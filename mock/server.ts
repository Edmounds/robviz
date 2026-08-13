/**
 * 模拟 foxglove_bridge：与真实 bridge 同协议（foxglove.websocket.v1）、
 * 同编码（CDR）、同 schema 广播格式。客户端对两者无感知。
 *
 * 直接运行：npm run mock（ws://localhost:8765）
 * 测试内嵌：startMockServer(port)
 */
import { parse } from "@foxglove/rosmsg";
import { MessageReader, MessageWriter } from "@foxglove/rosmsg2-serialization";
import { FoxgloveServer } from "@foxglove/ws-protocol";
import { encode as encodeJpeg } from "jpeg-js";
import { WebSocketServer } from "ws";

import {
  PUB_SCHEMAS,
  SET_BOOL_REQUEST_SCHEMA,
  SET_BOOL_RESPONSE_SCHEMA,
  TRIGGER_REQUEST_SCHEMA,
  TRIGGER_RESPONSE_SCHEMA,
  TWIST_SCHEMA,
} from "../src/core/rosSchemas";
import * as camera from "./camera";
import { CHANNELS } from "./schemas";
import * as scene from "./scene";

const NS = 1e9;

function stamp(t: number): { sec: number; nanosec: number } {
  const sec = Math.floor(t);
  return { sec, nanosec: Math.round((t - sec) * NS) };
}

function yawQuat(yaw: number): { x: number; y: number; z: number; w: number } {
  return { x: 0, y: 0, z: Math.sin(yaw / 2), w: Math.cos(yaw / 2) };
}

const IDENTITY_Q = { x: 0, y: 0, z: 0, w: 1 };

export interface MockServerOptions {
  /** 仿真真实 foxglove_bridge 的 send_buffer_limit：socket 积压超限时丢弃大消息 */
  sendBufferLimit?: number;
  /** 混沌网络模式：随机延迟抖动 + 周期性 1.5s 停顿 + 周期性强制断连 */
  chaos?: boolean;
  /** 点云规模倍数（压测用），1 = 7680 点/帧 */
  cloudScale?: number;
}

export interface MockServerHandle {
  port: number;
  close: () => Promise<void>;
}

type SocketLike = Parameters<FoxgloveServer["handleConnection"]>[0];

/**
 * 包装客户端 socket：
 * - 背压丢帧：对齐真实 bridge 行为（send_buffer_limit，默认 10MB），
 *   socket 积压超限时丢弃消息而不是无界排队；
 * - 混沌模式：0-40ms 随机抖动 + 每 12s 一次 1.5s 停顿（保序延迟队列）。
 */
function wrapSocket(
  inner: import("ws").WebSocket,
  opts: Required<Pick<MockServerOptions, "sendBufferLimit" | "chaos">>,
): SocketLike {
  let lastDeliverAt = 0;
  let dropped = 0;
  const chaosDelay = (): number => {
    if (!opts.chaos) return 0;
    const now = Date.now();
    const phase = now % 12_000;
    const stall = phase < 1500 ? 1500 - phase : 0; // 周期性停顿窗口
    return stall + Math.random() * 40;
  };
  return {
    get binaryType() {
      return inner.binaryType as string;
    },
    set binaryType(v: string) {
      inner.binaryType = v as import("ws").WebSocket["binaryType"];
    },
    get protocol() {
      return inner.protocol;
    },
    set onerror(h) {
      inner.onerror = h as never;
    },
    set onopen(h) {
      inner.onopen = h as never;
    },
    set onclose(h) {
      inner.onclose = h as never;
    },
    set onmessage(h) {
      inner.onmessage = h as never;
    },
    close: () => inner.close(),
    send: (data: string | ArrayBuffer | ArrayBufferView) => {
      const size = typeof data === "string" ? data.length : data.byteLength;
      if (inner.bufferedAmount + size > opts.sendBufferLimit) {
        if (++dropped % 100 === 1) {
          console.warn(`[mock] send buffer full, dropped ${dropped} messages`);
        }
        return;
      }
      const delay = chaosDelay();
      if (delay === 0 && lastDeliverAt <= Date.now()) {
        inner.send(data);
        return;
      }
      // 保序延迟队列：交付时间单调不减
      lastDeliverAt = Math.max(Date.now() + delay, lastDeliverAt);
      const buf = typeof data === "string" ? data : (data as ArrayBufferView | ArrayBuffer);
      setTimeout(() => {
        if (inner.readyState === inner.OPEN) inner.send(buf);
      }, lastDeliverAt - Date.now());
    },
  } as SocketLike;
}

export async function startMockServer(
  port = 8765,
  options: MockServerOptions = {},
): Promise<MockServerHandle> {
  const sendBufferLimit = options.sendBufferLimit ?? 10_000_000;
  const chaos = options.chaos ?? false;
  const cloudScale = options.cloudScale ?? 1;

  const server = new FoxgloveServer({
    name: "robviz-mock",
    capabilities: ["clientPublish", "services", "time"],
    supportedEncodings: ["cdr"],
  });
  const wss = new WebSocketServer({
    port,
    handleProtocols: (protocols) => server.handleProtocols(protocols),
  });

  wss.on("connection", (conn, req) => {
    server.handleConnection(
      wrapSocket(conn, { sendBufferLimit, chaos }),
      req.socket.remoteAddress ?? "client",
    );
  });
  server.on("error", (err) => console.error("[mock]", err.message));

  // 混沌模式：每 20s 强制掐断所有连接，考验客户端重连与订阅恢复
  const chaosTimer = chaos
    ? setInterval(() => {
        console.warn("[mock] chaos: terminating all clients");
        for (const c of wss.clients) c.terminate();
      }, 20_000)
    : undefined;

  const ids = new Map<string, number>();
  const writers = new Map<string, MessageWriter>();
  for (const spec of CHANNELS) {
    ids.set(
      spec.topic,
      server.addChannel({
        topic: spec.topic,
        encoding: "cdr",
        schemaName: spec.schemaName,
        schema: spec.schema,
        schemaEncoding: "ros2msg",
      }),
    );
    writers.set(spec.topic, new MessageWriter(parse(spec.schema, { ros2: true })));
  }

  const publish = (topic: string, t: number, message: unknown) => {
    const payload = writers.get(topic)!.writeMessage(message);
    server.sendMessage(ids.get(topic)!, BigInt(Math.round(t * NS)), payload);
  };

  const started = Date.now();
  const mapData = scene.gridData();

  // ---- 机器人驾驶状态：默认绕圈；收到 cmd_vel 进入手动积分；电机可被服务关停 ----

  let manual: { pose: scene.Pose2D; v: number; w: number; lastCmdAt: number } | undefined;
  let motorEnabled = true;
  let frozenPose: scene.Pose2D | undefined;
  /** 手动驾驶期间的轨迹历史（供 /path） */
  const drivenPath: Array<{ t: number; pose: scene.Pose2D }> = [];

  const poseAt = (t: number): scene.Pose2D => {
    if (!motorEnabled) return (frozenPose ??= scene.robotPoseAt(t));
    if (manual && Date.now() - manual.lastCmdAt < 1000) return manual.pose;
    manual = undefined;
    return scene.robotPoseAt(t);
  };

  const integrate = (dt: number) => {
    if (!manual || !motorEnabled) return;
    const p = manual.pose;
    p.x += manual.v * Math.cos(p.yaw) * dt;
    p.y += manual.v * Math.sin(p.yaw) * dt;
    p.yaw += manual.w * dt;
  };

  // ---- 客户端发布（cmd_vel 遥控） ----

  const clientReaders = new Map<string, MessageReader>();
  const readerFor = (schemaName: string, schema: string): MessageReader => {
    let reader = clientReaders.get(schemaName);
    if (!reader) {
      reader = new MessageReader(parse(schema, { ros2: true }));
      clientReaders.set(schemaName, reader);
    }
    return reader;
  };

  server.on("message", ({ channel, data }) => {
    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    if (channel.schemaName === "geometry_msgs/msg/Twist") {
      const twist = readerFor(channel.schemaName, TWIST_SCHEMA).readMessage(bytes) as {
        linear: { x: number };
        angular: { z: number };
      };
      const t = (Date.now() - started) / 1000;
      if (!manual) manual = { pose: { ...poseAt(t) }, v: 0, w: 0, lastCmdAt: 0 };
      manual.v = twist.linear.x;
      manual.w = twist.angular.z;
      manual.lastCmdAt = Date.now();
      return;
    }
    // Nav 工具验证：收到目标点/初始位姿时打印（真机上由 nav2/AMCL 消费）
    const pubSchema = PUB_SCHEMAS[channel.schemaName];
    if (pubSchema) {
      const msg = readerFor(channel.schemaName, pubSchema).readMessage(bytes) as Record<
        string,
        unknown
      >;
      const pose =
        (msg.pose as { pose?: { position: { x: number; y: number } } })?.pose ??
        (msg.pose as { position: { x: number; y: number } });
      const p = pose?.position;
      console.log(
        `[mock] client → ${channel.topic} (${channel.schemaName})` +
          (p ? ` position=(${p.x.toFixed(2)}, ${p.y.toFixed(2)})` : ""),
      );
    }
  });

  // ---- 服务 ----

  const svcWriters = {
    setBoolRes: new MessageWriter(parse(SET_BOOL_RESPONSE_SCHEMA, { ros2: true })),
    triggerRes: new MessageWriter(parse(TRIGGER_RESPONSE_SCHEMA, { ros2: true })),
  };
  const svcReaders = {
    setBoolReq: new MessageReader(parse(SET_BOOL_REQUEST_SCHEMA, { ros2: true })),
  };

  const enableMotorId = server.addService({
    name: "/robot/enable_motor",
    type: "std_srvs/srv/SetBool",
    request: {
      encoding: "cdr",
      schemaName: "std_srvs/srv/SetBool_Request",
      schemaEncoding: "ros2msg",
      schema: SET_BOOL_REQUEST_SCHEMA,
    },
    response: {
      encoding: "cdr",
      schemaName: "std_srvs/srv/SetBool_Response",
      schemaEncoding: "ros2msg",
      schema: SET_BOOL_RESPONSE_SCHEMA,
    },
  });
  const resetPoseId = server.addService({
    name: "/robot/reset_pose",
    type: "std_srvs/srv/Trigger",
    request: {
      encoding: "cdr",
      schemaName: "std_srvs/srv/Trigger_Request",
      schemaEncoding: "ros2msg",
      schema: TRIGGER_REQUEST_SCHEMA,
    },
    response: {
      encoding: "cdr",
      schemaName: "std_srvs/srv/Trigger_Response",
      schemaEncoding: "ros2msg",
      schema: TRIGGER_RESPONSE_SCHEMA,
    },
  });

  server.on("serviceCallRequest", (req, conn) => {
    const t = (Date.now() - started) / 1000;
    let payload: Uint8Array;
    if (req.serviceId === enableMotorId) {
      const { data } = svcReaders.setBoolReq.readMessage(
        new Uint8Array(req.data.buffer, req.data.byteOffset, req.data.byteLength),
      ) as { data: boolean };
      if (!data) frozenPose = { ...poseAt(t) };
      else frozenPose = undefined;
      motorEnabled = data;
      payload = svcWriters.setBoolRes.writeMessage({
        success: true,
        message: data ? "motor enabled" : "motor disabled (pose frozen)",
      });
    } else if (req.serviceId === resetPoseId) {
      manual = undefined;
      motorEnabled = true;
      frozenPose = undefined;
      drivenPath.length = 0;
      payload = svcWriters.triggerRes.writeMessage({
        success: true,
        message: "pose reset to auto circle",
      });
    } else {
      return;
    }
    server.sendServiceCallResponse(
      { serviceId: req.serviceId, callId: req.callId, encoding: "cdr", data: payload },
      conn,
    );
  });

  const publishTf = (t: number) => {
    const drift = scene.odomDriftAt(t);
    const inOdom = scene.robotInOdomAt(t, poseAt(t));
    publish("/tf", t, {
      transforms: [
        {
          header: { stamp: stamp(t), frame_id: "map" },
          child_frame_id: "odom",
          transform: {
            translation: { x: drift.x, y: drift.y, z: 0 },
            rotation: yawQuat(drift.yaw),
          },
        },
        {
          header: { stamp: stamp(t), frame_id: "odom" },
          child_frame_id: "base_link",
          transform: {
            translation: { x: inOdom.x, y: inOdom.y, z: 0 },
            rotation: yawQuat(inOdom.yaw),
          },
        },
        {
          header: { stamp: stamp(t), frame_id: "base_link" },
          child_frame_id: "laser",
          transform: {
            translation: { x: 0, y: 0, z: 0.5 },
            rotation: IDENTITY_Q,
          },
        },
        {
          header: { stamp: stamp(t), frame_id: "base_link" },
          child_frame_id: "camera_link",
          transform: {
            translation: { x: 0.2, y: 0, z: 0.5 },
            rotation: IDENTITY_Q,
          },
        },
      ],
    });
  };

  const publishScan = (t: number) => {
    const { ranges, intensities } = scene.scanAt(t, true, poseAt(t));
    publish("/scan", t, {
      header: { stamp: stamp(t), frame_id: "laser" },
      angle_min: -Math.PI,
      angle_max: Math.PI,
      angle_increment: (Math.PI * 2) / scene.SCAN_BEAMS,
      time_increment: 0,
      scan_time: 0.1,
      range_min: 0.1,
      range_max: scene.SCAN_MAX_RANGE,
      ranges,
      intensities,
    });
  };

  // 压测模式（cloudScale > 1）缓存一帧：光线投射生成 30 万+ 点会拖垮模拟器
  // 自身的发布循环，压测目标是客户端管线而不是模拟器。scale = 1 时保持逐帧
  // 真实生成（集成测试依赖内容与时间戳的确定性对应）。
  let cachedCloud: ReturnType<typeof scene.cloudAt> | undefined;

  const publishCloud = (t: number) => {
    const azimuths = scene.CLOUD_AZIMUTHS * cloudScale;
    let count: number;
    let buffer: Float32Array;
    if (cloudScale > 1) {
      cachedCloud ??= scene.cloudAt(0, azimuths);
      ({ count, buffer } = cachedCloud);
    } else {
      ({ count, buffer } = scene.cloudAt(t, azimuths, poseAt(t)));
    }
    const F32 = 7; // PointField.FLOAT32
    publish("/cloud", t, {
      header: { stamp: stamp(t), frame_id: "laser" },
      height: 1,
      width: count,
      fields: [
        { name: "x", offset: 0, datatype: F32, count: 1 },
        { name: "y", offset: 4, datatype: F32, count: 1 },
        { name: "z", offset: 8, datatype: F32, count: 1 },
        { name: "intensity", offset: 12, datatype: F32, count: 1 },
        { name: "ring", offset: 16, datatype: F32, count: 1 },
      ],
      is_bigendian: false,
      point_step: 20,
      row_step: 20 * count,
      data: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
      is_dense: true,
    });
  };

  const publishMap = (t: number) => {
    publish("/map", t, {
      header: { stamp: stamp(t), frame_id: "map" },
      info: {
        map_load_time: stamp(0),
        resolution: scene.MAP_RESOLUTION,
        width: scene.MAP_SIZE,
        height: scene.MAP_SIZE,
        origin: {
          position: { x: -scene.ROOM_HALF, y: -scene.ROOM_HALF, z: 0 },
          orientation: IDENTITY_Q,
        },
      },
      data: mapData,
    });
  };

  const publishPath = (t: number) => {
    // 手动驾驶过的轨迹 + 之前的自动圆弧，取最近 60s
    drivenPath.push({ t, pose: { ...poseAt(t) } });
    while (drivenPath.length > 0 && t - drivenPath[0].t > 60) drivenPath.shift();
    const poses = drivenPath.map((e) => ({
      header: { stamp: stamp(e.t), frame_id: "map" },
      pose: {
        position: { x: e.pose.x, y: e.pose.y, z: 0 },
        orientation: yawQuat(e.pose.yaw),
      },
    }));
    publish("/path", t, { header: { stamp: stamp(t), frame_id: "map" }, poses });
  };

  const publishOdom = (t: number) => {
    const p = scene.robotInOdomAt(t, poseAt(t));
    publish("/odom", t, {
      header: { stamp: stamp(t), frame_id: "odom" },
      child_frame_id: "base_link",
      pose: {
        pose: { position: { x: p.x, y: p.y, z: 0 }, orientation: yawQuat(p.yaw) },
        covariance: new Float64Array(36),
      },
      twist: {
        twist: {
          linear: {
            x: !motorEnabled ? 0 : manual ? manual.v : scene.CIRCLE_RADIUS * scene.ANGULAR_SPEED,
            y: 0,
            z: 0,
          },
          angular: {
            x: 0,
            y: 0,
            z: !motorEnabled ? 0 : manual ? manual.w : scene.ANGULAR_SPEED,
          },
        },
        covariance: new Float64Array(36),
      },
    });
  };

  // ---- 相机（深度 raw 32FC1 + 彩色 JPEG） ----

  const publishCamera = (t: number) => {
    const frame = camera.renderCamera(poseAt(t));
    publish("/camera/depth", t, {
      header: { stamp: stamp(t), frame_id: "camera_link" },
      height: camera.CAM_HEIGHT,
      width: camera.CAM_WIDTH,
      encoding: "32FC1",
      is_bigendian: 0,
      step: camera.CAM_WIDTH * 4,
      data: new Uint8Array(frame.depth.buffer, 0, frame.depth.byteLength),
    });
    const jpeg = encodeJpeg(
      { data: frame.rgba, width: camera.CAM_WIDTH, height: camera.CAM_HEIGHT },
      75,
    );
    publish("/camera/color/compressed", t, {
      header: { stamp: stamp(t), frame_id: "camera_link" },
      format: "jpeg",
      data: jpeg.data,
    });
  };

  // ---- 机械臂关节（T12 六足前两条腿的关节，正弦摆动） ----

  const JOINT_NAMES = [
    "HY1", "HP1", "KP1", "KR1", "AP1", "AR1",
    "HY2", "HP2", "KP2", "KR2", "AP2", "AR2",
  ];
  const publishJoints = (t: number) => {
    const position = new Float64Array(JOINT_NAMES.length);
    for (let i = 0; i < JOINT_NAMES.length; i++) {
      position[i] = 0.4 * Math.sin(t * 0.8 + i * 0.7);
    }
    publish("/joint_states", t, {
      header: { stamp: stamp(t), frame_id: "" },
      name: JOINT_NAMES,
      position,
      velocity: new Float64Array(0),
      effort: new Float64Array(0),
    });
  };

  // ---- Marker（覆盖箭头/立方体/球/线条/文字，混合 frame） ----

  const publishMarkers = (t: number) => {
    const p = poseAt(t);
    const common = {
      action: 0,
      lifetime: { sec: 0, nanosec: 0 },
      frame_locked: false,
      points: [],
      colors: [],
      texture_resource: "",
      texture: { header: { stamp: stamp(t), frame_id: "" }, format: "", data: new Uint8Array(0) },
      uv_coordinates: [],
      text: "",
      mesh_resource: "",
      mesh_file: { filename: "", data: new Uint8Array(0) },
      mesh_use_embedded_materials: false,
    };
    const pulse = 0.6 + 0.25 * Math.sin(t * 2);
    // 圆形巡逻路线（LINE_STRIP，map 系）
    const circlePts = [];
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      circlePts.push({
        x: scene.CIRCLE_RADIUS * Math.cos(a),
        y: scene.CIRCLE_RADIUS * Math.sin(a),
        z: 0.02,
      });
    }
    publish("/markers", t, {
      markers: [
        {
          ...common,
          header: { stamp: stamp(t), frame_id: "base_link" },
          ns: "robot",
          id: 0,
          type: 0, // ARROW：车头方向，挂 base_link 验证逐 marker TF
          pose: { position: { x: 0.3, y: 0, z: 0.3 }, orientation: IDENTITY_Q },
          scale: { x: 0.8, y: 0.08, z: 0.08 },
          color: { r: 0.2, g: 0.9, b: 0.4, a: 1 },
        },
        {
          ...common,
          header: { stamp: stamp(t), frame_id: "map" },
          ns: "goal",
          id: 1,
          type: 2, // SPHERE：脉动目标点
          pose: { position: { x: -6, y: -6, z: 0.5 }, orientation: IDENTITY_Q },
          scale: { x: pulse, y: pulse, z: pulse },
          color: { r: 1, g: 0.4, b: 0.2, a: 0.9 },
        },
        {
          ...common,
          header: { stamp: stamp(t), frame_id: "map" },
          ns: "zone",
          id: 2,
          type: 1, // CUBE：禁行区
          pose: { position: { x: 4, y: 4, z: 0.75 }, orientation: yawQuat(t * 0.3) },
          scale: { x: 2.2, y: 2.2, z: 1.5 },
          color: { r: 0.9, g: 0.2, b: 0.2, a: 0.35 },
        },
        {
          ...common,
          header: { stamp: stamp(t), frame_id: "map" },
          ns: "route",
          id: 3,
          type: 4, // LINE_STRIP：巡逻路线
          pose: { position: { x: 0, y: 0, z: 0 }, orientation: IDENTITY_Q },
          scale: { x: 0.04, y: 0, z: 0 },
          color: { r: 0.3, g: 0.6, b: 1, a: 0.8 },
          points: circlePts,
        },
        {
          ...common,
          header: { stamp: stamp(t), frame_id: "map" },
          ns: "label",
          id: 4,
          type: 9, // TEXT_VIEW_FACING
          pose: { position: { x: p.x, y: p.y, z: 1.6 }, orientation: IDENTITY_Q },
          scale: { x: 0, y: 0, z: 0.4 },
          color: { r: 1, g: 1, b: 1, a: 1 },
          text: motorEnabled ? (manual ? "MANUAL" : "AUTO") : "STOPPED",
        },
      ],
    });
  };

  const publishBattery = (t: number) => {
    publish("/battery", t, { data: 24.6 - 0.002 * t + 0.3 * Math.sin(t * 0.5) });
  };

  let tick = 0;
  let lastTickAt = Date.now();
  const timer = setInterval(() => {
    const now = Date.now();
    const t = (now - started) / 1000;
    integrate((now - lastTickAt) / 1000);
    lastTickAt = now;
    publishTf(t); // 30Hz
    if (tick % 3 === 0) publishScan(t); // 10Hz
    if (tick % 3 === 1) publishJoints(t); // 10Hz
    if (tick % 6 === 0) publishCloud(t); // 5Hz
    if (tick % 6 === 2) publishCamera(t); // 5Hz
    if (tick % 15 === 0) publishMarkers(t); // 2Hz
    if (tick % 30 === 0) {
      publishPath(t); // 1Hz
      publishBattery(t); // 1Hz
    }
    if (tick % 60 === 0) publishMap(t); // 0.5Hz
    publishOdom(t); // 30Hz
    tick++;
  }, 33);

  return {
    port,
    close: async () => {
      clearInterval(timer);
      if (chaosTimer) clearInterval(chaosTimer);
      for (const c of wss.clients) c.terminate();
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    },
  };
}

// 直接运行时启动。环境变量：PORT、CHAOS=1（混沌网络）、CLOUD_SCALE=N（点云压测倍数）
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop()!)) {
  const port = Number(process.env.PORT ?? 8765);
  const opts: MockServerOptions = {
    chaos: process.env.CHAOS === "1",
    cloudScale: Number(process.env.CLOUD_SCALE ?? 1),
  };
  void startMockServer(port, opts).then(() => {
    console.log(
      `[mock] foxglove_bridge simulator on ws://localhost:${port}` +
        (opts.chaos ? " (CHAOS)" : "") +
        (opts.cloudScale !== 1 ? ` (cloud x${opts.cloudScale})` : ""),
    );
  });
}
