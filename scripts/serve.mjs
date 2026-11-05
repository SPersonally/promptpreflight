import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".css": "text/css; charset=utf-8"
};

const server = createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405).end("Method not allowed");
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const path = resolve(root, "." + pathname);
    const location = relative(root, path);
    if (location.startsWith("..") || location === ".." || location.includes("\u0000")) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    if (!["/", "/index.html", "/app.js", "/styles.css", "/src/core.js", "/assets/logo.svg"].includes(pathname)) {
      res.writeHead(404).end("Not found");
      return;
    }
    const destination = pathname === "/" ? join(root, "index.html") : path;
    const info = await stat(destination);
    if (!info.isFile()) throw new Error("Not a file");
    const payload = await readFile(destination);
    res.writeHead(200, {
      "Content-Type": mime[extname(destination)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(req.method === "HEAD" ? undefined : payload);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write("PromptPreflight runs at http://127.0.0.1:" + port + "\n");
});
