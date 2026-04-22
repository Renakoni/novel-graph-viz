# HANDOFF

## 当前定位

这个仓库是 `novel-graph-engine` 的人物关系图可视化前端。

它当前已经不只是“读 JSON + 简单 inspector”，而是一个可本地运行、可导出单文件 HTML、支持 2D / 2.5D 双视图、支持人物头像覆盖的独立 viewer。

新会话接手时，先默认这是一个“可交付的前端产品”，不要再按最早期 demo 心态理解它。

## 主输入边界

主输入仍然是 engine 导出的：

```text
export/character_graph.json
```

不要把以下内容当 viewer 主路径：

- `workspace/project.json`
- `export/project.json`
- `logs/`
- `diagnostic/`
- `analysis.sqlite`

heavy contract 仍然保留 loader fallback，但组件层不要直接读取 heavy 字段。

## 当前支持的输入 contract

首选输入结构：

```ts
type CharacterGraphExport = {
  schema: "novel-graph-character-graph";
  schema_version: number;
  stable_graph_eligibility_status?: unknown;
  profile_digest_status?: unknown;
  profile_relation_projection_status?: unknown;
  project: {
    id: string;
    title: string;
    language: string;
    schema_version: number;
    created_at?: string;
  };
  nodes: ViewerNode[];
  pair_edges: ViewerPairEdge[];
  directed_edges: ViewerDirectedEdge[];
};
```

注意：

- `character_graph.json` 可能没有 `chapters`
- 现在 viewer 已兼容这种情况
- `loadProjectGraph.ts` 会从 `nodes / pair_edges / directed_edges` 的 `first_seen_chapter_id / last_seen_chapter_id` 自动推断章节列表
- engine 现在会额外输出一些稳定图谱评估字段与状态字段，viewer 当前主路径可以忽略它们

当前已观察到的新增但可忽略字段：

- root:
  - `stable_graph_eligibility_status`
  - `profile_digest_status`
  - `profile_relation_projection_status`
- `project.created_at`
- `pair_edges`:
  - `inferred`
  - `shared_intensity_score`
  - `stable_graph_eligible`
  - `stable_graph_eligibility_score`
  - `stable_graph_eligibility_reason`
  - `stable_graph_score_explanation`
- `directed_edges`:
  - `raw_label`
  - `stable_graph_eligible`
  - `stable_graph_eligibility_score`
  - `stable_graph_eligibility_reason`
  - `stable_graph_score_explanation`

所以如果再次看到：

```text
chapters must be an array
```

先查是不是 loader 回退了旧逻辑，或者新改动又把 `parseChaptersOrInfer` 弄丢了。

## 当前真实功能面

### 1. 图谱读取

- 本地打开 `character_graph.json`
- loader 统一输出 `ViewerProject`
- 保留 heavy contract fallback

关键文件：

- `src/data/loadProjectGraph.ts`
- `src/types/viewerGraph.ts`

### 2. 双视图

- `3d`：实际上是更接近 2.5D 的可拖拽空间视图
- `2d`：Sigma 视图，布局已换成 `ForceAtlas2 + Noverlap`

关键文件：

- `src/components/graph/ForceGraph3DCanvas.tsx`
- `src/components/graph/SigmaCanvas.tsx`
- `src/data/forceGraphAdapter.ts`
- `src/data/graphAdapters.ts`

### 3. 右侧详情面板

支持：

- 点击节点打开人物详情
- 点击 pair edge 打开关系详情
- 点击 directed edge 打开关系详情

关键文件：

- `src/components/inspectors/NodeInspector.tsx`
- `src/components/inspectors/PairRelationInspector.tsx`
- `src/components/inspectors/DirectedRelationInspector.tsx`
- `src/components/layout/RightPanel.tsx`

### 4. 人物头像上传与持久化

当前已落地：

- 在人物详情里上传头像
- 头像保存到 IndexedDB
- 头像会覆盖到 3D 圆盘节点上
- 2D 视图会优先用图片节点渲染

关键文件：

- `src/data/avatarStore.ts`
- `src/components/inspectors/NodeInspector.tsx`
- `src/components/graph/ForceGraph3DCanvas.tsx`
- `src/components/graph/SigmaCanvas.tsx`
- `src/data/graphAdapters.ts`

存储策略：

- DB 名：`novel-graph-viewer`
- Store：`node-avatars`
- project key：`${project.id}::${sourceName}`

这意味着：

- 同一个项目在不同文件名下会被视为不同头像命名空间
- 当前是本机持久化，不是跨机器同步

### 5. 背景与设置

当前设置菜单里只保留这些背景：

- `starfield`
- `tyndall`
- `firefly`
- `snow`
- `bubble`
- `wave`
- `grid`

关键文件：

- `src/components/background/StarfieldBackground.tsx`
- `src/components/layout/TopBar.tsx`
- `src/data/viewerState.ts`

如果背景选项和真实背景实现不一致，优先同时检查这 3 个文件。

### 6. Viewer State 导入导出

当前支持导出 / 导入 viewer state：

- 背景
- 语言
- 视图模式
- 头像映射

关键文件：

- `src/data/viewerState.ts`
- `src/pages/GraphPage.tsx`
- `src/components/layout/TopBar.tsx`

### 7. 单文件 HTML 导出

当前支持直接导出单个 `.html` 文件。

这个导出的 HTML 会内联：

- CSS
- JS
- 当前图数据
- 当前 viewer state

已支持两种来源：

- 正常 build 产物页面导出
- dev 模式下借助 `dist` 构建产物做导出

关键文件：

- `src/data/htmlExport.ts`
- `tools/export-single-html.mjs`
- `src/types/bootstrap.ts`
- `src/app/App.tsx`

非常重要：

- dev 模式导出时，仍然依赖本地 `dist` 存在
- 如果导出报 `dist 构建产物不完整`，先重新执行 `npm run build`
- 之前出现过导出空白，原因是旧 `vite.config.js` 干扰了真实 `vite.config.ts`
- 旧 `vite.config.js` 已删除；如果又出现类似问题，先查是否又生成了影子配置

## 当前图形实现状态

### 3D / 2.5D

当前不是传统立体球体，而是更偏“面向镜头的圆盘节点”方案。

现状：

- 节点视觉效果已经比球体贴图自然很多
- 连线支持 hover 高亮
- 点击线可以打开详情
- 头像会贴到圆盘表面

关键实现：

- 节点：Three `Sprite`
- 文本标签：canvas texture
- 连线：`Line2 + LineGeometry + LineMaterial`
- 指向关系：现在已不是最早那种生硬小锥体方案

如果后面继续优化 3D：

- 优先优化 line rendering 和 directed edge 表达
- 不要轻易回到“照片贴球体”的老做法，畸变明显

### 2D

当前 2D 已切到：

- `graphology-layout-forceatlas2`
- `graphology-layout-noverlap`
- `sigma`
- `@sigma/node-image`

也就是说：

- 2D 不再是最早那套粗糙布局
- 2D 已能直接渲染头像节点
- 2D 后续主要是继续调布局参数和标签策略，不是重起炉灶

## 当前高风险文件

新会话接手时，最值得先看的文件：

- `src/pages/GraphPage.tsx`
- `src/data/loadProjectGraph.ts`
- `src/data/graphAdapters.ts`
- `src/data/forceGraphAdapter.ts`
- `src/components/graph/ForceGraph3DCanvas.tsx`
- `src/components/graph/SigmaCanvas.tsx`
- `src/components/layout/TopBar.tsx`
- `src/data/htmlExport.ts`
- `src/data/avatarStore.ts`

原因：

- `GraphPage.tsx` 现在承担了较多页面协调逻辑
- loader / adapter / export / avatar persistence 是最容易被后续修改打断的链路

## 当前已知事实

### 1. `summary` 的语义

- `nodes.summary` 就是 viewer 该显示的人物摘要
- 不要再在组件层判断 `raw_profile_summary / profile_digest`
- 但要注意：当前 engine 某些人物摘要里已经出现了多段 `Update:` 串接文本
- 这是导出内容质量问题，不是 viewer 解析问题
- 如果后续要优化体验，可以在 viewer 增加“摘要清洗 / 分段显示”，但不要在 loader 里硬编码太重的 NLP 规则

### 2. 章节字段

- `first_seen_chapter_id / last_seen_chapter_id` 在 node / pair / directed 上都可能为空
- viewer 必须兼容为空
- `character_graph.json` 甚至可能根本不给 `chapters`

### 3. 3D 点击链路

- 节点点击打开人物详情
- 线点击打开关系详情
- 空白点击清空选择

如果又出现“悬停过节点后整个画布 cursor 都像可点击”之类的问题，优先查 `ForceGraph3DCanvas.tsx` 的 cursor / raycast 状态收敛逻辑。

### 4. 2D hover / click

- edge hover 高亮已经做了
- edge click 已接右侧详情
- 如果 hover 信息丢失，先查 `SigmaCanvas.tsx`

## 这轮之后的建议接手顺序

1. 先读 `README.md`
2. 再读 `docs/VIEWER_ARCHITECTURE.md`
3. 再读本文件
4. 然后按任务定位到具体链路文件

如果是导入问题，先看：

- `src/data/loadProjectGraph.ts`
- 实际 `character_graph.json`

如果是图布局或视觉问题，先看：

- `src/data/graphAdapters.ts`
- `src/data/forceGraphAdapter.ts`
- `src/components/graph/ForceGraph3DCanvas.tsx`
- `src/components/graph/SigmaCanvas.tsx`

如果是导出 HTML 问题，先看：

- `src/data/htmlExport.ts`
- `tools/export-single-html.mjs`

如果是头像问题，先看：

- `src/data/avatarStore.ts`
- `src/components/inspectors/NodeInspector.tsx`
- 两个 graph canvas

## 当前建议不要做的事

- 不要把 viewer 主路径重新绑回 `project.json`
- 不要把 heavy contract 字段继续渗透到组件层
- 不要为了临时 debug 直接改坏 HTML 导出链路
- 不要轻易大改 3D 逻辑，除非明确是在处理 3D 任务
- 不要同时改 loader + graph adapter + export 三层但不做 build 验证

## 最后

如果新会话只看一句话：

这个仓库当前的真实状态是：

“主输入是 `character_graph.json`，支持缺失 `chapters` 自动推断；前端有 2D / 2.5D 两套图；支持头像上传到 IndexedDB；支持单文件 HTML 导出；后续改动优先从 loader、adapter、两个 canvas 和 export 链路入手。”
