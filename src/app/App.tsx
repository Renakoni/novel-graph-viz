import { parseViewerProject } from "../data/loadProjectGraph";
import { GraphPage } from "../pages/GraphPage";
import type { ViewerBootstrapPayload } from "../types/bootstrap";
import { parseViewerState } from "../data/viewerState";

function readBootstrapPayload(): ViewerBootstrapPayload | null {
  if (window.__NOVEL_GRAPH_BOOTSTRAP__) {
    return window.__NOVEL_GRAPH_BOOTSTRAP__ ?? null;
  }

  const script = document.getElementById("novel-graph-bootstrap");
  if (!script?.textContent) {
    return null;
  }

  try {
    return JSON.parse(script.textContent) as ViewerBootstrapPayload;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function App() {
  const bootstrap = readBootstrapPayload();
  const standalone = bootstrap?.mode === "standalone";

  let initialLoadedGraph = null;
  let initialViewerState = null;

  try {
    if (bootstrap?.projectPayload) {
      initialLoadedGraph = {
        data: parseViewerProject(bootstrap.projectPayload),
        sourceName: bootstrap.sourceName ?? "embedded-project.json",
      };
    }

    if (bootstrap?.viewerState) {
      initialViewerState = parseViewerState(bootstrap.viewerState);
    }
  } catch (error) {
    console.error(error);
  }

  return (
    <GraphPage
      initialLoadedGraph={initialLoadedGraph}
      initialViewerState={initialViewerState}
      standalone={standalone}
    />
  );
}
