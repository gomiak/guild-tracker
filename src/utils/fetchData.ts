export async function fetchData<T>(url: string): Promise<T> {
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Erro na requisição: ${res.statusText}`);
    }

    return res.json() as Promise<T>;
}
