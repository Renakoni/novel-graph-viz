import { useRef, useState, type ChangeEvent } from "react";
import {
  Activity,
  BookOpen,
  CalendarDays,
  Camera,
  Fingerprint,
  Gauge,
  ImagePlus,
  Sparkles,
  Tags,
  Trash2,
} from "lucide-react";
import { imageFileToAvatarDataUrl } from "../../data/avatarStore";
import type { ViewerNode } from "../../types/viewerGraph";

type NodeInspectorProps = {
  node: ViewerNode;
  avatarDataUrl: string | null;
  onAvatarChange: (nodeId: string, dataUrl: string) => Promise<void>;
  onAvatarRemove: (nodeId: string) => Promise<void>;
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

export function NodeInspector({
  node,
  avatarDataUrl,
  onAvatarChange,
  onAvatarRemove,
}: NodeInspectorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const centrality = Math.max(0, Math.min(1, node.importance / 100));

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
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarBusy}
            aria-label={avatarDataUrl ? "更换人物头像" : "上传人物头像"}
          >
            {!avatarDataUrl ? <Camera size={40} /> : null}
            <span className="character-avatar__overlay">
              <ImagePlus size={14} />
              {avatarDataUrl ? "更换头像" : "上传头像"}
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarInput}
          />

          {avatarDataUrl ? (
            <button
              type="button"
              className="character-avatar__remove"
              onClick={handleAvatarRemove}
              disabled={avatarBusy}
              aria-label="移除人物头像"
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </div>

        <div className="character-detail__identity">
          <div className="character-detail__tier">{TIER_LABELS[node.tier]}</div>
          <h1>{node.name}</h1>
          <div className="character-detail__id">
            <Fingerprint size={13} />
            <span>{node.id}</span>
          </div>
          <div className="character-detail__avatar-tip">
            上传后会保存在当前浏览器的本地记忆里，并同步显示到图中的球体表面。
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
