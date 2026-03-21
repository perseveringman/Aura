export class Notice {
    constructor(public message: string, public duration?: number) {}

    setMessage(message: string) {
        this.message = message;
    }

    hide() {
        // noop in tests
    }
}

export class TFile {
    path: string;
    name: string;
    extension: string;
    basename: string;
    parent: any;
    stat: any;
}

export class Plugin {
    app: App;
    manifest: any;
    constructor(app: App, manifest: any) {
        this.app = app;
        this.manifest = manifest;
    }
}

export class App {
    vault: any;
    workspace: any;
    metadataCache: any;
}

export class TAbstractFile {}

export type EventRef = unknown;

export const Platform = {
    isMobile: false
};

function pad(value: number): string {
    return value.toString().padStart(2, '0');
}

function formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());

    switch (format) {
        case 'YYYYMMDD-HHmmss':
            return `${year}${month}${day}-${hour}${minute}${second}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'HH:mm:ss':
            return `${hour}:${minute}:${second}`;
        case 'YYYY-MM-DD HH:mm:ss':
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        default:
            return date.toISOString();
    }
}

export const moment = (input?: string | number | Date, format?: string, strict?: boolean) => {
    let date = input !== undefined ? new Date(input) : new Date();

    if (typeof input === 'string' && format === 'YYYYMMDD-HHmmss') {
        const match = input.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/);
        if (match) {
            date = new Date(
                Number(match[1]),
                Number(match[2]) - 1,
                Number(match[3]),
                Number(match[4]),
                Number(match[5]),
                Number(match[6])
            );
        } else if (strict) {
            date = new Date(Number.NaN);
        }
    }

    return {
        format: (fmt: string) => formatDate(date, fmt),
        isValid: () => !Number.isNaN(date.getTime())
    };
};
