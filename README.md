<div align="center">
  <img src="docs/images/logo.png" width="96" alt="DoneDesk logo">
  <h1>DoneDesk</h1>
  <p><b>轻巧的桌面任务便签 —— 今日事，今日毕。</b><br>支持 Windows · macOS · Linux</p>
  <a href="https://github.com/gu-success/donedesk/releases/latest"><img src="https://img.shields.io/github/v/release/gu-success/donedesk?style=flat-square&color=4f7cff" alt="release"></a>
  <a href="https://github.com/gu-success/donedesk/releases"><img src="https://img.shields.io/github/downloads/gu-success/donedesk/total?style=flat-square&color=2ea44f" alt="downloads"></a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-555?style=flat-square" alt="platform">
  <img src="https://img.shields.io/badge/Electron-desktop-47848F?style=flat-square&logo=electron&logoColor=white" alt="electron">
  <p><b>中文</b> | <a href="README.en.md">English</a></p>
  <p><a href="https://github.com/gu-success/donedesk/releases/latest"><b>⬇️ 下载最新版</b></a></p>
  <img src="docs/images/hero.png" width="760" alt="DoneDesk 浅色、深色与半透明">
</div>

## ✨ 主要功能

- 🔁 **未完成自动顺延** —— 今天没做完的任务自动带到明天，不会遗漏。
- ✅ **完成划线 · 紧急星标** —— 勾选即划线；星标或末尾加 `*` 标记紧急并置顶。
- 🗓️ **周期任务** —— 每天 / 每周 / 每月重复，可设定时提醒。
- 🟡 **悬浮球 + 任务气泡** —— 最小化后悬浮球显示未完成数量，气泡轮播待办。
- 🔒 **加密记事本** —— 密码保护，AES-256-GCM 本地加密，闲置自动锁定。
- 🕘 **历史记录** —— 按日期回顾过去的任务，支持搜索与一键恢复。
- 🎨 **个性化** —— 浅色/深色主题、窗口透明度、界面字体、中英双语切换。

## 📸 截图

| 今日任务 | 深色主题 | 历史记录 |
|:---:|:---:|:---:|
| <img src="docs/images/zh-light-tasks.png" width="250"> | <img src="docs/images/en-dark-tasks.png" width="250"> | <img src="docs/images/en-light-history.png" width="250"> |

<p align="center"><img src="docs/images/ball-bubble-light.png" width="370"><br><sub>悬浮球与任务气泡</sub></p>

## 📥 下载安装

前往 [Releases](https://github.com/gu-success/donedesk/releases/latest) 下载对应平台的安装包：

| 平台 | 安装包 |
|---|---|
| Windows 10/11 (x64) | [DoneDesk-Setup-1.1.4.exe](https://github.com/gu-success/donedesk/releases/download/v1.1.4/DoneDesk-Setup-1.1.4.exe) |
| macOS · Apple 芯片 (M1–M4) | [DoneDesk-1.1.4-mac-arm64.dmg](https://github.com/gu-success/donedesk/releases/download/v1.1.4/DoneDesk-1.1.4-mac-arm64.dmg) · [zip](https://github.com/gu-success/donedesk/releases/download/v1.1.4/DoneDesk-1.1.4-mac-arm64.zip) |
| macOS · Intel | [DoneDesk-1.1.4-mac-x64.dmg](https://github.com/gu-success/donedesk/releases/download/v1.1.4/DoneDesk-1.1.4-mac-x64.dmg) · [zip](https://github.com/gu-success/donedesk/releases/download/v1.1.4/DoneDesk-1.1.4-mac-x64.zip) |
| Linux · Debian/Ubuntu (x64) | [donedesk_1.1.4_amd64.deb](https://github.com/gu-success/donedesk/releases/download/v1.1.4/donedesk_1.1.4_amd64.deb) |

不确定 Mac 芯片？点左上角  →「关于本机」查看。

> [!NOTE]
> 安装包暂未签名。**Windows**：SmartScreen 提示时点「更多信息」→「仍要运行」。
> **macOS**：首次打开提示“无法验证开发者”时，任选其一：
> 1. 在「应用程序」中右键 DoneDesk →「打开」；
> 2. 「系统设置 → 隐私与安全性」底部点「仍要打开」；
> 3. 终端执行 `xattr -cr /Applications/DoneDesk.app`

## ⌨️ 快捷键

| 操作 | Windows / Linux | macOS |
|---|---|---|
| 显示 / 隐藏窗口 | `Ctrl+Shift+L` | `⌘⇧L` |
| 添加任务 | `Enter` | `Enter` |
| 标记紧急 | 末尾加 `*` 或点星标 | 同左 |
| 退出 | 托盘菜单 | `⌘Q` |

## 🔒 隐私与安全

- **不联网、无账号**：数据只保存在本机（Windows `%APPDATA%\DoneDesk`，macOS `~/Library/Application Support/DoneDesk`，Linux `~/.config/DoneDesk`）。
- **加密**：scrypt 派生密钥 + AES-256-GCM；闲置/锁屏自动锁定；连续输错 5 次需等待 30 秒。
- **安全写入**：原子写入 + `.bak` 备份。

> [!WARNING]
> 记事本密码**无法找回**，请务必牢记。

## ❓ 常见问题

<details><summary><b>支持哪些系统？</b></summary>

Windows 10/11（x64）、macOS（Apple 芯片与 Intel）以及 Linux（Debian/Ubuntu x64 .deb）。
</details>

<details><summary><b>关闭窗口后程序去哪了？</b></summary>

程序会继续在系统托盘 / 菜单栏运行；按快捷键或点托盘图标即可重新显示。
</details>

<details><summary><b>数据如何备份？</b></summary>

复制上面「隐私与安全」中列出的数据目录即可。
</details>

## 🗺️ 路线图

- [ ] 自动更新
- [ ] 安装包代码签名 / Apple 公证

## 💬 反馈

遇到问题或有新想法？欢迎提交 [Issue](https://github.com/gu-success/donedesk/issues/new/choose)。觉得好用就点个 ⭐ Star 吧！
