import { fetchData } from '@/utils/fetchData';
import { Guild } from '@/types/guild';
import { GuildMember } from '@/types/guild';
interface GuildAnalysis {
    info: {
        name: string;
        online: number;
        offline: number;
        total: number;
        external?: number;
    };
    vocations: Record<string, GuildMember[]>;
    exitedVocations: Record<string, GuildMember[]>;
    byLevel: {
        above: GuildMember[];
        below: GuildMember[];
    };
    sorted: GuildMember[];
    externalCharacters?: Array<{
        name: string;
        level: number;
        vocation: string;
        status: string;
        lastSeen: Date | null;
        isExited: boolean;
        isExternal: boolean;
    }>;
}

export async function getGuildData(): Promise<GuildAnalysis> {
    const url = `/api/guild/combined-data`;
    return fetchData<GuildAnalysis>(url);
}

export async function markMemberAsExited(memberName: string): Promise<void> {
    const url = `/api/guild/mark-exited/${encodeURIComponent(memberName)}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

export async function unmarkMemberAsExited(memberName: string): Promise<void> {
    const url = `/api/guild/unmark-exited/${encodeURIComponent(memberName)}`;
    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
