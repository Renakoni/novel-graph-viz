import { FolderOpen, Layers3, Settings } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import type { BackgroundVariant } from "../background/StarfieldBackground";
import { loadViewerGraphFromFile } from "../../data/loadProjectGraph";
import { useViewerStore } from "../../store/viewerStore";

type TopBarProps = {
  projectName: string | null;
  nodeCount: number;
  edgeCount: number;
  language: "zh" | "en";
  onLanguageChange: (language: "zh" | "en") => void;
  viewMode: "3d" | "2d";
  onViewModeChange: (viewMode: "3d" | "2d") => void;
  background: BackgroundVariant;
  onBackgroundChange: (background: BackgroundVariant) => void;
  onOpenProject?: () => void;
  labels: {
    brand: string;
    emptyTitle: string;
    openProject: string;
    nodes: string;
    edges: string;
    view3d: string;
    view2d: string;
    background: string;
    backgrounds: Record<BackgroundVariant, string>;
  };
};

const BACKGROUNDS: BackgroundVariant[] = [
  "starfield",
  "tyndall",
  "firefly",
  "snow",
  "bubble",
  "wave",
  "grid",
];

export function TopBar({
  projectName,
  nodeCount,
  edgeCount,
  language,
  onLanguageChange,
  viewMode,
  onViewModeChange,
  background,
  onBackgroundChange,
  onOpenProject,
  labels,
}: TopBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setLoadedGraph, setLoading, setError } = useViewerStore();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setLoading(true);
    try {
      const graph = await loadViewerGraphFromFile(file);
      setLoadedGraph(graph);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <header className="viewer-topbar">
      <div className="viewer-topbar__brand">
        <div className="viewer-topbar__logo">
          <Layers3 size={18} />
        </div>
        <div className="viewer-topbar__text">
          <div className="viewer-topbar__eyebrow">{labels.brand}</div>
          <div className="viewer-topbar__title">
            {projectName || labels.emptyTitle}
          </div>
        </div>
      </div>

      {projectName ? (
        <div className="viewer-topbar__stats">
          <span>
            {nodeCount} {labels.nodes}
          </span>
          <span className="viewer-topbar__divider">/</span>
          <span>
            {edgeCount} {labels.edges}
          </span>
        </div>
      ) : null}

      {projectName ? (
        <div className="viewer-topbar__segmented">
          <button
            onClick={() => onViewModeChange("3d")}
            className={viewMode === "3d" ? "is-active" : ""}
          >
            {labels.view3d}
          </button>
          <button
            onClick={() => onViewModeChange("2d")}
            className={viewMode === "2d" ? "is-active" : ""}
          >
            {labels.view2d}
          </button>
        </div>
      ) : null}

      {projectName ? (
        <div className="viewer-topbar__settings">
          <button
            className="viewer-topbar__icon-button"
            onClick={() => setSettingsOpen((value) => !value)}
            aria-label="背景设置"
          >
            <Settings size={16} />
          </button>
          {settingsOpen ? (
            <div className="viewer-settings-popover">
              <div className="viewer-settings-popover__title">
                {labels.background}
              </div>
              <div className="viewer-settings-popover__options">
                {BACKGROUNDS.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      onBackgroundChange(item);
                      setSettingsOpen(false);
                    }}
                    className={background === item ? "is-active" : ""}
                  >
                    <span className={`background-dot background-dot--${item}`} />
                    {labels.backgrounds[item]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div className="viewer-topbar__lang">
        <button
          onClick={() => onLanguageChange("zh")}
          className={language === "zh" ? "is-active" : ""}
        >
          中文
        </button>
        <button
          onClick={() => onLanguageChange("en")}
          className={language === "en" ? "is-active" : ""}
        >
          EN
        </button>
      </div>

      <button
        onClick={() => {
          if (onOpenProject) {
            onOpenProject();
          } else {
            fileInputRef.current?.click();
          }
        }}
        className="viewer-topbar__action"
      >
        <FolderOpen size={16} />
        <span>{labels.openProject}</span>
      </button>
    </header>
  );
}
