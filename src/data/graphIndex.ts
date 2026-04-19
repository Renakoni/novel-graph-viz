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
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function buildGraphIndex(data: ViewerProject): ViewerGraphIndex {
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
  };
}
