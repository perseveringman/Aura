import { Plugin, Notice, TFile, TAbstractFile, moment, Menu, MarkdownView, Editor } from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings } from './types/config';
import { ASRSettingTab } from './ui/settings-tab';
import { AudioRecorder } from './services/audio-recorder';
import { RecordingModal } from './ui/recording-view';
import { TextInserter } from './services/text-inserter';
import { VaultUtils } from './utils/vault-utils';
import { AudioSelectionModal } from './ui/audio-selection-modal';
import { TranscriptionManager } from './managers/transcription-manager';
import { LLMManager } from './managers/llm-manager';
import { ActionManager } from './managers/action-manager';
import { BatchManager } from './managers/batch-manager';
import { AutoTranscriptionManager } from './managers/auto-transcription-manager';
import { AutoLinkManager } from './managers/auto-link-manager';
import { TranscriptionNoteService } from './services/transcription-note-service';
import { DailyNoteLinkService } from './services/daily-note-link-service';
import { ArticleReaderManager } from './managers/article-reader-manager';
import { AISidebarView, VIEW_TYPE_AI_SIDEBAR } from './ui/sidebar/sidebar-view';
import { hasConfiguredSetup } from './ui/settings/settings-state';

export default class AuraPlugin extends Plugin {
    settings!: PluginSettings;
    recorder!: AudioRecorder;
    textInserter!: TextInserter;
    transcriptionManager!: TranscriptionManager;
    llmManager!: LLMManager;
    actionManager!: ActionManager;
    batchManager!: BatchManager;
    noteService!: TranscriptionNoteService;
    articleReaderManager!: ArticleReaderManager;
    autoTranscriptionManager!: AutoTranscriptionManager;
    autoLinkManager!: AutoLinkManager;
    dailyNoteLinkService!: DailyNoteLinkService;

    async onload() {
        await this.loadSettings();

        this.recorder = new AudioRecorder();
        this.textInserter = new TextInserter(this.app, this.settings);
        this.transcriptionManager = new TranscriptionManager(this.settings);
        this.llmManager = new LLMManager(this.settings);
        this.noteService = new TranscriptionNoteService(this.app, this.settings);
        this.dailyNoteLinkService = new DailyNoteLinkService(this.app, this.settings);
        this.actionManager = new ActionManager(this.app, this.llmManager, this.settings, this.saveSettings.bind(this));
        this.batchManager = new BatchManager(this.app, this.settings, this.transcriptionManager, this.llmManager, this.noteService);
        this.articleReaderManager = new ArticleReaderManager(this.app, this.settings, this.llmManager);
        this.autoTranscriptionManager = new AutoTranscriptionManager(
            this.app,
            this.settings,
            this.transcriptionManager,
            this.llmManager,
            this.noteService
        );
        this.autoLinkManager = new AutoLinkManager(
            this.app,
            this.settings,
            this.dailyNoteLinkService
        );

        this.addSettingTab(new ASRSettingTab(this.app, this));

        // Register View
        this.registerView(
            VIEW_TYPE_AI_SIDEBAR,
            (leaf) => new AISidebarView(leaf, this.actionManager)
        );

        // Add Ribbon Icon
        this.addRibbonIcon('bot', '打开 AI 操作', () => {
            this.activateView();
        });

        // Register commands
        this.addCommand({
            id: 'open-ai-sidebar',
            name: '打开 AI 操作侧边栏',
            callback: () => {
                this.activateView();
            }
        });

        this.addCommand({
            id: 'open-asr-modal',
            name: '打开转写窗口',
            callback: () => {
                new RecordingModal(this.app, this.recorder, this.handleTranscription.bind(this)).open();
            }
        });

        this.addCommand({
            id: 'transcribe-referenced-audio',
            name: '转写当前笔记中引用的音频',
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile || activeFile.extension !== 'md') return false;
                
                if (checking) return true;

                const audioFiles = VaultUtils.getReferencedAudioFiles(this.app, activeFile);
                if (audioFiles.length === 0) {
                    new Notice('当前笔记中未找到音频文件引用。');
                    return true;
                }

                if (audioFiles.length === 1) {
                    void this.handleFileTranscription(audioFiles[0]);
                } else {
                    new AudioSelectionModal(this.app, audioFiles, (file) => {
                        void this.handleFileTranscription(file);
                    }).open();
                }
                return true;
            }
        });

        this.addCommand({
            id: 'start-recording',
            name: '开始录音',
            callback: () => {
                void this.recorder.start().catch((err: unknown) => {
                    const message = err instanceof Error ? err.message : String(err);
                    new Notice(`录音启动失败: ${message}`);
                });
            }
        });

        this.addCommand({
            id: 'stop-recording',
            name: '停止录音',
            callback: () => {
                this.recorder.stop();
            }
        });

        this.addCommand({
            id: 'batch-process-todays-audio',
            name: '批量处理今日音频笔记',
            callback: () => {
                void this.batchManager.processTodaysAudioFiles();
            }
        });

        this.addCommand({
            id: 'analyze-url-at-cursor',
            name: '分析光标处的链接',
            editorCallback: async (editor: Editor) => {
                await this.handleUrlAtCursor(editor);
            }
        });

        this.addCommand({
            id: 'beautify-current-note',
            name: '美化当前笔记格式',
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile || activeFile.extension !== 'md') return false;
                
                if (checking) return true;

                void this.handleBeautifyNote(activeFile);
                return true;
            }
        });

        // Register paste event for auto-trigger
        this.registerEvent(
            this.app.workspace.on('editor-paste', (evt: ClipboardEvent, editor: Editor) => {
                if (!this.settings.enableArticleReader || !this.settings.articleReaderAutoTrigger) {
                    return;
                }
                const text = evt.clipboardData?.getData('text/plain');
                if (text) {
                    const url = this.articleReaderManager.extractUrl(text);
                    if (url) {
                        evt.preventDefault();
                        void this.handlePastedUrl(editor, text, url);
                    }
                }
            })
        );

        // Register file menu event for right-click transcription on audio files
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
                if (file instanceof TFile && this.isAudioFile(file)) {
                    menu.addItem((item) => {
                        item
                            .setTitle('转写音频')
                            .setIcon('mic')
                            .onClick(() => {
                                void this.handleAudioFileTranscription(file);
                            });
                    });
                }
            })
        );

        // Start auto transcription monitoring
        this.autoTranscriptionManager.start();

        // Start auto link monitoring
        this.autoLinkManager.start();
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf = workspace.getLeavesOfType(VIEW_TYPE_AI_SIDEBAR)[0];

        if (!leaf) {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                await rightLeaf.setViewState({
                    type: VIEW_TYPE_AI_SIDEBAR,
                    active: true,
                });
                leaf = workspace.getLeavesOfType(VIEW_TYPE_AI_SIDEBAR)[0];
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    private isAudioFile(file: TFile): boolean {
        const audioExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac'];
        return audioExtensions.includes(file.extension.toLowerCase());
    }

    /**
     * Handle URL at cursor position - triggered by command
     */
    async handleUrlAtCursor(editor: Editor) {
        if (!this.settings.enableArticleReader) {
            new Notice('文章阅读器未启用，请在设置中开启。');
            return;
        }

        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        const url = this.articleReaderManager.extractUrl(line);

        if (!url) {
            new Notice('当前行未找到 URL。');
            return;
        }

        try {
            const { link } = await this.articleReaderManager.processUrl(url);
            // Insert link below the URL line
            const lineEnd = { line: cursor.line, ch: line.length };
            editor.replaceRange(`\n${link}`, lineEnd);
        } catch (err) {
            // Error already shown by manager
        }
    }

    /**
     * Handle pasted URL - triggered by paste event
     */
    async handlePastedUrl(editor: Editor, pastedText: string, url: string) {
        // First, insert the pasted URL
        editor.replaceSelection(pastedText);
        const cursor = editor.getCursor();

        try {
            const { link } = await this.articleReaderManager.processUrl(url);
            // Insert link below the pasted URL
            const lineEnd = { line: cursor.line, ch: editor.getLine(cursor.line).length };
            editor.replaceRange(`\n${link}`, lineEnd);
        } catch (err) {
            // Error already shown by manager
        }
    }

    /**
     * Handle transcription of an audio file from context menu
     * Always creates a new note with the transcription
     */
    async handleAudioFileTranscription(file: TFile) {
        try {
            const fullText = await this.transcriptionManager.transcribe(file, this.app);
            const aiText = await this.llmManager.polish(fullText);
            const noteFile = await this.noteService.createTranscriptionNote(fullText, file, aiText);
            
            // Open the new note
            const leaf = this.app.workspace.getLeaf(true);
            await leaf.openFile(noteFile);
            
            new Notice(`转写完成: ${file.name}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            new Notice(`转写失败: ${file.name} — ${message}`);
            console.error('ASR Plugin error:', err);
        }
    }

    async handleTranscription(audio: Blob | File, styleId?: string) {
        const notice = new Notice('处理音频中...', 0);

        try {
            // 1. Save the audio file if it's a new recording (Blob)
            let audioFile: TFile | null = null;
            if (!(audio instanceof File)) {
                const timestamp = moment().format('YYYYMMDD-HHmmss');
                const extension = audio.type.includes('wav') ? 'wav' : 'mp3';
                const fileName = `Recording-${timestamp}.${extension}`;
                const folder = this.settings.audioSaveFolder || '/';
                
                // Ensure folder exists
                if (folder !== '/') {
                    const folderExists = await this.app.vault.adapter.exists(folder);
                    if (!folderExists) {
                        await this.app.vault.createFolder(folder);
                    }
                }
                
                const path = folder === '/' ? fileName : `${folder}/${fileName}`;
                const arrayBuffer = await audio.arrayBuffer();
                audioFile = await this.app.vault.createBinary(path, arrayBuffer);
                new Notice(`音频已保存: ${fileName}`);
            }

            // 2. Process transcription using Manager
            const fullText = await this.transcriptionManager.transcribe(audio, this.app);
            
            // 3. AI 润色
            let aiText = '';
            try {
                // Pass the selected style ID if available
                aiText = await this.llmManager.polish(fullText, styleId);
            } catch (err: unknown) {
                 const message = err instanceof Error ? err.message : String(err);
                 new Notice(`AI 润色失败: ${message}`, 5000);
            }

            await this.textInserter.insert(fullText, audioFile || undefined, aiText);
            notice.hide();
            new Notice('转写完成！');
        } catch (err: unknown) {
            notice.hide();
            const message = err instanceof Error ? err.message : String(err);
            new Notice(`转写失败: ${message}`);
            console.error('ASR Plugin error:', err);
        }
    }

    async handleFileTranscription(file: TFile) {
        try {
            const fullText = await this.transcriptionManager.transcribe(file, this.app);
            
            let aiText = '';
            try {
                aiText = await this.llmManager.polish(fullText);
            } catch (err: unknown) {
                 const message = err instanceof Error ? err.message : String(err);
                 new Notice(`AI 润色失败: ${message}`, 5000);
            }

            await this.textInserter.insert(fullText, file, aiText);
            new Notice(`转写完成: ${file.name}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            new Notice(`转写失败: ${file.name} — ${message}`);
            console.error('ASR Plugin error:', err);
        }
    }

    /**
     * Handle beautifying the current note's formatting without changing text content
     */
    async handleBeautifyNote(file: TFile) {
        const notice = new Notice('笔记美化中...', 0);
        
        try {
            const content = await this.app.vault.read(file);
            const beautified = await this.llmManager.beautifyNote(content);
            await this.app.vault.modify(file, beautified);
            notice.hide();
            new Notice('笔记美化完成！');
        } catch (err: unknown) {
            notice.hide();
            const message = err instanceof Error ? err.message : String(err);
            new Notice(`笔记美化失败: ${message}`);
            console.error('ASR Plugin error:', err);
        }
    }

    onunload() {
        if (this.recorder) {
            this.recorder.stop();
        }
        if (this.autoTranscriptionManager) {
            this.autoTranscriptionManager.stop();
        }
        if (this.autoLinkManager) {
            this.autoLinkManager.stop();
        }
    }

    async loadSettings() {
        const loadedData = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

        const hasUiState = !!loadedData
            && typeof loadedData === 'object'
            && (
                'onboardingCompleted' in loadedData
                || 'settingsViewMode' in loadedData
                || 'lastActiveTab' in loadedData
            );

        if (!hasUiState) {
            const hasConfigured = hasConfiguredSetup(this.settings);

            this.settings.onboardingCompleted = hasConfigured;
            this.settings.settingsViewMode = hasConfigured ? 'tabs' : 'wizard';
            this.settings.lastActiveTab = 'quickstart';
        }

        if (this.settings.settingsViewMode !== 'wizard' && this.settings.settingsViewMode !== 'tabs') {
            this.settings.settingsViewMode = this.settings.onboardingCompleted ? 'tabs' : 'wizard';
        }

        const validTabs = new Set(['quickstart', 'asr', 'llm', 'ai-advanced', 'general-advanced']);
        if (!validTabs.has(this.settings.lastActiveTab)) {
            this.settings.lastActiveTab = 'quickstart';
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // Update Managers
        this.transcriptionManager.updateSettings(this.settings);
        this.llmManager.updateSettings(this.settings);
        this.noteService.updateSettings(this.settings);
        this.textInserter = new TextInserter(this.app, this.settings);
        
        // Update action manager if needed
        if (this.actionManager) {
             this.actionManager.updateSettings(this.settings);
        }
        
        // Update article reader manager
        if (this.articleReaderManager) {
            this.articleReaderManager.updateSettings(this.settings);
        }
        
        // Update auto transcription manager
        if (this.autoTranscriptionManager) {
            this.autoTranscriptionManager.updateSettings(this.settings);
        }

        // Update auto link manager
        if (this.autoLinkManager) {
            this.autoLinkManager.updateSettings(this.settings);
        }
    }
}
