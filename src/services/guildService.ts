import { fetchData } from '@/utils/fetchData';

const API_BASE_URL = ''; 

export async function getGuildData() {
    const url = `https://guild-tracker-api.onrender.com/api/guild/data`; 

    const options: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    return fetchData<any>(url, options);
}