import type { ViewerProject } from "../types/viewerGraph";
import {
  EMPTY_VIEWER_PROJECT_EDITS,
  type ViewerDirectedEdgeEdit,
  type ViewerNodeEdit,
  type ViewerPairEdgeEdit,
  type ViewerProjectEdits,
} from "../types/viewerEdits";

export function applyProjectEdits(
  project: ViewerProject,
  edits: ViewerProjectEdits = EMPTY_VIEWER_PROJECT_EDITS,
): ViewerProject {
  const hiddenNodeIds = new Set(edits.hiddenNodeIds);
  const hiddenPairEdgeIds = new Set(edits.hiddenPairEdgeIds);
  const hiddenDirectedEdgeIds = new Set(edits.hiddenDirectedEdgeIds);

  const nodes = project.nodes
    .map((node) => applyNodeEdit(node, edits.nodes[node.id]))
    .filter((node) => !hiddenNodeIds.has(node.id));
  const visibleNodeIds = new Set(nodes.map((node) => node.id));

  return {
    ...project,
    nodes,
    pair_edges: [
      ...project.pair_edges
        .map((edge) => applyPairEdgeEdit(edge, edits.pairEdges[edge.id]))
        .filter(
          (edge) =>
            !hiddenPairEdgeIds.has(edge.id) &&
            visibleNodeIds.has(edge.source) &&
            visibleNodeIds.has(edge.target),
        ),
      ...edits.addedPairEdges,
    ].filter(
      (edge) =>
        !hiddenPairEdgeIds.has(edge.id) &&
        visibleNodeIds.has(edge.source) &&
        visibleNodeIds.has(edge.target),
    ),
    directed_edges: [
      ...project.directed_edges.map((edge) =>
        applyDirectedEdgeEdit(edge, edits.directedEdges[edge.id]),
      ),
      ...edits.addedDirectedEdges,
    ].filter(
      (edge) =>
        !hiddenDirectedEdgeIds.has(edge.id) &&
        visibleNodeIds.has(edge.source) &&
        visibleNodeIds.has(edge.target),
    ),
  };
}

function applyNodeEdit<T extends ViewerProject["nodes"][number]>(
  node: T,
  edit?: ViewerNodeEdit,
): T {
  if (!edit) {
    return node;
  }

  return {
    ...node,
    ...(edit.name !== undefined ? { name: edit.name } : {}),
    ...(edit.aliases !== undefined ? { aliases: edit.aliases } : {}),
    ...(edit.summary !== undefined ? { summary: edit.summary } : {}),
  };
}

function applyPairEdgeEdit<T extends ViewerProject["pair_edges"][number]>(
  edge: T,
  edit?: ViewerPairEdgeEdit,
): T {
  if (!edit) {
    return edge;
  }

  return {
    ...edge,
    ...(edit.label !== undefined ? { label: edit.label } : {}),
    ...(edit.summary !== undefined ? { summary: edit.summary } : {}),
  };
}

function applyDirectedEdgeEdit<T extends ViewerProject["directed_edges"][number]>(
  edge: T,
  edit?: ViewerDirectedEdgeEdit,
): T {
  if (!edit) {
    return edge;
  }

  return {
    ...edge,
    ...(edit.display_relation !== undefined
      ? { display_relation: edit.display_relation }
      : {}),
    ...(edit.summary !== undefined ? { summary: edit.summary } : {}),
    ...(edit.strength !== undefined ? { strength: edit.strength } : {}),
  };
}
