import { fetchData } from '@/utils/fetchData';
import { GuildResponse } from '@/types/guild';

export async function getGuildData(): Promise<GuildResponse> {
    const url = `https://api.tibiadata.com/v4/guild/felizes%20para%20sempre`;
    return fetchData<GuildResponse>(url);
}
