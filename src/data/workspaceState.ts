import { downloadJsonFile, parseViewerState } from "./viewerState";
import type { ViewerProject } from "../types/viewerGraph";
import type { ViewerState } from "../types/viewerState";

export type ViewerWorkspaceState = {
  version: 1;
  projectId?: string;
  projectTitle?: string;
  savedAt: string;
  projectPayload: unknown;
  viewerState: ViewerState;
};

export function createWorkspaceState(params: {
  project: ViewerProject | null;
  viewerState: ViewerState;
}): ViewerWorkspaceState {
  const { project, viewerState } = params;

  if (!project) {
    throw new Error("Workspace export requires a loaded project.");
  }

  return {
    version: 1,
    projectId: project.project.id,
    projectTitle: project.project.title,
    savedAt: new Date().toISOString(),
    projectPayload: project,
    viewerState,
  };
}

export function parseWorkspaceState(raw: unknown): ViewerWorkspaceState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Workspace state must be an object.");
  }

  const value = raw as Record<string, unknown>;
  if (value.version !== 1) {
    throw new Error("Unsupported workspace state version.");
  }

  return {
    version: 1,
    projectId: typeof value.projectId === "string" ? value.projectId : undefined,
    projectTitle:
      typeof value.projectTitle === "string" ? value.projectTitle : undefined,
    savedAt:
      typeof value.savedAt === "string" ? value.savedAt : new Date().toISOString(),
    projectPayload: value.projectPayload,
    viewerState: parseViewerState(value.viewerState),
  };
}

export function downloadWorkspaceStateFile(
  filename: string,
  workspaceState: ViewerWorkspaceState,
) {
  downloadJsonFile(filename, workspaceState);
}
