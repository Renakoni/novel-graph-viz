import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Activity,
  BookOpen,
  CalendarDays,
  Camera,
  Fingerprint,
  Gauge,
  ImagePlus,
  Link2,
  Sparkles,
  Tags,
  Trash2,
} from "lucide-react";
import { imageFileToAvatarDataUrl } from "../../data/avatarStore";
import type { ViewerNode } from "../../types/viewerGraph";
import type {
  ViewerAddedDirectedEdge,
  ViewerAddedPairEdge,
  ViewerNodeEdit,
} from "../../types/viewerEdits";

type NodeInspectorProps = {
  node: ViewerNode;
  language: "zh" | "en";
  editMode?: boolean;
  editDraft?: ViewerNodeEdit;
  onEditChange?: (patch: Partial<ViewerNodeEdit>) => void;
  candidateNodes: ViewerNode[];
  pairTypes: string[];
  pairTypeLabels: Map<string, string>;
  directedStances: string[];
  directedStanceLabels: Map<string, string>;
  directedStructuralBases: string[];
  directedStructuralBaseLabels: Map<string, string>;
  onCreatePairRelation: (edge: ViewerAddedPairEdge) => void;
  onCreateDirectedRelation: (edge: ViewerAddedDirectedEdge) => void;
  avatarDataUrl: string | null;
  allowAvatarEditing?: boolean;
  showInternalId?: boolean;
  onAvatarChange: (nodeId: string, dataUrl: string) => Promise<void>;
  onAvatarRemove: (nodeId: string) => Promise<void>;
};

const COPY = {
  zh: {
    tiers: {
      core: "核心人物",
      active: "活跃人物",
      background: "背景人物",
      transient: "临时人物",
    },
    replaceAvatar: "更换头像",
    uploadAvatar: "上传头像",
    removeAvatar: "移除头像",
    avatarHint: "上传后会保存到本地，并同步覆盖图上的人物圆片",
    avatarReadonly: "导出展示页不支持在这里编辑头像",
    aliases: "别名",
    summary: "评价摘要",
    noSummary: "暂无人物摘要。",
    chapterRange: "章节范围",
    firstSeen: "首次出现",
    lastSeen: "最后出现",
    unknown: "未知",
    importance: "重要度",
    centrality: "中心值",
    appearances: "出场次数",
    importanceHint: "engine 综合评分",
    centralityHint: "按重要度归一化",
    appearancesHint: "appearance_count",
    editTitle: "编辑人物",
    name: "人物名称",
    aliasesInput: "别名，用逗号分隔",
    summaryInput: "修改人物摘要",
    relationEditor: "添加关系",
    relationModePair: "对等关系",
    relationModeDirected: "单向关系",
    relationTarget: "目标人物",
    relationType: "关系类型",
    relationLabel: "显示名称",
    relationSummary: "关系摘要",
    relationStructural: "关系依据",
    relationStance: "关系倾向",
    relationStrength: "关系强度",
    createRelation: "添加关系",
    noTarget: "先选择目标人物",
  },
  en: {
    tiers: {
      core: "Core",
      active: "Active",
      background: "Background",
      transient: "Transient",
    },
    replaceAvatar: "Replace avatar",
    uploadAvatar: "Upload avatar",
    removeAvatar: "Remove avatar",
    avatarHint: "Stored locally and synced to the node preview in the graph",
    avatarReadonly: "Avatar upload is disabled in standalone export view",
    aliases: "Aliases",
    summary: "Summary",
    noSummary: "No character summary available.",
    chapterRange: "Timeline",
    firstSeen: "First Seen",
    lastSeen: "Last Seen",
    unknown: "Unknown",
    importance: "Importance",
    centrality: "Centrality",
    appearances: "Appearances",
    importanceHint: "Engine score",
    centralityHint: "Normalized from importance",
    appearancesHint: "appearance_count",
    editTitle: "Edit Character",
    name: "Character Name",
    aliasesInput: "Aliases, comma separated",
    summaryInput: "Update character summary",
    relationEditor: "Add Relation",
    relationModePair: "Pair",
    relationModeDirected: "Directed",
    relationTarget: "Target Character",
    relationType: "Relation Type",
    relationLabel: "Display Name",
    relationSummary: "Summary",
    relationStructural: "Structural Base",
    relationStance: "Stance",
    relationStrength: "Strength",
    createRelation: "Create Relation",
    noTarget: "Pick a target character first",
  },
} as const;

const TIER_CLASS: Record<ViewerNode["tier"], string> = {
  core: "is-core",
  active: "is-active",
  background: "is-background",
  transient: "is-transient",
};

type RelationMode = "pair" | "directed";

function formatScore(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

function createCustomId(prefix: string, source: string, target: string) {
  const seed = `${prefix}:${source}:${target}:${Date.now()}:${Math.random()}`;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `${prefix}_${(hash >>> 0).toString(16)}`;
}

export function NodeInspector({
  node,
  language,
  editMode = false,
  editDraft,
  onEditChange,
  candidateNodes,
  pairTypes,
  pairTypeLabels,
  directedStances,
  directedStanceLabels,
  directedStructuralBases,
  directedStructuralBaseLabels,
  onCreatePairRelation,
  onCreateDirectedRelation,
  avatarDataUrl,
  allowAvatarEditing = true,
  showInternalId = true,
  onAvatarChange,
  onAvatarRemove,
}: NodeInspectorProps) {
  const copy = COPY[language];
  const pinyinCollator = useMemo(
    () => new Intl.Collator("zh-u-co-pinyin", { sensitivity: "base", numeric: true }),
    [],
  );
  const sortedCandidateNodes = useMemo(
    () =>
      [...candidateNodes].sort((left, right) => {
        const nameDiff = pinyinCollator.compare(left.name, right.name);
        if (nameDiff !== 0) {
          return nameDiff;
        }
        return left.id.localeCompare(right.id);
      }),
    [candidateNodes, pinyinCollator],
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [relationMode, setRelationMode] = useState<RelationMode>("pair");
  const [targetNodeId, setTargetNodeId] = useState("");
  const [pairType, setPairType] = useState(pairTypes[0] ?? "custom_pair");
  const [pairLabel, setPairLabel] = useState("");
  const [pairSummary, setPairSummary] = useState("");
  const [directedStructural, setDirectedStructural] = useState(
    directedStructuralBases[0] ?? "custom",
  );
  const [directedStance, setDirectedStance] = useState(
    directedStances[0] ?? "custom",
  );
  const [directedLabel, setDirectedLabel] = useState("");
  const [directedSummary, setDirectedSummary] = useState("");
  const [directedStrength, setDirectedStrength] = useState("60");
  const centrality = Math.max(0, Math.min(1, node.importance / 100));
  const aliasInput = useMemo(() => node.aliases.join(", "), [node.aliases]);

  const handleAvatarInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setAvatarBusy(true);

    try {
      const dataUrl = await imageFileToAvatarDataUrl(file);
      await onAvatarChange(node.id, dataUrl);
    } catch (error) {
      console.error(error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setAvatarBusy(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarBusy(true);

    try {
      await onAvatarRemove(node.id);
    } catch (error) {
      console.error(error);
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleCreateRelation = () => {
    if (!targetNodeId) {
      return;
    }

    if (relationMode === "pair") {
      const nextLabel = pairLabel.trim() || pairTypeLabels.get(pairType) || pairType;
      onCreatePairRelation({
        id: createCustomId("pair_custom", node.id, targetNodeId),
        source: node.id,
        target: targetNodeId,
        type: pairType,
        label: nextLabel,
        summary: pairSummary.trim(),
        confidence: 0.8,
        inferred: false,
        shared_intensity_score: 60,
      });
      setPairSummary("");
      setPairLabel("");
      return;
    }

    const structuralLabel =
      directedStructuralBaseLabels.get(directedStructural) ?? directedStructural;
    const stanceLabel = directedStanceLabels.get(directedStance) ?? directedStance;
    onCreateDirectedRelation({
      id: createCustomId("directed_custom", node.id, targetNodeId),
      source: node.id,
      target: targetNodeId,
      structural_base: directedStructural,
      structural_label: structuralLabel,
      stance: directedStance,
      stance_label: stanceLabel,
      display_relation: directedLabel.trim() || `${structuralLabel}/${stanceLabel}`,
      summary: directedSummary.trim(),
      strength: Math.max(0, Math.min(100, Number(directedStrength) || 0)),
      mention_count: 1,
    });
    setDirectedLabel("");
    setDirectedSummary("");
    setDirectedStrength("60");
  };

  return (
    <div className="character-detail">
      <header className="character-detail__hero">
        <div className="character-avatar-shell">
          <button
            type="button"
            className={`character-avatar ${
              avatarDataUrl ? "has-image" : TIER_CLASS[node.tier]
            }`}
            style={
              avatarDataUrl
                ? {
                    backgroundImage: `url(${avatarDataUrl})`,
                    backgroundColor: "transparent",
                  }
                : undefined
            }
            onClick={() => {
              if (allowAvatarEditing) {
                fileInputRef.current?.click();
              }
            }}
            disabled={avatarBusy || !allowAvatarEditing}
            aria-label={avatarDataUrl ? copy.replaceAvatar : copy.uploadAvatar}
          >
            {!avatarDataUrl ? <Camera size={40} /> : null}
            {allowAvatarEditing ? (
              <span className="character-avatar__overlay">
                <ImagePlus size={14} />
                {avatarDataUrl ? copy.replaceAvatar : copy.uploadAvatar}
              </span>
            ) : null}
          </button>

          {allowAvatarEditing ? (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarInput}
            />
          ) : null}

          {avatarDataUrl && allowAvatarEditing ? (
            <button
              type="button"
              className="character-avatar__remove"
              onClick={handleAvatarRemove}
              disabled={avatarBusy}
              aria-label={copy.removeAvatar}
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </div>

        <div className="character-detail__identity">
          <div className="character-detail__tier">{copy.tiers[node.tier]}</div>
          <h1>{node.name}</h1>
          {showInternalId ? (
            <div className="character-detail__id">
              <Fingerprint size={13} />
              <span>{node.id}</span>
            </div>
          ) : null}
          {allowAvatarEditing ? (
            <div className="character-detail__avatar-tip">{copy.avatarHint}</div>
          ) : null}
        </div>
      </header>

      {editMode ? (
        <>
          <section className="character-section">
            <div className="character-section__title">
              <Sparkles size={15} />
              <span>{copy.editTitle}</span>
            </div>
            <div className="inspector-edit-grid">
              <EditField
                label={copy.name}
                value={editDraft?.name ?? node.name}
                onChange={(value) => onEditChange?.({ name: value })}
              />
              <EditField
                label={copy.aliases}
                value={editDraft?.aliases?.join(", ") ?? aliasInput}
                placeholder={copy.aliasesInput}
                onChange={(value) =>
                  onEditChange?.({
                    aliases: value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
              <EditArea
                label={copy.summary}
                value={editDraft?.summary ?? node.summary}
                placeholder={copy.summaryInput}
                onChange={(value) => onEditChange?.({ summary: value })}
              />
            </div>
          </section>

          <section className="character-section">
            <div className="character-section__title">
              <Link2 size={15} />
              <span>{copy.relationEditor}</span>
            </div>
            <div className="inspector-edit-grid">
              <div className="inspector-edit-segment">
                <button
                  type="button"
                  className={relationMode === "pair" ? "is-active" : ""}
                  onClick={() => setRelationMode("pair")}
                >
                  {copy.relationModePair}
                </button>
                <button
                  type="button"
                  className={relationMode === "directed" ? "is-active" : ""}
                  onClick={() => setRelationMode("directed")}
                >
                  {copy.relationModeDirected}
                </button>
              </div>

              <SelectField
                label={copy.relationTarget}
                value={targetNodeId}
                onChange={setTargetNodeId}
                options={sortedCandidateNodes.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />

              {relationMode === "pair" ? (
                <>
                  <SelectField
                    label={copy.relationType}
                    value={pairType}
                    onChange={setPairType}
                    options={pairTypes.map((value) => ({
                      value,
                      label: pairTypeLabels.get(value) ?? value,
                    }))}
                  />
                  <EditField
                    label={copy.relationLabel}
                    value={pairLabel}
                    onChange={setPairLabel}
                  />
                  <EditArea
                    label={copy.relationSummary}
                    value={pairSummary}
                    onChange={setPairSummary}
                  />
                </>
              ) : (
                <>
                  <SelectField
                    label={copy.relationStructural}
                    value={directedStructural}
                    onChange={setDirectedStructural}
                    options={directedStructuralBases.map((value) => ({
                      value,
                      label: directedStructuralBaseLabels.get(value) ?? value,
                    }))}
                  />
                  <SelectField
                    label={copy.relationStance}
                    value={directedStance}
                    onChange={setDirectedStance}
                    options={directedStances.map((value) => ({
                      value,
                      label: directedStanceLabels.get(value) ?? value,
                    }))}
                  />
                  <EditField
                    label={copy.relationLabel}
                    value={directedLabel}
                    onChange={setDirectedLabel}
                  />
                  <EditField
                    label={copy.relationStrength}
                    value={directedStrength}
                    onChange={setDirectedStrength}
                  />
                  <EditArea
                    label={copy.relationSummary}
                    value={directedSummary}
                    onChange={setDirectedSummary}
                  />
                </>
              )}

              <button
                type="button"
                className="inspector-edit-submit"
                disabled={!targetNodeId}
                onClick={handleCreateRelation}
              >
                {targetNodeId ? copy.createRelation : copy.noTarget}
              </button>
            </div>
          </section>
        </>
      ) : null}

      {node.aliases.length > 0 ? (
        <section className="character-section">
          <div className="character-section__title">
            <Tags size={15} />
            <span>{copy.aliases}</span>
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
          label={copy.importance}
          value={formatScore(node.importance)}
          helper={copy.importanceHint}
        />
        <ScoreCard
          icon={<Activity size={18} />}
          label={copy.centrality}
          value={centrality.toFixed(2)}
          helper={copy.centralityHint}
        />
        <ScoreCard
          icon={<Sparkles size={18} />}
          label={copy.appearances}
          value={String(node.appearance_count)}
          helper={copy.appearancesHint}
        />
      </section>

      <section className="character-section">
        <div className="character-section__title">
          <BookOpen size={15} />
          <span>{copy.summary}</span>
        </div>
        <div className="character-summary">{node.summary || copy.noSummary}</div>
      </section>

      <section className="character-section">
        <div className="character-section__title">
          <CalendarDays size={15} />
          <span>{copy.chapterRange}</span>
        </div>
        <div className="character-timeline">
          <TimelineItem
            label={copy.firstSeen}
            value={node.first_seen_chapter_id ?? copy.unknown}
          />
          <TimelineItem
            label={copy.lastSeen}
            value={node.last_seen_chapter_id ?? copy.unknown}
          />
        </div>
      </section>
    </div>
  );
}

function ScoreCard(props: {
  icon: ReactNode;
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

function EditField(props: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const { label, value, placeholder, onChange } = props;

  return (
    <label className="inspector-edit-field">
      <span>{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function EditArea(props: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const { label, value, placeholder, onChange } = props;

  return (
    <label className="inspector-edit-field inspector-edit-field--area">
      <span>{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const { label, value, onChange, options } = props;

  return (
    <label className="inspector-edit-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="" />
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
