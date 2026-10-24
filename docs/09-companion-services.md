# 通用后端与离线协议检查

基础 3D 不需要这些服务。按功能显式启动，不启动机器人控制进程。

## 文件与图像配置服务

```bash
PYTHONPATH=ros2/robviz_web_server /usr/bin/python3 -m robviz_web_server.web_server_node \
  --host 127.0.0.1 --port 8000 --data-dir /absolute/path/to/waypoints \
  --allowed-host localhost:5173 --allowed-host 127.0.0.1:5173 \
  --allowed-host localhost:4173 --allowed-host 127.0.0.1:4173
```

Vite API 代理保留浏览器 Host，服务只接受明确配置的 Host 与同源 Origin。
默认禁止非回环写操作。远程编辑使用 SSH 转发。
只有明确需要远程写入时才设置 `--allow-remote-writes` 和精确 `--allowed-host`。
不要把局域网地址等同于写入授权。

在 data-dir 中放入需要编辑的 YAML，文件名使用字母、数字、下划线或连字符。
服务只编辑现存文件，不通过 API 创建任意路径。
文档包含 `schema_version`、`frame_id`、`points`，点支持 name/type/x/y/z/yaw_deg/extra。
旧 schema-1 的 position、yaw 或 orientation 会映射到同一编辑协议，保存时保留原文档格式。
保存必须提交读取时的版本。冲突返回 409，非法输入返回 400，超限返回 413。
保存保留坐标系、schema 和未知文档字段，写入前备份，再 fsync 和原子替换。

协议版本为 1：

| 接口 | 方法 | 用途 |
| --- | --- | --- |
| `/api/files` | GET | 可编辑文档目录 |
| `/api/document` | GET / PUT | 读取与版本化保存 |
| `/api/background` | GET / DELETE | 读取或删除背景配置 |
| `/api/background/image` | GET / POST | 读取或上传 PNG/JPEG/WebP，最大 20 MiB |
| `/api/background/config` | PUT | 保存变换，图片必须属于该文档 |
| `/api/image-settings` | GET / PUT | 读取或暂存运行配置 |
| `/api/image-settings/defaults` | POST | 保存启动默认值并暂存运行配置 |

图像接口校验 session/version，冲突返回 409。
运行配置写入 `<data-dir>/image-settings.json`，默认值写入 `image-settings-defaults.json`。
HTTP 返回 `applied: false, status: awaiting_ros_reload`，不把写入文件当成 ROS 已生效。
客户端随后调用 `/robviz/reload_image_settings`，并校验返回的 version/session。
图像配置界面由 `image` 插件的设置分页提供，重载服务名称可按实际后端配置。
默认值在文件服务重启后恢复，session 则重新生成。

背景图采用唯一文件名，更新配置之前保留旧图片，避免上传失败破坏现有底图。
删除配置保留备份及图片，便于恢复。旧图片由操作人员在停服后清理。

## 视频网关

构建 `robviz_web_server` 与 `robviz_video_gateway` 后，在自己的 ROS 环境中启动：

```bash
ros2 run robviz_video_gateway gateway_node --ros-args \
  -p host:=127.0.0.1 -p port:=8787 \
  -p settings_file:=/absolute/path/to/waypoints/image-settings.json \
  -p capture_topic:=/your/color/image \
  -p capture_output_dir:=/absolute/path/to/captures \
  -p 'allowed_hosts:=[localhost:8787,127.0.0.1:8787]' \
  -p 'allowed_origins:=[http://localhost:5173,http://127.0.0.1:5173]'
```

Origin 必须与 Host 同源或在精确配置列表内。截图默认只允许回环连接。
远程截图需要显式设置 `allow_remote_capture:=true`，并配置实际 Host/Origin。
不根据局域网地址推断授权。

WebSocket `/ws` 协议版本为 1，保留 watch/unwatch/setFps/answer/ice/telemetry。
新增 getMeta/getCaptureInfo/setCaptureTopic/unwatchCapture/captureFrame。
采集仅缓存原始帧，不启动编码器。最后一个视频或采集客户端离开后释放订阅。
截图拒绝过期帧和不支持的颜色编码，成功后返回文件名、尺寸、时间戳和计数。
保存任务串行运行，客户端断开不会取消已经开始的磁盘写入。
深度设置根据 `16UC1` 编码选择，不根据话题名推断。

## 无硬件检查

```bash
PYTHONPATH=ros2/robviz_web_server /usr/bin/python3 -m unittest discover -s ros2/robviz_web_server/test
```

视频协议检查使用独立 ROS domain、本机合成图像和临时输出目录：

```bash
export ROS_LOCALHOST_ONLY=1 ROS_DOMAIN_ID=213
PYTHONPATH="$PWD/ros2/robviz_video_gateway:$PWD/ros2/robviz_web_server:$PYTHONPATH" \
  /usr/bin/python3 -m unittest discover -s ros2/robviz_video_gateway/test -p test_capture_protocol.py
```

先 source 自己的 ROS 运行环境，必须使用系统 OpenCV ABI。
这些检查不连接真机、不验证真实相机编码性能，也不触发机器人动作。
