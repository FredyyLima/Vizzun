const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

export const apiPath = (path: string) => {
  if (!path) return baseUrl || "/";
  if (!path.startsWith("/")) {
    return baseUrl ? `${baseUrl}/${path}` : `/${path}`;
  }
  return baseUrl ? `${baseUrl}${path}` : path;
};
