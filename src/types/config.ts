import { ArticleFetcherType } from './article';

export enum InsertPosition {
    CURSOR = 'cursor',
    DOCUMENT_END = 'document-end',
    NEW_NOTE = 'new-note'
}

export enum TranscriptionProvider {
    ZHIPU = 'zhipu',
    VOLCENGINE = 'volcengine',
    LOCAL_WHISPER = 'local-whisper'
}

export enum LLMProvider {
    OPENROUTER = 'openrouter',
    GEMINI = 'gemini',
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    ZHIPU = 'zhipu',
    MINIMAX = 'minimax',
    DEEPSEEK = 'deepseek'
}

export interface PluginSettings {
    transcriptionProvider: TranscriptionProvider;
    zhipuApiKey: string; // For ASR
    volcengineAppId: string;
    volcengineAccessToken: string;
    
    // Volcengine Enhanced Features
    enableSpeakerDiarization: boolean;
    enableTimestamps: boolean;
    
    // Local Whisper Settings
    whisperServerUrl: string;
    whisperModel: string;
    whisperLanguage: string;
    insertPosition: InsertPosition;
    addTimestamp: boolean;
    addSeparator: boolean;
    audioSaveFolder: string;
    hotwords: string[];
    contextPrompt: string;
    debugLogging: boolean;
    retryCount: number;
    timeout: number;
    templatePath: string;
    voiceNoteFolder: string;
    aiActionNoteFolder: string;
    
    // AI Polishing Settings
    enableAiPolishing: boolean;
    llmProvider: LLMProvider;
    systemPrompt: string;

    // Provider Specific Settings
    openRouterApiKey: string;
    openRouterModel: string;

    geminiApiKey: string;
    geminiModel: string;

    openAIApiKey: string;
    openAIModel: string;
    openAIBaseUrl: string; // Support custom proxies

    anthropicApiKey: string;
    anthropicModel: string;

    zhipuLLMApiKey: string; // Separate from ASR key potentially, or reuse? Better separate for clarity.
    zhipuLLMModel: string;

    minimaxApiKey: string;
    minimaxModel: string;

    deepseekApiKey: string;
    deepseekModel: string;

    // Style Presets
    stylePresets: StylePreset[];
    selectedStylePresetId: string;

    actionUsageCounts: Record<string, number>;
    customPrompts: Record<string, string>;

    // Auto Transcription Settings
    enableAutoTranscription: boolean;

    // Auto Link to Daily Note Settings
    enableAutoLink: boolean;
    embedInDailyNote: boolean;

    // Article Reader Settings
    enableArticleReader: boolean;
    articleReaderAutoTrigger: boolean;
    articleNoteFolder: string;
    articleFetcherType: ArticleFetcherType;
    articleReaderSystemPrompt: string;
    jinaApiKey: string;

    // Settings UI State
    onboardingCompleted: boolean;
    settingsViewMode: 'wizard' | 'tabs';
    lastActiveTab: 'quickstart' | 'asr' | 'llm' | 'ai-advanced' | 'general-advanced';
}

export interface StylePreset {
    id: string;
    name: string;
    prompt: string;
}

export const DEFAULT_STYLE_PRESETS: StylePreset[] = [
    {
        id: 'default',
        name: 'Default (Generic)',
        prompt: "You are a helpful assistant that polishes transcribed speech. Your task is to fix typos, remove redundancies (like 'um', 'ah', repeated words), and ensure sentences are grammatically correct and flow smoothly. DO NOT change the original structure, meaning, or tone. DO NOT add any introductory or concluding remarks. Output ONLY the polished text."
    },
    {
        id: 'meeting-minutes',
        name: '📝 Meeting Minutes',
        prompt: "You are a professional meeting secretary. Transform the following transcript into structured meeting minutes.\n\nRequirements:\n1. **Summary**: A brief 1-sentence summary of the discussion.\n2. **Key Points**: Bullet points of main topics discussed.\n3. **Action Items**: A checklist of tasks with assignees (if mentioned) and deadlines.\n4. **Decisions**: Key decisions made.\n\nKeep the tone professional and objective. Remove filler words and irrelevant small talk."
    },
    {
        id: 'spoken-to-written',
        name: '🎙️ Spoken to Written',
        prompt: "You are an expert editor. Convert the following spoken transcript into a well-written, coherent article or prose.\n\nRequirements:\n- Remove all filler words, false starts, and repetitions.\n- Improve sentence structure and flow.\n- Merge short, choppy sentences into fluid paragraphs.\n- Maintain the speaker's original voice and intent but make it read like a written piece.\n- Add appropriate headings if the content is long."
    },
    {
        id: 'flash-idea',
        name: '🧠 Flash Idea',
        prompt: "You are a personal knowledge assistant. The user has just dictated a quick thought or idea. Your job is to capture it faithfully but cleanly.\n\nRequirements:\n- Fix speech recognition errors (typos, homophones).\n- Remove 'um's and 'ah's.\n- Keep the text raw and authentic.\n- Do NOT summarize or restructure. Just polish the syntax."
    },
    {
        id: 'social-media',
        name: '🐦 Social Media Thread',
        prompt: "You are a social media expert. Convert the transcript into an engaging Twitter/X thread or LinkedIn post.\n\nRequirements:\n- Use a hook in the first line.\n- Use short, punchy paragraphs.\n- Use appropriate emojis.\n- Add relevant hashtags at the end.\n- Ensure the tone is engaging and viral-worthy."
    }
];

export const DEFAULT_SETTINGS: PluginSettings = {
    transcriptionProvider: TranscriptionProvider.ZHIPU,
    zhipuApiKey: '',
    volcengineAppId: '',
    volcengineAccessToken: '',
    
    // Volcengine Enhanced Features Defaults
    enableSpeakerDiarization: false,
    enableTimestamps: false,
    
    // Local Whisper Defaults
    whisperServerUrl: 'http://localhost:9000',
    whisperModel: 'base',
    whisperLanguage: 'auto',
    
    insertPosition: InsertPosition.CURSOR,
    addTimestamp: true,
    addSeparator: true,
    audioSaveFolder: '/',
    hotwords: [],
    contextPrompt: '',
    debugLogging: false,
    retryCount: 3,
    timeout: 30000,
    templatePath: '',
    voiceNoteFolder: '/',
    aiActionNoteFolder: '思维涌现',

    // AI Polishing Defaults
    enableAiPolishing: false,
    llmProvider: LLMProvider.OPENROUTER,
    systemPrompt: DEFAULT_STYLE_PRESETS[0].prompt, // Keep for backward compatibility or simple usage
    
    stylePresets: DEFAULT_STYLE_PRESETS,
    selectedStylePresetId: 'default',

    openRouterApiKey: '',
    openRouterModel: 'google/gemini-2.0-flash-exp:free',

    geminiApiKey: '',
    geminiModel: 'gemini-2.0-flash',

    openAIApiKey: '',
    openAIModel: 'gpt-4o-mini',
    openAIBaseUrl: 'https://api.openai.com/v1',

    anthropicApiKey: '',
    anthropicModel: 'claude-3-5-sonnet-latest',

    zhipuLLMApiKey: '',
    zhipuLLMModel: 'glm-4-flash',

    minimaxApiKey: '',
    minimaxModel: 'MiniMax-M2.5',

    deepseekApiKey: '',
    deepseekModel: 'deepseek-chat',

    actionUsageCounts: {},
    customPrompts: {},

    // Auto Transcription Defaults
    enableAutoTranscription: false,

    // Auto Link Defaults
    enableAutoLink: true,
    embedInDailyNote: true,

    // Article Reader Defaults
    enableArticleReader: true,
    articleReaderAutoTrigger: false,
    articleNoteFolder: 'Articles',
    articleFetcherType: ArticleFetcherType.FETCH,
    articleReaderSystemPrompt: '',
    jinaApiKey: '',

    // Settings UI State Defaults
    onboardingCompleted: false,
    settingsViewMode: 'wizard',
    lastActiveTab: 'quickstart'
};
