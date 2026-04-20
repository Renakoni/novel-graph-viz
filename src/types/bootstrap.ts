import type { ViewerState } from "./viewerState";

export type ViewerBootstrapPayload = {
  mode?: "app" | "standalone";
  sourceName?: string;
  projectPayload?: unknown;
  viewerState?: ViewerState;
};

declare global {
  interface Window {
    __NOVEL_GRAPH_BOOTSTRAP__?: ViewerBootstrapPayload;
  }
}
