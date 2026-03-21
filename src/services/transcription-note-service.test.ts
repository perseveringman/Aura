import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { TranscriptionNoteService } from './transcription-note-service';
import { DEFAULT_SETTINGS } from '../types/config';

describe('TranscriptionNoteService', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 0, 1, 10, 11, 12));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('uses the audio file creation date for the new transcription note filename', async () => {
        const app = {
            vault: {
                adapter: { exists: vi.fn().mockResolvedValue(false) },
                createFolder: vi.fn(),
                getAbstractFileByPath: vi.fn(),
                read: vi.fn(),
                create: vi.fn().mockResolvedValue({ path: 'Transcription-20250315-080910.md' })
            }
        } as any;

        const service = new TranscriptionNoteService(app, { ...DEFAULT_SETTINGS });
        const audioFile = {
            path: 'Recordings/meeting.m4a',
            basename: 'meeting',
            stat: { ctime: new Date(2025, 2, 15, 8, 9, 10).getTime() }
        } as TFile;

        await service.createTranscriptionNote('transcribed text', audioFile);

        expect(app.vault.create).toHaveBeenCalledWith(
            'Transcription-20250315-080910.md',
            expect.any(String)
        );
    });
});
