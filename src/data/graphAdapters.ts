import Graph from "graphology";
import type { Attributes } from "graphology-types";
import forceAtlas2 from "graphology-layout-forceatlas2";
import noverlap from "graphology-layout-noverlap";
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
  type: "circle" | "image";
  image?: string;
  kind: "node";
  tier: ViewerNode["tier"];
  importance: number;
  zIndex: number;
  hidden?: boolean;
};

export type SigmaEdgeAttributes = Attributes & {
  label: string;
  size: number;
  color: string;
  type: "line" | "arrow";
  zIndex: number;
  hidden?: boolean;
  kind: "pair-edge" | "directed-edge";
};

const TIER_Z_INDEX: Record<ViewerNode["tier"], number> = {
  core: 40,
  active: 30,
  background: 20,
  transient: 10,
};

type LayoutGraph = Graph<SigmaNodeAttributes, SigmaEdgeAttributes>;

function sigmaNodeSize(node: ViewerNode, layoutSize: number): number {
  const tierBonus = node.tier === "core" ? 2.8 : node.tier === "active" ? 1.8 : 0.7;
  return Math.max(4.2, Math.min(16, layoutSize * 0.72 + tierBonus));
}

function applyForceAtlasLayout(graph: LayoutGraph) {
  if (graph.order <= 1) {
    return;
  }

  const inferred = forceAtlas2.inferSettings(graph);
  const iterations = graph.order < 80 ? 120 : graph.order < 220 ? 85 : 55;

  forceAtlas2.assign(graph, {
    iterations,
    getEdgeWeight: "weight",
    settings: {
      ...inferred,
      adjustSizes: true,
      barnesHutOptimize: graph.order > 80,
      edgeWeightInfluence: 0.55,
      gravity: 0.9,
      linLogMode: true,
      scalingRatio: 6.8,
      slowDown: 2.8,
      strongGravityMode: false,
    },
  });

  noverlap.assign(graph, {
    maxIterations: 150,
    settings: {
      gridSize: 24,
      margin: 3.2,
      expansion: 1.08,
      ratio: 1.7,
      speed: 2.6,
    },
  });
}

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
  avatarByNodeId: Record<string, string> = {},
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
      size: sigmaNodeSize(node, position.size),
      color: tierColor(node.tier),
      type: avatarByNodeId[node.id] ? "image" : "circle",
      image: avatarByNodeId[node.id],
      kind: "node",
      tier: node.tier,
      importance: node.importance,
      zIndex: TIER_Z_INDEX[node.tier] + Math.round(node.importance),
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
      size: 1.35,
      color: "rgba(186, 230, 253, 0.34)",
      type: "line",
      kind: "pair-edge",
      weight: 1.2 + (edge.confidence ?? 0.45) * 1.6,
      zIndex: 1,
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
      size: 1.2 + edge.strength / 55,
      color: edgeColor("directed"),
      type: "arrow",
      kind: "directed-edge",
      weight: 0.6 + Math.max(1, edge.strength) / 45,
      zIndex: 2,
      hidden: !visible,
    });
  }

  applyForceAtlasLayout(graph);

  return {
    graph,
    visibleNodeCount: visibleNodeIds.size,
    visibleEdgeCount,
  };
}
