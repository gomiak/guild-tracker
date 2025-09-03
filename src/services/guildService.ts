import { fetchData } from '@/utils/fetchData';
import { Guild } from '@/types/guild';
import { GuildMember } from '@/types/guild';
interface GuildAnalysis {
    info: {
        name: string;
        online: number;
        offline: number;
        total: number;
    };
    vocations: Record<string, GuildMember[]>;
    byLevel: {
        above: GuildMember[];
        below: GuildMember[];
    };
    sorted: GuildMember[];
}

export async function getGuildData(): Promise<GuildAnalysis> {
    const url = `/api/guild/data`;
    return fetchData<GuildAnalysis>(url);
}
