# Aura for Obsidian

[English](README.md) | 简体中文

一个 AI 驱动的 Obsidian 插件，将你的声音和笔记转化为结构化知识。结合**语音转文字（ASR）**与**大语言模型（LLM）**，完成转录、润色和深度思考。

## 功能特性

- **🎙️ 语音转写**：直接在 Obsidian 中录制音频，或转写已有音频文件，支持智谱 AI 和火山引擎豆包。
- **✨ AI 润色**：自动去除填充词、修正断句，将原始转录整理为流畅的书面文字。
- **🧠 思维动作**：20+ 种认知模型——第一性原理、苏格拉底提问、六顶思考帽、每日复盘等。
- **📦 批量处理**：对文件夹、标签或日期范围内的所有笔记批量执行思维动作。
- **🔌 多模型支持**：OpenAI、Gemini、Claude、DeepSeek、Minimax、智谱 GLM、OpenRouter。
- **📄 长音频支持**：自动分片处理大文件。

## iOS 快捷指令

配套 **[「录音到 Obsidian」快捷指令](https://www.icloud.com/shortcuts/5e5e2f8b05c643b4a5b1ccfb0c5922f3)** —— 在 iPhone 上随时录音，音频自动保存到 Vault，回到桌面端用 Aura 转写。详见[使用文档](https://perseveringman.github.io/Aura/ios-shortcut)。

## 安装方法

1. 前往 [GitHub Releases](https://github.com/perseveringman/Aura/releases) 下载最新版本的 `main.js`、`manifest.json`、`styles.css`。
2. 在 Obsidian 库的 `.obsidian/plugins/` 目录下创建文件夹 `aura`，将三个文件放入。
3. Obsidian → 设置 → 第三方插件 → 启用 **Aura**。

或通过 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 安装：添加仓库 `perseveringman/Aura`。

## 快速开始

1. 设置 → **Aura** → 选择 ASR 服务商并填入 API Key。
2. `Ctrl/Cmd + P` → 搜索 "Open transcription modal" → 开始录音。
3. 停止录音，转录结果自动插入当前笔记。

## 使用文档

- [**在线文档**](https://perseveringman.github.io/Aura/)：安装、功能介绍、Provider 配置指南

## 隐私说明

音频数据将上传至你选择的 ASR 服务商处理，插件本身不在本地存储之外保留音频数据。

## 开源协议

MIT
