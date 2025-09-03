export interface GuildMember {
    name: string;
    vocation: string;
    level: number;
    status: string;
    lastSeen: Date;
}

export interface Guild {
    id: string;
    name: string;
    playersOnline: number;
    playersOffline: number;
    membersTotal: number;
    members: GuildMember[];
}

export interface GuildResponse {
    guild: Guild;
}
