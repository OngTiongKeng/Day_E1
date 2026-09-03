const links = new Map();
const PORT = Number(process.env.PORT || 3000);
const baseUrl = (process.env.BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`)).replace(/\/+$/, "");
const publicDir = process.env.PUBLIC_DIR
  ? require("node:path").resolve(process.env.PUBLIC_DIR)
  : null;

const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function createCode() {
  let code;
  do {
    code = "";
    for (let index = 0; index < 6; index += 1) {
      code += characters[Math.floor(Math.random() * characters.length)];
    }
  } while (links.has(code));
  return code;
}

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

async function serveStatic(pathname) {
  if (!publicDir) return null;
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = require("node:path").resolve(publicDir, relativePath);
  if (filePath !== publicDir && !filePath.startsWith(`${publicDir}${require("node:path").sep}`)) {
    return null;
  }
  const file = Bun.file(filePath);
  if (!(await file.exists())) return null;
  return withCors(new Response(file));
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    if (request.method === "POST" && url.pathname === "/api/links") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      if (!body || typeof body.url !== "string" || !/^https?:\/\//i.test(body.url)) {
        return json({ error: "URL must use http or https" }, 400);
      }
      try {
        new URL(body.url);
      } catch {
        return json({ error: "URL must use http or https" }, 400);
      }
      const code = createCode();
      const link = {
        code,
        url: body.url,
        shortUrl: `${baseUrl}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return json(link, 201);
    }

    if (request.method === "GET" && url.pathname === "/api/links") {
      return json([...links.values()]);
    }

    if (request.method === "GET") {
      const staticResponse = await serveStatic(url.pathname);
      if (staticResponse) return staticResponse;
      const code = decodeURIComponent(url.pathname.slice(1));
      const link = links.get(code);
      if (link) {
        link.hits += 1;
        return withCors(Response.redirect(link.url, 302));
      }
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`Snip listening on ${server.url}`);
