import type { ViewerDirectedEdge, ViewerPairEdge, ViewerProject } from "../types/viewerGraph";
import { buildInitialPositions } from "../utils/graphLayout";

export type ForceGraphNode = {
  id: string;
  name: string;
  tier: string;
  summary: string;
  val: number;
  color: string;
  degree: number;
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

export function toForceGraphData(project: ViewerProject): ForceGraphData {
  const initialPositions = buildInitialPositions(
    project.nodes,
    project.pair_edges,
    project.directed_edges,
  );
  const degreeById = new Map(project.nodes.map((node) => [node.id, 0]));

  for (const edge of project.pair_edges) {
    degreeById.set(edge.source, (degreeById.get(edge.source) ?? 0) + 1);
    degreeById.set(edge.target, (degreeById.get(edge.target) ?? 0) + 1);
  }

  for (const edge of project.directed_edges) {
    degreeById.set(edge.source, (degreeById.get(edge.source) ?? 0) + 1);
    degreeById.set(edge.target, (degreeById.get(edge.target) ?? 0) + 1);
  }

  const pairKeySet = new Set(
    project.pair_edges.map((edge) => unorderedKey(edge.source, edge.target)),
  );
  const directedKeySet = new Set(
    project.directed_edges.map((edge) => `${edge.source}\u0000${edge.target}`),
  );

  return {
    nodes: project.nodes.map((node) => {
      const position = initialPositions.get(node.id);
      const degree = degreeById.get(node.id) ?? 0;
      const hashUnit = ((stableHash(node.id) % 1000) / 1000 - 0.5) * 2;
      const baseX = (position?.x ?? 0) * 94;
      const baseY = (position?.y ?? 0) * 94;
      const baseZ = hashUnit * (degree === 0 ? 54 : 14 + Math.sqrt(node.importance) * 1.8);

      return {
        id: node.id,
        name: node.name,
        tier: node.tier,
        summary: node.summary,
        val: 4 + Math.max(1, Math.sqrt(Math.max(0, node.importance))),
        color: TIER_COLORS[node.tier] ?? "#94a3b8",
        degree,
        targetX: baseX,
        targetY: baseY,
        targetZ: baseZ,
        x: baseX,
        y: baseY,
        z: baseZ,
      };
    }),
    links: [
      ...project.pair_edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || edge.type,
        kind: "pair" as const,
        color: "rgba(186, 230, 253, 0.55)",
        lane: 0,
        width: 1.2 + (edge.confidence ?? 0.4) * 2,
        raw: edge,
      })),
      ...project.directed_edges.map((edge) => {
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
          raw: edge,
        };
      }),
    ],
  };
}
