import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";

// Em desenvolvimento, executa as funções de /api localmente (mesma assinatura do Vercel)
function localApi() {
  const rewrites = (() => { try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf8")).rewrites || []; } catch { return []; } })();
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith("/api/")) return next();
        // aplica os rewrites do vercel.json (ex.: /api/oauth/:provider/callback)
        for (const r of rewrites) {
          const keys = []; const re = new RegExp("^" + r.source.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/?]+)")) + "(?:\\?(.*))?$");
          const m = req.url.match(re);
          if (m) { let dest = r.destination; keys.forEach((k, i) => { dest = dest.replace(":" + k, m[i + 1]); }); const qs = m[keys.length + 1]; req.url = dest + (qs ? (dest.includes("?") ? "&" : "?") + qs : ""); break; }
        }
        const route = req.url.split("?")[0].replace(/\/$/, "");
        const file = path.join(process.cwd(), route + ".js");
        if (!fs.existsSync(file)) { res.statusCode = 404; return res.end("not found"); }
        try {
          const mod = await server.ssrLoadModule(file);
          const handler = mod[req.method];
          if (!handler) { res.statusCode = 405; return res.end("method not allowed"); }
          const chunks = []; for await (const c of req) chunks.push(c);
          const request = new Request("http://" + (req.headers.host || "localhost") + req.url, {
            method: req.method, headers: req.headers,
            body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) { console.error(e); res.statusCode = 500; res.end(String(e)); }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApi()],
  // um único bundle: permite gerar o onde-sair.html em arquivo único
  build: { rollupOptions: { output: { inlineDynamicImports: true } } },
});
