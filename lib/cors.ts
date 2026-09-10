const githubOrigin = "https://duduwwl.github.io";

export function corsHeaders(request: Request) {
  const headers = new Headers();
  if (request.headers.get("origin") === githubOrigin) {
    headers.set("Access-Control-Allow-Origin", githubOrigin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, X-Manager-Code");
    headers.set("Vary", "Origin");
  }
  return headers;
}

export function jsonWithCors(request: Request, body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  corsHeaders(request).forEach((value, key) => headers.set(key, value));
  return Response.json(body, { ...init, headers });
}

export function corsPreflight(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
