import {
  ChevronDown,
  Download,
  FolderOpen,
  Layers3,
  PencilLine,
  Settings,
} from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import type { BackgroundVariant } from "../background/StarfieldBackground";
import { GitHubMark } from "../common/GitHubMark";
import { PRODUCT_REPO_URL } from "../../config/product";
import {
  loadViewerGraphFromFile,
  type LoadedViewerFile,
} from "../../data/loadProjectGraph";
import { useViewerStore } from "../../store/viewerStore";

type TopBarProps = {
  projectName: string | null;
  nodeCount: number;
  edgeCount: number;
  language: "zh" | "en";
  onLanguageChange: (language: "zh" | "en") => void;
  editMode: boolean;
  onEditModeChange: (value: boolean) => void;
  hasPendingEdits: boolean;
  saveState: "idle" | "saving" | "saved";
  onSaveEdits?: () => Promise<void> | void;
  background: BackgroundVariant;
  onBackgroundChange: (background: BackgroundVariant) => void;
  onOpenProject?: () => void;
  onOpenLoadedFile?: (loadedFile: LoadedViewerFile) => void;
  onExportViewerState?: () => void;
  onImportViewerState?: (file: File) => Promise<void> | void;
  onExportHtml?: () => Promise<void> | void;
  onExportHtmlWithoutIsolates?: () => Promise<void> | void;
  labels: {
    brand: string;
    emptyTitle: string;
    openProject: string;
    exportHtml: string;
    exportFullHtml: string;
    exportHtmlWithoutIsolates: string;
    exportState: string;
    importState: string;
    nodes: string;
    edges: string;
    editMode: string;
    saveEdits: string;
    background: string;
    language: string;
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
  editMode,
  onEditModeChange,
  hasPendingEdits,
  saveState,
  onSaveEdits,
  background,
  onBackgroundChange,
  onOpenProject,
  onOpenLoadedFile,
  onExportViewerState,
  onImportViewerState,
  onExportHtml,
  onExportHtmlWithoutIsolates,
  labels,
}: TopBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stateInputRef = useRef<HTMLInputElement>(null);
  const { setLoadedGraph, setLoading, setError } = useViewerStore();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setLoading(true);
    try {
      const loadedFile = await loadViewerGraphFromFile(file);
      if (onOpenLoadedFile) {
        onOpenLoadedFile(loadedFile);
      } else {
        setLoadedGraph(loadedFile.graph);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load project");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleStateFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImportViewerState) {
      return;
    }

    try {
      await onImportViewerState(file);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to import viewer state");
    } finally {
      if (stateInputRef.current) {
        stateInputRef.current.value = "";
      }
      setSettingsOpen(false);
      setExportOpen(false);
    }
  };

  return (
    <header className="viewer-topbar">
      <div className="viewer-topbar__left">
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
          <button
            type="button"
            onClick={() => onEditModeChange(!editMode)}
            className={`viewer-topbar__edit-button${editMode ? " is-active" : ""}`}
          >
            <PencilLine size={15} />
            <span>{labels.editMode}</span>
          </button>
        ) : null}

        {projectName ? (
          <button
            type="button"
            onClick={() => void onSaveEdits?.()}
            disabled={saveState === "saving" || !hasPendingEdits}
            className={`viewer-topbar__save-button${
              hasPendingEdits ? " is-dirty" : ""
            }${saveState === "saved" ? " is-saved" : ""}`}
          >
            <span>{labels.saveEdits}</span>
          </button>
        ) : null}
      </div>

      <div className="viewer-topbar__center" />

      <div className="viewer-topbar__right">
        {projectName ? (
          <a
            href={PRODUCT_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="viewer-topbar__icon-link"
            aria-label="GitHub repository"
          >
            <GitHubMark size={16} />
          </a>
        ) : null}

        {projectName ? (
          <div className="viewer-topbar__settings">
            <button
              type="button"
              className="viewer-topbar__icon-button"
              onClick={() => {
                setSettingsOpen((value) => !value);
                setExportOpen(false);
              }}
              aria-label="Viewer settings"
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
                      type="button"
                      onClick={() => {
                        onBackgroundChange(item);
                        setSettingsOpen(false);
                      }}
                      className={background === item ? "is-active" : ""}
                    >
                      <span className={`background-dot background-dot--${item}`} />
                      <span>{labels.backgrounds[item]}</span>
                    </button>
                  ))}
                </div>
                <div className="viewer-settings-popover__title viewer-settings-popover__title--sub">
                  {labels.language}
                </div>
                <div className="viewer-settings-popover__language">
                  <button
                    type="button"
                    onClick={() => onLanguageChange("zh")}
                    className={language === "zh" ? "is-active" : ""}
                  >
                    中文
                  </button>
                  <button
                    type="button"
                    onClick={() => onLanguageChange("en")}
                    className={language === "en" ? "is-active" : ""}
                  >
                    EN
                  </button>
                </div>
                <div className="viewer-settings-popover__tools">
                  <button
                    type="button"
                    onClick={() => {
                      void onExportViewerState?.();
                      setSettingsOpen(false);
                    }}
                  >
                    {labels.exportState}
                  </button>
                  <button
                    type="button"
                    onClick={() => stateInputRef.current?.click()}
                  >
                    {labels.importState}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {projectName ? (
          <div className="viewer-topbar__settings viewer-topbar__export">
            <button
              type="button"
              onClick={() => {
                setExportOpen((value) => !value);
                setSettingsOpen(false);
              }}
              className="viewer-topbar__action viewer-topbar__action--secondary"
              aria-expanded={exportOpen}
            >
              <Download size={16} />
              <span>{labels.exportHtml}</span>
              <ChevronDown
                size={15}
                className={`viewer-topbar__action-caret${exportOpen ? " is-open" : ""}`}
              />
            </button>
            {exportOpen ? (
              <div className="viewer-export-menu">
                <div className="viewer-export-menu__title">{labels.exportHtml}</div>
                <div className="viewer-export-menu__list">
                  <button
                    type="button"
                    onClick={() => {
                      void onExportHtml?.();
                      setExportOpen(false);
                    }}
                  >
                    <div className="viewer-export-menu__item-title">
                      {labels.exportFullHtml}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void onExportHtmlWithoutIsolates?.();
                      setExportOpen(false);
                    }}
                  >
                    <div className="viewer-export-menu__item-title">
                      {labels.exportHtmlWithoutIsolates}
                    </div>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            if (onOpenProject) {
              onOpenProject();
            } else {
              fileInputRef.current?.click();
            }
            setSettingsOpen(false);
            setExportOpen(false);
          }}
          className="viewer-topbar__action"
        >
          <FolderOpen size={16} />
          <span>{labels.openProject}</span>
        </button>
      </div>

      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={stateInputRef}
        onChange={handleStateFileChange}
      />
    </header>
  );
}
