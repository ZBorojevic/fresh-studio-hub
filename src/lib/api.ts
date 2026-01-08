// src/lib/api.ts
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("fs_auth_token");

  // 1) Ako je full URL (http/https), ne diraj
  if (/^https?:\/\//i.test(path)) {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // prefer fresh data for full URLs as well
    return fetch(path, { ...options, headers, cache: options.cache ?? "no-store" });
  }

  // 2) Normaliziraj path da počinje s "/"
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // 3) Ako već kreće s "/api", ne dodaj ponovo
  const url = normalizedPath.startsWith("/api")
    ? normalizedPath
    : `/api${normalizedPath}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
    // ensure API requests are not served from browser HTTP cache
    cache: options.cache ?? "no-store",
  });
}
