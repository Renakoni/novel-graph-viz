import fs from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const githubPagesBase = "/novel-graph-viz/";

export default defineConfig({
  base: isGitHubPages ? githubPagesBase : "/",
  plugins: [
    react(),
    {
      name: "novel-graph-export-dev-endpoints",
      configureServer(server) {
        const root = server.config.root;
        const distDir = path.join(root, "dist");
        const middleware = async (req, res, next) => {
          const url = req.url ? new URL(req.url, "http://localhost") : null;
          if (!url) {
            next();
            return;
          }

          if (url.pathname === "/__viewer_export__/dist-index-source") {
            try {
              const content = await fs.readFile(
                path.join(distDir, "index.html"),
                "utf8",
              );
              res.setHeader("Content-Type", "text/plain; charset=utf-8");
              res.end(content);
            } catch {
              res.statusCode = 404;
              res.end("dist/index.html not found");
            }
            return;
          }

          if (url.pathname === "/__viewer_export__/dist-asset-source") {
            const assetPath = url.searchParams.get("path");
            if (!assetPath) {
              res.statusCode = 400;
              res.end("Missing asset path");
              return;
            }

            const normalized = path.normalize(assetPath).replace(/^(\.\.[\\/])+/, "");
            const resolved = path.join(distDir, normalized);
            const relative = path.relative(distDir, resolved);

            if (
              !relative ||
              relative.startsWith("..") ||
              path.isAbsolute(relative)
            ) {
              res.statusCode = 400;
              res.end("Invalid asset path");
              return;
            }

            try {
              const content = await fs.readFile(resolved, "utf8");
              res.setHeader("Content-Type", "text/plain; charset=utf-8");
              res.end(content);
            } catch {
              res.statusCode = 404;
              res.end("Asset not found");
            }
            return;
          }

          next();
        };

        server.middlewares.stack.unshift({
          route: "",
          handle: middleware,
        });
      },
    },
  ],
});
