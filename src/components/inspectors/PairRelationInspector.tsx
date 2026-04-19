import { BookOpen, Calendar, Hash, Link, Radar } from "lucide-react";
import type { ViewerPairEdge } from "../../types/viewerGraph";

type PairRelationInspectorProps = {
  relation: ViewerPairEdge;
};

export function PairRelationInspector({
  relation,
}: PairRelationInspectorProps) {
  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
            <Link size={24} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Pair Edge</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Undirected Relation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border/50 bg-secondary px-3 py-1 text-[10px] font-bold uppercase">
            {relation.type}
          </span>
          <span className="text-sm font-semibold text-foreground/80">
            {relation.label}
          </span>
        </div>
      </header>

      <section className="space-y-2 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-5">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-500">
          <BookOpen size={14} />
          <span>Summary</span>
        </div>
        <p className="text-sm leading-relaxed text-foreground/80">
          {relation.summary || "No pair-edge summary available."}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <MetaItem icon={<Hash size={14} />} label="ID" value={relation.id} />
        <MetaItem
          icon={<Calendar size={14} />}
          label="First Seen"
          value={relation.first_seen_chapter_id ?? "Unknown"}
        />
        <MetaItem
          icon={<Radar size={14} />}
          label="Co-events"
          value={String(relation.co_event_count ?? 0)}
        />
        <MetaItem
          icon={<Calendar size={14} />}
          label="Last Seen"
          value={relation.last_seen_chapter_id ?? "Unknown"}
        />
        <MetaItem
          icon={<BookOpen size={14} />}
          label="Co-appearances"
          value={String(relation.co_appearance_count ?? 0)}
        />
        <MetaItem
          icon={<Radar size={14} />}
          label="Confidence"
          value={
            relation.confidence === undefined
              ? "Unknown"
              : relation.confidence.toFixed(2)
          }
        />
      </section>
    </div>
  );
}

function MetaItem(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const { icon, label, value } = props;

  return (
    <div className="space-y-1 rounded-xl border border-border/50 bg-secondary/50 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-tight">
          {label}
        </span>
      </div>
      <p className="truncate text-xs font-bold">{value}</p>
    </div>
  );
}
