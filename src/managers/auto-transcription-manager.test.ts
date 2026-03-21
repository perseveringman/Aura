import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { AutoTranscriptionManager } from './auto-transcription-manager';
import { DEFAULT_SETTINGS } from '../types/config';

describe('AutoTranscriptionManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('skips processing when another device already claimed the same audio file', async () => {
        const readBinary = vi.fn().mockResolvedValue(new ArrayBuffer(8));
        const createClaim = vi.fn().mockRejectedValue(new Error('File already exists'));
        const createNote = vi.fn();
        const transcribe = vi.fn().mockResolvedValue('transcribed text');

        const app = createApp({
            readBinary,
            create: createClaim,
            getAbstractFileByPath: vi.fn((path: string) => path === 'Recordings/20260318-101500.m4a' ? audioFile() : null)
        });

        const manager = new AutoTranscriptionManager(
            app as any,
            {
                ...DEFAULT_SETTINGS,
                enableAutoTranscription: true,
                audioSaveFolder: 'Recordings',
                voiceNoteFolder: 'Transcriptions'
            },
            { transcribe } as any,
            { polish: vi.fn() } as any,
            { createTranscriptionNote: vi.fn() } as any
        );

        const pending = (manager as any).handleNewAudioFile(audioFile());
        await vi.advanceTimersByTimeAsync(10000);
        await pending;

        expect(createClaim).toHaveBeenCalledWith(
            'Transcriptions/.aura-locks/20260318-101500.json',
            expect.any(String)
        );
        expect(transcribe).not.toHaveBeenCalled();
        expect(readBinary).not.toHaveBeenCalled();
        expect(createNote).not.toHaveBeenCalled();
    });

    it('creates a shared claim before transcribing an unclaimed audio file', async () => {
        const transcribe = vi.fn().mockResolvedValue('transcribed text');
        const createTranscriptionNote = vi.fn().mockResolvedValue({ path: 'Transcriptions/Transcription-20260318-101500.md' });
        const createClaim = vi.fn()
            .mockResolvedValueOnce({ path: 'Transcriptions/.aura-locks/20260318-101500.json' })
            .mockResolvedValueOnce({ path: 'Transcriptions/Transcription-20260318-101500.md' });
        const remove = vi.fn().mockResolvedValue(undefined);
        const app = createApp({
            create: createClaim,
            remove,
            getAbstractFileByPath: vi.fn((path: string) => path === 'Recordings/20260318-101500.m4a' ? audioFile() : null)
        });

        const manager = new AutoTranscriptionManager(
            app as any,
            {
                ...DEFAULT_SETTINGS,
                enableAutoTranscription: true,
                audioSaveFolder: 'Recordings',
                voiceNoteFolder: 'Transcriptions'
            },
            { transcribe } as any,
            { polish: vi.fn().mockResolvedValue('') } as any,
            { createTranscriptionNote } as any
        );

        const pending = (manager as any).handleNewAudioFile(audioFile());
        await vi.advanceTimersByTimeAsync(10000);
        await pending;

        expect(createClaim).toHaveBeenNthCalledWith(
            1,
            'Transcriptions/.aura-locks/20260318-101500.json',
            expect.any(String)
        );
        expect(transcribe).toHaveBeenCalledWith(expect.objectContaining({ path: 'Recordings/20260318-101500.m4a' }), app);
        expect(createTranscriptionNote).toHaveBeenCalledWith(
            'transcribed text',
            expect.objectContaining({ path: 'Recordings/20260318-101500.m4a' }),
            ''
        );
        expect(remove).toHaveBeenCalledWith('Transcriptions/.aura-locks/20260318-101500.json');
    });
});

function createApp(overrides: Record<string, unknown> = {}) {
    const adapter = {
        exists: vi.fn().mockResolvedValue(false),
        mkdir: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined)
    };

    const mergedAdapter = {
        ...adapter,
        ...pick(overrides, ['exists', 'mkdir', 'remove'])
    };

    const vault = {
        adapter: mergedAdapter,
        on: vi.fn(),
        offref: vi.fn(),
        getFiles: vi.fn().mockReturnValue([]),
        getAbstractFileByPath: vi.fn(),
        create: vi.fn().mockResolvedValue({ path: 'Transcriptions/Transcription-20260318-101500.md' }),
        readBinary: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    };

    return {
        vault: {
            ...vault,
            ...pick(overrides, ['on', 'offref', 'getFiles', 'getAbstractFileByPath', 'create', 'readBinary'])
        },
        workspace: {},
        metadataCache: {},
        ...pick(overrides, ['workspace', 'metadataCache'])
    };
}

function audioFile(): TFile {
    return Object.assign(new TFile(), {
        path: 'Recordings/20260318-101500.m4a',
        name: '20260318-101500.m4a',
        extension: 'm4a',
        basename: '20260318-101500',
        stat: {
            mtime: new Date(2026, 2, 18, 10, 15, 0).getTime(),
            ctime: new Date(2026, 2, 18, 10, 15, 0).getTime()
        }
    });
}

function pick(source: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
        if (key in source) {
            result[key] = source[key];
        }
    }
    return result;
}
