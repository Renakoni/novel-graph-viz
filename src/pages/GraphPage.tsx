import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  FileJson,
  Loader2,
  MousePointerClick,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  StarfieldBackground,
  type BackgroundVariant,
} from "../components/background/StarfieldBackground";
import { ForceGraph3DCanvas } from "../components/graph/ForceGraph3DCanvas";
import { DirectedRelationInspector } from "../components/inspectors/DirectedRelationInspector";
import { EmptyInspector } from "../components/inspectors/EmptyInspector";
import { NodeInspector } from "../components/inspectors/NodeInspector";
import { PairRelationInspector } from "../components/inspectors/PairRelationInspector";
import { GitHubMark } from "../components/common/GitHubMark";
import { LeftPanel } from "../components/layout/LeftPanel";
import { RightPanel } from "../components/layout/RightPanel";
import { TopBar } from "../components/layout/TopBar";
import { exportCurrentProjectAsSingleHtml } from "../data/htmlExport";
import { buildGraphIndex } from "../data/graphIndex";
import { applyProjectEdits } from "../data/projectEdits";
import { serializeProjectEdits } from "../data/projectEditStore";
import {
  createViewerState,
  parseViewerState,
} from "../data/viewerState";
import {
  createWorkspaceState,
  downloadWorkspaceStateFile,
  parseWorkspaceState,
} from "../data/workspaceState";
import { buildSigmaGraph } from "../data/graphAdapters";
import {
  getEmptyStateContent,
  getLandingContent,
  GRAPH_PAGE_COPY as COPY,
  type Language,
} from "./graphPageCopy";
import { PRODUCT_REPO_URL } from "../config/product";
import { useViewerStore } from "../store/viewerStore";
import {
  EMPTY_VIEWER_PROJECT_EDITS,
  type ViewerAddedDirectedEdge,
  type ViewerAddedPairEdge,
  type ViewerDirectedEdgeEdit,
  type ViewerNodeEdit,
  type ViewerPairEdgeEdit,
  type ViewerProjectEdits,
} from "../types/viewerEdits";
import type { LoadedViewerGraph } from "../types/viewerGraph";
import type { ViewerLanguage, ViewerState } from "../types/viewerState";
import type { LoadedViewerFile } from "../data/loadProjectGraph";

type GraphPageProps = {
  initialLoadedGraph?: LoadedViewerGraph | null;
  initialViewerState?: ViewerState | null;
  standalone?: boolean;
};

function buildWorkspaceSignature(params: {
  projectEdits: ViewerProjectEdits;
  avatarByNodeId: Record<string, string>;
  language: Language;
  background: BackgroundVariant;
}) {
  const { projectEdits, avatarByNodeId, language, background } = params;

  return JSON.stringify({
    projectEdits: JSON.parse(serializeProjectEdits(projectEdits)),
    avatars: Object.fromEntries(
      Object.entries(avatarByNodeId).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    language,
    background,
  });
}

export function GraphPage({
  initialLoadedGraph = null,
  initialViewerState = null,
  standalone = false,
}: GraphPageProps) {
  const initialLanguage = initialViewerState?.settings.language ?? "zh";
  const initialBackground = initialViewerState?.settings.background ?? "starfield";
  const [focusRequest, setFocusRequest] = useState<{
    nodeId: string;
    nonce: number;
  } | null>(null);
  const [language, setLanguage] = useState<Language>(
    initialLanguage,
  );
  const [editMode, setEditMode] = useState(false);
  const [projectEdits, setProjectEdits] = useState<ViewerProjectEdits>(
    EMPTY_VIEWER_PROJECT_EDITS,
  );
  const [savedWorkspaceSnapshot, setSavedWorkspaceSnapshot] = useState(
    buildWorkspaceSignature({
      projectEdits: EMPTY_VIEWER_PROJECT_EDITS,
      avatarByNodeId: initialViewerState?.avatars ?? {},
      language: initialLanguage,
      background: initialBackground,
    }),
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [background, setBackground] = useState<BackgroundVariant>(
    initialBackground,
  );
  const copy = COPY[language];
  const emptyState = getLandingContent(language);

  const {
    isLoading,
    error,
    loaded,
    filters,
    selection,
    avatarByNodeId,
    setSearch,
    toggleTier,
    togglePairType,
    toggleDirectedStance,
    toggleDirectedStructuralBase,
    setMinDirectedStrength,
    setShowPairEdges,
    setShowDirectedEdges,
    setSelection,
    setLoadedGraph,
    setAvatarMap,
    setNodeAvatar,
    removeNodeAvatar,
    setError,
  } = useViewerStore();

  const projectData = useMemo(
    () => (loaded ? applyProjectEdits(loaded.data, projectEdits) : null),
    [loaded, projectEdits],
  );
  const index = useMemo(
    () => (projectData ? buildGraphIndex(projectData) : null),
    [projectData],
  );

  useEffect(() => {
    if (!initialLoadedGraph) {
      return;
    }

    setLoadedGraph(initialLoadedGraph);
    setProjectEdits(EMPTY_VIEWER_PROJECT_EDITS);
    setSaveState("idle");

    if (initialViewerState) {
      setAvatarMap(initialViewerState.avatars);
      setSavedWorkspaceSnapshot(
        buildWorkspaceSignature({
          projectEdits: EMPTY_VIEWER_PROJECT_EDITS,
          avatarByNodeId: initialViewerState.avatars,
          language: initialViewerState.settings.language as Language,
          background: initialViewerState.settings.background,
        }),
      );
      return;
    }

    setSavedWorkspaceSnapshot(
      buildWorkspaceSignature({
        projectEdits: EMPTY_VIEWER_PROJECT_EDITS,
        avatarByNodeId: {},
        language: initialLanguage,
        background: initialBackground,
      }),
    );
  }, [
    initialBackground,
    initialLoadedGraph,
    initialLanguage,
    initialViewerState,
    setAvatarMap,
    setLoadedGraph,
  ]);

  const graphResult = useMemo(() => {
    if (!projectData) {
      return null;
    }

    return buildSigmaGraph(projectData, filters, avatarByNodeId);
  }, [avatarByNodeId, projectData, filters]);

  const selectedNode =
    selection?.kind === "node" ? index?.nodeById.get(selection.id) ?? null : null;
  const selectedPairEdge =
    selection?.kind === "pair-edge"
      ? index?.pairEdgeById.get(selection.id) ?? null
      : null;
  const selectedDirectedEdge =
    selection?.kind === "directed-edge"
      ? index?.directedEdgeById.get(selection.id) ?? null
      : null;
  const detailTitle = selectedNode
    ? language === "zh"
      ? "人物详情"
      : "Character"
    : selectedPairEdge || selectedDirectedEdge
    ? language === "zh"
      ? "关系详情"
      : "Relation"
    : language === "zh"
    ? "详情"
    : "Details";
  const detailKicker = selectedNode
    ? language === "zh"
      ? "人物"
      : "Character"
    : selectedPairEdge
    ? language === "zh"
      ? "对等关系"
      : "Pair Relation"
    : selectedDirectedEdge
    ? language === "zh"
      ? "单向关系"
      : "Directed Relation"
    : "Details";

  useEffect(() => {
    if (!selection || !index) {
      return;
    }

    const exists =
      (selection.kind === "node" && index.nodeById.has(selection.id)) ||
      (selection.kind === "pair-edge" && index.pairEdgeById.has(selection.id)) ||
      (selection.kind === "directed-edge" &&
        index.directedEdgeById.has(selection.id));

    if (!exists) {
      setSelection(null);
    }
  }, [index, selection, setSelection]);

  const handleNodeClick = (nodeId: string) => {
    if (index?.nodeById.has(nodeId)) {
      setSelection({ kind: "node", id: nodeId });
    }
  };

  const handleOverviewNodeSelect = (nodeId: string) => {
    if (!index?.nodeById.has(nodeId)) {
      return;
    }

    setSelection({ kind: "node", id: nodeId });
    setFocusRequest({ nodeId, nonce: Date.now() });
  };

  const handleEdgeClick = (edgeId: string, kind: "pair-edge" | "directed-edge") => {
    if (kind === "pair-edge" && index?.pairEdgeById.has(edgeId)) {
      setSelection({ kind: "pair-edge", id: edgeId });
      return;
    }

    if (kind === "directed-edge" && index?.directedEdgeById.has(edgeId)) {
      setSelection({ kind: "directed-edge", id: edgeId });
    }
  };

  const handleNodeAvatarChange = async (nodeId: string, dataUrl: string) => {
    if (!loaded || standalone) {
      return;
    }

    setNodeAvatar(nodeId, dataUrl);
    setSaveState("idle");
  };

  const handleNodeAvatarRemove = async (nodeId: string) => {
    if (!loaded || standalone) {
      return;
    }

    removeNodeAvatar(nodeId);
    setSaveState("idle");
  };

  const updateNodeEdit = (nodeId: string, patch: Partial<ViewerNodeEdit>) => {
    setProjectEdits((current) => ({
      ...current,
      nodes: {
        ...current.nodes,
        [nodeId]: {
          ...current.nodes[nodeId],
          ...patch,
        },
      },
    }));
    setSaveState("idle");
  };

  const updatePairEdgeEdit = (
    edgeId: string,
    patch: Partial<ViewerPairEdgeEdit>,
  ) => {
    setProjectEdits((current) => ({
      ...current,
      pairEdges: {
        ...current.pairEdges,
        [edgeId]: {
          ...current.pairEdges[edgeId],
          ...patch,
        },
      },
    }));
    setSaveState("idle");
  };

  const updateDirectedEdgeEdit = (
    edgeId: string,
    patch: Partial<ViewerDirectedEdgeEdit>,
  ) => {
    setProjectEdits((current) => ({
      ...current,
      directedEdges: {
        ...current.directedEdges,
        [edgeId]: {
          ...current.directedEdges[edgeId],
          ...patch,
        },
      },
    }));
    setSaveState("idle");
  };

  const addPairRelation = (edge: ViewerAddedPairEdge) => {
    setProjectEdits((current) => ({
      ...current,
      addedPairEdges: [...current.addedPairEdges, edge],
    }));
    setSelection({ kind: "pair-edge", id: edge.id });
    setSaveState("idle");
  };

  const addDirectedRelation = (edge: ViewerAddedDirectedEdge) => {
    setProjectEdits((current) => ({
      ...current,
      addedDirectedEdges: [...current.addedDirectedEdges, edge],
    }));
    setSelection({ kind: "directed-edge", id: edge.id });
    setSaveState("idle");
  };

  const currentWorkspaceSignature = useMemo(
    () =>
      buildWorkspaceSignature({
        projectEdits,
        avatarByNodeId,
        language,
        background,
      }),
    [avatarByNodeId, background, language, projectEdits],
  );

  const hasPendingEdits = currentWorkspaceSignature !== savedWorkspaceSnapshot;
  const isolatedNodes = useMemo(() => {
    if (!projectData) {
      return [];
    }

    const linked = new Set<string>();
    for (const edge of projectData.pair_edges) {
      linked.add(edge.source);
      linked.add(edge.target);
    }
    for (const edge of projectData.directed_edges) {
      linked.add(edge.source);
      linked.add(edge.target);
    }

    return projectData.nodes.filter((node) => !linked.has(node.id));
  }, [projectData]);

  const handleSaveProjectEdits = async () => {
    if (!projectData) {
      return;
    }

    setSaveState("saving");

    try {
      const workspaceState = createWorkspaceState({
        project: projectData,
        viewerState: currentViewerState,
      });
      const baseName =
        projectData.project.title?.trim() ||
        projectData.project.id ||
        "novel-graph";
      const safeName = baseName.replace(/[\\/:*?"<>|]+/g, "-").trim() || "novel-graph";
      downloadWorkspaceStateFile(`${safeName}.workspace.json`, workspaceState);
      setSavedWorkspaceSnapshot(currentWorkspaceSignature);
      setSaveState("saved");
    } catch (saveError) {
      setSaveState("idle");
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save manual edits",
      );
    }
  };

  const hideNodeById = (nodeId: string) => {
    setProjectEdits((current) => ({
      ...current,
      hiddenNodeIds: current.hiddenNodeIds.includes(nodeId)
        ? current.hiddenNodeIds
        : [...current.hiddenNodeIds, nodeId],
    }));
    if (selection?.kind === "node" && selection.id === nodeId) {
      setSelection(null);
    }
    setSaveState("idle");
  };

  const hidePairRelationById = (edgeId: string) => {
    setProjectEdits((current) => ({
      ...current,
      hiddenPairEdgeIds: current.hiddenPairEdgeIds.includes(edgeId)
        ? current.hiddenPairEdgeIds
        : [...current.hiddenPairEdgeIds, edgeId],
    }));
    if (selection?.kind === "pair-edge" && selection.id === edgeId) {
      setSelection(null);
    }
    setSaveState("idle");
  };

  const hideDirectedRelationById = (edgeId: string) => {
    setProjectEdits((current) => ({
      ...current,
      hiddenDirectedEdgeIds: current.hiddenDirectedEdgeIds.includes(edgeId)
        ? current.hiddenDirectedEdgeIds
        : [...current.hiddenDirectedEdgeIds, edgeId],
    }));
    if (selection?.kind === "directed-edge" && selection.id === edgeId) {
      setSelection(null);
    }
    setSaveState("idle");
  };

  const hideAllIsolatedNodes = () => {
    if (isolatedNodes.length === 0) {
      return;
    }

    setProjectEdits((current) => ({
      ...current,
      hiddenNodeIds: Array.from(
        new Set([...current.hiddenNodeIds, ...isolatedNodes.map((node) => node.id)]),
      ),
    }));
    if (selection?.kind === "node" && isolatedNodes.some((node) => node.id === selection.id)) {
      setSelection(null);
    }
    setSaveState("idle");
  };

  const restoreHiddenItems = () => {
    setProjectEdits((current) => ({
      ...current,
      hiddenNodeIds: [],
      hiddenPairEdgeIds: [],
      hiddenDirectedEdgeIds: [],
    }));
    setSaveState("idle");
  };

  const currentViewerState = createViewerState({
    project: projectData ?? null,
    avatars: avatarByNodeId,
    settings: {
      language,
      viewMode: "3d",
      background,
    },
  });

  const handleExportViewerState = () => {
    if (!projectData) {
      return;
    }

    const workspaceState = createWorkspaceState({
      project: projectData,
      viewerState: currentViewerState,
    });
    const baseName =
      projectData.project.title?.trim() ||
      projectData.project.id ||
      "novel-graph";
    const safeName = baseName.replace(/[\\/:*?"<>|]+/g, "-").trim() || "novel-graph";
    downloadWorkspaceStateFile(`${safeName}.workspace.json`, workspaceState);
  };

  const requestExportName = () => {
    const initialName = projectData?.project.title?.trim() || "novel-graph";
    const nextName = window.prompt(
      language === "zh" ? "输入导出的文件名" : "Enter export file name",
      initialName,
    );

    if (nextName === null) {
      return null;
    }

    const trimmed = nextName.trim();
    return trimmed || initialName;
  };

  const handleExportHtml = async () => {
    if (!loaded || !projectData) {
      return;
    }

    const exportName = requestExportName();
    if (!exportName) {
      return;
    }

    await exportCurrentProjectAsSingleHtml({
      loaded: {
        ...loaded,
        data: projectData,
      },
      viewerState: currentViewerState,
      variant: "full",
      exportName,
    });
  };

  const handleExportHtmlWithoutIsolates = async () => {
    if (!loaded || !projectData) {
      return;
    }

    const exportName = requestExportName();
    if (!exportName) {
      return;
    }

    await exportCurrentProjectAsSingleHtml({
      loaded: {
        ...loaded,
        data: projectData,
      },
      viewerState: currentViewerState,
      variant: "without-isolates",
      exportName,
    });
  };

  const handleImportViewerState = async (file: File) => {
    const text = await file.text();
    const parsed = parseWorkspaceState(JSON.parse(text));

    setLoadedGraph({
      data: parsed.projectPayload as LoadedViewerGraph["data"],
      sourceName: file.name,
    });
    setLanguage(parsed.viewerState.settings.language as ViewerLanguage);
    setBackground(parsed.viewerState.settings.background);
    setAvatarMap(parsed.viewerState.avatars);
    setProjectEdits(EMPTY_VIEWER_PROJECT_EDITS);
    setSavedWorkspaceSnapshot(
      buildWorkspaceSignature({
        projectEdits: EMPTY_VIEWER_PROJECT_EDITS,
        avatarByNodeId: parsed.viewerState.avatars,
        language: parsed.viewerState.settings.language as Language,
        background: parsed.viewerState.settings.background,
      }),
    );
    setSaveState("idle");
  };

  const handleOpenLoadedFile = (loadedFile: LoadedViewerFile) => {
    setLoadedGraph(loadedFile.graph);
    setProjectEdits(EMPTY_VIEWER_PROJECT_EDITS);
    setSaveState("idle");

    if (!loadedFile.workspaceState) {
      setSavedWorkspaceSnapshot(
        buildWorkspaceSignature({
          projectEdits: EMPTY_VIEWER_PROJECT_EDITS,
          avatarByNodeId: {},
          language,
          background,
        }),
      );
      return;
    }

    setLanguage(
      loadedFile.workspaceState.viewerState.settings.language as ViewerLanguage,
    );
    setBackground(loadedFile.workspaceState.viewerState.settings.background);
    setAvatarMap(loadedFile.workspaceState.viewerState.avatars);
    setProjectEdits(EMPTY_VIEWER_PROJECT_EDITS);
    setSavedWorkspaceSnapshot(
      buildWorkspaceSignature({
        projectEdits: EMPTY_VIEWER_PROJECT_EDITS,
        avatarByNodeId: loadedFile.workspaceState.viewerState.avatars,
        language: loadedFile.workspaceState.viewerState.settings.language as Language,
        background: loadedFile.workspaceState.viewerState.settings.background,
      }),
    );
  };

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setSaveState("idle");
  };

  const handleBackgroundChange = (nextBackground: BackgroundVariant) => {
    setBackground(nextBackground);
    setSaveState("idle");
  };

  return (
    <main
      className={`relative h-screen w-screen overflow-hidden bg-[#020617] font-sans text-slate-200${
        standalone ? " viewer-root viewer-root--standalone" : ""
      }`}
    >
      <StarfieldBackground variant={background} />
      {!standalone ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="blob-glow absolute left-[-10%] top-[-10%] h-[40%] w-[40%] animate-pulse rounded-full" />
          <div
            className="blob-glow absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] animate-pulse rounded-full"
            style={{ animationDelay: "2s" }}
          />
        </div>
      ) : null}

      {!standalone ? (
        <TopBar
          projectName={projectData?.project.title ?? null}
          nodeCount={graphResult?.visibleNodeCount ?? 0}
          edgeCount={graphResult?.visibleEdgeCount ?? 0}
          language={language}
          onLanguageChange={handleLanguageChange}
          editMode={editMode}
          onEditModeChange={setEditMode}
          hasPendingEdits={hasPendingEdits}
          saveState={saveState}
          onSaveEdits={handleSaveProjectEdits}
          background={background}
          onBackgroundChange={handleBackgroundChange}
          onOpenLoadedFile={handleOpenLoadedFile}
          onExportHtml={async () => {
            try {
              await handleExportHtml();
            } catch (exportError) {
              setError(
                exportError instanceof Error
                  ? exportError.message
                  : "Failed to export HTML",
              );
            }
          }}
          onExportHtmlWithoutIsolates={async () => {
            try {
              await handleExportHtmlWithoutIsolates();
            } catch (exportError) {
              setError(
                exportError instanceof Error
                  ? exportError.message
                  : "Failed to export HTML",
              );
            }
          }}
          onExportViewerState={handleExportViewerState}
          onImportViewerState={async (file) => {
            try {
              await handleImportViewerState(file);
            } catch (importError) {
              setError(
                importError instanceof Error
                  ? importError.message
                  : "Failed to import viewer state",
              );
            }
          }}
          labels={{
            brand: copy.topbarBrand,
            emptyTitle: copy.topbarEmpty,
            openProject: copy.openProject,
            exportHtml: copy.exportHtml,
            exportFullHtml: copy.exportFullHtml,
            exportHtmlWithoutIsolates: copy.exportHtmlWithoutIsolates,
            exportState: copy.exportState,
            importState: copy.importState,
            nodes: copy.nodes,
            edges: copy.edges,
            editMode: copy.editMode,
            saveEdits:
              language === "zh"
                ? saveState === "saved"
                  ? "已保存"
                  : saveState === "saving"
                  ? "保存中..."
                  : "保存修改"
                : saveState === "saved"
                ? "Saved"
                : saveState === "saving"
                ? "Saving..."
                : "Save Changes",
            background: copy.background,
            language: language === "zh" ? "语言" : "Language",
            backgrounds: copy.backgrounds,
          }}
        />
      ) : null}

      {projectData && editMode && !standalone ? (
        <div className="edit-mode-hud">
          <div className="edit-mode-hud__title">
            {language === "zh" ? "编辑模式已开启" : "Edit mode is on"}
          </div>
          <div className="edit-mode-hud__desc">
            {language === "zh"
              ? "后续人工修正孤点、隐藏关系、固定位置都从这里继续接。"
              : "Manual isolate fixes, edge hiding, and pinned positions will continue from here."}
          </div>
        </div>
      ) : null}

      {standalone && projectData && graphResult ? (
        <div className="standalone-hud">
          <div className="standalone-hud__row">
            <div>
              <div className="standalone-hud__eyebrow">Novel Graph Viz</div>
              <div className="standalone-hud__title">{projectData.project.title}</div>
            </div>
            <a
              href={PRODUCT_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="standalone-hud__repo"
              aria-label="GitHub repository"
            >
              <GitHubMark size={15} />
            </a>
          </div>
          <div className="standalone-hud__meta">
            <span>{graphResult.visibleNodeCount} {copy.nodes}</span>
            <span className="standalone-hud__divider">/</span>
            <span>{graphResult.visibleEdgeCount} {copy.edges}</span>
            <span className="standalone-hud__divider">/</span>
            <span>{copy.view3d}</span>
          </div>
        </div>
      ) : null}

      <div
        className={
          standalone
            ? "viewer-stage viewer-stage--standalone"
            : projectData
            ? "viewer-stage viewer-stage--graph"
            : "viewer-stage viewer-stage--scroll"
        }
      >
        {projectData && graphResult ? (
          <div
            className={
              standalone
                ? "standalone-stage-shell"
                : "h-full w-full px-3 pb-3 pt-3 lg:px-[22rem] xl:pr-[25rem]"
            }
          >
            <div
              className={
                standalone
                  ? "graph-frame graph-frame--standalone h-full w-full overflow-hidden"
                  : "graph-frame h-full w-full overflow-hidden rounded-[28px]"
              }
            >
              <ForceGraph3DCanvas
                data={projectData}
                filters={filters}
                avatarByNodeId={avatarByNodeId}
                focusRequest={focusRequest}
                onNodeClick={handleNodeClick}
                onLinkClick={handleEdgeClick}
                onStageClick={() => setSelection(null)}
              />
            </div>
          </div>
        ) : (
          <div className={standalone ? "standalone-empty" : "viewer-empty"}>
            <div className="viewer-empty__shell">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="viewer-loading"
                  >
                    <div className="viewer-loading__spinner">
                      <div className="viewer-loading__ring" />
                      <Sparkles className="viewer-loading__icon" size={28} />
                    </div>
                    <div className="viewer-loading__text">
                      <h2>{copy.loadingTitle}</h2>
                      <p>{copy.loadingDesc}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.section
                    key="empty"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={standalone ? "viewer-hero standalone-empty__panel" : "viewer-hero"}
                  >
                    <div className="viewer-hero__main">
                      <div className="viewer-hero__badge">
                        <UploadCloud size={30} />
                      </div>
                      <div className="viewer-hero__copy">
                        <p className="viewer-hero__eyebrow">{emptyState.eyebrow}</p>
                        <h1>{emptyState.title}</h1>
                        <p className="viewer-hero__description">{emptyState.description}</p>
                      </div>
                    </div>

                    <div className="viewer-hero__grid">
                      <FeatureCard
                        icon={<Sparkles size={16} />}
                        title={emptyState.cards[0].title}
                        desc={emptyState.cards[0].desc}
                      />
                      <FeatureCard
                        icon={<AlertCircle size={16} />}
                        title={emptyState.cards[1].title}
                        desc={emptyState.cards[1].desc}
                      />
                      <FeatureCard
                        icon={<Loader2 size={16} />}
                        title={emptyState.cards[2].title}
                        desc={emptyState.cards[2].desc}
                      />
                    </div>

                    <div className="viewer-hero__steps viewer-hero__steps--expanded">
                      <div className="viewer-hero__section-title">
                        <MousePointerClick size={15} />
                        <span>{emptyState.stepsTitle}</span>
                      </div>
                      <div className="viewer-hero__steps-list viewer-hero__steps-list--expanded">
                        {emptyState.steps.map((step) => (
                          <StepCard key={step.title} title={step.title} desc={step.desc} />
                        ))}
                      </div>
                      {emptyState.note ? (
                        <div className="viewer-hero__note">{emptyState.note}</div>
                      ) : null}
                    </div>
                    <div className="viewer-hero__links">
                      <a
                        href={PRODUCT_REPO_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="viewer-hero__repo-link"
                      >
                        <GitHubMark size={16} />
                        <span>GitHub</span>
                        <ArrowUpRight size={15} />
                      </a>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {projectData && !isLoading && !standalone ? (
        <>
          <LeftPanel
            language={language}
            editMode={editMode}
            nodes={projectData.nodes}
            isolatedNodes={isolatedNodes}
            hiddenCounts={{
              nodes: projectEdits.hiddenNodeIds.length,
              pairEdges: projectEdits.hiddenPairEdgeIds.length,
              directedEdges: projectEdits.hiddenDirectedEdgeIds.length,
            }}
            selectedNodeId={selectedNode?.id ?? null}
            avatarByNodeId={avatarByNodeId}
            filters={filters}
            pairTypes={index?.pairTypes ?? []}
            directedStances={index?.directedStances ?? []}
            directedStructuralBases={index?.directedStructuralBases ?? []}
            pairTypeLabels={index?.pairTypeLabels ?? new Map()}
            directedStanceLabels={index?.directedStanceLabels ?? new Map()}
            directedStructuralBaseLabels={index?.directedStructuralBaseLabels ?? new Map()}
            onNodeSelect={handleOverviewNodeSelect}
            onNodeAvatarChange={handleNodeAvatarChange}
            onNodeAvatarRemove={handleNodeAvatarRemove}
            onHideNode={hideNodeById}
            onHideAllIsolates={hideAllIsolatedNodes}
            onRestoreHidden={restoreHiddenItems}
            onSearchChange={setSearch}
            onToggleTier={toggleTier}
            onTogglePairType={togglePairType}
            onToggleDirectedStance={toggleDirectedStance}
            onToggleDirectedStructuralBase={toggleDirectedStructuralBase}
            onMinDirectedStrengthChange={setMinDirectedStrength}
            onShowPairEdgesChange={setShowPairEdges}
            onShowDirectedEdgesChange={setShowDirectedEdges}
          />
          <RightPanel
            isVisible={Boolean(selection)}
            panelKey={selection ? `${selection.kind}:${selection.id}` : "empty"}
            title={detailTitle}
            kicker={detailKicker}
            onClose={() => setSelection(null)}
          >
            {selectedNode ? (
              <NodeInspector
                key={`node-${selectedNode.id}`}
                node={selectedNode}
                language={language}
                editMode={editMode}
                editDraft={projectEdits.nodes[selectedNode.id]}
                onEditChange={(patch) => updateNodeEdit(selectedNode.id, patch)}
                candidateNodes={projectData.nodes.filter((item) => item.id !== selectedNode.id)}
                pairTypes={index?.pairTypes ?? []}
                pairTypeLabels={index?.pairTypeLabels ?? new Map()}
                directedStances={index?.directedStances ?? []}
                directedStanceLabels={index?.directedStanceLabels ?? new Map()}
                directedStructuralBases={index?.directedStructuralBases ?? []}
                directedStructuralBaseLabels={index?.directedStructuralBaseLabels ?? new Map()}
                onCreatePairRelation={addPairRelation}
                onCreateDirectedRelation={addDirectedRelation}
                avatarDataUrl={avatarByNodeId[selectedNode.id] ?? null}
                allowAvatarEditing
                showInternalId
                onAvatarChange={handleNodeAvatarChange}
                onAvatarRemove={handleNodeAvatarRemove}
              />
            ) : null}
            {selectedPairEdge ? (
              <PairRelationInspector
                key={`pair-${selectedPairEdge.id}`}
                relation={selectedPairEdge}
                language={language}
                sourceLabel={
                  index?.nodeById.get(selectedPairEdge.source)?.name ?? selectedPairEdge.source
                }
                targetLabel={
                  index?.nodeById.get(selectedPairEdge.target)?.name ?? selectedPairEdge.target
                }
                editMode={editMode}
                editDraft={projectEdits.pairEdges[selectedPairEdge.id]}
                onEditChange={(patch) => updatePairEdgeEdit(selectedPairEdge.id, patch)}
                onHideRelation={() => hidePairRelationById(selectedPairEdge.id)}
              />
            ) : null}
            {selectedDirectedEdge ? (
              <DirectedRelationInspector
                key={`directed-${selectedDirectedEdge.id}`}
                relation={selectedDirectedEdge}
                language={language}
                sourceLabel={
                  index?.nodeById.get(selectedDirectedEdge.source)?.name ??
                  selectedDirectedEdge.source
                }
                targetLabel={
                  index?.nodeById.get(selectedDirectedEdge.target)?.name ??
                  selectedDirectedEdge.target
                }
                editMode={editMode}
                editDraft={projectEdits.directedEdges[selectedDirectedEdge.id]}
                onEditChange={(patch) =>
                  updateDirectedEdgeEdit(selectedDirectedEdge.id, patch)
                }
                onHideRelation={() => hideDirectedRelationById(selectedDirectedEdge.id)}
              />
            ) : null}
            {!selectedNode && !selectedPairEdge && !selectedDirectedEdge ? (
              <EmptyInspector />
            ) : null}
          </RightPanel>
        </>
      ) : null}

      {projectData && !isLoading && standalone ? (
        <RightPanel
          isVisible={Boolean(selection)}
          panelKey={selection ? `${selection.kind}:${selection.id}` : "empty"}
          title={detailTitle}
          kicker={detailKicker}
          onClose={() => setSelection(null)}
        >
          {selectedNode ? (
            <NodeInspector
              key={`node-${selectedNode.id}`}
              node={selectedNode}
              language={language}
              editMode={editMode}
              editDraft={projectEdits.nodes[selectedNode.id]}
              onEditChange={(patch) => updateNodeEdit(selectedNode.id, patch)}
              candidateNodes={projectData.nodes.filter((item) => item.id !== selectedNode.id)}
              pairTypes={index?.pairTypes ?? []}
              pairTypeLabels={index?.pairTypeLabels ?? new Map()}
              directedStances={index?.directedStances ?? []}
              directedStanceLabels={index?.directedStanceLabels ?? new Map()}
              directedStructuralBases={index?.directedStructuralBases ?? []}
              directedStructuralBaseLabels={index?.directedStructuralBaseLabels ?? new Map()}
              onCreatePairRelation={addPairRelation}
              onCreateDirectedRelation={addDirectedRelation}
              avatarDataUrl={avatarByNodeId[selectedNode.id] ?? null}
              allowAvatarEditing={false}
              showInternalId={false}
              onAvatarChange={handleNodeAvatarChange}
              onAvatarRemove={handleNodeAvatarRemove}
            />
          ) : null}
          {selectedPairEdge ? (
            <PairRelationInspector
              key={`pair-${selectedPairEdge.id}`}
              relation={selectedPairEdge}
              language={language}
              sourceLabel={
                index?.nodeById.get(selectedPairEdge.source)?.name ?? selectedPairEdge.source
              }
              targetLabel={
                index?.nodeById.get(selectedPairEdge.target)?.name ?? selectedPairEdge.target
              }
              editMode={editMode}
              editDraft={projectEdits.pairEdges[selectedPairEdge.id]}
              onEditChange={(patch) => updatePairEdgeEdit(selectedPairEdge.id, patch)}
              onHideRelation={() => hidePairRelationById(selectedPairEdge.id)}
            />
          ) : null}
          {selectedDirectedEdge ? (
            <DirectedRelationInspector
              key={`directed-${selectedDirectedEdge.id}`}
              relation={selectedDirectedEdge}
              language={language}
              sourceLabel={
                index?.nodeById.get(selectedDirectedEdge.source)?.name ??
                selectedDirectedEdge.source
              }
              targetLabel={
                index?.nodeById.get(selectedDirectedEdge.target)?.name ??
                selectedDirectedEdge.target
              }
              editMode={editMode}
              editDraft={projectEdits.directedEdges[selectedDirectedEdge.id]}
              onEditChange={(patch) =>
                updateDirectedEdgeEdit(selectedDirectedEdge.id, patch)
              }
              onHideRelation={() => hideDirectedRelationById(selectedDirectedEdge.id)}
            />
          ) : null}
          {!selectedNode && !selectedPairEdge && !selectedDirectedEdge ? (
            <EmptyInspector />
          ) : null}
        </RightPanel>
      ) : null}

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 z-[100] -translate-x-1/2"
          >
            <div className="flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-8 py-4 font-bold text-red-400 shadow-2xl backdrop-blur-xl">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function FeatureCard(props: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  const { icon, title, desc } = props;

  return (
    <div className="viewer-card">
      <div className="viewer-card__icon">{icon}</div>
      <div className="viewer-card__title">{title}</div>
      <div className="viewer-card__desc">{desc}</div>
    </div>
  );
}

function StepCard(props: { title: string; desc: string }) {
  const { title, desc } = props;

  return (
    <div className="viewer-step-card">
      <div className="viewer-step-card__title">{title}</div>
      <div className="viewer-step-card__desc">{desc}</div>
    </div>
  );
}
