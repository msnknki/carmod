import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PRODUCTION_API_BASE = 'https://carmod.onrender.com/api';

const AUTH_TOKEN_KEY = '@carmodapp/authToken';

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
export const IMAGE_REQUEST_TIMEOUT_MS = 120_000;

const GUEST_EMAIL = 'guest@carmodapp.local';
const GUEST_PASSWORD = 'guestpass123';
const GUEST_NAME = 'Guest';

let authToken: string | null = null;
let refreshing = false;

export const setAuthToken = (token: string) => {
  authToken = token;
  AsyncStorage.setItem(AUTH_TOKEN_KEY, token).catch(() => {});
};

export const clearAuthToken = () => {
  authToken = null;
  AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
};

export const getAuthToken = () => authToken;

async function loadStoredToken(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (stored) {
      authToken = stored;
    }
  } catch {
  }
}

async function loginGuestRaw(): Promise<string | null> {
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
      return data.token ?? null;
    }
  } catch {
  } finally {
    clearTimeout(timeoutId);
  }
  return null;
}

async function registerGuestRaw(): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: GUEST_EMAIL,
        password: GUEST_PASSWORD,
        displayName: GUEST_NAME,
      }),
      signal: controller.signal,
    });
    if (res.ok) {
      const data = await res.json();
      return data.token ?? null;
    }
  } catch {
  } finally {
    clearTimeout(timeoutId);
  }
  return null;
}

export async function ensureAuthenticated(): Promise<boolean> {
  if (authToken) {
    return true;
  }
  await loadStoredToken();
  if (authToken) {
    return true;
  }

  let token = await registerGuestRaw();
  if (!token) {
    token = await loginGuestRaw();
  }
  if (token) {
    setAuthToken(token);
    return true;
  }
  return false;
}

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
  if (refreshing) {
    return;
  }
  refreshing = true;
  try {
    let token = await loginGuestRaw();
    if (!token) {
      token = await registerGuestRaw();
    }
    if (!token) {
      token = await loginGuestRaw();
    }
    if (token) {
      setAuthToken(token);
    }
  } finally {
    refreshing = false;
  }
}

async function request(
  url: string,
  options: RequestInit,
  retry = true,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<any> {
  if (!authToken) {
    await ensureAuthenticated();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {...options, signal: controller.signal});
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      const seconds = Math.round(timeoutMs / 1000);
      throw new Error(
        timeoutMs > REQUEST_TIMEOUT_MS
          ? `Image request timed out after ${seconds}s — try again; Render may still be waking up`
          : 'Request timed out — the server may be waking up (Render free tier) or unreachable',
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
    if (!authToken) {
      throw new Error(
        'Could not sign in — check your internet connection and try again (Render may be waking up)',
      );
    }
    const retryOptions = {
      ...options,
      headers: getHeaders(),
    };
    return request(url, retryOptions, false, timeoutMs);
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
  async post(
    endpoint: string,
    body: object,
    options?: {timeoutMs?: number},
  ) {
    return request(
      `${API_BASE}${endpoint}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      },
      true,
      options?.timeoutMs ?? REQUEST_TIMEOUT_MS,
    );
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
