import { Guild } from '@/types/guild';

export function mapGuildData(apiData: {
    guild: {
        name: string;
        members: any[];
        players_online: number;
        players_offline: number;
        members_total: number;
    };
}): Guild {
    return {
        name: apiData.guild.name,
        members: apiData.guild.members,
        playersOnline: apiData.guild.players_online,
        playersOffline: apiData.guild.players_offline,
        membersTotal: apiData.guild.members_total,
    };
}
