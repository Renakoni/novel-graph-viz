import { promises as fs } from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    project: "",
    state: "",
    out: "",
    sourceName: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (token === "--project") {
      args.project = value ?? "";
      index += 1;
    } else if (token === "--state") {
      args.state = value ?? "";
      index += 1;
    } else if (token === "--out") {
      args.out = value ?? "";
      index += 1;
    } else if (token === "--source-name") {
      args.sourceName = value ?? "";
      index += 1;
    }
  }

  if (!args.project) {
    throw new Error(
      "Missing --project. Example: npm run export:html -- --project path\\to\\project.json",
    );
  }

  return args;
}

function escapeHtmlJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function inlineAssetLinks(html, cssBlocks, scriptBlocks) {
  let output = html;

  output = output.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/g,
    (full, href) => {
      if (/^https?:\/\//i.test(href)) {
        return "";
      }

      const assetPath = href.replace(/^\//, "");
      const css = cssBlocks.get(assetPath);
      if (!css) {
        throw new Error(`Missing CSS asset in dist: ${assetPath}`);
      }
      return `<style data-inline-href="${assetPath}">\n${css}\n</style>`;
    },
  );

  output = output.replace(
    /<script\s+type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/g,
    (full, src) => {
      const assetPath = src.replace(/^\//, "");
      const script = scriptBlocks.get(assetPath);
      if (!script) {
        throw new Error(`Missing JS asset in dist: ${assetPath}`);
      }
      return `<script type="module" data-inline-src="${assetPath}">\n${script}\n</script>`;
    },
  );

  output = output.replace(
    /<link[^>]+href=["']https?:\/\/fonts\.googleapis\.com[^>]*>\s*/gi,
    "",
  );
  output = output.replace(
    /<link[^>]+href=["']https?:\/\/fonts\.gstatic\.com[^>]*>\s*/gi,
    "",
  );

  return output;
}

async function readAssets(distDir, html) {
  const cssPaths = [
    ...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/g),
  ]
    .map((match) => match[1])
    .filter((href) => !/^https?:\/\//i.test(href))
    .map((href) => href.replace(/^\//, ""));

  const scriptPaths = [
    ...html.matchAll(/<script\s+type=["']module["'][^>]*src=["']([^"']+)["']/g),
  ]
    .map((match) => match[1])
    .filter((src) => !/^https?:\/\//i.test(src))
    .map((src) => src.replace(/^\//, ""));

  const cssBlocks = new Map();
  const scriptBlocks = new Map();

  await Promise.all(
    cssPaths.map(async (assetPath) => {
      cssBlocks.set(
        assetPath,
        await fs.readFile(path.join(distDir, assetPath), "utf8"),
      );
    }),
  );

  await Promise.all(
    scriptPaths.map(async (assetPath) => {
      scriptBlocks.set(
        assetPath,
        await fs.readFile(path.join(distDir, assetPath), "utf8"),
      );
    }),
  );

  return { cssBlocks, scriptBlocks };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, "dist");
  const indexHtmlPath = path.join(distDir, "index.html");
  const projectPath = path.resolve(rootDir, args.project);
  const statePath = args.state ? path.resolve(rootDir, args.state) : "";
  const outputPath = path.resolve(
    rootDir,
    args.out || path.join("dist", `${path.parse(projectPath).name}.single.html`),
  );

  const [indexHtml, projectText, stateText] = await Promise.all([
    fs.readFile(indexHtmlPath, "utf8"),
    fs.readFile(projectPath, "utf8"),
    statePath ? fs.readFile(statePath, "utf8") : Promise.resolve(""),
  ]);

  const projectPayload = JSON.parse(projectText);
  const viewerState = stateText ? JSON.parse(stateText) : undefined;
  const { cssBlocks, scriptBlocks } = await readAssets(distDir, indexHtml);

  const bootstrapPayload = {
    mode: "standalone",
    sourceName: args.sourceName || path.basename(projectPath),
    projectPayload,
    viewerState,
  };

  let html = inlineAssetLinks(indexHtml, cssBlocks, scriptBlocks);
  const title =
    typeof projectPayload?.project?.title === "string"
      ? `${projectPayload.project.title} | Novel Graph Viz`
      : "Novel Graph Viz";

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = html.replace(
    "</body>",
    `  <script id="novel-graph-bootstrap" type="application/json">${escapeHtmlJson(
      bootstrapPayload,
    )}</script>\n</body>`,
  );

  await fs.writeFile(outputPath, html, "utf8");
  console.log(`Single HTML written to: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
