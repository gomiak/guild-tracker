import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export async function GET() {
    try {
        if (!API_URL || !API_KEY) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 },
            );
        }

        const response = await fetch(`${API_URL}/api/messages/data`, {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('GET Messages error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 502 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!API_URL || !API_KEY) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 },
            );
        }

        const { name, message } = await request.json();
        // Validação de entrada
        if (!name || !message) {
            return NextResponse.json(
                { error: 'Name and message are required' },
                { status: 400 },
            );
        }

        if (typeof name !== 'string' || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Name and message must be strings' },
                { status: 400 },
            );
        }

        if (name.trim().length === 0 || message.trim().length === 0) {
            return NextResponse.json(
                { error: 'Name and message cannot be empty' },
                { status: 400 },
            );
        }

        if (message.length > 50) {
            return NextResponse.json(
                { error: 'Message must be 50 characters or less' },
                { status: 400 },
            );
        }

        if (name.length > 50) {
            return NextResponse.json(
                { error: 'Name must be 50 characters or less' },
                { status: 400 },
            );
        }

        const response = await fetch(`${API_URL}/api/messages/data`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, message }),
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('POST Messages error:', error);
        return NextResponse.json(
            { error: 'Failed to save message' },
            { status: 502 },
        );
    }
}
