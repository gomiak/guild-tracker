export interface GuildMember {
    name: string;
    vocation: string;
    level: number;
    status: string;
    lastSeen: Date;
    isExited: boolean;
    isExternal?: boolean;
}

export interface Guild {
    id?: string;
    name: string;
    playersOnline: number;
    playersOffline: number;
    membersTotal: number;
    members: GuildMember[];
}

export interface GuildResponse {
    guild: Guild;
}

export interface ExternalCharacter {
    name: string;
    level: number;
    vocation: string;
    status: string;
    lastSeen: Date | null;
    isExited: boolean;
    isExternal: boolean;
}

export interface GuildAnalysis {
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
    exitedByLevel: {
        above: GuildMember[];
        below: GuildMember[];
    };
    exitedSorted: GuildMember[];
    externalCharacters?: ExternalCharacter[];
}
