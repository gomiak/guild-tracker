import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> },
) {
    try {
        const API_URL = process.env.API_URL;
        const API_KEY = process.env.API_KEY;

        if (!API_URL || !API_KEY) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 },
            );
        }

        const { name } = await params;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
                { error: 'Nome do personagem é obrigatório' },
                { status: 400 },
            );
        }

        const response = await fetch(
            `${API_URL}/api/external-characters/unmark-exited/${encodeURIComponent(
                name.trim(),
            )}`,
            {
                method: 'POST',
                headers: {
                    'X-API-Key': API_KEY,
                    'Content-Type': 'application/json',
                },
            },
        );

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                {
                    error:
                        errorData.error ||
                        'Erro ao desmarcar personagem como exitado',
                },
                { status: response.status },
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('API Route error:', error);
        return NextResponse.json(
            { error: 'Failed to unmark external character as exited' },
            { status: 502 },
        );
    }
}
