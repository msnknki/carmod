import Config from 'react-native-config';

/** Hosted backend (used when .env is missing or not baked into the native build). */
export const PRODUCTION_API_BASE = 'https://carmod.onrender.com/api';

// Default: always Render. Local backend only when USE_LOCAL_API=true in .env (then rebuild native app).
function normalizeApiBase(raw: string | undefined): string {
  const cleaned = (raw || '')
    .trim()
    .replace(/^["']+|["']+$/g, '');
  return (cleaned || PRODUCTION_API_BASE).replace(/\/$/, '');
}

const useLocalApi =
  __DEV__ &&
  String(Config.USE_LOCAL_API || '').toLowerCase() === 'true';

const API_BASE = useLocalApi
  ? normalizeApiBase(Config.API_BASE_URL)
  : PRODUCTION_API_BASE;

if (__DEV__) {
  console.log('[api] Using base URL:', API_BASE);
}

export const getApiBaseUrl = () => API_BASE;

const REQUEST_TIMEOUT_MS = 20000;

const GUEST_EMAIL = 'guest@carmodapp.local';
const GUEST_PASSWORD = 'guestpass123';
const GUEST_NAME = 'Guest';

let authToken: string | null = null;
let refreshing = false;

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

async function refreshGuestToken(): Promise<void> {
  if (refreshing) return;
  refreshing = true;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: GUEST_EMAIL, password: GUEST_PASSWORD}),
      signal: controller.signal,
    });
    if (res.ok) {
      const data = await res.json();
      authToken = data.token;
    }
  } catch {
    // backend unreachable — leave token as-is
  } finally {
    clearTimeout(timeoutId);
    refreshing = false;
  }
}

async function request(url: string, options: RequestInit, retry = true): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {...options, signal: controller.signal});
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        'Request timed out — the server may be waking up (Render free tier) or unreachable',
      );
    }
    throw new Error(
      'Network error — check your connection and make sure the backend is running',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401 && retry) {
    await refreshGuestToken();
    const retryOptions = {
      ...options,
      headers: getHeaders(),
    };
    return request(url, retryOptions, false);
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

  async patch(endpoint: string, body: object) {
    return request(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
  },

  async del(endpoint: string) {
    return request(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },
};
