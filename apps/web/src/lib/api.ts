export const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${apiUrl}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}
