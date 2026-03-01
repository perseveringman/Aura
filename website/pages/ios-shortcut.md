---
title: iOS 快捷指令
---

# iOS 快捷指令

Aura 提供配套的 iOS 快捷指令 **「录音到 Obsidian」**，让你在 iPhone / iPad 上随时录音，音频自动保存到 Obsidian Vault，回到桌面端即可用 Aura 转写和处理。

## 安装快捷指令

1. 在 iPhone 或 iPad 上点击下方链接：

   👉 [**获取「录音到 Obsidian」快捷指令**](https://www.icloud.com/shortcuts/5e5e2f8b05c643b4a5b1ccfb0c5922f3)

2. 点击 **添加快捷指令**。
3. 首次运行时，系统会请求麦克风和文件访问权限，请允许。

## 配置 Vault 路径

安装后需要确保快捷指令将录音保存到你的 Obsidian Vault 目录。

- 如果你使用 **iCloud 同步**，Vault 默认位于 `iCloud Drive/Obsidian/<你的 Vault 名>/` 下。
- 建议在 Vault 中创建一个专用文件夹（如 `recordings/`），用于存放录音文件。
- 打开快捷指令编辑界面，检查保存路径是否指向正确的 Vault 目录。

## 使用流程

```
iPhone 录音 → 音频保存到 Vault → Obsidian 同步 → Aura 转写 & 润色
```

1. **录音**：在 iPhone 上运行「录音到 Obsidian」快捷指令，开始录音。
2. **保存**：录音结束后，音频文件自动保存到 Vault 的指定目录。
3. **同步**：通过 iCloud（或其他同步方案）将音频同步到桌面端。
4. **转写**：在 Obsidian 中右键点击该音频文件 → **Transcribe audio**，Aura 会自动完成转写。
5. **润色 / 思考**：对转写结果使用 [AI 润色](/features/ai-polish) 或 [思维动作](/features/thinking-actions) 进一步处理。

## 小技巧

- **添加到主屏幕**：长按快捷指令 → 添加到主屏幕，一键即可开始录音。
- **配合 Aura 模板**：在 Aura 设置中配置转写输出模板，转写结果会自动按模板格式化。
- **批量转写**：如果积累了多个录音，可以使用 Aura 的[批量处理](/features/batch)功能一次性转写整个文件夹。

## 常见问题

### 录音保存后在 Obsidian 中看不到？

- 检查 iCloud 同步是否完成（打开「文件」App 查看是否有云朵图标）。
- 确认快捷指令保存路径与 Obsidian Vault 路径一致。

### 支持哪些音频格式？

快捷指令默认录制 m4a 格式，Aura 完整支持该格式。Aura 支持的所有格式：mp3, wav, m4a, ogg, flac, aac, webm。
