import {
  Activity,
  ChevronLeft,
  Eye,
  Filter,
  LayoutGrid,
  Link,
  Link2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import type { ViewerChapter, ViewerFilters, ViewerTier } from "../../types/viewerGraph";

const TIERS: ViewerTier[] = ["core", "active", "background", "transient"];

type LeftPanelProps = {
  filters: ViewerFilters;
  chapters: ViewerChapter[];
  pairTypes: string[];
  directedStances: string[];
  directedStructuralBases: string[];
  onSearchChange: (value: string) => void;
  onToggleTier: (tier: ViewerTier) => void;
  onChapterRangeChange: (startId: string | null, endId: string | null) => void;
  onTogglePairType: (value: string) => void;
  onToggleDirectedStance: (value: string) => void;
  onToggleDirectedStructuralBase: (value: string) => void;
  onMinDirectedStrengthChange: (value: number) => void;
  onShowPairEdgesChange: (value: boolean) => void;
  onShowDirectedEdgesChange: (value: boolean) => void;
};

export function LeftPanel(props: LeftPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    filters,
    chapters,
    pairTypes,
    directedStances,
    directedStructuralBases,
    onSearchChange,
    onToggleTier,
    onChapterRangeChange,
    onTogglePairType,
    onToggleDirectedStance,
    onToggleDirectedStructuralBase,
    onMinDirectedStrengthChange,
    onShowPairEdgesChange,
    onShowDirectedEdgesChange,
  } = props;

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 top-20 z-40 flex lg:bottom-5 lg:left-5 lg:top-20">
      <motion.aside
        animate={{
          width: isCollapsed ? 0 : 320,
          opacity: isCollapsed ? 0 : 1,
          x: isCollapsed ? -16 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="panel-shell hidden overflow-hidden lg:flex"
      >
        <div className="panel-header">
          <div>
            <div className="panel-kicker">Controls</div>
            <h2 className="panel-title">Filters</h2>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-7 overflow-y-auto px-5 py-5">
          <Section title="Search" icon={<Search size={14} />}>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={15}
              />
              <input
                type="text"
                className="w-full rounded-2xl border border-white/8 bg-slate-950/70 px-10 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-400/30"
                placeholder="Name, alias, or summary"
                value={filters.search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {filters.search ? (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </Section>

          <Section title="Node Tiers" icon={<LayoutGrid size={14} />}>
            <div className="grid grid-cols-2 gap-2">
              {TIERS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => onToggleTier(tier)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    filters.tiers.includes(tier)
                      ? "border-sky-400/30 bg-sky-400/12 text-sky-100"
                      : "border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Chapter Range" icon={<Filter size={14} />}>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={filters.chapterStartId ?? ""}
                options={chapters}
                placeholder="Start"
                onChange={(value) =>
                  onChapterRangeChange(value || null, filters.chapterEndId)
                }
              />
              <Select
                value={filters.chapterEndId ?? ""}
                options={chapters}
                placeholder="End"
                onChange={(value) =>
                  onChapterRangeChange(filters.chapterStartId, value || null)
                }
              />
            </div>
          </Section>

          <Section title="Visible Layers" icon={<Eye size={14} />}>
            <div className="space-y-2">
              <Toggle
                label="Pair edges"
                checked={filters.showPairEdges}
                onChange={onShowPairEdgesChange}
                icon={<Link size={14} />}
              />
              <Toggle
                label="Directed edges"
                checked={filters.showDirectedEdges}
                onChange={onShowDirectedEdgesChange}
                icon={<Link2 size={14} />}
              />
            </div>
          </Section>

          <Section title="Pair Types" icon={<Link size={14} />}>
            <ChipGrid
              values={pairTypes}
              selected={filters.pairTypes}
              onToggle={onTogglePairType}
              emptyLabel="No pair types"
            />
          </Section>

          <Section title="Directed Bases" icon={<SlidersHorizontal size={14} />}>
            <ChipGrid
              values={directedStructuralBases}
              selected={filters.directedStructuralBases}
              onToggle={onToggleDirectedStructuralBase}
              emptyLabel="No directed bases"
            />
          </Section>

          <Section title="Directed Stances" icon={<Link2 size={14} />}>
            <ChipGrid
              values={directedStances}
              selected={filters.directedStances}
              onToggle={onToggleDirectedStance}
              emptyLabel="No directed stances"
            />
          </Section>

          <Section title="Minimum Strength" icon={<Activity size={14} />}>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Threshold</span>
                <span className="rounded-lg border border-sky-400/20 bg-sky-400/10 px-2 py-1 font-mono text-sky-100">
                  {filters.minDirectedStrength}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-sky-300"
                value={filters.minDirectedStrength}
                onChange={(e) => onMinDirectedStrengthChange(Number(e.target.value))}
              />
            </div>
          </Section>
        </div>
      </motion.aside>

      <AnimatePresence>
        {isCollapsed ? (
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            onClick={() => setIsCollapsed(false)}
            className="panel-shell flex h-12 w-12 items-center justify-center text-slate-300 hover:text-white lg:flex"
          >
            <SlidersHorizontal size={18} />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Section(props: { title: string; icon: ReactNode; children: ReactNode }) {
  const { title, icon, children } = props;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
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
      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-colors ${
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

function Select(props: {
  value: string;
  options: ViewerChapter[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const { value, options, placeholder, onChange } = props;

  return (
    <select
      className="w-full rounded-2xl border border-white/8 bg-slate-950/70 px-3 py-3 text-sm text-slate-200 outline-none focus:border-sky-400/30"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.title}
        </option>
      ))}
    </select>
  );
}

function ChipGrid(props: {
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  emptyLabel: string;
}) {
  const { values, selected, onToggle, emptyLabel } = props;

  if (values.length === 0) {
    return <div className="text-sm text-slate-500">{emptyLabel}</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <button
          key={value}
          onClick={() => onToggle(value)}
          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
            selected.includes(value)
              ? "border-sky-400/30 bg-sky-400/12 text-sky-100"
              : "border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200"
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
