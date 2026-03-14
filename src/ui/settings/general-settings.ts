import { PluginSettings, TranscriptionProvider, LLMProvider, InsertPosition } from '../../types/config';
import ASRPlugin from '../../main';
import { Setting, SettingTab } from 'obsidian';

export class GeneralSettingsTab {
    constructor(private containerEl: HTMLElement, private plugin: ASRPlugin) {}

    display(): void {
        new Setting(this.containerEl)
            .setName('通用设置')
            .setHeading();

        new Setting(this.containerEl)
            .setName('音频保存文件夹')
            .setDesc('录音文件保存的文件夹')
            .addText(text => text
                .setPlaceholder('/')
                .setValue(this.plugin.settings.audioSaveFolder)
                .onChange(async (value) => {
                    this.plugin.settings.audioSaveFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('语音笔记文件夹')
            .setDesc('新建语音笔记所在的文件夹')
            .addText(text => text
                .setPlaceholder('/')
                .setValue(this.plugin.settings.voiceNoteFolder)
                .onChange(async (value) => {
                    this.plugin.settings.voiceNoteFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('AI 操作笔记文件夹')
            .setDesc('AI 生成笔记（例如来自侧边栏）所在的文件夹')
            .addText(text => text
                .setPlaceholder('思维涌现')
                .setValue(this.plugin.settings.aiActionNoteFolder)
                .onChange(async (value) => {
                    this.plugin.settings.aiActionNoteFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('模板文件路径')
            .setDesc('新语音笔记的模板文件路径（例如：templates/voice-note.md）')
            .addText(text => text
                .setPlaceholder('templates/voice-note.md')
                .setValue(this.plugin.settings.templatePath)
                .onChange(async (value) => {
                    this.plugin.settings.templatePath = value;
                    await this.plugin.saveSettings();
                }));

        // Auto Transcription Settings
        new Setting(this.containerEl)
            .setName('自动转写设置')
            .setHeading();

        new Setting(this.containerEl)
            .setName('自动转写新音频文件')
            .setDesc('添加音频文件到保存文件夹时自动转写。启动时也会扫描未处理的音频。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableAutoTranscription)
                .onChange(async (value) => {
                    this.plugin.settings.enableAutoTranscription = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('自动链接到每日笔记')
            .setDesc('自动将转写笔记链接到对应日期的每日笔记。启动时扫描未链接的笔记并监听新笔记。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableAutoLink)
                .onChange(async (value) => {
                    this.plugin.settings.enableAutoLink = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('嵌入转写笔记到每日笔记')
            .setDesc('开启后使用 ![[]] 嵌入模式，关闭后使用 [[]] 链接模式。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.embedInDailyNote)
                .onChange(async (value) => {
                    this.plugin.settings.embedInDailyNote = value;
                    await this.plugin.saveSettings();
                }));
        
        // Insertion Settings
        new Setting(this.containerEl)
            .setName('插入设置')
            .setHeading();

        new Setting(this.containerEl)
            .setName('插入位置')
            .setDesc('转写文本插入的位置')
            .addDropdown(dropdown => dropdown
                .addOption(InsertPosition.CURSOR, '光标处')
                .addOption(InsertPosition.DOCUMENT_END, '文档末尾')
                .addOption(InsertPosition.NEW_NOTE, '新建笔记')
                .setValue(this.plugin.settings.insertPosition)
                .onChange(async (value) => {
                    this.plugin.settings.insertPosition = value as InsertPosition;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('添加时间戳')
            .setDesc('在转写文本前添加时间戳')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.addTimestamp)
                .onChange(async (value) => {
                    this.plugin.settings.addTimestamp = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('添加分隔符')
            .setDesc('在转写文本前添加分隔符')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.addSeparator)
                .onChange(async (value) => {
                    this.plugin.settings.addSeparator = value;
                    await this.plugin.saveSettings();
                }));
    }
}
