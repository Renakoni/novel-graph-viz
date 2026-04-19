import {
  Activity,
  Calendar,
  FileText,
  Hash,
  Link2,
  Shield,
  Sparkles,
} from "lucide-react";
import type { ViewerDirectedEdge } from "../../types/viewerGraph";

type DirectedRelationInspectorProps = {
  relation: ViewerDirectedEdge;
};

export function DirectedRelationInspector({
  relation,
}: DirectedRelationInspectorProps) {
  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
            <Link2 size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Directed Edge</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Directed Relation
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            icon={<Shield size={10} />}
            label={relation.structural_label}
            color="border-orange-500/20 bg-orange-500/10 text-orange-500"
          />
          <Badge
            icon={<Sparkles size={10} />}
            label={relation.stance_label}
            color="border-pink-500/20 bg-pink-500/10 text-pink-500"
          />
        </div>
      </header>

      <section className="space-y-3 rounded-2xl border border-primary/10 bg-primary/5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
            <Activity size={14} />
            <span>Strength</span>
          </div>
          <span className="font-mono text-xs font-bold">{relation.strength}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, relation.strength)}%` }}
          />
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-border/50 bg-secondary/30 p-5">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <FileText size={14} />
          <span>Display Relation</span>
        </div>
        <p className="text-sm font-bold text-foreground/90">
          {relation.display_relation}
        </p>
        <p className="text-sm leading-relaxed text-foreground/70">
          {relation.summary || "No directed-edge summary available."}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <MetaCard icon={<Hash size={14} />} label="ID" value={relation.id} />
        <MetaCard
          icon={<Calendar size={14} />}
          label="First Seen"
          value={relation.first_seen_chapter_id ?? "Unknown"}
        />
        <MetaCard
          icon={<Calendar size={14} />}
          label="Last Seen"
          value={relation.last_seen_chapter_id ?? "Unknown"}
        />
        <MetaCard
          icon={<Activity size={14} />}
          label="Mentions"
          value={String(relation.mention_count ?? 0)}
        />
      </section>
    </div>
  );
}

function Badge(props: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  const { icon, label, color } = props;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${color}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

function MetaCard(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const { icon, label, value } = props;

  return (
    <div className="space-y-1 rounded-xl border border-border/50 bg-secondary/50 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold uppercase">{label}</span>
      </div>
      <p className="truncate text-xs font-bold">{value}</p>
    </div>
  );
}
