import { fetchData } from '@/utils/fetchData';

export interface ExternalCharacter {
    name: string;
    level: number;
    vocation: string;
    status: string;
    lastSeen: Date | null;
    isExited: boolean;
    isExternal: boolean;
}

export async function addExternalCharacter(name: string): Promise<void> {
    const response = await fetch('/api/external-characters/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar personagem');
    }
}

export async function removeExternalCharacter(name: string): Promise<void> {
    const response = await fetch(
        `/api/external-characters/remove/${encodeURIComponent(name)}`,
        {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover personagem');
    }
}

export async function getExternalCharacters(): Promise<ExternalCharacter[]> {
    const url = '/api/external-characters/list';
    return fetchData<ExternalCharacter[]>(url);
}

export async function markExternalCharacterAsExited(
    name: string,
): Promise<void> {
    const response = await fetch(
        `/api/external-characters/mark-exited/${encodeURIComponent(name)}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.error || 'Erro ao marcar personagem como exitado',
        );
    }
}

export async function unmarkExternalCharacterAsExited(
    name: string,
): Promise<void> {
    const response = await fetch(
        `/api/external-characters/unmark-exited/${encodeURIComponent(name)}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.error || 'Erro ao desmarcar personagem como exitado',
        );
    }
}
