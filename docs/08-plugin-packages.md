# ESM 插件包与本地 SDK

官方功能和示例插件均从独立插件仓构建。Core 不再扫描内部源码插件。

## 开发包

在 Core 仓库生成类型开发包：

```bash
npm run sdk:build
npm pack ./sdk
```

插件仓将生成的 `robviz-core-0.1.5.tgz` 放入 `vendor/`，通过 npm 安装。
插件构建不使用 Core 源码目录或开发机软链接。
`@robviz/core` 的运行实现由宿主提供，开发包不是另一份宿主实现。

插件只能使用 `@robviz/core` 的公开导出、共享运行库及自身打包依赖。
共享 UI 见 [07-shared-ui.md](07-shared-ui.md)。

## 包结构

每个 `plugins/<id>/` 包含 `manifest.json`、一个 ESM 入口以及声明的 CSS 和资源。
入口默认导出 `RobvizPlugin`。
`sdkApiVersion` 必须为 `1`。
`entry` 和 `style` 必须出现在 `files` 中。
资源只能使用包内安全相对路径。
不支持前端插件依赖字段。

后端需求使用 `requiredServices: [{ "id": "video", "protocolVersion": 1 }]` 描述。
该声明不是权限沙箱，也不会自动启动后端。

## 手动安装

将完整的已编译插件目录复制到服务机器的 Core `plugins/` 目录。
首次启动开发服务或预览服务时会校验包并生成索引。
运行中的纯静态部署需要手动更新索引：

```bash
npm run plugins:scan
```

刷新页面后加载已安装插件。
插件代码不保存在 localStorage。
`ROBVIZ_PLUGIN_DIR` 可以指定另一安装目录。
不要将源码目录或整个插件仓作为安装包。

Vite 开发服务和生产预览从同一安装目录提供 `/plugins/` 资源。
纯静态部署需同时部署生成的 `plugins/` 目录及索引。
生产安装不要求重新编译 Core。
扫描拒绝越界路径、符号链接、缺失文件和不兼容包。
一个无效包不会阻止其他有效包被发现。

## 共享运行库

宿主在模块执行前提供 Import Map：

- `@robviz/core`
- `react`
- `react-dom`
- `react-dom/client`
- `react/jsx-runtime`
- `react/jsx-dev-runtime`
- `three`

插件构建将这些精确名称标记为 external。
其他专属依赖必须打入自身包。
共享运行库随 Core 本地分发，不依赖公网 CDN。
模块加载超时后宿主忽略其定义，但浏览器不能取消已经发起的原生 ESM 导入。
插件模块顶层不得创建连接、定时器或控制请求。

## 无硬件检查

先手动安装 teleop，再运行：

```bash
ROBVIZ_RUNTIME_CHECK=1 npm run build
npm run preview -- --host 127.0.0.1
```

打开 `/runtime.html`。
页面检查 React、React DOM、Three.js、SDK 实例身份及离线遥控禁用状态。
它不创建机器人连接，也不发送控制指令。
开发模式下可直接打开同一路径。
该检查页面不进入默认生产构建。

## 在线安装与升级

Vite 开发与预览服务提供同一个 `plugin-management/` 接口。
在服务进程环境中设置可信来源，不接受浏览器提交任意下载 URL：

```bash
export ROBVIZ_PLUGIN_REPO=OWNER/REPOSITORY
export ROBVIZ_PLUGIN_REF=FULL_40_CHARACTER_COMMIT_SHA
# 可选：从此固定版本 Release 下载。tag 必须解析为上面的 commit。
export ROBVIZ_PLUGIN_RELEASE=v0.1.0
npm run preview -- --host 127.0.0.1
```

打开“设置 → 插件”。界面显示实际服务主机、安装目录、已安装版本和错误。
读取官方清单后可以安装或升级，也可重新扫描和卸载。
安装、升级和卸载前先保存编辑内容，操作完成后点击“刷新生效”。
禁用或卸载后保留配置和占位面板，不清空 Dockview 排列。
初次迁移在 localStorage 的 `robviz.layout.v3.before-plugin-split` 保留原配置副本。

管理写操作只接受回环连接、回环 Host 和匹配的 Origin。
远程访问管理功能请使用 SSH 转发，不能通过允许任意 CORS 开放写操作。
纯静态站点显示只读安装提示，继续支持手动复制与 CLI 扫描。

下载通过服务器的 `gh api --hostname github.com` 完成，需要可用的 gh 认证。
凭据不传到浏览器，不写入导出配置或下载目录。
每个文件有大小、超时、相对路径和 SHA-256 校验，包总大小限制为 50 MiB。
安装不解压不可信归档，不执行包内脚本，不跟随包内符号链接。
文件系统 `flock` 串行保护扫描、安装和卸载。
目录切换前写入恢复记录，索引成功后才提交。进程中断后，下次启动先恢复旧包。

## Release 产物

官方插件仓构建同时生成 `plugins/`、`catalog.json` 和 `release-assets/`。
Release 资产使用 `<id>-<sha256>.bin` 名称，目录形式仍保留原始 ESM 文件名。
Release catalog 必须与固定 commit 中的 catalog 完全相同。
发布人员获得授权后，才可用 `gh release upload` 上传 `release-assets/` 的明确文件列表。
不要将私有插件产物上传到官方 Release。

## 通用后端

启动、安全边界、协议和无硬件检查见 [09-companion-services.md](09-companion-services.md)。
本地协议验证不等同于已发布 GitHub Release 验收。
仓库创建、正式 Release、main 合并及有 WebGL 环境的视觉验收需要单独记录。
