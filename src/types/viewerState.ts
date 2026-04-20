import type { BackgroundVariant } from "../components/background/StarfieldBackground";

export type ViewerLanguage = "zh" | "en";
export type ViewerMode = "3d" | "2d";

export type ViewerState = {
  version: 1;
  projectId?: string;
  projectTitle?: string;
  exportedAt: string;
  avatars: Record<string, string>;
  settings: {
    language: ViewerLanguage;
    viewMode: ViewerMode;
    background: BackgroundVariant;
  };
};
