export function mapGuildData(apiData: any) {
    return {
        id: apiData.id,
        name: apiData.name,
        members: apiData.members,
        playersOnline: apiData.players_online,
        playersOffline: apiData.players_offline,
        membersTotal: apiData.members_total,
        lastSeen: apiData.lastSeen,
    };
}
