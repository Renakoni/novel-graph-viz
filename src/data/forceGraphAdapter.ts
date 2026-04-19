import type { ViewerDirectedEdge, ViewerPairEdge, ViewerProject } from "../types/viewerGraph";

export type ForceGraphNode = {
  id: string;
  name: string;
  tier: string;
  summary: string;
  val: number;
  color: string;
};

export type ForceGraphLink = {
  source: string;
  target: string;
  label: string;
  kind: "pair" | "directed";
  color: string;
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

export function toForceGraphData(project: ViewerProject): ForceGraphData {
  return {
    nodes: project.nodes.map((node) => ({
      id: node.id,
      name: node.name,
      tier: node.tier,
      summary: node.summary,
      val: 4 + Math.max(1, Math.sqrt(Math.max(0, node.importance))),
      color: TIER_COLORS[node.tier] ?? "#94a3b8",
    })),
    links: [
      ...project.pair_edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        label: edge.label || edge.type,
        kind: "pair" as const,
        color: "rgba(186, 230, 253, 0.55)",
        width: 1.2 + (edge.confidence ?? 0.4) * 2,
        raw: edge,
      })),
      ...project.directed_edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        label: edge.display_relation,
        kind: "directed" as const,
        color: "rgba(251, 146, 60, 0.72)",
        width: 1 + Math.max(1, edge.strength) / 36,
        raw: edge,
      })),
    ],
  };
}
