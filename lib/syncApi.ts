import { getSyncUrl } from './syncConfig';

function normalizePath(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return path.startsWith('/') ? path : `/${path}`;
}

export async function fetchSyncJson<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<T> {
  const syncUrl = await getSyncUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${syncUrl}${normalizePath(path)}`, {
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body?.error) errorMessage = body.error;
        if (body?.message) errorMessage = body.message;
      } catch {
        // ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
