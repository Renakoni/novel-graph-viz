# Viewer Architecture v0.6

## Goal

`novel-graph-viewer` 是 `novel-graph-engine` 的人物关系图消费端。

它当前的产品目标不是“展示 schema”，而是：

- 本地打开人物关系图导出
- 让用户读人物、关系、摘要、章节出现范围
- 允许做少量面向展示的本地增强
  - 例如头像
  - 例如背景
  - 例如导出为单文件 HTML

## Product Boundary

viewer 只消费导出物，不参与 engine 内部分析过程。

主路径输入：

```text
export/character_graph.json
```

不应成为主路径的数据源：

- `workspace/project.json`
- `export/project.json`
- `logs/`
- `diagnostic/`
- `analysis.sqlite`

## Input Contracts

### Preferred contract

```json
{
  "schema": "novel-graph-character-graph",
  "schema_version": 1,
  "stable_graph_eligibility_status": "...optional metadata...",
  "profile_digest_status": "...optional metadata...",
  "profile_relation_projection_status": "...optional metadata...",
  "project": {...},
  "nodes": [...],
  "pair_edges": [...],
  "directed_edges": [...]
}
```

当前 engine 已开始在 root / edge 上补充一批稳定图谱评估字段，例如：

- root:
  - `stable_graph_eligibility_status`
  - `profile_digest_status`
  - `profile_relation_projection_status`
- `project.created_at`
- `pair_edges.inferred`
- `pair_edges.shared_intensity_score`
- `pair_edges.stable_graph_*`
- `directed_edges.raw_label`
- `directed_edges.stable_graph_*`

这些字段目前属于“附加元数据”，不是 viewer canonical shape 的必要组成部分。

当前策略：

- loader 允许它们存在
- canonical viewer shape 不强制承接它们
- 组件层默认忽略它们

### Compatibility fallback

loader 仍可兼容：

- 旧 `export/project.json`
- heavy engine contract

但 fallback 的意义只在 loader。

组件层、页面层、inspector、graph adapter 不应理解 heavy 字段。

## Canonical Viewer Shape

源码定义见：

- `src/types/viewerGraph.ts`

核心 shape：

```ts
type ViewerProject = {
  project: ViewerProjectMeta;
  chapters: ViewerChapter[];
  nodes: ViewerNode[];
  pair_edges: ViewerPairEdge[];
  directed_edges: ViewerDirectedEdge[];
};
```

其中：

- `nodes.summary` 是最终展示摘要
- `pair_edges.label` / `summary` 是 pair relation 的主展示文案
- `directed_edges.display_relation` 是 directed relation 的主展示文案

补充现实情况：

- 当前部分 `nodes.summary` 已经出现多段 `Update:` 叠加文本
- 这属于导出摘要内容质量问题，不是 contract 破坏
- viewer 目前按原文展示；如果后续要做 UI 清洗，应放在展示层而不是 loader 强转

## Loader Responsibilities

文件：

- `src/data/loadProjectGraph.ts`

职责：

1. 识别输入属于 preferred contract 还是 heavy fallback
2. 转成统一 `ViewerProject`
3. 做最小必要的引用校验
4. 兼容 `chapters` 缺失

### Chapters inference

这是当前一个很重要的现实规则。

`character_graph.json` 可能完全没有 `chapters`，但 node / edge 上仍带有：

- `first_seen_chapter_id`
- `last_seen_chapter_id`

当前 loader 会从这些字段中自动推断章节数组。

因此：

- `chapters` 缺失不应再是致命错误
- 章节范围筛选仍可继续工作

如果后续又出现 `chapters must be an array`，说明 loader 兼容分支被破坏了。

## Data Flow

大致链路如下：

```text
character_graph.json
  -> loadProjectGraph.ts
  -> ViewerProject
  -> graphIndex.ts
  -> graphAdapters.ts / forceGraphAdapter.ts
  -> SigmaCanvas / ForceGraph3DCanvas
  -> inspectors / panels
```

页面协调层在：

- `src/pages/GraphPage.tsx`

状态层在：

- `src/store/viewerStore.ts`

## View Modes

### 3D / 2.5D view

文件：

- `src/components/graph/ForceGraph3DCanvas.tsx`
- `src/data/forceGraphAdapter.ts`

当前实现不是传统真实球体，而是更偏“面向镜头的圆盘节点”。

这样做的原因：

- 头像贴图在球体上畸变过重
- 读图体验上，圆盘比球体更稳定
- 仍然保留空间拖拽和纵深感

当前技术：

- `3d-force-graph`
- `three`
- `Sprite` 节点
- `Line2` 自定义连线

当前交互：

- 点击节点打开人物详情
- 点击边打开关系详情
- hover 边高亮
- 空白点击清空选择

### 2D view

文件：

- `src/components/graph/SigmaCanvas.tsx`
- `src/data/graphAdapters.ts`

当前技术：

- `sigma`
- `graphology`
- `graphology-layout-forceatlas2`
- `graphology-layout-noverlap`
- `@sigma/node-image`

2D 的核心目标不是复刻 3D，而是提供一个更稳定的平面阅读模式。

当前能力：

- ForceAtlas2 初始布局
- Noverlap 避碰
- 图片节点
- edge hover 高亮
- edge click 打开详情

## Avatar Architecture

文件：

- `src/data/avatarStore.ts`
- `src/components/inspectors/NodeInspector.tsx`

头像链路：

1. 用户在人物详情中上传图片
2. 图片被裁成正方形并转成 data URL
3. 写入 IndexedDB
4. 写入 store 中的 `avatarByNodeId`
5. 两个 graph canvas 读取头像映射并更新渲染

当前持久化是本机级，不是跨机器级。

project key 由以下内容组成：

```ts
`${project.id}::${sourceName}`
```

这意味着同一项目如果文件名变化，头像会进入不同命名空间。

## Viewer State Architecture

文件：

- `src/data/viewerState.ts`

当前 viewer state 负责保存：

- `language`
- `viewMode`
- `background`
- `avatars`

它既用于：

- 手动导出 / 导入状态
- 单文件 HTML 导出时的引导数据

## Standalone HTML Export

文件：

- `src/data/htmlExport.ts`
- `tools/export-single-html.mjs`
- `src/types/bootstrap.ts`
- `src/app/App.tsx`

### Browser-side export

页面内点击导出按钮时：

1. 收集当前页面对应的 CSS / JS
2. 将当前图数据和 viewer state 注入 bootstrap payload
3. 内联生成单文件 HTML
4. 直接下载

### Dev-mode export

开发模式下因为脚本来自 dev server，不能直接原样内联。

当前策略是：

1. 读取本地 `dist/index.html`
2. 提取构建产物里的 CSS / JS
3. 再与当前数据拼装成单文件 HTML

所以 dev 模式导出依赖：

```bash
npm run build
```

如果没有 build 过，或者 `dist` 不完整，导出会失败。

## Background System

文件：

- `src/components/background/StarfieldBackground.tsx`
- `src/components/layout/TopBar.tsx`
- `src/data/viewerState.ts`

当前只保留这几种背景：

- `starfield`
- `tyndall`
- `firefly`
- `snow`
- `bubble`
- `wave`
- `grid`

这三个文件里的枚举必须保持一致。

## Inspectors

文件：

- `NodeInspector.tsx`
- `PairRelationInspector.tsx`
- `DirectedRelationInspector.tsx`

要求：

- 只读 canonical viewer shape
- 不要回头引用 heavy contract 字段
- node inspector 要承担头像上传入口

## Current Risks

### 1. `GraphPage.tsx` 过重

页面目前承担了较多协调逻辑：

- 初始加载
- viewer state 注入
- IndexedDB 回填
- 视图切换
- 导出
- 文案切换
- selection 派发

后续如果继续加功能，可以考虑适度拆分 hooks，但当前还没到必须重构的程度。

### 2. Export chain is fragile

`htmlExport.ts` 和 `tools/export-single-html.mjs` 这两条链路都很关键。

任何一侧改坏，都会出现：

- 导出空白
- 找不到 dist 资源
- bootstrap 注入失败

### 3. 3D interaction is easy to regress

`ForceGraph3DCanvas.tsx` 里有一套自定义 cursor / raycast / click hit 流程。

之前已经出现过：

- 悬停节点后整个画布 cursor 状态不恢复
- 空白区域看起来像仍可点击

所以改 3D 交互时要很克制。

## Debug Order

如果 viewer 出 bug，建议按这个顺序排查：

1. 实际 `character_graph.json` 长什么样
2. `loadProjectGraph.ts` 是否正确转成 `ViewerProject`
3. `graphAdapters.ts` / `forceGraphAdapter.ts` 是否消费 canonical shape
4. `GraphPage.tsx` / inspector / store 是否仍按同一套字段工作
5. 最后才去追 engine

## Suggested Entry Points For A New Session

如果新会话要快速接手：

1. 先读 `README.md`
2. 再读 `HANDOFF.md`
3. 再读本文件
4. 然后根据任务类型进入对应源码

任务到文件的大致映射：

- 导入兼容：`loadProjectGraph.ts`
- 2D 视觉：`graphAdapters.ts` + `SigmaCanvas.tsx`
- 3D 视觉：`forceGraphAdapter.ts` + `ForceGraph3DCanvas.tsx`
- 头像：`avatarStore.ts` + `NodeInspector.tsx`
- HTML 导出：`htmlExport.ts` + `export-single-html.mjs`
