# 脚本控制插件

在顶部打开「脚本控制」。左侧卡片列出脚本参数，右侧显示当前日志。
必填参数选择完成后，点击「启动」。
启动直接运行脚本，不自动清理旧任务；如需清理旧任务，先点击顶部 Kill。
顶部 Kill 不需要确认，它清理进程但不代表硬件急停。
它也会清理机械臂插件或终端启动的机器人任务。

七个脚本来自机器人上的 `runtime_tasks.yaml`。
`test_voice.sh` 和 `test_qr.sh` 无参数控件。
启动请求只传任务 ID 和白名单参数，不传 shell 命令。
页面复用机械臂插件的 `runtimeRequest` 和 runtime 服务地址。
网络设置中的 `runtime` 默认监听端口 8001。

日志用现有 xterm 依赖保留 ANSI 颜色、回车更新和滚动历史。
「清屏」只清除显示，不删除机器人日志文件。
分隔条支持鼠标拖动和键盘操作，布局和参数保存到当前机器状态。
窄屏使用上下布局。
离开插件或关闭浏览器后脚本继续运行，返回页面恢复当前日志。
服务重启不恢复当前任务引用，也不会自动启动脚本。

后端 API 和安全边界见 fruit_ws 的 `docs/ROBVIZ_RUNTIME_CONTROL.md`。
先更新并构建后端，再在机器人任务停止时重启 `fruit-runtime.service`。

```bash
npm run build
npm test -- tests/unit/fruitScriptsProtocol.test.ts
```
