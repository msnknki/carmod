const API_BASE = 'http://10.0.2.2:3000/api'; // Android emulator → localhost

let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
};

async function request(url: string, options: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error(
      'Network error — check your connection and make sure the backend is running',
    );
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned ${res.status} with no JSON body`);
  }

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Rate limit reached — please wait a moment and try again');
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  async post(endpoint: string, body: object) {
    return request(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
  },

  async get(endpoint: string) {
    return request(`${API_BASE}${endpoint}`, {
      headers: getHeaders(),
    });
  },

  async del(endpoint: string) {
    return request(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },
};
