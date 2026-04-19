import { useMemo, useState } from "react";
import { AlertCircle, Loader2, Sparkles, UploadCloud } from "lucide-react";
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
import { buildSigmaGraph } from "../data/graphAdapters";
import { DEMO_LOADED_GRAPH } from "../data/demoProject";
import { useViewerStore } from "../store/viewerStore";

type Language = "zh" | "en";
type ViewMode = "3d" | "2d";

const COPY = {
  zh: {
    topbarBrand: "小说关系图查看器",
    topbarEmpty: "打开导出的 project.json",
    openProject: "加载示例",
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
    openProject: "Load Demo",
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

export function GraphPage() {
  const [language, setLanguage] = useState<Language>("zh");
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [background, setBackground] = useState<BackgroundVariant>("starfield");
  const copy = COPY[language];
  const {
    isLoading,
    error,
    loaded,
    index,
    filters,
    selection,
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
  } = useViewerStore();

  const projectData = loaded?.data;

  const graphResult = useMemo(() => {
    if (!projectData) {
      return null;
    }

    return buildSigmaGraph(projectData, filters);
  }, [projectData, filters]);

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

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#020617] font-sans text-slate-200">
      <StarfieldBackground variant={background} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob-glow absolute left-[-10%] top-[-10%] h-[40%] w-[40%] animate-pulse rounded-full" />
        <div
          className="blob-glow absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] animate-pulse rounded-full"
          style={{ animationDelay: "2s" }}
        />
      </div>

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
        onOpenProject={() => setLoadedGraph(DEMO_LOADED_GRAPH)}
        labels={{
          brand: copy.topbarBrand,
          emptyTitle: copy.topbarEmpty,
          openProject: copy.openProject,
          nodes: copy.nodes,
          edges: copy.edges,
          view3d: copy.view3d,
          view2d: copy.view2d,
          background: copy.background,
          backgrounds: copy.backgrounds,
        }}
      />

      <div
        className={
          projectData
            ? "viewer-stage viewer-stage--graph"
            : "viewer-stage viewer-stage--scroll"
        }
      >
        {projectData && graphResult ? (
          <div className="h-full w-full px-3 pb-3 pt-3 lg:px-[22rem] xl:pr-[25rem]">
            <div className="graph-frame h-full w-full overflow-hidden rounded-[28px]">
              {viewMode === "3d" ? (
                <ForceGraph3DCanvas
                  data={projectData}
                  onNodeClick={handleNodeClick}
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
          <div className="viewer-empty">
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
                    className="viewer-hero"
                  >
                    <div className="viewer-hero__main">
                      <div className="viewer-hero__badge">
                        <UploadCloud size={30} />
                      </div>
                      <div className="viewer-hero__copy">
                        <p className="viewer-hero__eyebrow">{copy.eyebrow}</p>
                        <h1>{copy.heroTitle}</h1>
                        <p className="viewer-hero__description">{copy.heroDesc}</p>
                      </div>
                    </div>

                    <div className="viewer-hero__grid">
                      <FeatureCard
                        icon={<Sparkles size={16} />}
                        title={copy.card1Title}
                        desc={copy.card1Desc}
                      />
                      <FeatureCard
                        icon={<AlertCircle size={16} />}
                        title={copy.card2Title}
                        desc={copy.card2Desc}
                      />
                      <FeatureCard
                        icon={<Loader2 size={16} />}
                        title={copy.card3Title}
                        desc={copy.card3Desc}
                      />
                    </div>

                    <div className="viewer-hero__contract">
                      <div className="viewer-hero__contract-head">
                        <span>{copy.contractTitle}</span>
                        <span>{copy.contractType}</span>
                      </div>
                      <div className="viewer-hero__contract-list">
                        <ContractRow label="project" requiredLabel={copy.required} />
                        <ContractRow label="chapters" requiredLabel={copy.required} />
                        <ContractRow label="nodes.summary" requiredLabel={copy.required} />
                        <ContractRow label="pair_edges" requiredLabel={copy.required} />
                        <ContractRow label="directed_edges" requiredLabel={copy.required} />
                      </div>
                      <div className="viewer-hero__note">{copy.note}</div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {projectData && !isLoading ? (
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
            {selectedNode ? <NodeInspector node={selectedNode} /> : null}
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

function ContractRow(props: { label: string; requiredLabel: string }) {
  const { label, requiredLabel } = props;

  return (
    <div className="viewer-contract-row">
      <span>{label}</span>
      <span>{requiredLabel}</span>
    </div>
  );
}
