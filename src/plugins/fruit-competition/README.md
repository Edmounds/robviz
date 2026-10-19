# 正式比赛插件

流程下拉框提供 ABC、ACB 和 ACBD，并保留单区调试选择。
ABC 调用 `mission` 任务。ACB 调用 `mission_acb` 任务，对应 `start_fruit_mission_acb.sh`。
ACBD 调用 `mission_acbd` 任务，对应 `start_fruit_mission_acbd.sh`。
ACB 与 ACBD 采用固定闭环或分段模式，因此禁用开环选择。

1. 选择流程和调试参数。
2. 点击「启动其他部分」启动准备阶段。
3. 等待状态显示「等待定位」。
4. 在机器人安全静止时，点击「启动定位并进入比赛」。

准备后锁定路线和参数。刷新页面从状态接口恢复本轮选择。
定位初始化每次最多等待 10 秒，失败后只重启 Point-LIO 和 loam 一次。
第二次失败不启动 mission。健康状态只显示，不重启模块。
比赛完成后保留组件，直到停止或 Kill。
Kill 只清理进程，不是硬件急停，也不证明硬件停稳。

页面使用现有相机面板和运行服务，不发送浏览器 shell 命令。
ABC、ACB 和 ACBD 共用机器人比赛会话锁，不能同时拥有硬件。
详细 API 和安全边界见 fruit_ws 的 `docs/ROBVIZ_RUNTIME_CONTROL.md`。
