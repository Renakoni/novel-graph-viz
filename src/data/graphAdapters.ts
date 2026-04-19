import Graph from "graphology";
import type { Attributes } from "graphology-types";
import { buildInitialPositions } from "../utils/graphLayout";
import { edgeColor, tierColor } from "../utils/color";
import type {
  ViewerDirectedEdge,
  ViewerFilters,
  ViewerNode,
  ViewerPairEdge,
  ViewerProject,
} from "../types/viewerGraph";

export type SigmaNodeAttributes = Attributes & {
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  kind: "node";
  hidden?: boolean;
};

export type SigmaEdgeAttributes = Attributes & {
  label: string;
  size: number;
  color: string;
  type: "line" | "arrow";
  hidden?: boolean;
  kind: "pair-edge" | "directed-edge";
};

export type GraphAdapterResult = {
  graph: Graph<SigmaNodeAttributes, SigmaEdgeAttributes>;
  visibleNodeCount: number;
  visibleEdgeCount: number;
};

function chapterOrderMap(data: ViewerProject): Map<string, number> {
  return new Map(data.chapters.map((chapter) => [chapter.id, chapter.order]));
}

function chapterVisible(
  chapterId: string | undefined,
  orderLookup: Map<string, number>,
  startOrder: number | null,
  endOrder: number | null,
): boolean {
  if (!chapterId) {
    return true;
  }

  const order = orderLookup.get(chapterId);
  if (order === undefined) {
    return false;
  }

  if (startOrder !== null && order < startOrder) {
    return false;
  }

  if (endOrder !== null && order > endOrder) {
    return false;
  }

  return true;
}

function nodeMatches(node: ViewerNode, filters: ViewerFilters): boolean {
  if (filters.tiers.length > 0 && !filters.tiers.includes(node.tier)) {
    return false;
  }

  const query = filters.search.trim().toLowerCase();
  if (!query) {
    return true;
  }

  const haystack = [node.name, ...node.aliases, node.summary].join(" ").toLowerCase();
  return haystack.includes(query);
}

function pairEdgeMatches(
  edge: ViewerPairEdge,
  filters: ViewerFilters,
  orderLookup: Map<string, number>,
  startOrder: number | null,
  endOrder: number | null,
): boolean {
  if (!filters.showPairEdges) {
    return false;
  }

  if (filters.pairTypes.length > 0 && !filters.pairTypes.includes(edge.type)) {
    return false;
  }

  return (
    chapterVisible(edge.first_seen_chapter_id, orderLookup, startOrder, endOrder) ||
    chapterVisible(edge.last_seen_chapter_id, orderLookup, startOrder, endOrder)
  );
}

function directedEdgeMatches(
  edge: ViewerDirectedEdge,
  filters: ViewerFilters,
  orderLookup: Map<string, number>,
  startOrder: number | null,
  endOrder: number | null,
): boolean {
  if (!filters.showDirectedEdges) {
    return false;
  }

  if (edge.strength < filters.minDirectedStrength) {
    return false;
  }

  if (
    filters.directedStances.length > 0 &&
    !filters.directedStances.includes(edge.stance)
  ) {
    return false;
  }

  if (
    filters.directedStructuralBases.length > 0 &&
    !filters.directedStructuralBases.includes(edge.structural_base)
  ) {
    return false;
  }

  return (
    chapterVisible(edge.first_seen_chapter_id, orderLookup, startOrder, endOrder) ||
    chapterVisible(edge.last_seen_chapter_id, orderLookup, startOrder, endOrder)
  );
}

export function buildSigmaGraph(
  data: ViewerProject,
  filters: ViewerFilters,
): GraphAdapterResult {
  const graph = new Graph<SigmaNodeAttributes, SigmaEdgeAttributes>({
    type: "mixed",
    multi: true,
  });

  const positions = buildInitialPositions(
    data.nodes,
    data.pair_edges,
    data.directed_edges,
  );
  const orderLookup = chapterOrderMap(data);
  const startOrder =
    filters.chapterStartId === null ? null : orderLookup.get(filters.chapterStartId) ?? null;
  const endOrder =
    filters.chapterEndId === null ? null : orderLookup.get(filters.chapterEndId) ?? null;

  const visibleNodeIds = new Set(
    data.nodes.filter((node) => nodeMatches(node, filters)).map((node) => node.id),
  );

  for (const node of data.nodes) {
    const position = positions.get(node.id);
    if (!position) {
      continue;
    }

    graph.addNode(node.id, {
      label: node.name,
      x: position.x,
      y: position.y,
      size: position.size,
      color: tierColor(node.tier),
      kind: "node",
      hidden: !visibleNodeIds.has(node.id),
    });
  }

  let visibleEdgeCount = 0;

  for (const edge of data.pair_edges) {
    const visible =
      visibleNodeIds.has(edge.source) &&
      visibleNodeIds.has(edge.target) &&
      pairEdgeMatches(edge, filters, orderLookup, startOrder, endOrder);

    if (visible) {
      visibleEdgeCount += 1;
    }

    graph.addUndirectedEdgeWithKey(edge.id, edge.source, edge.target, {
      label: edge.label,
      size: 2.5,
      color: edgeColor("pair"),
      type: "line",
      kind: "pair-edge",
      hidden: !visible,
    });
  }

  for (const edge of data.directed_edges) {
    const visible =
      visibleNodeIds.has(edge.source) &&
      visibleNodeIds.has(edge.target) &&
      directedEdgeMatches(edge, filters, orderLookup, startOrder, endOrder);

    if (visible) {
      visibleEdgeCount += 1;
    }

    graph.addDirectedEdgeWithKey(edge.id, edge.source, edge.target, {
      label: edge.display_relation,
      size: 1.5 + edge.strength / 40,
      color: edgeColor("directed"),
      type: "arrow",
      kind: "directed-edge",
      hidden: !visible,
    });
  }

  return {
    graph,
    visibleNodeCount: visibleNodeIds.size,
    visibleEdgeCount,
  };
}
