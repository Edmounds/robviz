/**
 * CLI 冒烟测试：逐个子命令跑一遍验证输出。
 * 前置：npm run mock 已在 8765 运行。
 * 运行：npx tsx scripts/cli-smoke.ts
 */
import { execFileSync } from "node:child_process";

function cli(...args: string[]): string {
  return execFileSync(process.execPath, ["node_modules/.bin/tsx", "cli/robviz.ts", ...args], {
    encoding: "utf8",
    timeout: 30000,
  });
}

// topics
const topics = JSON.parse(cli("topics")) as { topics: unknown[]; services: unknown[] };
console.log(`topics: ${topics.topics.length} topics, ${topics.services.length} services`);
if (topics.topics.length < 8) throw new Error("话题数不足");

// echo
const odom = JSON.parse(cli("echo", "/odom", "-n", "2")) as Array<{
  pose: { pose: { position: { x: number } } };
}>;
console.log(`echo /odom: ${odom.length} msgs, x=${odom[0].pose.pose.position.x.toFixed(2)}`);
if (odom.length !== 2) throw new Error("echo 条数不对");

// tf
const tf = JSON.parse(cli("tf", "map", "base_link")) as {
  translation: { x: number };
  yaw_rad: number;
};
console.log(`tf map→base_link: x=${tf.translation.x.toFixed(2)} yaw=${tf.yaw_rad.toFixed(2)}`);

// pub → odom 应反映手动速度
const pub = JSON.parse(
  cli("pub", "/cmd_vel", "geometry_msgs/msg/Twist", '{"linear":{"x":0.3}}'),
) as { published: string };
console.log(`pub: ${pub.published}`);
await new Promise((r) => setTimeout(r, 300));
const odom2 = JSON.parse(cli("echo", "/odom", "-n", "1")) as Array<{
  twist: { twist: { linear: { x: number } } };
}>;
const vx = odom2[0].twist.twist.linear.x;
console.log(`odom after cmd_vel: vx=${vx}`);
if (Math.abs(vx - 0.3) > 1e-6) throw new Error("cmd_vel 未生效");

// call
const svc = JSON.parse(cli("call", "/robot/reset_pose")) as { response: { success: boolean } };
console.log(`call /robot/reset_pose: success=${svc.response.success}`);
if (!svc.response.success) throw new Error("服务调用失败");

// screenshot 无 UI 时应报可读错误（快速超时）
try {
  cli("screenshot", "-t", "1", "--port", "18767");
  console.log("screenshot (no UI): 意外成功?");
} catch {
  console.log("screenshot (no UI): 预期报错 ok");
}

console.log("ALL CLI SMOKE PASSED");
