import type { ReactNode } from "react";
import {
  Activity,
  FileText,
  Link2,
  MessageCircle,
  MoveRight,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import type { ViewerDirectedEdge } from "../../types/viewerGraph";
import type { ViewerDirectedEdgeEdit } from "../../types/viewerEdits";

type DirectedRelationInspectorProps = {
  relation: ViewerDirectedEdge;
  language: "zh" | "en";
  sourceLabel: string;
  targetLabel: string;
  editMode?: boolean;
  editDraft?: ViewerDirectedEdgeEdit;
  onEditChange?: (patch: Partial<ViewerDirectedEdgeEdit>) => void;
  onHideRelation?: () => void;
};

const COPY = {
  zh: {
    kind: "单向关系",
    unnamed: "未命名关系",
    strength: "关系强度",
    summaryTitle: "关系说明",
    emptySummary: "暂无关系摘要。",
    source: "起点人物",
    target: "终点人物",
    structural: "关系依据",
    stance: "关系倾向",
    mentions: "提及次数",
    editTitle: "编辑关系",
    relationName: "显示关系",
    relationSummary: "关系说明",
    relationStrength: "关系强度",
    hideRelation: "隐藏这条关系",
  },
  en: {
    kind: "Directed Relation",
    unnamed: "Unnamed relation",
    strength: "Strength",
    summaryTitle: "Relation Notes",
    emptySummary: "No relation summary available.",
    source: "Source",
    target: "Target",
    structural: "Structural Base",
    stance: "Stance",
    mentions: "Mentions",
    editTitle: "Edit Relation",
    relationName: "Display Relation",
    relationSummary: "Relation Notes",
    relationStrength: "Strength",
    hideRelation: "Hide Relation",
  },
} as const;

export function DirectedRelationInspector({
  relation,
  language,
  sourceLabel,
  targetLabel,
  editMode = false,
  editDraft,
  onEditChange,
  onHideRelation,
}: DirectedRelationInspectorProps) {
  const copy = COPY[language];

  return (
    <div className="relation-detail">
      <header className="relation-detail__hero">
        <div className="relation-detail__icon relation-detail__icon--directed">
          <Link2 size={22} />
        </div>
        <div className="relation-detail__headline">
          <div className="relation-detail__eyebrow">{copy.kind}</div>
          <h3>{relation.display_relation || copy.unnamed}</h3>
          <div className="relation-detail__chips">
            <span>{relation.structural_label || relation.structural_base}</span>
            <span>{relation.stance_label || relation.stance}</span>
          </div>
        </div>
      </header>

      {editMode ? (
        <section className="relation-section">
          <div className="relation-section__title">
            <Sparkles size={15} />
            <span>{copy.editTitle}</span>
          </div>
          <div className="inspector-edit-grid">
            <label className="inspector-edit-field">
              <span>{copy.relationName}</span>
              <input
                value={editDraft?.display_relation ?? relation.display_relation}
                onChange={(event) =>
                  onEditChange?.({ display_relation: event.target.value })
                }
              />
            </label>
            <label className="inspector-edit-field">
              <span>{copy.relationStrength}</span>
              <input
                type="number"
                min={0}
                max={100}
                value={editDraft?.strength ?? relation.strength}
                onChange={(event) =>
                  onEditChange?.({
                    strength: Number.isFinite(Number(event.target.value))
                      ? Number(event.target.value)
                      : 0,
                  })
                }
              />
            </label>
            <label className="inspector-edit-field inspector-edit-field--area">
              <span>{copy.relationSummary}</span>
              <textarea
                value={editDraft?.summary ?? relation.summary}
                onChange={(event) => onEditChange?.({ summary: event.target.value })}
              />
            </label>
            <button type="button" className="inspector-edit-danger" onClick={onHideRelation}>
              <Trash2 size={14} />
              <span>{copy.hideRelation}</span>
            </button>
          </div>
        </section>
      ) : null}

      <section className="relation-section relation-section--accent">
        <div className="relation-section__title">
          <Activity size={15} />
          <span>{copy.strength}</span>
          <strong>{relation.strength}</strong>
        </div>
        <div className="relation-strength">
          <div style={{ width: `${Math.min(100, Math.max(0, relation.strength))}%` }} />
        </div>
      </section>

      <section className="relation-meta-grid relation-meta-grid--balanced">
        <MetaItem icon={<UserRound size={14} />} label={copy.source} value={sourceLabel} />
        <MetaItem icon={<MoveRight size={14} />} label={copy.target} value={targetLabel} />
        <MetaItem
          icon={<Link2 size={14} />}
          label={copy.structural}
          value={relation.structural_label || relation.structural_base}
        />
        <MetaItem
          icon={<Sparkles size={14} />}
          label={copy.stance}
          value={relation.stance_label || relation.stance}
        />
        <MetaItem
          icon={<MessageCircle size={14} />}
          label={copy.mentions}
          value={String(relation.mention_count ?? 0)}
        />
      </section>

      <section className="relation-section">
        <div className="relation-section__title">
          <FileText size={15} />
          <span>{copy.summaryTitle}</span>
        </div>
        <p className="relation-detail__summary">
          {relation.summary || copy.emptySummary}
        </p>
      </section>
    </div>
  );
}

function MetaItem(props: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  const { icon, label, value } = props;

  return (
    <div className="relation-meta-card">
      <div className="relation-meta-card__label">
        {icon}
        <span>{label}</span>
      </div>
      <div className="relation-meta-card__value">{value}</div>
    </div>
  );
}
