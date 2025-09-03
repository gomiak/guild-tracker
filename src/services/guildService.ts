import { fetchData } from '@/utils/fetchData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.API_KEY;

export async function getGuildData() {
    const url = `${API_BASE_URL}/api/guild/data`;

    const options: RequestInit = {
        headers: {
            'X-API-Key': API_KEY || '',
        },
    };

    return fetchData<any>(url, options);
}
