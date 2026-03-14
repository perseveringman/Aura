import { App, TFile, moment } from 'obsidian';
import { PluginSettings } from '../types/config';

/**
 * Service for linking transcription notes to daily notes.
 * Extracted from BatchManager for reuse by AutoTranscriptionManager.
 */
export class DailyNoteLinkService {
    constructor(private app: App, private settings: PluginSettings) {}

    /**
     * Link the given notes to their corresponding daily notes.
     * Groups notes by date and links each group to the appropriate daily note.
     */
    public async linkNotesToDailyNote(notes: TFile[]): Promise<void> {
        // Group notes by date: prefer parsing from filename (Transcription-YYYYMMDD-HHmmss),
        // fall back to note creation time
        const notesByDate = new Map<string, TFile[]>();
        
        for (const note of notes) {
            const date = this.getDateFromNote(note);
            if (!notesByDate.has(date)) {
                notesByDate.set(date, []);
            }
            notesByDate.get(date)!.push(note);
        }

        // Link each group to its corresponding daily note
        for (const [, dateNotes] of notesByDate) {
            await this.linkNotesToSingleDailyNote(dateNotes);
        }
    }

    /**
     * Link notes to today's daily note (backward compatible with BatchManager usage).
     */
    private async linkNotesToSingleDailyNote(notes: TFile[]): Promise<void> {
        // Use the first note's date to determine the daily note date
        const dateStr = notes.length > 0 ? this.getDateFromNote(notes[0]) : moment().format('YYYY-MM-DD');
        const noteDate = moment(dateStr, 'YYYY-MM-DD');
        const dailyNote = await this.getOrCreateDailyNote(noteDate);
        if (!dailyNote) {
            return;
        }

        let content = await this.app.vault.read(dailyNote);
        const sectionHeader = '### 语音笔记';
        
        // Filter out notes that are already linked in the daily note
        const newNotes = notes.filter(note => {
            const embedLink = `![[${note.path}|${note.basename}]]`;
            const plainLink = `[[${note.path}|${note.basename}]]`;
            return !content.includes(embedLink) && !content.includes(plainLink);
        });

        if (newNotes.length === 0) {
            return;
        }

        const embed = this.settings.embedInDailyNote;
        const linksContent = newNotes.map(note => {
            const link = embed ? `![[${note.path}|${note.basename}]]` : `[[${note.path}|${note.basename}]]`;
            return `- ${link}`;
        }).join('\n');

        if (content.includes(sectionHeader)) {
            const lines = content.split('\n');
            const headerIndex = lines.findIndex(line => line.trim() === sectionHeader);
            
            // Insert after the header
            lines.splice(headerIndex + 1, 0, linksContent);
            content = lines.join('\n');
        } else {
            // Append the new section to the end of the file
            content = content.trim() + `\n\n${sectionHeader}\n${linksContent}\n`;
        }

        await this.app.vault.modify(dailyNote, content);
    }

    /**
     * Gets a daily note for the given date or creates it if it doesn't exist.
     * Falls back to today if no date is provided.
     */
    /**
     * Extract the date from a transcription note.
     * Parses from filename first (Transcription-YYYYMMDD-HHmmss.md),
     * falls back to note ctime.
     */
    private getDateFromNote(note: TFile): string {
        const match = note.basename.match(/^Transcription-(\d{4})(\d{2})(\d{2})/);
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}`;
        }
        return moment(note.stat.ctime).format('YYYY-MM-DD');
    }

    public async getOrCreateDailyNote(date?: ReturnType<typeof moment>): Promise<TFile | null> {
        const targetDate = date || moment();
        
        // Try to use the Daily Notes plugin settings if available
        const dailyNotesPlugin = (this.app as any).internalPlugins?.getPluginById('daily-notes');
        const dailyNotesEnabled = dailyNotesPlugin?.enabled;
        
        let folder = '';
        let format = 'YYYY-MM-DD';

        if (dailyNotesEnabled && dailyNotesPlugin.instance?.options) {
            const options = dailyNotesPlugin.instance.options;
            folder = options.folder || '';
            format = options.format || 'YYYY-MM-DD';
        }

        const fileName = targetDate.format(format) + '.md';
        const path = folder ? `${folder}/${fileName}` : fileName;

        let file = this.app.vault.getAbstractFileByPath(path);
        
        if (!file) {
            try {
                // Ensure folder exists
                if (folder) {
                    const folderExists = await this.app.vault.adapter.exists(folder);
                    if (!folderExists) {
                        await this.app.vault.createFolder(folder);
                    }
                }
                file = await this.app.vault.create(path, '');
            } catch (error) {
                console.error('创建日记文件失败:', error);
                return null;
            }
        }

        return file instanceof TFile ? file : null;
    }
}
