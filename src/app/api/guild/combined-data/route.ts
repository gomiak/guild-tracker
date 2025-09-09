import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const API_URL = process.env.API_URL;
        const API_KEY = process.env.API_KEY;

        if (!API_URL || !API_KEY) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 },
            );
        }

        const response = await fetch(
            `${API_URL}/api/external-characters/combined-data`,
            {
                method: 'GET',
                headers: {
                    'X-API-Key': API_KEY,
                    'Content-Type': 'application/json',
                },
            },
        );

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('GET Combined Data error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch combined data' },
            { status: 502 },
        );
    }
}
