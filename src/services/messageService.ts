export interface MemberMessage {
    name: string;
    message: string;
}

export async function getMessages(): Promise<MemberMessage[]> {
    const response = await fetch('/api/messages/data');
    if (!response.ok) throw new Error('Erro ao buscar mensagens');
    return response.json();
}

export async function saveMessage(
    name: string,
    message: string,
): Promise<MemberMessage> {
    if (message.length > 50) {
        throw new Error('Mensagem deve ter no máximo 50 caracteres');
    }

    const response = await fetch('/api/messages/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, message }),
    });

    if (!response.ok) throw new Error('Erro ao salvar mensagem');
    return response.json();
}
