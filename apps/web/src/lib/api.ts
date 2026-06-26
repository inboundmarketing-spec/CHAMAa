/** No browser usa proxy same-origin (/api → Nest). No servidor, URL direta. */
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  const url =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
  return url.replace(/\/$/, '');
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('chama_token');
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('chama_token');
  localStorage.removeItem('chama_user');
}

function networkErrorMessage(cause: unknown): string {
  const hint =
    typeof window !== 'undefined'
      ? ' Verifique se a API está rodando (npm run dev na raiz do projeto).'
      : '';
  if (cause instanceof TypeError) {
    return `Não foi possível conectar à API.${hint}`;
  }
  return cause instanceof Error ? cause.message : 'Erro de rede';
}

export async function apiForm<T>(
  path: string,
  formData: FormData,
  method = 'POST',
): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
  } catch (err) {
    throw new Error(networkErrorMessage(err));
  }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      clearToken();
      window.location.assign('/login');
    }
    const err = await res.text();
    let message = err || res.statusText;
    try {
      const parsed = JSON.parse(err) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      /* texto bruto */
    }
    throw new Error(
      message && message !== res.statusText
        ? `${message} (${path})`
        : `${res.statusText || 'Erro na requisição'} (${path})`,
    );
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text.trim()) return null as T;
  return JSON.parse(text) as T;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (err) {
    throw new Error(networkErrorMessage(err));
  }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      clearToken();
      window.location.assign('/login');
    }
    const err = await res.text();
    let message = err || res.statusText;
    try {
      const parsed = JSON.parse(err) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      /* texto bruto */
    }
    throw new Error(
      message && message !== res.statusText
        ? `${message} (${path})`
        : `${res.statusText || 'Erro na requisição'} (${path})`,
    );
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text.trim()) return null as T;
  return JSON.parse(text) as T;
}

async function publicApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (err) {
    throw new Error(networkErrorMessage(err));
  }
  if (!res.ok) {
    const err = await res.text();
    let message = err || res.statusText;
    try {
      const parsed = JSON.parse(err) as { message?: string | string[] };
      const msg = parsed.message;
      if (typeof msg === 'string') message = msg;
      else if (Array.isArray(msg)) message = msg.join(', ');
    } catch {
      /* texto bruto */
    }
    throw new Error(
      message && message !== res.statusText
        ? `${message} (${path})`
        : `${res.statusText || 'Erro na requisição'} (${path})`,
    );
  }
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  return publicApi<{
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      venueId?: string | null;
    };
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function checkFirstAccess(email: string) {
  return publicApi<{ ok: true; email: string; name: string; role: string }>(
    '/api/auth/first-access/check',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
  );
}

export async function setupFirstAccess(
  email: string,
  password: string,
  name?: string,
) {
  return publicApi<{
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      venueId?: string | null;
    };
  }>('/api/auth/first-access/setup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}
