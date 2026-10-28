const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_URL_STORAGE_KEY = "devhub-api-url";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(API_URL_STORAGE_KEY);
    if (saved?.trim()) return saved.trim().replace(/\/+$/, "");
  }
  return DEFAULT_API_URL.replace(/\/+$/, "");
}

export function saveApiBaseUrl(value: string): void {
  if (typeof window === "undefined") return;
  const normalized = value.trim().replace(/\/+$/, "");
  if (normalized) window.localStorage.setItem(API_URL_STORAGE_KEY, normalized);
  else window.localStorage.removeItem(API_URL_STORAGE_KEY);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload.message === "string"
        ? payload.message
        : `API isteği başarısız oldu (${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("tr-TR", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function timeAgo(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Bilinmiyor";
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days === 0) return "Bugün güncellendi";
  if (days === 1) return "Dün güncellendi";
  if (days < 30) return `${days} gün önce`;
  if (days < 365) return `${Math.floor(days / 30)} ay önce`;
  return `${Math.floor(days / 365)} yıl önce`;
}
