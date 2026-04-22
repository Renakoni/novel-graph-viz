import type {
  ViewerChapter,
  ViewerDirectedEdge,
  ViewerNode,
  ViewerPairEdge,
  ViewerProject,
} from "../types/viewerGraph";

export type ViewerGraphIndex = {
  nodeById: Map<string, ViewerNode>;
  pairEdgeById: Map<string, ViewerPairEdge>;
  directedEdgeById: Map<string, ViewerDirectedEdge>;
  chapterById: Map<string, ViewerChapter>;
  pairTypes: string[];
  directedStances: string[];
  directedStructuralBases: string[];
  pairTypeLabels: Map<string, string>;
  directedStanceLabels: Map<string, string>;
  directedStructuralBaseLabels: Map<string, string>;
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function buildGraphIndex(data: ViewerProject): ViewerGraphIndex {
  const pairTypeLabels = new Map<string, string>();
  for (const edge of data.pair_edges) {
    if (!pairTypeLabels.has(edge.type)) {
      pairTypeLabels.set(edge.type, edge.label || edge.type);
    }
  }

  const directedStanceLabels = new Map<string, string>();
  const directedStructuralBaseLabels = new Map<string, string>();
  for (const edge of data.directed_edges) {
    if (!directedStanceLabels.has(edge.stance)) {
      directedStanceLabels.set(edge.stance, edge.stance_label || edge.stance);
    }
    if (!directedStructuralBaseLabels.has(edge.structural_base)) {
      directedStructuralBaseLabels.set(
        edge.structural_base,
        edge.structural_label || edge.structural_base,
      );
    }
  }

  return {
    nodeById: new Map(data.nodes.map((node) => [node.id, node])),
    pairEdgeById: new Map(data.pair_edges.map((edge) => [edge.id, edge])),
    directedEdgeById: new Map(data.directed_edges.map((edge) => [edge.id, edge])),
    chapterById: new Map(data.chapters.map((chapter) => [chapter.id, chapter])),
    pairTypes: uniqueSorted(data.pair_edges.map((edge) => edge.type)),
    directedStances: uniqueSorted(data.directed_edges.map((edge) => edge.stance)),
    directedStructuralBases: uniqueSorted(
      data.directed_edges.map((edge) => edge.structural_base),
    ),
    pairTypeLabels,
    directedStanceLabels,
    directedStructuralBaseLabels,
  };
}
