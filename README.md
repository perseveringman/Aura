# Aura for Obsidian

[English](README.md) | [简体中文](README_CN.md)

An AI-powered Obsidian plugin that transforms your voice and notes into structured knowledge. Combines **Speech-to-Text (ASR)** with **Large Language Models** to transcribe, polish, and think through your ideas.

## Key Features

- **🎙️ Voice Transcription**: Record directly in Obsidian or transcribe existing audio files. Supports Zhipu AI and Volcengine Doubao.
- **✨ AI Polishing**: Remove filler words, fix punctuation, and reformat raw transcripts into clean prose.
- **🧠 Thinking Actions**: 20+ cognitive models — First Principles, Socratic Questioning, Six Thinking Hats, Daily Review, and more.
- **📦 Batch Processing**: Run any thinking action across a folder, tag, or date range.
- **🔌 Multi-Provider LLM**: OpenAI, Gemini, Claude, DeepSeek, Minimax, Zhipu GLM, OpenRouter.
- **📄 Long Audio Support**: Automatically chunks large files for providers with size limits.

## iOS Shortcut

Pair with the **[Record to Obsidian](https://www.icloud.com/shortcuts/5e5e2f8b05c643b4a5b1ccfb0c5922f3)** shortcut — record on your iPhone, audio saves to your Vault, then transcribe with Aura on desktop.

## Quick Start

1. **Install**: Download `main.js`, `manifest.json`, `styles.css` to `.obsidian/plugins/aura/`, or install via BRAT.
2. **Configure**: Settings → **Aura** → choose an ASR provider and enter your API Key.
3. **Use**: `Cmd/Ctrl + P` → "Open transcription modal", or right-click any audio file → "Transcribe audio".

## Documentation

- [**使用文档（中文）**](https://perseveringman.github.io/Aura/)
- [**Provider Setup Guide**](docs/providers.md)
- [**Architecture & Development**](docs/architecture.md)

## License

MIT
