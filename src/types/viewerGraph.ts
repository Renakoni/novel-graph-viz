export type ViewerTier = "core" | "active" | "background" | "transient";

export type ViewerProjectMeta = {
  id: string;
  title: string;
  language: string;
  schema_version: number;
  created_at?: string;
};

export type ViewerChapter = {
  id: string;
  title: string;
  order: number;
};

export type ViewerNode = {
  id: string;
  name: string;
  aliases: string[];
  tier: ViewerTier;
  importance: number;
  summary: string;
  first_seen_chapter_id?: string;
  last_seen_chapter_id?: string;
  appearance_count: number;
};

export type ViewerPairEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  summary: string;
  confidence?: number;
  first_seen_chapter_id?: string;
  last_seen_chapter_id?: string;
  co_event_count?: number;
  co_appearance_count?: number;
  inferred?: boolean;
  shared_intensity_score?: number;
  stable_graph_eligible?: boolean;
  stable_graph_eligibility_score?: number;
  stable_graph_eligibility_reason?: string;
};

export type ViewerDirectedEdge = {
  id: string;
  source: string;
  target: string;
  raw_label?: string;
  structural_base: string;
  structural_label: string;
  stance: string;
  stance_label: string;
  display_relation: string;
  summary: string;
  strength: number;
  first_seen_chapter_id?: string;
  last_seen_chapter_id?: string;
  mention_count?: number;
  stable_graph_eligible?: boolean;
  stable_graph_eligibility_score?: number;
  stable_graph_eligibility_reason?: string;
};

export type ViewerProject = {
  project: ViewerProjectMeta;
  chapters: ViewerChapter[];
  nodes: ViewerNode[];
  pair_edges: ViewerPairEdge[];
  directed_edges: ViewerDirectedEdge[];
};

export type ViewerSelection =
  | { kind: "node"; id: string }
  | { kind: "pair-edge"; id: string }
  | { kind: "directed-edge"; id: string }
  | null;

export type ViewerFilters = {
  search: string;
  tiers: ViewerTier[];
  chapterStartId: string | null;
  chapterEndId: string | null;
  pairTypes: string[];
  directedStances: string[];
  directedStructuralBases: string[];
  minDirectedStrength: number;
  showPairEdges: boolean;
  showDirectedEdges: boolean;
};

export type LoadedViewerGraph = {
  data: ViewerProject;
  sourceName: string;
};
