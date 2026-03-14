import { App, MarkdownView, Notice, TFile, moment, TFolder } from 'obsidian';
import { LLMManager } from './llm-manager';
import { RootCategory, AIAction, SourceConfig } from '../types/action';
import { PluginSettings } from '../types/config';
import { DEFAULT_PROMPTS } from '../data/default-prompts';
import { TimeRangeModal } from '../ui/modals/time-range-modal';
import { TagSelectionModal } from '../ui/modals/tag-selection-modal';
import { ExtractedMetadata } from '../types/metadata';
import { safeParseJson } from '../utils/json-utils';

export class ActionManager {
    private categories: RootCategory[] = [];
    private settings: PluginSettings;

    constructor(
        private app: App,
        private llmManager: LLMManager,
        settings: PluginSettings,
        private saveSettings?: () => Promise<void>
    ) {
        this.settings = settings;
        this.loadDefaultActions();
    }

    public updateSettings(settings: PluginSettings) {
        this.settings = settings;
    }

    public getMostFrequentActions(limit: number = 4): AIAction[] {
        const counts = this.settings.actionUsageCounts || {};
        const allActions: AIAction[] = [];
        
        // Flatten all actions
        for (const root of this.categories) {
            for (const sub of root.subCategories) {
                allActions.push(...sub.actions);
            }
        }

        // Sort by usage count (descending)
        return allActions
            .filter(action => (counts[action.id] || 0) > 0)
            .sort((a, b) => {
                const countA = counts[a.id] || 0;
                const countB = counts[b.id] || 0;
                return countB - countA;
            })
            .slice(0, limit);
    }

    private async recordActionUsage(actionId: string) {
        if (!this.settings.actionUsageCounts) {
            this.settings.actionUsageCounts = {};
        }
        
        this.settings.actionUsageCounts[actionId] = (this.settings.actionUsageCounts[actionId] || 0) + 1;
        
        if (this.saveSettings) {
            await this.saveSettings();
        }
    }

    private getPrompt(id: string): string {
        return this.settings.customPrompts[id] || DEFAULT_PROMPTS[id] || '';
    }

    // ... loadDefaultActions ...
    private loadDefaultActions() {
        this.categories = [
            {
                id: 'emergence',
                name: 'AI 涌现', // Level 1: Root
                subCategories: [
                    {
                        id: 'thinking-decision',
                        name: '思维决策', // Level 2: Sub
                        actions: [ // Level 3: Actions
                            {
                                id: 'value-clarification',
                                name: '价值澄清', 
                                description: '分析内容，提取核心价值',
                                icon: 'star',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('value-clarification'),
                            },
                            {
                                id: 'first-principles',
                                name: '第一性原理',
                                description: '剥离表象，回归事物最原本的真理',
                                icon: 'box',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('first-principles'),
                            },
                            {
                                id: 'six-thinking-hats',
                                name: '六顶思考帽',
                                description: '全方位视角分析',
                                icon: 'hard-hat',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('six-thinking-hats'),
                            },
                            {
                                id: 'socratic-questioning',
                                name: '苏格拉底提问',
                                description: '通过追问发现盲点',
                                icon: 'help-circle',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('socratic-questioning'),
                            },
                            {
                                id: 'endgame-thinking',
                                name: '终局思维',
                                description: '以终为始，推演终局并反向规划行动路径',
                                icon: 'flag',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('endgame-thinking'),
                            }
                        ]
                    },
                    {
                        id: 'content-processing',
                        name: '内容处理',
                        actions: [
                            {
                                id: 'extract-metadata',
                                name: '提取元数据',
                                description: '自动分析笔记并填充 Frontmatter',
                                icon: 'file-json',
                                outputMode: 'frontmatter',
                                systemPrompt: this.getPrompt('extract-metadata'),
                            },
                            {
                                id: 'core-summary',
                                name: '核心摘要',
                                description: '提取要点并生成结构化摘要',
                                icon: 'list',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('core-summary'),
                            },
                            {
                                id: 'task-extraction',
                                name: '待办提取',
                                description: '识别并提取可执行的任务项',
                                icon: 'check-square',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('task-extraction'),
                            }
                        ]
                    },
                    {
                        id: 'creative-inspiration',
                        name: '创意启发',
                        actions: [
                            {
                                id: 'perspective-collision',
                                name: '观点对撞',
                                description: '提供对立视角，激发辩证思考',
                                icon: 'zap',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('perspective-collision'),
                            },
                            {
                                id: 'master-debate',
                                name: '大师辩论',
                                description: '模拟多位大师针对内容进行深度辩论',
                                icon: 'users',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('master-debate'),
                            },
                            {
                                id: 'mindmap-outline',
                                name: '思维导图大纲',
                                description: '将内容转化为逻辑清晰的思维导图大纲',
                                icon: 'layout-list',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('mindmap-outline'),
                            }
                        ]
                    },
                    {
                        id: 'knowledge-management',
                        name: '知识管理',
                        actions: [
                            {
                                id: 'knowledge-link',
                                name: '知识连接',
                                description: '探索笔记与其它领域知识的关联',
                                icon: 'link',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('knowledge-link'),
                            },
                            {
                                id: 'concept-clarification',
                                name: '概念释义',
                                description: '提取并深度解析核心概念',
                                icon: 'book-open',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('concept-clarification'),
                            }
                        ]
                    },
                    {
                        id: 'recommendation',
                        name: '推荐内容',
                        actions: [
                            {
                                id: 'book-recommendation',
                                name: '书单推荐',
                                description: '基于笔记内容推荐相关的经典书籍',
                                icon: 'book',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('book-recommendation'),
                            },
                            {
                                id: 'poetry-recommendation',
                                name: '诗歌共鸣',
                                description: '寻找与笔记意境共鸣的经典诗歌',
                                icon: 'scroll',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('poetry-recommendation'),
                            },
                            {
                                id: 'figure-recommendation',
                                name: '人物连接',
                                description: '推荐思想契合或经历相关的历史/现代人物',
                                icon: 'user-plus',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('figure-recommendation'),
                            },
                            {
                                id: 'media-recommendation',
                                name: '影音推荐',
                                description: '推荐相关的电影、纪录片 or 播客',
                                icon: 'film',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('media-recommendation'),
                            }
                        ]
                    },
                    {
                        id: 'reflection',
                        name: '复盘',
                        actions: [
                            {
                                id: 'daily-review',
                                name: '日评',
                                description: '回顾今日所得，总结经验教训',
                                icon: 'sun',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('daily-review'),
                            },
                            {
                                id: 'weekly-review',
                                name: '周评',
                                description: '梳理本周进展，规划下周重点',
                                icon: 'calendar',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('weekly-review'),
                            },
                            {
                                id: 'monthly-review',
                                name: '月评',
                                description: '全面月度回顾：数据洞察、趋势对比、反思提问',
                                icon: 'calendar-range',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('monthly-review'),
                            },
                            {
                                id: 'project-aar',
                                name: '项目复盘',
                                description: '针对项目进行 AAR 复盘分析',
                                icon: 'target',
                                outputMode: 'new-note',
                                systemPrompt: this.getPrompt('project-aar'),
                            }
                        ]
                    }
                ]
            }
        ];
    }
    
    public getCategories(): RootCategory[] {
        return this.categories;
    }

    private getActiveModelName(): string {
        const { llmProvider } = this.settings;
        switch (llmProvider) {
            case 'openrouter': return this.settings.openRouterModel;
            case 'gemini': return this.settings.geminiModel;
            case 'openai': return this.settings.openAIModel;
            case 'anthropic': return this.settings.anthropicModel;
            case 'zhipu': return this.settings.zhipuLLMModel;
            case 'minimax': return this.settings.minimaxModel;
            case 'deepseek': return this.settings.deepseekModel;
            default: return 'unknown';
        }
    }

    public async executeAction(action: AIAction, source: SourceConfig) {
        await this.recordActionUsage(action.id);

        switch (source.type) {
            case 'date-range':
                new TimeRangeModal(this.app, (start, end) => {
                    this.executeDateRangeAction(action, start, end);
                }).open();
                break;
            case 'tag':
                new TagSelectionModal(this.app, (tag) => {
                    this.executeTagAction(action, tag);
                }).open();
                break;
            case 'current-folder':
                this.executeFolderAction(action);
                break;
            case 'selection':
                this.executeSelectionAction(action);
                break;
            case 'current-note':
            default:
                this.executeCurrentNoteAction(action);
                break;
        }
    }

    private executeCurrentNoteAction(action: AIAction) {
        // Default: current-note
        let activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        
        // If focus is in sidebar, getActiveViewOfType might return null.
        // Try to get the active file and find its corresponding view.
        if (!activeView) {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile && activeFile.extension === 'md') {
                const leaves = this.app.workspace.getLeavesOfType('markdown');
                const matchingLeaf = leaves.find(l => (l.view as MarkdownView).file === activeFile);
                if (matchingLeaf) {
                    activeView = matchingLeaf.view as MarkdownView;
                }
            }
        }

        if (!activeView) {
            new Notice('未找到活动的 Markdown 文件。');
            return;
        }

        const editor = activeView.editor;
        const content = editor.getValue();
        
        if (!content.trim()) {
            new Notice('笔记内容为空。');
            return;
        }

        this.runLLM(action, content, activeView.file);
    }

    private async executeSelectionAction(action: AIAction) {
        let activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        
        // If focus is in sidebar, try to find the view for the active file
        if (!activeView) {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile && activeFile.extension === 'md') {
                const leaves = this.app.workspace.getLeavesOfType('markdown');
                const matchingLeaf = leaves.find(l => (l.view as MarkdownView).file === activeFile);
                if (matchingLeaf) {
                    activeView = matchingLeaf.view as MarkdownView;
                }
            }
        }

        if (!activeView) {
            new Notice('未找到活动的 Markdown 视图。');
            return;
        }

        const editor = activeView.editor;
        const selection = editor.getSelection();

        if (!selection.trim()) {
            new Notice('未选中任何文本。');
            return;
        }

        // Treat selection like a current note action but with selected text
        this.runLLM(action, selection, activeView.file, [], undefined, undefined, "Selected Text");
    }

    private async executeFolderAction(action: AIAction) {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('未找到活动文件。');
            return;
        }

        const parent = activeFile.parent;
        if (!parent) {
             new Notice('无法确定父文件夹。');
             return;
        }

        const files = this.fetchFilesByFolder(parent);
        if (files.length === 0) {
            new Notice('当前文件夹中没有 Markdown 文件。');
            return;
        }

        new Notice(`正在处理文件夹 ${parent.name} 中的 ${files.length} 篇笔记...`);
        
        const combinedContent = await this.combineFilesContent(files, `Folder: ${parent.path}`);
        this.runLLM(action, combinedContent, null, files, undefined, undefined, `Folder: ${parent.name}`);
    }

    private async executeTagAction(action: AIAction, tag: string) {
        const files = this.fetchFilesByTag(tag);
         if (files.length === 0) {
            new Notice(`未找到标签为 ${tag} 的笔记。`);
            return;
        }

        new Notice(`正在处理标签 ${tag} 下的 ${files.length} 篇笔记...`);

        const combinedContent = await this.combineFilesContent(files, `Tag: ${tag}`);
        this.runLLM(action, combinedContent, null, files, undefined, undefined, `Tag: ${tag}`);
    }

    private fetchFilesByFolder(folder: TFolder): TFile[] {
        const files: TFile[] = [];
        for (const child of folder.children) {
            if (child instanceof TFile && child.extension === 'md') {
                files.push(child);
            }
        }
        return files;
    }

    private fetchFilesByTag(tag: string): TFile[] {
        const files = this.app.vault.getMarkdownFiles();
        return files.filter(file => {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) return false;
            
            // Check frontmatter tags
            const frontmatterTags = cache.frontmatter?.tags;
            if (frontmatterTags) {
                if (Array.isArray(frontmatterTags)) {
                    if (frontmatterTags.includes(tag) || frontmatterTags.includes(tag.replace('#', ''))) return true;
                } else if (typeof frontmatterTags === 'string') {
                    if (frontmatterTags === tag || frontmatterTags === tag.replace('#', '')) return true;
                }
            }

            // Check inline tags
            if (cache.tags) {
                if (cache.tags.some(t => t.tag === tag)) return true;
            }

            return false;
        });
    }

    private async combineFilesContent(files: TFile[], headerInfo: string): Promise<string> {
        let combinedContent = `Context: ${headerInfo}\n\n`;
        for (const file of files) {
            const content = await this.app.vault.read(file);
            combinedContent += `\n\n--- Note: [[${file.basename}]] ---\n${content}`;
        }
        combinedContent += `\n\nIMPORTANT: You must start your response with "Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）" on the very first line.`;
        return combinedContent;
    }

    private async executeDateRangeAction(action: AIAction, start: moment.Moment, end: moment.Moment) {
        const files = this.fetchFilesByDateRange(start, end);
        if (files.length === 0) {
            new Notice('所选日期范围内没有找到笔记。');
            return;
        }

        new Notice(`正在处理 ${files.length} 篇笔记...`);

        const combinedContent = await this.combineFilesContent(files, `Analysis Period: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`);

        this.runLLM(action, combinedContent, null, files, start, end);
    }

    private fetchFilesByDateRange(start: moment.Moment, end: moment.Moment): TFile[] {
        const allFiles = this.app.vault.getMarkdownFiles();
        // Set start to beginning of day and end to end of day
        const startTime = start.clone().startOf('day').valueOf();
        const endTime = end.clone().endOf('day').valueOf();

        return allFiles.filter(file => {
            const ctime = file.stat.ctime;
            return ctime >= startTime && ctime <= endTime;
        });
    }

    private async runLLM(action: AIAction, content: string, sourceFile: TFile | null, sourceFiles: TFile[] = [], start?: moment.Moment, end?: moment.Moment, contextInfo?: string) {
        new Notice(`正在执行 AI 操作：${action.name}...`);

        const messages = [
            { role: 'system' as const, content: action.systemPrompt },
            { role: 'user' as const, content: content }
        ];

        try {
            // Use streaming for new-note output mode
            if (action.outputMode === 'new-note' && this.llmManager.supportsStreaming()) {
                await this.runStreamingLLM(action, messages, sourceFile, sourceFiles, start, end, contextInfo);
            } else {
                const result = await this.llmManager.complete(messages);
                await this.handleOutput(action, result, sourceFile, sourceFiles, start, end, contextInfo);
                new Notice('AI 操作已完成！');
            }
        } catch (error) {
            console.error('AI Action failed:', error);
            const message = error instanceof Error ? error.message : String(error);
            new Notice(`AI 操作失败：${message}`);
        }
    }

    private async runStreamingLLM(
        action: AIAction,
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
        sourceFile: TFile | null,
        sourceFiles: TFile[] = [],
        start?: moment.Moment,
        end?: moment.Moment,
        contextInfo?: string
    ) {
        // Create the note first with placeholder content
        const { file: newFile, contentPrefix } = await this.createStreamingNote(
            action, sourceFile, sourceFiles, start, end, contextInfo
        );

        // Open the note immediately
        const leaf = this.app.workspace.getLeaf('split', 'vertical');
        await leaf.openFile(newFile);

        let fullContent = '';
        let lastUpdateTime = 0;
        const updateInterval = 100; // Update file every 100ms max

        const updateFile = async (final: boolean = false) => {
            const now = Date.now();
            if (!final && now - lastUpdateTime < updateInterval) return;
            lastUpdateTime = now;

            // Parse topic from accumulated content
            let topic = '';
            let cleanContent = fullContent.trim();
            const lines = cleanContent.split('\n');
            
            for (let i = 0; i < Math.min(lines.length, 10); i++) {
                const line = lines[i].trim();
                const match = line.match(/^Topic:\s*(.*)/i);
                if (match) {
                    topic = match[1].trim().replace(/^[\[【"']+|[\]】"']+$/g, '').trim();
                    lines.splice(i, 1);
                    cleanContent = lines.join('\n').trim();
                    break;
                }
            }

            // Rebuild frontmatter with topic if found
            let finalContent = contentPrefix;
            if (topic) {
                // Insert topic into frontmatter
                finalContent = finalContent.replace('---\n\n', `topic: ${topic}\n---\n\n`);
            }
            finalContent += cleanContent;

            // Add references if final
            if (final && sourceFiles.length > 0) {
                finalContent += `\n\n## References\n`;
                for (const file of sourceFiles) {
                    finalContent += `- [[${file.path}|${file.basename}]]\n`;
                }
            }

            await this.app.vault.modify(newFile, finalContent);
        };

        try {
            await this.llmManager.stream(messages, async (chunk, done) => {
                if (chunk) {
                    fullContent += chunk;
                    await updateFile(false);
                }
                if (done) {
                    await updateFile(true);
                }
            });

            // Insert backlink to source note
            if (sourceFile) {
                const leaves = this.app.workspace.getLeavesOfType('markdown');
                const sourceLeaf = leaves.find(l => (l.view as MarkdownView).file === sourceFile);
                if (sourceLeaf) {
                    const editor = (sourceLeaf.view as MarkdownView).editor;
                    const linkText = `\n\n[[${newFile.basename}|${action.name} Output]]\n`;
                    const lineCount = editor.lineCount();
                    editor.replaceRange(linkText, { line: lineCount, ch: 0 });
                }
            }

            new Notice('AI 操作已完成！');
        } catch (error) {
            // On error, keep what we have
            await updateFile(true);
            throw error;
        }
    }

    private async createStreamingNote(
        action: AIAction,
        sourceFile: TFile | null,
        sourceFiles: TFile[] = [],
        start?: moment.Moment,
        end?: moment.Moment,
        contextInfo?: string
    ): Promise<{ file: TFile; contentPrefix: string }> {
        const folder = this.settings.aiActionNoteFolder || '思维涌现';
        
        if (folder !== '/') {
            const folderExists = await this.app.vault.adapter.exists(folder);
            if (!folderExists) {
                await this.app.vault.createFolder(folder);
            }
        }

        const timestamp = moment().format('YYYYMMDD-HHmmss');
        let filenameBase = action.name;
        
        if (start && end) {
            filenameBase += `-${start.format('YYYYMMDD')}-${end.format('YYYYMMDD')}`;
        } else if (contextInfo) {
            const sanitizedContext = contextInfo.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-').substring(0, 20);
            filenameBase += `-${sanitizedContext}`;
        } else if (sourceFile) {
            filenameBase += `-${sourceFile.basename}`;
        }
        
        const filename = `${filenameBase}-${timestamp}.md`;
        const path = folder === '/' ? filename : `${folder}/${filename}`;

        // Build content prefix (frontmatter + source info)
        let contentPrefix = `---\ntags:\n  - AI涌现/${action.name}\nmodel: ${this.getActiveModelName()}\n---\n\n`;

        if (sourceFile) {
            contentPrefix += `> [!info] Source: [[${sourceFile.path}|${sourceFile.basename}]]\n\n`;
            if (contextInfo === "Selected Text") {
                contentPrefix += `> [!info] Scope: Selected Text\n\n`;
            }
        } else if (sourceFiles.length > 0) {
            if (start && end) {
                contentPrefix += `> [!info] Analysis of ${sourceFiles.length} notes from ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\n\n`;
            } else if (contextInfo) {
                contentPrefix += `> [!info] Analysis of ${sourceFiles.length} notes. Source: ${contextInfo}\n\n`;
            }
        }

        // Add streaming indicator
        contentPrefix += `_Generating..._\n\n`;

        const newFile = await this.app.vault.create(path, contentPrefix);
        return { file: newFile, contentPrefix: contentPrefix.replace('_Generating..._\n\n', '') };
    }

    private async handleOutput(action: AIAction, text: string, sourceFile: TFile | null, sourceFiles: TFile[] = [], start?: moment.Moment, end?: moment.Moment, contextInfo?: string) {
        if (action.outputMode === 'frontmatter') {
            await this.handleFrontmatterOutput(text, sourceFile);
            return;
        }

        if (action.outputMode === 'new-note') {
            await this.createNewNote(action, text, sourceFile, sourceFiles, start, end, contextInfo);
            return;
        }
        
        // Fallback for current note append/replace
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView && sourceFile && activeView.file === sourceFile) {
             const editor = activeView.editor;
             const formattedText = `\n\n${text}\n`;
             
             switch (action.outputMode) {
                case 'append': {
                    const lineCount = editor.lineCount();
                    editor.replaceRange(formattedText, { line: lineCount, ch: 0 });
                    break;
                }
                case 'replace':
                    editor.setValue(text);
                    break;
                default: {
                    const lineCountDef = editor.lineCount();
                    editor.replaceRange(formattedText, { line: lineCountDef, ch: 0 });
                }
            }
        }
    }

    private async handleFrontmatterOutput(text: string, sourceFile: TFile | null) {
        if (!sourceFile) {
            new Notice('没有可更新 Frontmatter 的源文件。');
            return;
        }

        const data = safeParseJson<ExtractedMetadata>(text);
        if (!data) {
            new Notice('无法解析 AI 返回的元数据。');
            return;
        }

        try {
            await this.app.fileManager.processFrontMatter(sourceFile, (fm) => {
                if (data.title) fm['title'] = data.title;
                if (data.summary) fm['summary'] = data.summary;
                if (data.mood) fm['mood'] = data.mood;
                if (data.date) fm['date'] = data.date;

                if (data.tags && data.tags.length > 0) {
                    const existingTags = new Set<string>();
                    if (Array.isArray(fm['tags'])) {
                        fm['tags'].forEach((t: string) => existingTags.add(t));
                    } else if (typeof fm['tags'] === 'string') {
                        fm['tags'].split(',').forEach((t: string) => existingTags.add(t.trim()));
                    }
                    data.tags.forEach(t => existingTags.add(t));
                    fm['tags'] = Array.from(existingTags);
                }

                if (data.people && data.people.length > 0) {
                    const existingPeople = new Set<string>(fm['people'] || []);
                    data.people.forEach(p => existingPeople.add(p));
                    fm['people'] = Array.from(existingPeople);
                }

                if (data.actionItems && data.actionItems.length > 0) {
                    const existingActions = new Set<string>(fm['actionItems'] || []);
                    data.actionItems.forEach(a => existingActions.add(a));
                    fm['actionItems'] = Array.from(existingActions);
                }
            });
            new Notice('Frontmatter 更新成功！');
        } catch (error) {
            console.error('Failed to update frontmatter:', error);
            new Notice('Frontmatter 更新失败。');
        }
    }

    private async createNewNote(action: AIAction, content: string, sourceFile: TFile | null, sourceFiles: TFile[] = [], start?: moment.Moment, end?: moment.Moment, contextInfo?: string) {
        const folder = this.settings.aiActionNoteFolder || '思维涌现';
        
        // Ensure folder exists
        if (folder !== '/') {
            const folderExists = await this.app.vault.adapter.exists(folder);
            if (!folderExists) {
                await this.app.vault.createFolder(folder);
            }
        }

        // Parse Topic
        let topic = '';
        let cleanContent = content.trim();
        
        // Robust parsing: Look for Topic: line in the first 10 lines
        const lines = cleanContent.split('\n');
        for (let i = 0; i < Math.min(lines.length, 10); i++) {
            const line = lines[i].trim();
            const match = line.match(/^Topic:\s*(.*)/i);
            if (match) {
                topic = match[1].trim();
                // Remove potential brackets or quotes added by LLM
                topic = topic.replace(/^[\[【"']+|[\]】"']+$/g, '').trim();
                // Remove the topic line
                lines.splice(i, 1);
                cleanContent = lines.join('\n').trim();
                break;
            }
        }

        const timestamp = moment().format('YYYYMMDD-HHmmss');
        let filenameBase = action.name;
        
        if (start && end) {
            filenameBase += `-${start.format('YYYYMMDD')}-${end.format('YYYYMMDD')}`;
        } else if (contextInfo) {
             // Sanitize context info for filename
             const sanitizedContext = contextInfo.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-').substring(0, 20);
             filenameBase += `-${sanitizedContext}`;
        } else if (sourceFile) {
            filenameBase += `-${sourceFile.basename}`;
        }
        
        const filename = `${filenameBase}-${timestamp}.md`;
        const path = folder === '/' ? filename : `${folder}/${filename}`;

        // Prepare content with frontmatter and backlink
        let finalContent = `---\ntags:\n  - AI涌现/${action.name}\n`;
        if (topic) {
            finalContent += `topic: ${topic}\n`;
        }
        finalContent += `model: ${this.getActiveModelName()}\n`;
        finalContent += `---\n\n`;

        if (sourceFile) {
            finalContent += `> [!info] Source: [[${sourceFile.path}|${sourceFile.basename}]]\n\n`;
            if (contextInfo === "Selected Text") {
                finalContent += `> [!info] Scope: Selected Text\n\n`;
            }
        } else if (sourceFiles.length > 0) {
            if (start && end) {
                finalContent += `> [!info] Analysis of ${sourceFiles.length} notes from ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\n\n`;
            } else if (contextInfo) {
                finalContent += `> [!info] Analysis of ${sourceFiles.length} notes. Source: ${contextInfo}\n\n`;
            }
        }
        
        finalContent += cleanContent;
        
        // Append list of source files if multiple
        if (sourceFiles.length > 0) {
            finalContent += `\n\n## References\n`;
            for (const file of sourceFiles) {
                finalContent += `- [[${file.path}|${file.basename}]]\n`;
            }
        }

        // Create the new note
        const newFile = await this.app.vault.create(path, finalContent);
        
        // Insert link to current note (only if single source)
        if (sourceFile) {
            // Try to find the view for the source file
            const leaves = this.app.workspace.getLeavesOfType('markdown');
            const sourceLeaf = leaves.find(l => (l.view as MarkdownView).file === sourceFile);
            
            if (sourceLeaf) {
                const editor = (sourceLeaf.view as MarkdownView).editor;
                const linkText = `\n\n[[${newFile.basename}|${action.name} Output]]\n`;
                const lineCount = editor.lineCount();
                editor.replaceRange(linkText, { line: lineCount, ch: 0 });
            }
        }

        // Open the new note in a split to the right
        const leaf = this.app.workspace.getLeaf('split', 'vertical');
        await leaf.openFile(newFile);
    }
}
