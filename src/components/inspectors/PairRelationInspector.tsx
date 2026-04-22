import type { ReactNode } from "react";
import {
  BookOpen,
  Link,
  Radar,
  Sparkles,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import type { ViewerPairEdge } from "../../types/viewerGraph";
import type { ViewerPairEdgeEdit } from "../../types/viewerEdits";

type PairRelationInspectorProps = {
  relation: ViewerPairEdge;
  language: "zh" | "en";
  sourceLabel: string;
  targetLabel: string;
  editMode?: boolean;
  editDraft?: ViewerPairEdgeEdit;
  onEditChange?: (patch: Partial<ViewerPairEdgeEdit>) => void;
  onHideRelation?: () => void;
};

const COPY = {
  zh: {
    kind: "对等关系",
    unnamed: "未命名关系",
    confidence: "置信度",
    summaryTitle: "关系摘要",
    emptySummary: "暂无关系摘要。",
    leftPerson: "人物 A",
    rightPerson: "人物 B",
    relationType: "关系类型",
    coEvents: "共同事件",
    coAppearances: "共同出场",
    intensity: "强度评分",
    unknown: "未知",
    editTitle: "编辑关系",
    relationName: "关系名称",
    relationSummary: "关系摘要",
    hideRelation: "隐藏这条关系",
  },
  en: {
    kind: "Pair Relation",
    unnamed: "Unnamed relation",
    confidence: "Confidence",
    summaryTitle: "Summary",
    emptySummary: "No relation summary available.",
    leftPerson: "Character A",
    rightPerson: "Character B",
    relationType: "Type",
    coEvents: "Co-events",
    coAppearances: "Co-appearances",
    intensity: "Intensity",
    unknown: "Unknown",
    editTitle: "Edit Relation",
    relationName: "Relation Name",
    relationSummary: "Summary",
    hideRelation: "Hide Relation",
  },
} as const;

export function PairRelationInspector({
  relation,
  language,
  sourceLabel,
  targetLabel,
  editMode = false,
  editDraft,
  onEditChange,
  onHideRelation,
}: PairRelationInspectorProps) {
  const copy = COPY[language];

  return (
    <div className="relation-detail">
      <header className="relation-detail__hero">
        <div className="relation-detail__icon relation-detail__icon--pair">
          <Link size={22} />
        </div>
        <div className="relation-detail__headline">
          <div className="relation-detail__eyebrow">{copy.kind}</div>
          <h3>{relation.label || relation.type || copy.unnamed}</h3>
          <div className="relation-detail__chips">
            <span>{relation.type}</span>
            {relation.confidence !== undefined ? (
              <span>
                {copy.confidence} {relation.confidence.toFixed(2)}
              </span>
            ) : null}
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
                value={editDraft?.label ?? relation.label}
                onChange={(event) => onEditChange?.({ label: event.target.value })}
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

      <section className="relation-meta-grid relation-meta-grid--balanced">
        <MetaItem icon={<UserRound size={14} />} label={copy.leftPerson} value={sourceLabel} />
        <MetaItem icon={<Users size={14} />} label={copy.rightPerson} value={targetLabel} />
        <MetaItem icon={<Link size={14} />} label={copy.relationType} value={relation.type} />
        <MetaItem
          icon={<Radar size={14} />}
          label={copy.coEvents}
          value={String(relation.co_event_count ?? 0)}
        />
        <MetaItem
          icon={<BookOpen size={14} />}
          label={copy.coAppearances}
          value={String(relation.co_appearance_count ?? 0)}
        />
        <MetaItem
          icon={<Sparkles size={14} />}
          label={copy.intensity}
          value={
            relation.shared_intensity_score === undefined
              ? copy.unknown
              : relation.shared_intensity_score.toFixed(1)
          }
        />
      </section>

      <section className="relation-section">
        <div className="relation-section__title">
          <BookOpen size={15} />
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
