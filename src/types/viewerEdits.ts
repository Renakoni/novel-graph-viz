import type { ViewerDirectedEdge, ViewerPairEdge } from "./viewerGraph";

export type ViewerNodeEdit = {
  name?: string;
  aliases?: string[];
  summary?: string;
};

export type ViewerPairEdgeEdit = {
  label?: string;
  summary?: string;
};

export type ViewerDirectedEdgeEdit = {
  display_relation?: string;
  summary?: string;
  strength?: number;
};

export type ViewerAddedPairEdge = ViewerPairEdge;

export type ViewerAddedDirectedEdge = ViewerDirectedEdge;

export type ViewerProjectEdits = {
  version: 1;
  nodes: Record<string, ViewerNodeEdit>;
  pairEdges: Record<string, ViewerPairEdgeEdit>;
  directedEdges: Record<string, ViewerDirectedEdgeEdit>;
  addedPairEdges: ViewerAddedPairEdge[];
  addedDirectedEdges: ViewerAddedDirectedEdge[];
  hiddenNodeIds: string[];
  hiddenPairEdgeIds: string[];
  hiddenDirectedEdgeIds: string[];
};

export const EMPTY_VIEWER_PROJECT_EDITS: ViewerProjectEdits = {
  version: 1,
  nodes: {},
  pairEdges: {},
  directedEdges: {},
  addedPairEdges: [],
  addedDirectedEdges: [],
  hiddenNodeIds: [],
  hiddenPairEdgeIds: [],
  hiddenDirectedEdgeIds: [],
};
