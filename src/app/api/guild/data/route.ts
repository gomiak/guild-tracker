import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const API_URL = process.env.API_URL;
        const API_KEY = process.env.API_KEY;

        if (!API_URL || !API_KEY) {
            console.error('Missing environment variables in production');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 },
            );
        }

        const response = await fetch(`${API_URL}/api/guild/data`, {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json',
            },
            next: { revalidate: 30 },
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('API Route error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch guild data' },
            { status: 502 },
        );
    }
}
