import type { BackgroundVariant } from "../components/background/StarfieldBackground";
import type { ViewerProject } from "../types/viewerGraph";
import type { ViewerState } from "../types/viewerState";

const BACKGROUND_VARIANTS: BackgroundVariant[] = [
  "starfield",
  "grid",
  "snow",
  "bubble",
  "firefly",
  "wave",
  "tyndall",
];

export function createViewerState(params: {
  project: ViewerProject | null;
  avatars: Record<string, string>;
  settings: ViewerState["settings"];
}): ViewerState {
  const { project, avatars, settings } = params;

  return {
    version: 1,
    projectId: project?.project.id,
    projectTitle: project?.project.title,
    exportedAt: new Date().toISOString(),
    avatars,
    settings,
  };
}

export function parseViewerState(raw: unknown): ViewerState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Viewer state must be an object.");
  }

  const state = raw as Record<string, unknown>;
  const avatars = state.avatars;
  const settings = state.settings;

  if (state.version !== 1) {
    throw new Error("Unsupported viewer state version.");
  }

  if (
    !avatars ||
    typeof avatars !== "object" ||
    Array.isArray(avatars) ||
    Object.values(avatars).some((value) => typeof value !== "string")
  ) {
    throw new Error("Viewer state avatars are invalid.");
  }

  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    throw new Error("Viewer state settings are invalid.");
  }

  const settingsObject = settings as Record<string, unknown>;
  const language = settingsObject.language;
  const viewMode = settingsObject.viewMode;
  const background = settingsObject.background;

  if (language !== "zh" && language !== "en") {
    throw new Error("Viewer state language is invalid.");
  }

  if (viewMode !== "3d" && viewMode !== "2d") {
    throw new Error("Viewer state view mode is invalid.");
  }

  if (typeof background !== "string") {
    throw new Error("Viewer state background is invalid.");
  }

  const parsedBackground = BACKGROUND_VARIANTS.includes(background as BackgroundVariant)
    ? (background as BackgroundVariant)
    : "starfield";

  return {
    version: 1,
    projectId: typeof state.projectId === "string" ? state.projectId : undefined,
    projectTitle:
      typeof state.projectTitle === "string" ? state.projectTitle : undefined,
    exportedAt:
      typeof state.exportedAt === "string"
        ? state.exportedAt
        : new Date().toISOString(),
    avatars: avatars as Record<string, string>,
    settings: {
      language,
      viewMode,
      background: parsedBackground,
    },
  };
}

export function downloadJsonFile(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
