const TOKEN_KEY = "lavaseguro_token";
const LAVADOR_ID_KEY = "lavaseguro_lavador_id";
const LAVADOR_NOME_KEY = "lavaseguro_lavador_nome";

export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function setLavadorId(id: number): void {
  localStorage.setItem(LAVADOR_ID_KEY, String(id));
}

export function getLavadorId(): number | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(LAVADOR_ID_KEY);
  return v ? Number(v) : null;
}

export function setLavadorNome(nome: string): void {
  localStorage.setItem(LAVADOR_NOME_KEY, nome);
}

export function getLavadorNome(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAVADOR_NOME_KEY);
}

export function setSession(data: {
  access_token: string;
  lavador_id?: number;
  lavador_nome?: string;
}): void {
  setToken(data.access_token);
  if (data.lavador_id != null) setLavadorId(data.lavador_id);
  if (data.lavador_nome) setLavadorNome(data.lavador_nome);
}

export function clearSession(): void {
  clearToken();
  localStorage.removeItem(LAVADOR_ID_KEY);
  localStorage.removeItem(LAVADOR_NOME_KEY);
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(apiBase() + path, { ...init, headers });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function loginComPin(pin: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/v1/auth/pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) throw new Error("PIN inválido");
  const data = await res.json();
  setSession(data);
}
