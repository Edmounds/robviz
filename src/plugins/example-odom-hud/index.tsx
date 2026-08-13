/**
 * 示例插件：里程计速度 HUD（侧栏区块）。
 * 演示插件的最小完整形态：订阅话题 → 展示数据。写自己的插件时可以整个目录复制起步。
 */
import { useEffect, useState } from "react";

import type { Odometry } from "../../core/types";
import type { PluginSectionProps, RobvizPlugin } from "../types";

function OdomHud({ ctx }: PluginSectionProps) {
  const [topic, setTopic] = useState("/odom");
  const [speed, setSpeed] = useState<{ linear: number; angular: number }>();

  const odomTopics = ctx.topics.filter((t) => t.schemaName === "nav_msgs/msg/Odometry");

  useEffect(() => {
    if (!topic) return;
    setSpeed(undefined);
    const unsub = ctx.bridge.subscribe(topic, (payload) => {
      if (payload.kind !== "raw") return;
      const odom = payload.message as Odometry;
      setSpeed({
        linear: Math.hypot(odom.twist.twist.linear.x, odom.twist.twist.linear.y),
        angular: odom.twist.twist.angular.z,
      });
    });
    return unsub;
  }, [ctx.bridge, topic]);

  return (
    <>
      <div className="side-row">
        <select className="topic-input" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {(odomTopics.length > 0 ? odomTopics.map((t) => t.topic) : [topic]).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="side-row">
        <span className="side-label">
          {speed
            ? `${speed.linear.toFixed(2)} m/s · ${((speed.angular * 180) / Math.PI).toFixed(0)} °/s`
            : "等待消息…"}
        </span>
      </div>
    </>
  );
}

const plugin: RobvizPlugin = {
  id: "example-odom-hud",
  name: "速度 HUD",
  sections: [{ id: "hud", title: "速度 HUD（示例插件）", component: OdomHud }],
};

export default plugin;
