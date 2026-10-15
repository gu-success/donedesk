<div align="center">
  <img src="docs/images/logo.png" width="96" alt="DoneDesk logo">
  <h1>事毕 DoneDesk</h1>
  <p><b>轻巧的 Windows 桌面任务便签 —— 今日事，今日毕。</b><br>A lightweight sticky-note todo app for the Windows desktop.</p>
  <a href="https://github.com/gu-success/donedesk/releases/latest"><img src="https://img.shields.io/github/v/release/gu-success/donedesk?style=flat-square&color=4f7cff" alt="release"></a>
  <a href="https://github.com/gu-success/donedesk/releases"><img src="https://img.shields.io/github/downloads/gu-success/donedesk/total?style=flat-square&color=2ea44f" alt="downloads"></a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows" alt="platform">
  <img src="https://img.shields.io/badge/Electron-desktop-47848F?style=flat-square&logo=electron&logoColor=white" alt="electron">
  <p><b>中文</b> | <a href="README.en.md">English</a></p>
  <p><a href="https://github.com/gu-success/donedesk/releases/download/v1.0.0/DoneDesk-Setup-1.0.0.exe"><b>⬇️ 下载 Windows 安装包 (v1.0.0)</b></a></p>
  <img src="docs/images/hero.png" width="760" alt="事毕 浅色与深色主题">
</div>

## ✨ 功能特性

- 📋 **今日任务** —— 打开即是今天要做的事，顶部显示日期与完成进度。
- ✅ **完成即划线** —— 勾选后任务加删除线，一目了然。
- 🔁 **未完成自动顺延** —— 今天没做完的任务会自动带到第二天，不会丢。
- 🔴 **紧急置顶** —— 任务末尾加 `*` 即标记为紧急：红色显示并置顶。
- ↕️ **拖拽排序** —— 按住拖动即可调整任务顺序。
- 🗓️ **周期任务** —— 支持每天 / 每周（可多选星期）/ 每月（遇到月末自动取当月最后一天）；可设定时间提醒并弹出系统通知；完成后自动生成下一次，不会重复堆积。
- ⌨️ **全局快捷键** —— `Ctrl+Shift+L` 随时显示 / 隐藏窗口。
- 🔒 **加密记事本** —— 使用 scrypt + AES-256-GCM 本地加密，支持闲置自动锁定、系统锁屏时锁定、输错保护。
- 🌗 **主题** —— 浅色 / 深色 / 跟随系统。
- 🪟 **桌面体验** —— 无边框自定义标题栏、窗口置顶、系统托盘、开机自启、单实例运行。
- 💾 **数据完全本地** —— 只保存在 `%APPDATA%\DoneDesk`，原子写入并保留 `.bak` 备份。

## 📸 截图

| 今日任务（浅色） | 今日任务（深色） |
|:---:|:---:|
| <img src="docs/images/1-tasks.png" width="300"> | <img src="docs/images/6-dark-tasks.png" width="300"> |
| **记事本列表** | **记事本已锁定** |
| <img src="docs/images/3b-notes-list.png" width="300"> | <img src="docs/images/2-notes-locked.png" width="300"> |
| **设置（浅色）** | **设置（深色）** |
| <img src="docs/images/4-settings.png" width="300"> | <img src="docs/images/4b-settings-dark.png" width="300"> |
| **首次设置记事本密码** | **深色锁定界面** |
| <img src="docs/images/5-notes-setup.png" width="300"> | <img src="docs/images/7-dark-notes-locked.png" width="300"> |

## 📥 下载安装

1. 前往 [Releases](https://github.com/gu-success/donedesk/releases/latest) 或直接下载 **[DoneDesk-Setup-1.0.0.exe](https://github.com/gu-success/donedesk/releases/download/v1.0.0/DoneDesk-Setup-1.0.0.exe)**。
2. 双击运行安装程序。
3. 系统要求：**Windows 10 / 11（64 位）**。

> [!NOTE]
> 安装包暂未进行代码签名，首次运行时 Windows SmartScreen 可能提示“已保护你的电脑”。点击 **「更多信息」→「仍要运行」** 即可。

## ⌨️ 快捷键与小技巧

| 操作 | 方式 |
|---|---|
| 显示 / 隐藏窗口 | `Ctrl` + `Shift` + `L` |
| 添加任务 | 在底部输入框输入后按 `Enter` |
| 标记紧急 | 任务末尾加 `*`（或点击星标） |
| 调整顺序 | 拖拽任务 |

## 🔒 隐私与安全

- **不联网、无账号**：所有数据只保存在本机 `%APPDATA%\DoneDesk`。
- **加密方式**：记事本内容使用 **scrypt** 派生密钥，**AES-256-GCM** 加密存储。
- **自动锁定**：闲置 1 / 5 / 15 / 30 / 60 分钟或从不（默认 15 分钟）；系统锁屏时立即锁定。
- **防暴力尝试**：连续输错 5 次密码需等待 30 秒。
- **数据安全写入**：原子写入 + `.bak` 备份，降低意外断电导致的数据损坏风险。

> [!WARNING]
> 记事本密码**无法找回**。忘记密码将无法解密已有内容，请务必牢记。

## ❓ 常见问题

<details><summary><b>为什么 Windows 提示“已保护你的电脑”？</b></summary>

安装包尚未购买代码签名证书，SmartScreen 会对未签名程序给出提示。点击「更多信息」→「仍要运行」即可。代码签名已列入计划。
</details>

<details><summary><b>关闭窗口后程序去哪了？</b></summary>

关闭窗口会隐藏到系统托盘；按 `Ctrl+Shift+L` 或点击托盘图标即可重新显示。彻底退出请使用托盘菜单。
</details>

<details><summary><b>数据保存在哪里？如何备份？</b></summary>

在 `%APPDATA%\DoneDesk` 目录。复制该目录即可备份。
</details>

<details><summary><b>忘记记事本密码怎么办？</b></summary>

出于安全设计，密码无法找回，加密内容也无法恢复。
</details>

<details><summary><b>支持 macOS / Linux 吗？</b></summary>

目前仅支持 Windows 10/11 x64，macOS 版本在计划中。
</details>

## 🗺️ 路线图

- [ ] 历史记录视图（查看过去每天完成的任务）
- [ ] 自动更新
- [ ] 安装包代码签名
- [ ] macOS 版本

## 💬 反馈

遇到问题或有新想法？欢迎提交 [Issue](https://github.com/gu-success/donedesk/issues/new/choose)。如果觉得好用，点个 ⭐ Star 支持一下吧！
