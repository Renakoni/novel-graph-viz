import type {
  ViewerDirectedEdge,
  ViewerFilters,
  ViewerNode,
  ViewerPairEdge,
  ViewerProject,
} from "../types/viewerGraph";
import { buildInitialPositions } from "../utils/graphLayout";

export type ForceGraphNode = {
  id: string;
  name: string;
  tier: string;
  summary: string;
  val: number;
  color: string;
  degree: number;
  communityId: string;
  depthBand: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  x: number;
  y: number;
  z: number;
};

export type ForceGraphLink = {
  id: string;
  source: string;
  target: string;
  label: string;
  kind: "pair" | "directed";
  color: string;
  lane: number;
  width: number;
  distance: number;
  raw: ViewerPairEdge | ViewerDirectedEdge;
};

export type ForceGraphData = {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
};

const TIER_COLORS: Record<string, string> = {
  core: "#7dd3fc",
  active: "#fbbf24",
  background: "#94a3b8",
  transient: "#64748b",
};

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function unorderedKey(source: string, target: string): string {
  return source < target ? `${source}\u0000${target}` : `${target}\u0000${source}`;
}

function defaultCommunityId(nodeId: string) {
  return `community_${nodeId}`;
}

const LINK_DISTANCE_SCALE = 1.5;

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

  return [node.name, ...node.aliases].join(" ").toLowerCase().includes(query);
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

function pairLinkDistance(
  edge: ViewerPairEdge,
  source: ForceGraphNode,
  target: ForceGraphNode,
): number {
  const sameCommunity = source.communityId === target.communityId;
  const confidence = edge.confidence ?? 0.5;
  const stability =
    edge.stable_graph_eligibility_score ??
    (edge.stable_graph_eligible === true
      ? 70
      : edge.stable_graph_eligible === false
      ? 32
      : 50);
  const hubPenalty = Math.min(26, (source.degree + target.degree) * 0.75);

  return (
    Math.max(
    112,
    132 +
      (sameCommunity ? -18 : 42) +
      (edge.inferred ? 16 : 0) +
      (1 - confidence) * 18 +
      (1 - stability / 100) * 26 +
      hubPenalty,
    ) * LINK_DISTANCE_SCALE
  );
}

function directedLinkDistance(
  edge: ViewerDirectedEdge,
  source: ForceGraphNode,
  target: ForceGraphNode,
): number {
  const sameCommunity = source.communityId === target.communityId;
  const stability =
    edge.stable_graph_eligibility_score ??
    (edge.stable_graph_eligible === true
      ? 68
      : edge.stable_graph_eligible === false
      ? 34
      : 50);
  const strengthPull = Math.min(30, Math.max(0, edge.strength) / 5);
  const mentionPull = Math.min(10, (edge.mention_count ?? 0) * 1.6);
  const hubPenalty = Math.min(32, (source.degree + target.degree) * 0.85);

  return (
    Math.max(
    124,
    154 +
      (sameCommunity ? -22 : 48) +
      (1 - stability / 100) * 28 +
      hubPenalty -
      strengthPull -
      mentionPull,
    ) * LINK_DISTANCE_SCALE
  );
}

export function toForceGraphData(
  project: ViewerProject,
  filters?: ViewerFilters,
): ForceGraphData {
  const orderLookup = chapterOrderMap(project);
  const startOrder =
    !filters || filters.chapterStartId === null
      ? null
      : orderLookup.get(filters.chapterStartId) ?? null;
  const endOrder =
    !filters || filters.chapterEndId === null
      ? null
      : orderLookup.get(filters.chapterEndId) ?? null;
  const visibleNodes = filters
    ? project.nodes.filter((node) => nodeMatches(node, filters))
    : project.nodes;
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
  const visiblePairEdges = project.pair_edges.filter(
    (edge) =>
      visibleNodeIds.has(edge.source) &&
      visibleNodeIds.has(edge.target) &&
      (!filters || pairEdgeMatches(edge, filters, orderLookup, startOrder, endOrder)),
  );
  const visibleDirectedEdges = project.directed_edges.filter(
    (edge) =>
      visibleNodeIds.has(edge.source) &&
      visibleNodeIds.has(edge.target) &&
      (!filters || directedEdgeMatches(edge, filters, orderLookup, startOrder, endOrder)),
  );
  const initialPositions = buildInitialPositions(
    visibleNodes,
    visiblePairEdges,
    visibleDirectedEdges,
  );
  const degreeById = new Map(visibleNodes.map((node) => [node.id, 0]));

  for (const edge of visiblePairEdges) {
    degreeById.set(edge.source, (degreeById.get(edge.source) ?? 0) + 1);
    degreeById.set(edge.target, (degreeById.get(edge.target) ?? 0) + 1);
  }

  for (const edge of visibleDirectedEdges) {
    degreeById.set(edge.source, (degreeById.get(edge.source) ?? 0) + 1);
    degreeById.set(edge.target, (degreeById.get(edge.target) ?? 0) + 1);
  }

  const pairKeySet = new Set(
    visiblePairEdges.map((edge) => unorderedKey(edge.source, edge.target)),
  );
  const directedKeySet = new Set(
    visibleDirectedEdges.map((edge) => `${edge.source}\u0000${edge.target}`),
  );

  const nodes = visibleNodes.map((node) => {
      const position = initialPositions.get(node.id);
      const degree = degreeById.get(node.id) ?? 0;
      const hashUnit = ((stableHash(node.id) % 1000) / 1000 - 0.5) * 2;
      const baseX = (position?.x ?? 0) * 108;
      const baseY = (position?.y ?? 0) * 108;
      const communityId = position?.communityId ?? defaultCommunityId(node.id);
      const depthBand = position?.depthBand ?? (degree === 0 ? 2 : 0);
      const tierBias =
        node.tier === "core"
          ? -8
          : node.tier === "active"
          ? -2
          : node.tier === "background"
          ? 8
          : 14;
      const baseZ =
        depthBand * 34 +
        tierBias +
        hashUnit * (degree === 0 ? 12 : 5 + Math.sqrt(node.importance) * 0.46);

      return {
        id: node.id,
        name: node.name,
        tier: node.tier,
        summary: node.summary,
        val: 4 + Math.max(1, Math.sqrt(Math.max(0, node.importance))),
        color: TIER_COLORS[node.tier] ?? "#94a3b8",
        degree,
        communityId,
        depthBand,
        targetX: baseX,
        targetY: baseY,
        targetZ: baseZ,
        x: baseX,
        y: baseY,
        z: baseZ,
      };
    });

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return {
    nodes,
    links: [
      ...visiblePairEdges.map((edge) => {
        const source = nodeById.get(edge.source)!;
        const target = nodeById.get(edge.target)!;
        return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || edge.type,
        kind: "pair" as const,
        color: "rgba(186, 230, 253, 0.55)",
        lane: 0,
        width: 1.2 + (edge.confidence ?? 0.4) * 2,
        distance: pairLinkDistance(edge, source, target),
        raw: edge,
      };
      }),
      ...visibleDirectedEdges.map((edge) => {
        const source = nodeById.get(edge.source)!;
        const target = nodeById.get(edge.target)!;
        const hasReverse = directedKeySet.has(`${edge.target}\u0000${edge.source}`);
        const hasPair = pairKeySet.has(unorderedKey(edge.source, edge.target));
        const lane = hasReverse
          ? edge.source < edge.target
            ? 0.72
            : -0.72
          : hasPair
          ? 0.58
          : 0;

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.display_relation,
          kind: "directed" as const,
          color: "rgba(251, 146, 60, 0.72)",
          lane,
          width: 1 + Math.max(1, edge.strength) / 36,
          distance: directedLinkDistance(edge, source, target),
          raw: edge,
        };
      }),
    ],
  };
}
