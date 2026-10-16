# 过级鸭 · 本地真题练习

## 2026-10-16 题库审查更正

当前主分支已修复六级重复听力、缺少第22题、第35空错位及计时、听力分值错误。63套共3465道客观题已通过结构检查；这不代表全部解析已逐题人工审校。套次沿用原站目录编号，不保证与各出版社的套号排列相同。

四级、雅思原入口共用演示题，**不是对应的真实试卷**。现在四级显示62套原站目录并跳转原站练习，雅思提供 Cambridge English 官方样题入口；本地逐卷题库尚未接入。旧版 v38 完整便携包仍包含这些已知问题，本次修复目前在主分支源码及维护者运行的网页中，旧下载包尚未更新。

详细更正及来源见 `data/cet6-exams/audit.json`。网页风格、标注、查词、句式、AI讲解与阅读悬浮功能保留。

CET6 / CET4 / 雅思练习程序。保留原有中文界面、现有题库、听力、句式标注、涂鸦、交卷解析、点击译文和本地 AI 讲解与追问。

## 下载与安装

从本仓库 **Releases** 下载 `GuoJiYa-Portable-v38.zip` 并完整解压。**Code → Download ZIP 是源码，不含 Node.js 运行环境。**

1. 从 [Ollama 官网](https://ollama.com/download) 安装并打开 Ollama。
2. 在 PowerShell 或终端执行：

```sh
ollama pull qwen3.5:9b-q4_K_M
```

3. Windows 双击 `Start-Windows.cmd`；Mac 双击 `Start-Mac.command`。
4. 保持启动窗口与 Ollama 运行，在交卷后答案页使用 AI 译文、讲解与追问。

无需 API 密钥，不依赖发布者电脑或付费在线 AI。模型另行下载，默认配置已指向本机 Ollama。不要直接双击 index.html。

详细配置、排查与部署方法见 [先看这里](先看这里.md)。

## 从源码启动

安装 Node.js 22.22.2 或兼容的新版本，以及上述 Ollama 模型，在仓库根目录运行：

```sh
node start.cjs
```

无框架、无构建步骤，无需 npm install。默认网址 http://127.0.0.1:8888/ 。双击启动脚本供带 runtime 的 Release 包使用，源码用户请执行上述 node 命令。

可复制 config.env.example 为 config.env 修改端口或私有 Ollama 地址。真实配置不可提交 Git。

```sh
node --test tests/portable.test.cjs tests/tutor-api.test.cjs
```

修改 JS/CSS 后运行 node --check，并统一递增 index.html 所有 ?v=N。

## 标注与翻页

画笔与荧光笔模式下，单指写画、双指翻页和缩放；点击工具栏 ↕️ 后可单指滚动。退出画笔时已有标注继续显示，笔迹仍按原试卷与板块保存。

## 设备与数据

- Windows / Mac 可分别独立运行。模型下载约 6.6 GB，运行需要额外内存；原环境为 24 GB Mac，其他硬件性能需实测。
- 手机和平板需要自己配置的电脑或服务器提供网站与 AI，不能直接运行本包模型。默认仅本机访问；局域网需另配监听、访问密码与来源。
- 浏览器数据和笔迹各自本地保存，无跨设备同步。
- 在线词典与部分发音需要网络，系统朗读音色因设备而异。
- AI 输出可能出错，应结合题库答案与原文核对。
- GitHub 提供源码与下载文件；GitHub Pages 不能运行本项目的 Node 后端或 Ollama。

已验证 Mac 便携启动和相关接口；Windows、iOS、Android 未做真机验证。详细范围见包内说明。

## 模型与素材

使用 [Qwen 3.5 9B Q4_K_M](https://ollama.com/library/qwen3.5:9b-q4_K_M)，模型由使用者自行下载，不随仓库或便携包分发。题库与听力沿用原项目；第三方素材和依赖的权利归各自权利人，此仓库未对这些素材授予额外许可。
