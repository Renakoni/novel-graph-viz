import type { LoadedViewerGraph } from "../types/viewerGraph";
import type { ViewerState } from "../types/viewerState";

type StandalonePayload = {
  mode: "standalone";
  sourceName: string;
  projectPayload: unknown;
  viewerState: ViewerState;
};

function escapeHtmlJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildStandaloneHtml(params: {
  title: string;
  cssBlocks: string[];
  scriptBlocks: string[];
  payload: StandalonePayload;
}) {
  const { title, cssBlocks, scriptBlocks, payload } = params;

  const css = cssBlocks
    .map((block, index) => `<style data-inline-index="${index}">\n${block}\n</style>`)
    .join("\n");
  const scripts = scriptBlocks
    .map(
      (block, index) =>
        `<script type="module" data-inline-index="${index}">\n${block}\n</script>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${css}
  </head>
  <body class="dark">
    <div id="root"></div>
    <script id="novel-graph-bootstrap" type="application/json">${escapeHtmlJson(
      payload,
    )}</script>
    ${scripts}
  </body>
</html>`;
}

async function fetchLocalAsset(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${url}`);
  }
  return response.text();
}

function isRemoteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function normalizeDistAssetPath(url: string) {
  if (url.startsWith("/assets/")) {
    return url.slice(1);
  }

  if (url.startsWith("./assets/")) {
    return url.slice(2);
  }

  return url;
}

async function fetchRawDistAsset(assetPath: string) {
  const normalizedPath = normalizeDistAssetPath(assetPath);
  return fetchLocalAsset(
    `/__viewer_export__/dist-asset-source?path=${encodeURIComponent(normalizedPath)}`,
  );
}

async function collectAssetsFromCurrentDocument() {
  const stylesheetUrls = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'),
  )
    .map((element) => element.getAttribute("href") || "")
    .filter((href) => href && !isRemoteUrl(href));

  const moduleScriptUrls = Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'),
  )
    .map((element) => element.getAttribute("src") || "")
    .filter((src) => src && !isRemoteUrl(src));

  const [cssBlocks, scriptBlocks] = await Promise.all([
    Promise.all(stylesheetUrls.map((url) => fetchLocalAsset(url))),
    Promise.all(moduleScriptUrls.map((url) => fetchLocalAsset(url))),
  ]);

  if (!cssBlocks.length || !scriptBlocks.length) {
    throw new Error("没有找到可内联的构建资源，无法导出单文件 HTML。");
  }

  return { cssBlocks, scriptBlocks };
}

async function collectAssetsFromDistBuild() {
  const indexHtml = await fetchLocalAsset(
    "/__viewer_export__/dist-index-source",
  ).catch(() => "");

  if (!indexHtml) {
    throw new Error(
      "当前是开发模式，但没有找到 dist 构建产物。请先执行一次 npm run build。",
    );
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(indexHtml, "text/html");

  const stylesheetPaths = Array.from(
    documentNode.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'),
  )
    .map((element) => element.getAttribute("href") || "")
    .filter((href) => href && !isRemoteUrl(href))
    .map(normalizeDistAssetPath);

  const moduleScriptPaths = Array.from(
    documentNode.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'),
  )
    .map((element) => element.getAttribute("src") || "")
    .filter((src) => src && !isRemoteUrl(src))
    .map(normalizeDistAssetPath);

  const [cssBlocks, scriptBlocks] = await Promise.all([
    Promise.all(stylesheetPaths.map((assetPath) => fetchRawDistAsset(assetPath))),
    Promise.all(moduleScriptPaths.map((assetPath) => fetchRawDistAsset(assetPath))),
  ]);

  if (!cssBlocks.length || !scriptBlocks.length) {
    throw new Error("dist 构建产物不完整，无法导出单文件 HTML。");
  }

  return { cssBlocks, scriptBlocks };
}

async function collectCurrentBuiltAssets() {
  const moduleScriptUrls = Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'),
  )
    .map((element) => element.getAttribute("src") || "")
    .filter(Boolean);

  const looksLikeDevServer = moduleScriptUrls.some(
    (url) => url.includes("/src/") || /\.tsx?$/.test(url),
  );

  if (looksLikeDevServer) {
    return collectAssetsFromDistBuild();
  }

  return collectAssetsFromCurrentDocument();
}

function downloadHtmlFile(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportCurrentProjectAsSingleHtml(params: {
  loaded: LoadedViewerGraph;
  viewerState: ViewerState;
}) {
  const { loaded, viewerState } = params;
  const { cssBlocks, scriptBlocks } = await collectCurrentBuiltAssets();

  const title = `${loaded.data.project.title} | Novel Graph Viz`;
  const payload: StandalonePayload = {
    mode: "standalone",
    sourceName: loaded.sourceName,
    projectPayload: loaded.data,
    viewerState,
  };

  const html = buildStandaloneHtml({
    title,
    cssBlocks,
    scriptBlocks,
    payload,
  });

  const safeBaseName = (loaded.data.project.id || "novel-graph")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-");

  downloadHtmlFile(`${safeBaseName}.standalone.html`, html);
}
