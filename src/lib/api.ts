// /var/www/fresh-studio-hub/src/lib/api.ts
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
    cache: options.cache ?? "no-store",
  });
}

/**
 * Upload files via multipart/form-data.
 * Does NOT set Content-Type header — browser sets it with boundary automatically.
 */
export async function apiUpload(
  path: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("fs_auth_token");

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = normalizedPath.startsWith("/api")
    ? normalizedPath
    : `/api${normalizedPath}`;

  const headers = new Headers(options.headers || {});
  // NE postavljamo Content-Type — browser sam dodaje multipart boundary
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    method: options.method ?? "POST",
    headers,
    body: formData,
    cache: "no-store",
  });
}