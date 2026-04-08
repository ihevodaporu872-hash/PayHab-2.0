const API_BASE = 'http://localhost:8001';

const headers = (): HeadersInit => ({ 'Content-Type': 'application/json' });

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Ошибка сервера' }));
    throw new Error(err.detail || 'Ошибка');
  }
  if (res.status === 204) return null;
  return res.json();
};

export const api = {
  get: (url: string) => fetch(`${API_BASE}${url}`, { headers: headers() }).then(handleResponse),
  post: (url: string, data?: unknown) =>
    fetch(`${API_BASE}${url}`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  put: (url: string, data?: unknown) =>
    fetch(`${API_BASE}${url}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  delete: (url: string) =>
    fetch(`${API_BASE}${url}`, { method: 'DELETE', headers: headers() }).then(handleResponse),
};
