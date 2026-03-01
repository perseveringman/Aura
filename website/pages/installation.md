---
title: 安装与快速入门
---

# 安装与快速入门

## 安装方法

### 方式一：手动安装（当前）

1. 前往 [GitHub Releases](https://github.com/perseveringman/Aura/releases) 下载最新版本的 `main.js`、`manifest.json`、`styles.css`。
2. 在你的 Obsidian 库（Vault）的 `.obsidian/plugins/` 目录下创建文件夹 `aura`。
3. 将三个文件放入该文件夹。
4. 打开 Obsidian → 设置 → 第三方插件 → 启用 **Aura**。

### 方式二：通过 BRAT 安装（Beta）

1. 先安装 [BRAT 插件](https://github.com/TfTHacker/obsidian42-brat)。
2. 在 BRAT 设置中添加仓库：`perseveringman/Aura`。
3. 在第三方插件中启用 **Aura**。

## 快速配置

安装后，至少需要配置一个 ASR 服务商才能开始使用：

1. 打开 Obsidian → 设置 → **Aura**。
2. 在"转录服务商"中选择 **智谱 AI** 或 **火山引擎**。
3. 填入对应的 API Key（详见 [Provider 配置](/providers/overview)）。

## 第一次转录

1. 使用命令面板（`Ctrl/Cmd + P`）搜索 **Open transcription modal**。
2. 点击 **Start Recording** 开始录音。
3. 点击 **Stop Recording** 结束录音，转录结果将自动插入当前笔记。

## 系统要求

- Obsidian 0.15.0 或更高版本
- 支持桌面端和移动端
- 需要网络连接（调用 ASR/LLM API）
