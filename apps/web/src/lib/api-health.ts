/** URL leve para checar se o Nest está no ar (nunca use `/` no browser — é o redirect do Next). */
const HEALTH_PATH = '/healthz';

/** Aguarda a API Nest responder (evita ECONNREFUSED no simulador ao subir o monorepo). */
export async function waitForApiReady(maxMs = 120_000): Promise<boolean> {
  const deadline = Date.now() + maxMs;

  while (Date.now() < deadline) {
    if (await isApiReady()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }

  return false;
}

export async function isApiReady(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_PATH, { cache: 'no-store' });
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string; service?: string };
    return data.status === 'ok' && data.service === 'chama-api';
  } catch {
    return false;
  }
}
