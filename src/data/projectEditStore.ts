import type { LoadedViewerGraph } from "../types/viewerGraph";
import {
  EMPTY_VIEWER_PROJECT_EDITS,
  type ViewerProjectEdits,
} from "../types/viewerEdits";

const STORAGE_PREFIX = "novel-graph-viewer:project-edits:";

export function getProjectEditsKey(loaded: LoadedViewerGraph): string {
  return `${STORAGE_PREFIX}${loaded.data.project.id}::${loaded.sourceName}`;
}

export function loadProjectEdits(loaded: LoadedViewerGraph): ViewerProjectEdits {
  if (typeof window === "undefined") {
    return EMPTY_VIEWER_PROJECT_EDITS;
  }

  const raw = window.localStorage.getItem(getProjectEditsKey(loaded));
  if (!raw) {
    return EMPTY_VIEWER_PROJECT_EDITS;
  }

  try {
    return parseProjectEdits(JSON.parse(raw));
  } catch {
    return EMPTY_VIEWER_PROJECT_EDITS;
  }
}

export function saveProjectEdits(
  loaded: LoadedViewerGraph,
  edits: ViewerProjectEdits,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getProjectEditsKey(loaded),
    JSON.stringify(normalizeProjectEdits(edits)),
  );
}

export function normalizeProjectEdits(
  edits: ViewerProjectEdits,
): ViewerProjectEdits {
  return {
    version: 1,
    nodes: sortRecord(edits.nodes),
    pairEdges: sortRecord(edits.pairEdges),
    directedEdges: sortRecord(edits.directedEdges),
    addedPairEdges: [...edits.addedPairEdges].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
    addedDirectedEdges: [...edits.addedDirectedEdges].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
    hiddenNodeIds: [...edits.hiddenNodeIds].sort((left, right) =>
      left.localeCompare(right),
    ),
    hiddenPairEdgeIds: [...edits.hiddenPairEdgeIds].sort((left, right) =>
      left.localeCompare(right),
    ),
    hiddenDirectedEdgeIds: [...edits.hiddenDirectedEdgeIds].sort((left, right) =>
      left.localeCompare(right),
    ),
  };
}

export function serializeProjectEdits(edits: ViewerProjectEdits): string {
  return JSON.stringify(normalizeProjectEdits(edits));
}

export function parseProjectEdits(raw: unknown): ViewerProjectEdits {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return EMPTY_VIEWER_PROJECT_EDITS;
  }

  const value = raw as Record<string, unknown>;
  if (value.version !== 1) {
    return EMPTY_VIEWER_PROJECT_EDITS;
  }

  return normalizeProjectEdits({
    version: 1,
    nodes: sanitizeNodeEdits(value.nodes),
    pairEdges: sanitizePairEdgeEdits(value.pairEdges),
    directedEdges: sanitizeDirectedEdgeEdits(value.directedEdges),
    addedPairEdges: sanitizeAddedPairEdges(value.addedPairEdges),
    addedDirectedEdges: sanitizeAddedDirectedEdges(value.addedDirectedEdges),
    hiddenNodeIds: sanitizeStringArray(value.hiddenNodeIds),
    hiddenPairEdgeIds: sanitizeStringArray(value.hiddenPairEdgeIds),
    hiddenDirectedEdgeIds: sanitizeStringArray(value.hiddenDirectedEdgeIds),
  });
}

function sanitizeNodeEdits(raw: unknown): ViewerProjectEdits["nodes"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const entries = Object.entries(raw as Record<string, unknown>).map(([id, edit]) => {
    const next = edit && typeof edit === "object" && !Array.isArray(edit)
      ? (edit as Record<string, unknown>)
      : {};

    return [
      id,
      {
        ...(typeof next.name === "string" ? { name: next.name } : {}),
        ...(Array.isArray(next.aliases) &&
        next.aliases.every((item) => typeof item === "string")
          ? { aliases: next.aliases as string[] }
          : {}),
        ...(typeof next.summary === "string" ? { summary: next.summary } : {}),
      },
    ] as const;
  });

  return Object.fromEntries(entries);
}

function sanitizePairEdgeEdits(raw: unknown): ViewerProjectEdits["pairEdges"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const entries = Object.entries(raw as Record<string, unknown>).map(([id, edit]) => {
    const next = edit && typeof edit === "object" && !Array.isArray(edit)
      ? (edit as Record<string, unknown>)
      : {};

    return [
      id,
      {
        ...(typeof next.label === "string" ? { label: next.label } : {}),
        ...(typeof next.summary === "string" ? { summary: next.summary } : {}),
      },
    ] as const;
  });

  return Object.fromEntries(entries);
}

function sanitizeDirectedEdgeEdits(
  raw: unknown,
): ViewerProjectEdits["directedEdges"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const entries = Object.entries(raw as Record<string, unknown>).map(([id, edit]) => {
    const next = edit && typeof edit === "object" && !Array.isArray(edit)
      ? (edit as Record<string, unknown>)
      : {};

    return [
      id,
      {
        ...(typeof next.display_relation === "string"
          ? { display_relation: next.display_relation }
          : {}),
        ...(typeof next.summary === "string" ? { summary: next.summary } : {}),
        ...(typeof next.strength === "number" && Number.isFinite(next.strength)
          ? { strength: next.strength }
          : {}),
      },
    ] as const;
  });

  return Object.fromEntries(entries);
}

function sortRecord<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
  ) as T;
}

function sanitizeStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((item): item is string => typeof item === "string");
}

function sanitizeAddedPairEdges(raw: unknown): ViewerProjectEdits["addedPairEdges"] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isAddedPairEdge) as ViewerProjectEdits["addedPairEdges"];
}

function sanitizeAddedDirectedEdges(
  raw: unknown,
): ViewerProjectEdits["addedDirectedEdges"] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isAddedDirectedEdge) as ViewerProjectEdits["addedDirectedEdges"];
}

function isAddedPairEdge(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const edge = value as Record<string, unknown>;
  return (
    typeof edge.id === "string" &&
    typeof edge.source === "string" &&
    typeof edge.target === "string" &&
    typeof edge.type === "string" &&
    typeof edge.label === "string" &&
    typeof edge.summary === "string"
  );
}

function isAddedDirectedEdge(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const edge = value as Record<string, unknown>;
  return (
    typeof edge.id === "string" &&
    typeof edge.source === "string" &&
    typeof edge.target === "string" &&
    typeof edge.structural_base === "string" &&
    typeof edge.structural_label === "string" &&
    typeof edge.stance === "string" &&
    typeof edge.stance_label === "string" &&
    typeof edge.display_relation === "string" &&
    typeof edge.summary === "string" &&
    typeof edge.strength === "number" &&
    Number.isFinite(edge.strength)
  );
}
