const API_BASE = 'http://localhost:8001';

const getToken = (): string | null => localStorage.getItem('payhab_token');

const headers = (): HeadersInit => {
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    localStorage.removeItem('payhab_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
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

export const authApi = {
  login: (username: string, password: string) =>
    fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(handleResponse),
};
