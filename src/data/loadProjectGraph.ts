import type {
  LoadedViewerGraph,
  ViewerChapter,
  ViewerDirectedEdge,
  ViewerNode,
  ViewerPairEdge,
  ViewerProject,
  ViewerProjectMeta,
  ViewerTier,
} from "../types/viewerGraph";

const VALID_TIERS: ViewerTier[] = ["core", "active", "background", "transient"];

export class ViewerGraphLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ViewerGraphLoadError";
  }
}

function ensureObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ViewerGraphLoadError(`${label} must be an object`);
  }

  return value as Record<string, unknown>;
}

function ensureArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new ViewerGraphLoadError(`${label} must be an array`);
  }

  return value;
}

function ensureString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new ViewerGraphLoadError(`${label} must be a string`);
  }

  return value;
}

function ensureNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ViewerGraphLoadError(`${label} must be a number`);
  }

  return value;
}

function ensureStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ViewerGraphLoadError(`${label} must be a string array`);
  }

  return value;
}

function optionalString(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return ensureString(value, label);
}

function optionalNumber(value: unknown, label: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return ensureNumber(value, label);
}

function parseProjectMeta(value: unknown): ViewerProjectMeta {
  const raw = ensureObject(value, "project");

  return {
    id: ensureString(raw.id, "project.id"),
    title: ensureString(raw.title, "project.title"),
    language: ensureString(raw.language, "project.language"),
    schema_version: ensureNumber(raw.schema_version, "project.schema_version"),
  };
}

function parseAliasList(value: unknown, label: string): string[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new ViewerGraphLoadError(`${label} must be an array`);
  }

  return value.map((item, index) => {
    if (typeof item === "string") {
      return item;
    }

    const raw = ensureObject(item, `${label}[${index}]`);
    return ensureString(raw.alias, `${label}[${index}].alias`);
  });
}

function parseChapter(value: unknown, index: number): ViewerChapter {
  const raw = ensureObject(value, `chapters[${index}]`);

  return {
    id: ensureString(raw.id, `chapters[${index}].id`),
    title: ensureString(raw.title, `chapters[${index}].title`),
    order: ensureNumber(raw.order, `chapters[${index}].order`),
  };
}

function parseNode(value: unknown, index: number): ViewerNode {
  const raw = ensureObject(value, `nodes[${index}]`);
  const tier = ensureString(raw.tier, `nodes[${index}].tier`);

  if (!VALID_TIERS.includes(tier as ViewerTier)) {
    throw new ViewerGraphLoadError(`nodes[${index}].tier is invalid`);
  }

  return {
    id: ensureString(raw.id, `nodes[${index}].id`),
    name: ensureString(raw.name, `nodes[${index}].name`),
    aliases: ensureStringArray(raw.aliases ?? [], `nodes[${index}].aliases`),
    tier: tier as ViewerTier,
    importance: ensureNumber(raw.importance, `nodes[${index}].importance`),
    summary: ensureString(raw.summary ?? "", `nodes[${index}].summary`),
    first_seen_chapter_id: optionalString(
      raw.first_seen_chapter_id,
      `nodes[${index}].first_seen_chapter_id`,
    ),
    last_seen_chapter_id: optionalString(
      raw.last_seen_chapter_id,
      `nodes[${index}].last_seen_chapter_id`,
    ),
    appearance_count: ensureNumber(
      raw.appearance_count,
      `nodes[${index}].appearance_count`,
    ),
  };
}

function parseHeavyNode(value: unknown, index: number): ViewerNode {
  const raw = ensureObject(value, `entities[${index}]`);
  const tier = ensureString(raw.tier, `entities[${index}].tier`);

  if (!VALID_TIERS.includes(tier as ViewerTier)) {
    throw new ViewerGraphLoadError(`entities[${index}].tier is invalid`);
  }

  return {
    id: ensureString(raw.id, `entities[${index}].id`),
    name: ensureString(raw.canonical_name, `entities[${index}].canonical_name`),
    aliases: parseAliasList(raw.aliases, `entities[${index}].aliases`),
    tier: tier as ViewerTier,
    importance: ensureNumber(
      raw.importance_score ?? raw.importance_raw,
      `entities[${index}].importance_score`,
    ),
    summary: ensureString(
      raw.profile_summary ?? raw.profile_digest ?? raw.raw_profile_summary ?? "",
      `entities[${index}].profile_summary`,
    ),
    first_seen_chapter_id: optionalString(
      raw.first_seen_chapter_id,
      `entities[${index}].first_seen_chapter_id`,
    ),
    last_seen_chapter_id: optionalString(
      raw.last_seen_chapter_id,
      `entities[${index}].last_seen_chapter_id`,
    ),
    appearance_count: ensureNumber(
      raw.appearance_count,
      `entities[${index}].appearance_count`,
    ),
  };
}

function parsePairEdge(value: unknown, index: number): ViewerPairEdge {
  const raw = ensureObject(value, `pair_edges[${index}]`);

  return {
    id: ensureString(raw.id, `pair_edges[${index}].id`),
    source: ensureString(raw.source, `pair_edges[${index}].source`),
    target: ensureString(raw.target, `pair_edges[${index}].target`),
    type: ensureString(raw.type, `pair_edges[${index}].type`),
    label: ensureString(raw.label, `pair_edges[${index}].label`),
    summary: ensureString(raw.summary ?? "", `pair_edges[${index}].summary`),
    confidence: optionalNumber(raw.confidence, `pair_edges[${index}].confidence`),
    first_seen_chapter_id: optionalString(
      raw.first_seen_chapter_id,
      `pair_edges[${index}].first_seen_chapter_id`,
    ),
    last_seen_chapter_id: optionalString(
      raw.last_seen_chapter_id,
      `pair_edges[${index}].last_seen_chapter_id`,
    ),
    co_event_count: optionalNumber(
      raw.co_event_count,
      `pair_edges[${index}].co_event_count`,
    ),
    co_appearance_count: optionalNumber(
      raw.co_appearance_count,
      `pair_edges[${index}].co_appearance_count`,
    ),
  };
}

function parseDirectedEdge(value: unknown, index: number): ViewerDirectedEdge {
  const raw = ensureObject(value, `directed_edges[${index}]`);

  return {
    id: ensureString(raw.id, `directed_edges[${index}].id`),
    source: ensureString(raw.source, `directed_edges[${index}].source`),
    target: ensureString(raw.target, `directed_edges[${index}].target`),
    structural_base: ensureString(
      raw.structural_base,
      `directed_edges[${index}].structural_base`,
    ),
    structural_label: ensureString(
      raw.structural_label,
      `directed_edges[${index}].structural_label`,
    ),
    stance: ensureString(raw.stance, `directed_edges[${index}].stance`),
    stance_label: ensureString(
      raw.stance_label,
      `directed_edges[${index}].stance_label`,
    ),
    display_relation: ensureString(
      raw.display_relation,
      `directed_edges[${index}].display_relation`,
    ),
    summary: ensureString(raw.summary ?? "", `directed_edges[${index}].summary`),
    strength: ensureNumber(raw.strength, `directed_edges[${index}].strength`),
    first_seen_chapter_id: optionalString(
      raw.first_seen_chapter_id,
      `directed_edges[${index}].first_seen_chapter_id`,
    ),
    last_seen_chapter_id: optionalString(
      raw.last_seen_chapter_id,
      `directed_edges[${index}].last_seen_chapter_id`,
    ),
    mention_count: optionalNumber(
      raw.mention_count,
      `directed_edges[${index}].mention_count`,
    ),
  };
}

function parseHeavyPairEdge(value: unknown, index: number): ViewerPairEdge {
  const raw = ensureObject(value, `pair_relations[${index}]`);

  return {
    id: ensureString(raw.id, `pair_relations[${index}].id`),
    source: ensureString(raw.entity_a_id, `pair_relations[${index}].entity_a_id`),
    target: ensureString(raw.entity_b_id, `pair_relations[${index}].entity_b_id`),
    type: ensureString(
      raw.shared_structural_base,
      `pair_relations[${index}].shared_structural_base`,
    ),
    label: ensureString(
      raw.shared_structural_base_label,
      `pair_relations[${index}].shared_structural_base_label`,
    ),
    summary: ensureString(
      raw.pair_summary ?? raw.evidence_summary ?? "",
      `pair_relations[${index}].pair_summary`,
    ),
    confidence: optionalNumber(raw.confidence, `pair_relations[${index}].confidence`),
    first_seen_chapter_id: optionalString(
      raw.first_seen_chapter_id,
      `pair_relations[${index}].first_seen_chapter_id`,
    ),
    last_seen_chapter_id: optionalString(
      raw.last_seen_chapter_id,
      `pair_relations[${index}].last_seen_chapter_id`,
    ),
    co_event_count: optionalNumber(
      raw.co_event_count,
      `pair_relations[${index}].co_event_count`,
    ),
    co_appearance_count: optionalNumber(
      raw.co_appearance_count,
      `pair_relations[${index}].co_appearance_count`,
    ),
  };
}

function parseHeavyDirectedEdge(value: unknown, index: number): ViewerDirectedEdge {
  const raw = ensureObject(value, `directed_relations[${index}]`);

  return {
    id: ensureString(raw.id, `directed_relations[${index}].id`),
    source: ensureString(
      raw.from_entity_id,
      `directed_relations[${index}].from_entity_id`,
    ),
    target: ensureString(
      raw.to_entity_id,
      `directed_relations[${index}].to_entity_id`,
    ),
    structural_base: ensureString(
      raw.structural_base,
      `directed_relations[${index}].structural_base`,
    ),
    structural_label: ensureString(
      raw.structural_base_label,
      `directed_relations[${index}].structural_base_label`,
    ),
    stance: ensureString(
      raw.dynamic_stance,
      `directed_relations[${index}].dynamic_stance`,
    ),
    stance_label: ensureString(
      raw.dynamic_stance_label,
      `directed_relations[${index}].dynamic_stance_label`,
    ),
    display_relation: ensureString(
      raw.display_relation,
      `directed_relations[${index}].display_relation`,
    ),
    summary: ensureString(
      raw.state_summary ?? raw.evidence_summary ?? "",
      `directed_relations[${index}].state_summary`,
    ),
    strength: ensureNumber(
      raw.strength_score,
      `directed_relations[${index}].strength_score`,
    ),
    first_seen_chapter_id: optionalString(
      raw.first_seen_chapter_id,
      `directed_relations[${index}].first_seen_chapter_id`,
    ),
    last_seen_chapter_id: optionalString(
      raw.last_seen_chapter_id,
      `directed_relations[${index}].last_seen_chapter_id`,
    ),
    mention_count: optionalNumber(
      raw.mention_count,
      `directed_relations[${index}].mention_count`,
    ),
  };
}

function validateOptionalChapter(
  chapterId: string | undefined,
  chapterIds: Set<string>,
  ownerId: string,
) {
  if (chapterId && !chapterIds.has(chapterId)) {
    throw new ViewerGraphLoadError(
      `${ownerId} references missing chapter ${chapterId}`,
    );
  }
}

function validateReferences(project: ViewerProject) {
  const nodeIds = new Set(project.nodes.map((node) => node.id));
  const chapterIds = new Set(project.chapters.map((chapter) => chapter.id));

  for (const edge of project.pair_edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new ViewerGraphLoadError(`pair edge ${edge.id} references missing node`);
    }

    validateOptionalChapter(edge.first_seen_chapter_id, chapterIds, edge.id);
    validateOptionalChapter(edge.last_seen_chapter_id, chapterIds, edge.id);
  }

  for (const edge of project.directed_edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new ViewerGraphLoadError(
        `directed edge ${edge.id} references missing node`,
      );
    }

    validateOptionalChapter(edge.first_seen_chapter_id, chapterIds, edge.id);
    validateOptionalChapter(edge.last_seen_chapter_id, chapterIds, edge.id);
  }

  for (const node of project.nodes) {
    validateOptionalChapter(node.first_seen_chapter_id, chapterIds, node.id);
    validateOptionalChapter(node.last_seen_chapter_id, chapterIds, node.id);
  }
}

export function parseViewerProject(raw: unknown): ViewerProject {
  const root = ensureObject(raw, "root");

  const isViewerContract =
    Array.isArray(root.nodes) &&
    Array.isArray(root.pair_edges) &&
    Array.isArray(root.directed_edges);

  const isHeavyEngineContract =
    Array.isArray(root.entities) &&
    Array.isArray(root.pair_relations) &&
    Array.isArray(root.directed_relations);

  let project: ViewerProject;

  if (isViewerContract) {
    project = {
      project: parseProjectMeta(root.project),
      chapters: ensureArray(root.chapters, "chapters").map(parseChapter),
      nodes: ensureArray(root.nodes, "nodes").map(parseNode),
      pair_edges: ensureArray(root.pair_edges, "pair_edges").map(parsePairEdge),
      directed_edges: ensureArray(root.directed_edges, "directed_edges").map(
        parseDirectedEdge,
      ),
    };
  } else if (isHeavyEngineContract) {
    project = {
      project: parseProjectMeta(root.project),
      chapters: ensureArray(root.chapters, "chapters").map(parseChapter),
      nodes: ensureArray(root.entities, "entities").map(parseHeavyNode),
      pair_edges: ensureArray(root.pair_relations, "pair_relations").map(
        parseHeavyPairEdge,
      ),
      directed_edges: ensureArray(
        root.directed_relations,
        "directed_relations",
      ).map(parseHeavyDirectedEdge),
    };
  } else {
    throw new ViewerGraphLoadError(
      "Unsupported graph payload: expected viewer contract or heavy engine contract",
    );
  }

  validateReferences(project);

  return project;
}

export async function loadViewerGraphFromFile(
  file: File,
): Promise<LoadedViewerGraph> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ViewerGraphLoadError("File is not valid JSON");
  }

  return {
    data: parseViewerProject(parsed),
    sourceName: file.name,
  };
}
