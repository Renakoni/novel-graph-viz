import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
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
import { SigmaCanvas } from "../components/graph/SigmaCanvas";
import { DirectedRelationInspector } from "../components/inspectors/DirectedRelationInspector";
import { EmptyInspector } from "../components/inspectors/EmptyInspector";
import { NodeInspector } from "../components/inspectors/NodeInspector";
import { PairRelationInspector } from "../components/inspectors/PairRelationInspector";
import { LeftPanel } from "../components/layout/LeftPanel";
import { RightPanel } from "../components/layout/RightPanel";
import { TopBar } from "../components/layout/TopBar";
import {
  getAvatarProjectKey,
  listProjectAvatars,
  removeNodeAvatar as removeStoredNodeAvatar,
  saveNodeAvatar,
} from "../data/avatarStore";
import { exportCurrentProjectAsSingleHtml } from "../data/htmlExport";
import {
  createViewerState,
  downloadJsonFile,
  parseViewerState,
} from "../data/viewerState";
import { buildSigmaGraph } from "../data/graphAdapters";
import { useViewerStore } from "../store/viewerStore";
import type { LoadedViewerGraph } from "../types/viewerGraph";
import type { ViewerLanguage, ViewerMode, ViewerState } from "../types/viewerState";

type Language = "zh" | "en";
type ViewMode = "3d" | "2d";

const COPY = {
  zh: {
    topbarBrand: "小说关系图查看器",
    topbarEmpty: "打开导出的 project.json",
    openProject: "打开项目",
    exportHtml: "导出 HTML",
    exportState: "导出状态",
    importState: "导入状态",
    nodes: "节点",
    edges: "边",
    loadingTitle: "正在加载项目图谱",
    loadingDesc: "正在解析 project.json...",
    eyebrow: "本地项目查看器",
    heroTitle: "直接打开导出的角色关系图，在本地查看。",
    heroDesc:
      "这个 viewer 直接读取 project.json，聚焦节点、对等边、指向边、摘要和章节范围。",
    card1Title: "轻量 Contract",
    card1Desc: "直接读取 project、chapters、nodes、pair_edges 和 directed_edges。",
    card2Title: "Inspector",
    card2Desc: "面向图谱阅读，不绑定 engine 诊断面板。",
    card3Title: "本地文件",
    card3Desc: "直接消费你机器上的导出 JSON。",
    contractTitle: "期望输入",
    contractType: "Viewer Contract",
    note:
      "pair_edges.first_seen_chapter_id 和 pair_edges.last_seen_chapter_id 可以为空，viewer 会兼容。",
    required: "必需",
    view3d: "3D",
    view2d: "2D",
    background: "背景",
    backgrounds: {
      starfield: "深空星野",
      grid: "网格",
      snow: "飘雪",
      bubble: "气泡",
      firefly: "萤火虫",
      wave: "粒子海洋",
      tyndall: "丁达尔光",
    },
  },
  en: {
    topbarBrand: "Novel Graph Viewer",
    topbarEmpty: "Open an exported project.json",
    openProject: "Open Project",
    exportHtml: "Export HTML",
    exportState: "Export State",
    importState: "Import State",
    nodes: "nodes",
    edges: "edges",
    loadingTitle: "Loading Project Graph",
    loadingDesc: "Parsing project.json...",
    eyebrow: "Local Project Viewer",
    heroTitle: "Open a clean exported graph and inspect it locally.",
    heroDesc:
      "This viewer reads the engine export directly from project.json and focuses on nodes, pair edges, directed edges, summaries, and chapter ranges.",
    card1Title: "Light Contract",
    card1Desc: "Reads project, chapters, nodes, pair_edges, and directed_edges.",
    card2Title: "Inspector",
    card2Desc: "Built for graph reading, not engine diagnostics.",
    card3Title: "Local File",
    card3Desc: "Works directly with the exported JSON on your machine.",
    contractTitle: "Expected Input",
    contractType: "Viewer Contract",
    note:
      "pair_edges.first_seen_chapter_id and pair_edges.last_seen_chapter_id may be empty. The viewer accepts that.",
    required: "Required",
    view3d: "3D",
    view2d: "2D",
    background: "Background",
    backgrounds: {
      starfield: "Deep Starfield",
      grid: "Grid",
      snow: "Snow",
      bubble: "Bubble",
      firefly: "Firefly",
      wave: "Particle Ocean",
      tyndall: "Tyndall",
    },
  },
} satisfies Record<
  Language,
  {
    topbarBrand: string;
    topbarEmpty: string;
    openProject: string;
    exportHtml: string;
    exportState: string;
    importState: string;
    nodes: string;
    edges: string;
    loadingTitle: string;
    loadingDesc: string;
    eyebrow: string;
    heroTitle: string;
    heroDesc: string;
    card1Title: string;
    card1Desc: string;
    card2Title: string;
    card2Desc: string;
    card3Title: string;
    card3Desc: string;
    contractTitle: string;
    contractType: string;
    note: string;
    required: string;
    view3d: string;
    view2d: string;
    background: string;
    backgrounds: Record<BackgroundVariant, string>;
  }
>;

type GraphPageProps = {
  initialLoadedGraph?: LoadedViewerGraph | null;
  initialViewerState?: ViewerState | null;
  standalone?: boolean;
};

export function GraphPage({
  initialLoadedGraph = null,
  initialViewerState = null,
  standalone = false,
}: GraphPageProps) {
  const [language, setLanguage] = useState<Language>(
    initialViewerState?.settings.language ?? "zh",
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    initialViewerState?.settings.viewMode ?? "3d",
  );
  const [background, setBackground] = useState<BackgroundVariant>(
    initialViewerState?.settings.background ?? "starfield",
  );
  const copy = COPY[language];
  const emptyState = getLandingContent(language);

  const {
    isLoading,
    error,
    loaded,
    index,
    filters,
    selection,
    avatarByNodeId,
    setSearch,
    toggleTier,
    setChapterRange,
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

  const projectData = loaded?.data;

  useEffect(() => {
    if (!initialLoadedGraph) {
      return;
    }

    setLoadedGraph(initialLoadedGraph);

    if (initialViewerState) {
      setAvatarMap(initialViewerState.avatars);
      const projectKey = getAvatarProjectKey(initialLoadedGraph);
      void Promise.all(
        Object.entries(initialViewerState.avatars).map(([nodeId, dataUrl]) =>
          saveNodeAvatar(projectKey, nodeId, dataUrl),
        ),
      );
    }
  }, [initialLoadedGraph, initialViewerState, setAvatarMap, setLoadedGraph]);

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

  const handleNodeClick = (nodeId: string) => {
    if (index?.nodeById.has(nodeId)) {
      setSelection({ kind: "node", id: nodeId });
    }
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

  useEffect(() => {
    if (!loaded) {
      if (!initialViewerState) {
        setAvatarMap({});
      }
      return;
    }

    let cancelled = false;
    const projectKey = getAvatarProjectKey(loaded);

    void listProjectAvatars(projectKey)
      .then((avatarMap) => {
        if (!cancelled) {
          setAvatarMap(
            initialViewerState
              ? { ...avatarMap, ...initialViewerState.avatars }
              : avatarMap,
          );
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          console.error(loadError);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialViewerState, loaded, setAvatarMap]);

  const handleNodeAvatarChange = async (nodeId: string, dataUrl: string) => {
    if (!loaded) {
      return;
    }

    const projectKey = getAvatarProjectKey(loaded);
    setNodeAvatar(nodeId, dataUrl);
    await saveNodeAvatar(projectKey, nodeId, dataUrl);
  };

  const handleNodeAvatarRemove = async (nodeId: string) => {
    if (!loaded) {
      return;
    }

    const projectKey = getAvatarProjectKey(loaded);
    await removeStoredNodeAvatar(projectKey, nodeId);
    removeNodeAvatar(nodeId);
  };

  const currentViewerState = createViewerState({
    project: projectData ?? null,
    avatars: avatarByNodeId,
    settings: {
      language,
      viewMode,
      background,
    },
  });

  const handleExportViewerState = () => {
    const baseName = projectData?.project.id ?? "novel-graph";
    downloadJsonFile(`${baseName}.viewer-state.json`, currentViewerState);
  };

  const handleExportHtml = async () => {
    if (!loaded) {
      return;
    }

    await exportCurrentProjectAsSingleHtml({
      loaded,
      viewerState: currentViewerState,
    });
  };

  const handleImportViewerState = async (file: File) => {
    const text = await file.text();
    const parsed = parseViewerState(JSON.parse(text));

    setLanguage(parsed.settings.language as ViewerLanguage);
    setViewMode(parsed.settings.viewMode as ViewerMode);
    setBackground(parsed.settings.background);
    setAvatarMap(parsed.avatars);

    if (loaded) {
      const projectKey = getAvatarProjectKey(loaded);
      await Promise.all(
        Object.entries(parsed.avatars).map(([nodeId, dataUrl]) =>
          saveNodeAvatar(projectKey, nodeId, dataUrl),
        ),
      );
    }
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
          onLanguageChange={setLanguage}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          background={background}
          onBackgroundChange={setBackground}
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
            exportState: copy.exportState,
            importState: copy.importState,
            nodes: copy.nodes,
            edges: copy.edges,
            view3d: copy.view3d,
            view2d: copy.view2d,
            background: copy.background,
            backgrounds: copy.backgrounds,
          }}
        />
      ) : null}

      {standalone && projectData && graphResult ? (
        <div className="standalone-hud">
          <div className="standalone-hud__eyebrow">Novel Graph Viz</div>
          <div className="standalone-hud__title">{projectData.project.title}</div>
          <div className="standalone-hud__meta">
            <span>{graphResult.visibleNodeCount} {copy.nodes}</span>
            <span className="standalone-hud__divider">/</span>
            <span>{graphResult.visibleEdgeCount} {copy.edges}</span>
            <span className="standalone-hud__divider">/</span>
            <span>{viewMode === "3d" ? copy.view3d : copy.view2d}</span>
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
              {viewMode === "3d" ? (
                <ForceGraph3DCanvas
                  data={projectData}
                  avatarByNodeId={avatarByNodeId}
                  onNodeClick={handleNodeClick}
                  onLinkClick={handleEdgeClick}
                  onStageClick={() => setSelection(null)}
                />
              ) : (
                <SigmaCanvas
                  graph={graphResult.graph}
                  onNodeClick={handleNodeClick}
                  onEdgeClick={handleEdgeClick}
                  onStageClick={() => setSelection(null)}
                  fitRequest={0}
                />
              )}
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
            filters={filters}
            chapters={projectData.chapters}
            pairTypes={index?.pairTypes ?? []}
            directedStances={index?.directedStances ?? []}
            directedStructuralBases={index?.directedStructuralBases ?? []}
            onSearchChange={setSearch}
            onToggleTier={toggleTier}
            onChapterRangeChange={setChapterRange}
            onTogglePairType={togglePairType}
            onToggleDirectedStance={toggleDirectedStance}
            onToggleDirectedStructuralBase={toggleDirectedStructuralBase}
            onMinDirectedStrengthChange={setMinDirectedStrength}
            onShowPairEdgesChange={setShowPairEdges}
            onShowDirectedEdgesChange={setShowDirectedEdges}
          />
          <RightPanel
            isVisible={Boolean(selection)}
            onClose={() => setSelection(null)}
          >
            {selectedNode ? (
              <NodeInspector
                node={selectedNode}
                avatarDataUrl={avatarByNodeId[selectedNode.id] ?? null}
                onAvatarChange={handleNodeAvatarChange}
                onAvatarRemove={handleNodeAvatarRemove}
              />
            ) : null}
            {selectedPairEdge ? (
              <PairRelationInspector relation={selectedPairEdge} />
            ) : null}
            {selectedDirectedEdge ? (
              <DirectedRelationInspector relation={selectedDirectedEdge} />
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
          onClose={() => setSelection(null)}
        >
          {selectedNode ? (
            <NodeInspector
              node={selectedNode}
              avatarDataUrl={avatarByNodeId[selectedNode.id] ?? null}
              onAvatarChange={handleNodeAvatarChange}
              onAvatarRemove={handleNodeAvatarRemove}
            />
          ) : null}
          {selectedPairEdge ? (
            <PairRelationInspector relation={selectedPairEdge} />
          ) : null}
          {selectedDirectedEdge ? (
            <DirectedRelationInspector relation={selectedDirectedEdge} />
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

function getLandingContent(language: Language) {
  if (language === "zh") {
    return {
      eyebrow: "本地查看器",
      title: "可视化小说人物关系图",
      description:
        "这里更适合做一件事：快速看人物、关系、摘要，以及章节里的出现范围，而不是先读一堆工程字段。",
      cards: [
        {
          title: "直接看图",
          desc: "打开后默认就是关系图，点击人物即可查看详情、摘要和关联关系。",
        },
        {
          title: "更像阅读器",
          desc: "重点是人物关系本身，不是导出结构，也不是工程诊断界面。",
        },
        {
          title: "先试试看",
          desc: "你可以先加载示例，再决定要不要导入自己的 project.json。",
        },
      ],
      stepsTitle: "第一次使用",
      steps: [
        {
          title: "1. 先加载一个项目",
          desc: "使用“打开项目”按钮加载你本地的 project.json；如果只是想先看效果，也可以点“加载示例”。",
        },
        {
          title: "2. 再点击人物",
          desc: "点球体或节点，右侧会滑出人物详情。除了摘要、别名和评分，你还可以给人物上传头像，头像会保存并覆盖到球体上。",
        },
        {
          title: "3. 最后导出展示页",
          desc: "背景、头像和视图都调好之后，可以直接导出成单个 HTML，用来分享、归档或离线展示。",
        },
      ],
      note: "",
    };
  }

  return {
    eyebrow: "Local Viewer",
    title: "Open your novel relationship graph directly",
    description:
      "This page is meant to feel like a reading surface, not a schema sheet. Use it to inspect characters, links, summaries, and chapter presence.",
    cards: [
      {
        title: "See the graph first",
        desc: "The viewer is built around the graph itself. Click a node to inspect the character.",
      },
      {
        title: "Made for reading",
        desc: "This is about understanding the network, not reading export fields or engine diagnostics.",
      },
      {
        title: "Try the demo",
        desc: "You can load the demo first, then decide whether to open your own project.json.",
      },
    ],
    stepsTitle: "Quick Start",
    steps: [
      {
        title: "1. Load a project",
        desc: "Use the Open Project button to load your local project.json, or start with the demo if you just want a quick look.",
      },
      {
        title: "2. Click a character",
        desc: "Selecting a node opens the detail panel with summaries, aliases, scores, and avatar upload for that character.",
      },
      {
        title: "3. Export a shareable page",
        desc: "Once the background, avatars, and view feel right, export a single HTML file for sharing or offline use.",
      },
    ],
    note: "",
  };
}

function getEmptyStateContent(language: Language) {
  if (language === "zh") {
    return {
      eyebrow: "本地查看器",
      title: "把小说人物关系图直接打开来看。",
      description:
        "这里不该先让人读接口字段。它更适合做一件事：快速看人物、关系、摘要，以及章节里的出现范围。",
      cards: [
        {
          title: "直接看图",
          desc: "打开后默认就是关系图，点击人物即可查看详情、摘要和关联关系。",
        },
        {
          title: "更像阅读器",
          desc: "重点是人物关系本身，不是导出结构，也不是工程诊断界面。",
        },
        {
          title: "先试试看",
          desc: "你可以先加载示例，再决定要不要导入自己的 project.json。",
        },
      ],
      stepsTitle: "第一次使用",
      steps: [
        {
          title: "1. 先加载一个项目",
          desc: "右上角可以打开你导出的 project.json，也可以先点“加载示例”。",
        },
        {
          title: "2. 再点击人物",
          desc: "点球体或节点，右侧会滑出人物详情，包括摘要、别名和评分信息。",
        },
        {
          title: "3. 最后导出展示页",
          desc: "背景和头像调好之后，可以直接导出成单个 HTML 用来分享。",
        },
      ],
      hintTitle: "导入说明",
      hintDesc:
        "通常你不需要理解底层字段；只要导出的 JSON 是标准 viewer 数据，页面就能读取。",
      miniSpecLabel: "最低需要",
      miniSpecValue:
        "project、chapters、nodes、pair_edges、directed_edges",
      note:
        "如果某条关系没有 first_seen_chapter_id / last_seen_chapter_id，也没关系，viewer 会自动兼容。",
    };
  }

  return {
    eyebrow: "Local Viewer",
    title: "Open your novel relationship graph and read it directly.",
    description:
      "This page should feel like a reading surface, not a schema sheet. Use it to inspect characters, links, summaries, and chapter presence.",
    cards: [
      {
        title: "See the graph first",
        desc: "The viewer is built around the graph itself. Click a node to inspect the character.",
      },
      {
        title: "Made for reading",
        desc: "This is about understanding the network, not reading export fields or engine diagnostics.",
      },
      {
        title: "Try the demo",
        desc: "You can load the demo first, then decide whether to open your own project.json.",
      },
    ],
    stepsTitle: "Quick Start",
    steps: [
      {
        title: "1. Load a project",
        desc: "Open your exported project.json from the top-right, or start with the demo.",
      },
      {
        title: "2. Click a character",
        desc: "Selecting a node opens the detail panel with summaries, aliases, and scores.",
      },
      {
        title: "3. Export a shareable page",
        desc: "Once the background and avatars look right, export a single HTML file.",
      },
    ],
    hintTitle: "Import Notes",
    hintDesc:
      "You usually do not need to care about the low-level fields. If the exported JSON follows the viewer contract, it will load.",
    miniSpecLabel: "Minimum data",
    miniSpecValue: "project, chapters, nodes, pair_edges, directed_edges",
    note:
      "If pair_edges.first_seen_chapter_id or last_seen_chapter_id is missing, the viewer still works.",
  };
}
