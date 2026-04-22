import {
  Activity,
  Camera,
  ChevronLeft,
  Eye,
  ImagePlus,
  LayoutGrid,
  Link,
  Link2,
  List,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { imageFileToAvatarDataUrl } from "../../data/avatarStore";
import type {
  ViewerFilters,
  ViewerNode,
  ViewerTier,
} from "../../types/viewerGraph";

const TIERS: ViewerTier[] = ["core", "active", "background", "transient"];
type LeftPanelLanguage = "zh" | "en";

const LEFT_PANEL_COPY = {
  zh: {
    overview: "总览",
    filters: "筛选",
    search: "搜索",
    searchPlaceholder: "搜索人物",
    filterSearchPlaceholder: "姓名或别名",
    nodeTiers: "人物层级",
    visibleLayers: "显示内容",
    pairEdges: "对等关系",
    directedEdges: "单向关系",
    pairTypes: "对等类型",
    directedBases: "关系依据",
    directedStances: "关系倾向",
    minimumStrength: "最低强度",
    threshold: "阈值",
    characters: "个人物",
    emptyPairTypes: "暂无对等类型",
    emptyDirectedBases: "暂无关系依据",
    emptyDirectedStances: "暂无关系倾向",
    collapseSidebar: "收起侧栏",
    expandSidebar: "展开侧栏",
    uploadAvatar: "上传头像",
    removeAvatar: "移除头像",
    isolateWorkbench: "孤点工作台",
    isolateCount: "个孤点",
    hideNode: "隐藏",
    hideAllIsolates: "全部隐藏",
    restoreHidden: "恢复隐藏项",
    hiddenSummary: "已隐藏",
    tiers: {
      core: "核心",
      active: "活跃",
      background: "背景",
      transient: "临时",
    },
  },
  en: {
    overview: "Overview",
    filters: "Filters",
    search: "Search",
    searchPlaceholder: "Find a character",
    filterSearchPlaceholder: "Name or alias",
    nodeTiers: "Node Tiers",
    visibleLayers: "Visible Layers",
    pairEdges: "Pair edges",
    directedEdges: "Directed edges",
    pairTypes: "Pair Types",
    directedBases: "Directed Bases",
    directedStances: "Directed Stances",
    minimumStrength: "Minimum Strength",
    threshold: "Threshold",
    characters: "characters",
    emptyPairTypes: "No pair types",
    emptyDirectedBases: "No directed bases",
    emptyDirectedStances: "No directed stances",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
    uploadAvatar: "Upload avatar",
    removeAvatar: "Remove avatar",
    isolateWorkbench: "Isolates",
    isolateCount: "isolates",
    hideNode: "Hide",
    hideAllIsolates: "Hide all",
    restoreHidden: "Restore hidden",
    hiddenSummary: "Hidden",
    tiers: {
      core: "Core",
      active: "Active",
      background: "Background",
      transient: "Transient",
    },
  },
} satisfies Record<LeftPanelLanguage, {
  overview: string;
  filters: string;
  search: string;
  searchPlaceholder: string;
  filterSearchPlaceholder: string;
  nodeTiers: string;
  visibleLayers: string;
  pairEdges: string;
  directedEdges: string;
  pairTypes: string;
  directedBases: string;
  directedStances: string;
  minimumStrength: string;
  threshold: string;
  characters: string;
  emptyPairTypes: string;
  emptyDirectedBases: string;
  emptyDirectedStances: string;
  collapseSidebar: string;
  expandSidebar: string;
  uploadAvatar: string;
  removeAvatar: string;
  isolateWorkbench: string;
  isolateCount: string;
  hideNode: string;
  hideAllIsolates: string;
  restoreHidden: string;
  hiddenSummary: string;
  tiers: Record<ViewerTier, string>;
}>;

type LeftPanelProps = {
  language: LeftPanelLanguage;
  editMode: boolean;
  nodes: ViewerNode[];
  isolatedNodes: ViewerNode[];
  hiddenCounts: {
    nodes: number;
    pairEdges: number;
    directedEdges: number;
  };
  selectedNodeId: string | null;
  avatarByNodeId: Record<string, string>;
  filters: ViewerFilters;
  pairTypes: string[];
  directedStances: string[];
  directedStructuralBases: string[];
  pairTypeLabels: Map<string, string>;
  directedStanceLabels: Map<string, string>;
  directedStructuralBaseLabels: Map<string, string>;
  onNodeSelect: (nodeId: string) => void;
  onNodeAvatarChange: (nodeId: string, dataUrl: string) => Promise<void>;
  onNodeAvatarRemove: (nodeId: string) => Promise<void>;
  onHideNode: (nodeId: string) => void;
  onHideAllIsolates: () => void;
  onRestoreHidden: () => void;
  onSearchChange: (value: string) => void;
  onToggleTier: (tier: ViewerTier) => void;
  onTogglePairType: (value: string) => void;
  onToggleDirectedStance: (value: string) => void;
  onToggleDirectedStructuralBase: (value: string) => void;
  onMinDirectedStrengthChange: (value: number) => void;
  onShowPairEdgesChange: (value: boolean) => void;
  onShowDirectedEdgesChange: (value: boolean) => void;
};

export function LeftPanel(props: LeftPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "filters">("overview");
  const {
    editMode,
    nodes,
    isolatedNodes,
    hiddenCounts,
    selectedNodeId,
    avatarByNodeId,
    language,
    filters,
    pairTypes,
    directedStances,
    directedStructuralBases,
    pairTypeLabels,
    directedStanceLabels,
    directedStructuralBaseLabels,
    onNodeSelect,
    onNodeAvatarChange,
    onNodeAvatarRemove,
    onHideNode,
    onHideAllIsolates,
    onRestoreHidden,
    onSearchChange,
    onToggleTier,
    onTogglePairType,
    onToggleDirectedStance,
    onToggleDirectedStructuralBase,
    onMinDirectedStrengthChange,
    onShowPairEdgesChange,
    onShowDirectedEdgesChange,
  } = props;
  const labels = LEFT_PANEL_COPY[language];

  const handlePanelWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.scrollTop += event.deltaY;
  };

  const handleCollapsedChange = (nextCollapsed: boolean) => {
    setIsAnimating(true);
    setIsCollapsed(nextCollapsed);
  };

  useEffect(() => {
    if (!isAnimating) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsAnimating(false), 230);
    return () => window.clearTimeout(timeoutId);
  }, [isAnimating, isCollapsed]);

  return (
    <div
      className={`left-panel-root${isCollapsed ? " is-collapsed" : ""}${
        isAnimating ? " is-animating" : ""
      }`}
    >
      <aside className="panel-shell left-panel left-panel--collapsed">
          <button
            type="button"
            onClick={() => handleCollapsedChange(false)}
            className="left-panel__collapsed-toggle"
            aria-label={labels.expandSidebar}
          >
            <ChevronLeft className="rotate-180" size={18} />
          </button>
        </aside>
        <aside className="panel-shell left-panel">
        <div className="left-panel__tabs-row">
          <div className="left-panel__tabs">
            <TabButton
              active={activeTab === "overview"}
              icon={<List size={14} />}
              label={labels.overview}
              onClick={() => setActiveTab("overview")}
            />
            <TabButton
              active={activeTab === "filters"}
              icon={<SlidersHorizontal size={14} />}
              label={labels.filters}
              onClick={() => setActiveTab("filters")}
            />
          </div>
          <button
            type="button"
            onClick={() => handleCollapsedChange(true)}
            className="left-panel__tab-collapse"
            aria-label={labels.collapseSidebar}
          >
            <ChevronLeft size={16} />
          </button>
        </div>

            <div
              className="custom-scrollbar left-panel__body flex-1 overflow-y-auto"
              onWheelCapture={handlePanelWheel}
            >
          {activeTab === "overview" ? (
            <CharacterOverviewSection
              nodes={nodes}
              editMode={editMode}
              isolatedNodes={isolatedNodes}
              hiddenCounts={hiddenCounts}
              selectedNodeId={selectedNodeId}
              avatarByNodeId={avatarByNodeId}
              onNodeSelect={onNodeSelect}
              onNodeAvatarChange={onNodeAvatarChange}
              onNodeAvatarRemove={onNodeAvatarRemove}
              onHideNode={onHideNode}
              onHideAllIsolates={onHideAllIsolates}
              onRestoreHidden={onRestoreHidden}
              labels={labels}
            />
          ) : (
            <div className="left-panel__stack">
              <Section title={labels.search} icon={<Search size={14} />}>
                <div className="left-panel__search-shell">
                  <Search
                    className="left-panel__search-icon"
                    size={15}
                  />
                  <input
                    type="text"
                    className="left-panel__search-input"
                    placeholder={labels.filterSearchPlaceholder}
                    value={filters.search}
                    onChange={(e) => onSearchChange(e.target.value)}
                  />
                  {filters.search ? (
                    <button
                      onClick={() => onSearchChange("")}
                      className="left-panel__search-clear"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
              </Section>

              <Section title={labels.nodeTiers} icon={<LayoutGrid size={14} />}>
                <div className="left-panel__chip-grid left-panel__chip-grid--two">
                  {TIERS.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => onToggleTier(tier)}
                      className={`left-panel__chip capitalize ${
                        filters.tiers.includes(tier)
                          ? "is-active border-sky-400/30 bg-sky-400/12 text-sky-100"
                          : "border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {labels.tiers[tier]}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title={labels.visibleLayers} icon={<Eye size={14} />}>
                <div className="left-panel__stack left-panel__stack--tight">
                  <Toggle
                    label={labels.pairEdges}
                    checked={filters.showPairEdges}
                    onChange={onShowPairEdgesChange}
                    icon={<Link size={14} />}
                  />
                  <Toggle
                    label={labels.directedEdges}
                    checked={filters.showDirectedEdges}
                    onChange={onShowDirectedEdgesChange}
                    icon={<Link2 size={14} />}
                  />
                </div>
              </Section>

              <Section title={labels.pairTypes} icon={<Link size={14} />}>
                <ChipGrid
                  values={pairTypes}
                  labelMap={pairTypeLabels}
                  selected={filters.pairTypes}
                  onToggle={onTogglePairType}
                  emptyLabel={labels.emptyPairTypes}
                />
              </Section>

              <Section title={labels.directedBases} icon={<SlidersHorizontal size={14} />}>
                <ChipGrid
                  values={directedStructuralBases}
                  labelMap={directedStructuralBaseLabels}
                  selected={filters.directedStructuralBases}
                  onToggle={onToggleDirectedStructuralBase}
                  emptyLabel={labels.emptyDirectedBases}
                />
              </Section>

              <Section title={labels.directedStances} icon={<Link2 size={14} />}>
                <ChipGrid
                  values={directedStances}
                  labelMap={directedStanceLabels}
                  selected={filters.directedStances}
                  onToggle={onToggleDirectedStance}
                  emptyLabel={labels.emptyDirectedStances}
                />
              </Section>

              <Section title={labels.minimumStrength} icon={<Activity size={14} />}>
                <div className="left-panel__stack left-panel__stack--tight">
                  <div className="left-panel__range-meta">
                    <span>{labels.threshold}</span>
                    <span className="left-panel__range-value">
                      {filters.minDirectedStrength}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    className="left-panel__range-input"
                    value={filters.minDirectedStrength}
                    onChange={(e) => onMinDirectedStrengthChange(Number(e.target.value))}
                  />
                </div>
              </Section>
            </div>
          )}
        </div>
        </aside>
    </div>
  );
}

function TabButton(props: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  const { active, icon, label, onClick } = props;

  return (
    <button
      onClick={onClick}
      className={`left-panel__tab${active ? " is-active" : ""}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function languageAwareCount(count: number, label: string): string {
  return label.startsWith("个") ? `${count}${label}` : `${count} ${label}`;
}

function CharacterOverviewSection(props: {
  nodes: ViewerNode[];
  editMode: boolean;
  isolatedNodes: ViewerNode[];
  hiddenCounts: {
    nodes: number;
    pairEdges: number;
    directedEdges: number;
  };
  selectedNodeId: string | null;
  avatarByNodeId: Record<string, string>;
  labels: (typeof LEFT_PANEL_COPY)[LeftPanelLanguage];
  onNodeSelect: (nodeId: string) => void;
  onNodeAvatarChange: (nodeId: string, dataUrl: string) => Promise<void>;
  onNodeAvatarRemove: (nodeId: string) => Promise<void>;
  onHideNode: (nodeId: string) => void;
  onHideAllIsolates: () => void;
  onRestoreHidden: () => void;
}) {
  const {
    nodes,
    editMode,
    isolatedNodes,
    hiddenCounts,
    selectedNodeId,
    avatarByNodeId,
    labels,
    onNodeSelect,
    onNodeAvatarChange,
    onNodeAvatarRemove,
    onHideNode,
    onHideAllIsolates,
    onRestoreHidden,
  } = props;
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const sortedNodes = [...nodes]
    .filter((node) => {
      if (!normalizedQuery) {
        return true;
      }

      return [node.name, ...node.aliases]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((left, right) => {
      if (right.importance !== left.importance) {
        return right.importance - left.importance;
      }
      return (
        right.appearance_count - left.appearance_count ||
        left.name.localeCompare(right.name)
      );
    });

  return (
    <div className="left-panel__stack">
      {editMode ? (
        <section className="left-panel__section">
          <div className="left-panel__section-heading">
            <span className="text-sky-300/80">
              <Eye size={14} />
            </span>
            <span>{labels.isolateWorkbench}</span>
          </div>
          <div className="left-panel__stack left-panel__stack--tight">
            <div className="left-panel__meta">
              {languageAwareCount(isolatedNodes.length, labels.isolateCount)}
            </div>

            <div className="left-panel__chip-grid">
              <button
                onClick={onHideAllIsolates}
                className="left-panel__chip border-white/8 bg-white/[0.03] text-slate-300 hover:text-slate-100"
              >
                {labels.hideAllIsolates}
              </button>
              <button
                onClick={onRestoreHidden}
                className="left-panel__chip border-white/8 bg-white/[0.03] text-slate-300 hover:text-slate-100"
              >
                {labels.restoreHidden}
              </button>
            </div>

            <div className="left-panel__empty">
              {labels.hiddenSummary}: {hiddenCounts.nodes} / {hiddenCounts.pairEdges} / {hiddenCounts.directedEdges}
            </div>

            {isolatedNodes.length > 0 ? (
              <div className="left-panel__list">
                {isolatedNodes.map((isolatedNode) => (
                  <CharacterOverviewItem
                    key={`isolate-${isolatedNode.id}`}
                    node={isolatedNode}
                    selected={selectedNodeId === isolatedNode.id}
                    avatarDataUrl={avatarByNodeId[isolatedNode.id] ?? null}
                    onSelect={() => onNodeSelect(isolatedNode.id)}
                    onAvatarChange={(dataUrl) => onNodeAvatarChange(isolatedNode.id, dataUrl)}
                    onAvatarRemove={() => onNodeAvatarRemove(isolatedNode.id)}
                    labels={labels}
                    rightSlot={
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onHideNode(isolatedNode.id);
                        }}
                        className="left-panel__icon-button rounded-xl border border-white/8 bg-white/[0.03] p-2 text-slate-300 hover:text-red-300"
                        aria-label={labels.hideNode}
                      >
                        <Trash2 size={14} />
                      </button>
                    }
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="left-panel__search-shell">
        <Search
          className="left-panel__search-icon"
          size={15}
        />
        <input
          type="text"
          className="left-panel__search-input"
          placeholder={labels.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query ? (
          <button
            onClick={() => setQuery("")}
            className="left-panel__search-clear"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      <div className="left-panel__meta">
        {languageAwareCount(sortedNodes.length, labels.characters)}
      </div>

      <div className="left-panel__list">
        {sortedNodes.map((node) => (
          <CharacterOverviewItem
            key={node.id}
            node={node}
            selected={selectedNodeId === node.id}
            avatarDataUrl={avatarByNodeId[node.id] ?? null}
            onSelect={() => onNodeSelect(node.id)}
            onAvatarChange={(dataUrl) => onNodeAvatarChange(node.id, dataUrl)}
            onAvatarRemove={() => onNodeAvatarRemove(node.id)}
            labels={labels}
          />
        ))}
      </div>
    </div>
  );
}

function CharacterOverviewItem(props: {
  node: ViewerNode;
  selected: boolean;
  avatarDataUrl: string | null;
  labels: (typeof LEFT_PANEL_COPY)[LeftPanelLanguage];
  onSelect: () => void;
  onAvatarChange: (dataUrl: string) => Promise<void>;
  onAvatarRemove: () => Promise<void>;
  rightSlot?: ReactNode;
}) {
  const {
    node,
    selected,
    avatarDataUrl,
    labels,
    onSelect,
    onAvatarChange,
    onAvatarRemove,
    rightSlot,
  } = props;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const handleAvatarInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await imageFileToAvatarDataUrl(file);
      await onAvatarChange(dataUrl);
    } catch (error) {
      console.error(error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setBusy(false);
    }
  };

  const handleAvatarRemove = async (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setBusy(true);
    try {
      await onAvatarRemove();
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`left-panel__character w-full rounded-2xl border text-left transition-colors ${
        selected
          ? "is-selected border-sky-400/30 bg-sky-400/10"
          : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <div className="relative shrink-0">
        <div
          className={`left-panel__avatar flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border text-slate-100 ${
            avatarDataUrl
              ? "has-image border-white/20"
              : "border-sky-400/20 bg-slate-900/80"
          }`}
          aria-hidden="true"
        >
          {avatarDataUrl ? (
            <img
              src={avatarDataUrl}
              alt=""
              className="left-panel__avatar-image"
              draggable={false}
            />
          ) : (
            <Camera size={18} />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleAvatarInput}
        />
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="left-panel__character-trigger"
      >
        <div className="left-panel__character-name">{node.name}</div>
        <div className="left-panel__character-meta">
          <span>{labels.tiers[node.tier]}</span>
          <span>·</span>
          <span>{node.importance}</span>
          <span>·</span>
          <span>{node.appearance_count}</span>
        </div>
      </button>

      <div className="left-panel__actions">
        {rightSlot ?? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={busy}
              className="left-panel__icon-button rounded-xl border border-white/8 bg-white/[0.03] p-2 text-slate-300 hover:text-white"
              aria-label={labels.uploadAvatar}
            >
              <ImagePlus size={14} />
            </button>
            {avatarDataUrl ? (
              <button
                type="button"
                onClick={handleAvatarRemove}
                disabled={busy}
                className="left-panel__icon-button rounded-xl border border-white/8 bg-white/[0.03] p-2 text-slate-300 hover:text-red-300"
                aria-label={labels.removeAvatar}
              >
                <Trash2 size={14} />
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function Section(props: { title: string; icon: ReactNode; children: ReactNode }) {
  const { title, icon, children } = props;

  return (
    <section className="left-panel__section">
      <div className="left-panel__section-heading">
        <span className="text-sky-300/80">{icon}</span>
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

function Toggle(props: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: ReactNode;
}) {
  const { label, checked, onChange, icon } = props;

  return (
    <button
      onClick={() => onChange(!checked)}
      className={`left-panel__toggle flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-colors ${
        checked
          ? "border-sky-400/25 bg-sky-400/10 text-slate-100"
          : "border-white/8 bg-white/[0.03] text-slate-400"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className="text-sky-200">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </span>
      <span
        className={`h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-sky-300" : "bg-white/10"
        }`}
      >
        <span
          className={`mt-1 block h-3 w-3 rounded-full bg-slate-950 transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

function ChipGrid(props: {
  values: string[];
  labelMap?: Map<string, string>;
  selected: string[];
  onToggle: (value: string) => void;
  emptyLabel: string;
}) {
  const { values, labelMap, selected, onToggle, emptyLabel } = props;

  if (values.length === 0) {
    return <div className="left-panel__empty">{emptyLabel}</div>;
  }

  return (
    <div className="left-panel__chip-grid">
      {values.map((value) => (
        <button
          key={value}
          onClick={() => onToggle(value)}
          className={`left-panel__chip ${
            selected.includes(value)
              ? "is-active border-sky-400/30 bg-sky-400/12 text-sky-100"
              : "border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200"
          }`}
        >
          {labelMap?.get(value) ?? value}
        </button>
      ))}
    </div>
  );
}
