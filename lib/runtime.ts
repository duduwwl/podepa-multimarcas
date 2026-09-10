const githubBase = "/podepa-multimarcas";
const apiOrigin = "https://podepa-multimarcas-lavras.duduwwl.chatgpt.site";

function isGithubPages() {
  return typeof window !== "undefined" && window.location.hostname === "duduwwl.github.io";
}

export function appHref(path: string) {
  if (!isGithubPages()) return path;
  if (path === "/") return `${githubBase}/`;
  const [pathname, query] = path.split("?", 2);
  const target = `${githubBase}${pathname}${pathname.endsWith("/") ? "" : "/"}`;
  return query ? `${target}?${query}` : target;
}

export function assetUrl(path: string) {
  return isGithubPages() ? `${githubBase}${path}` : path;
}

export function apiUrl(path: string) {
  return isGithubPages() ? `${apiOrigin}${path}` : path;
}
