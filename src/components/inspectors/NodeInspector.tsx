import {
  Activity,
  BookOpen,
  CalendarDays,
  Fingerprint,
  Gauge,
  Sparkles,
  Tags,
  UserRound,
} from "lucide-react";
import type { ViewerNode } from "../../types/viewerGraph";

type NodeInspectorProps = {
  node: ViewerNode;
};

const TIER_LABELS: Record<ViewerNode["tier"], string> = {
  core: "核心人物",
  active: "活跃人物",
  background: "背景人物",
  transient: "临时人物",
};

const TIER_CLASS: Record<ViewerNode["tier"], string> = {
  core: "is-core",
  active: "is-active",
  background: "is-background",
  transient: "is-transient",
};

function formatScore(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

export function NodeInspector({ node }: NodeInspectorProps) {
  const centrality = Math.max(0, Math.min(1, node.importance / 100));

  return (
    <div className="character-detail">
      <header className="character-detail__hero">
        <div className={`character-avatar ${TIER_CLASS[node.tier]}`}>
          <UserRound size={44} />
        </div>
        <div className="character-detail__identity">
          <div className="character-detail__tier">{TIER_LABELS[node.tier]}</div>
          <h1>{node.name}</h1>
          <div className="character-detail__id">
            <Fingerprint size={13} />
            <span>{node.id}</span>
          </div>
        </div>
      </header>

      {node.aliases.length > 0 ? (
        <section className="character-section">
          <div className="character-section__title">
            <Tags size={15} />
            <span>别名</span>
          </div>
          <div className="character-aliases">
            {node.aliases.map((alias) => (
              <span key={alias}>{alias}</span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="character-score-grid">
        <ScoreCard
          icon={<Gauge size={18} />}
          label="重要度"
          value={formatScore(node.importance)}
          helper="engine 综合评分"
        />
        <ScoreCard
          icon={<Activity size={18} />}
          label="中心值"
          value={centrality.toFixed(2)}
          helper="当前按重要度归一化"
        />
        <ScoreCard
          icon={<Sparkles size={18} />}
          label="出场次数"
          value={String(node.appearance_count)}
          helper="appearance_count"
        />
      </section>

      <section className="character-section">
        <div className="character-section__title">
          <BookOpen size={15} />
          <span>评价摘要</span>
        </div>
        <div className="character-summary">
          {node.summary || "暂无人物摘要。"}
        </div>
      </section>

      <section className="character-section">
        <div className="character-section__title">
          <CalendarDays size={15} />
          <span>章节范围</span>
        </div>
        <div className="character-timeline">
          <TimelineItem label="首次出现" value={node.first_seen_chapter_id ?? "未知"} />
          <TimelineItem label="最后出现" value={node.last_seen_chapter_id ?? "未知"} />
        </div>
      </section>
    </div>
  );
}

function ScoreCard(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  const { icon, label, value, helper } = props;

  return (
    <div className="character-score">
      <div className="character-score__icon">{icon}</div>
      <div>
        <div className="character-score__label">{label}</div>
        <div className="character-score__value">{value}</div>
        <div className="character-score__helper">{helper}</div>
      </div>
    </div>
  );
}

function TimelineItem(props: { label: string; value: string }) {
  const { label, value } = props;

  return (
    <div className="character-timeline__item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
