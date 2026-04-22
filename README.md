# Novel Graph Viewer

`novel-graph-viewer` 是 `novel-graph-engine` 的人物关系图可视化前端。

它当前的职责是：

- 打开 engine 导出的 `export/character_graph.json`
- 解析成统一的 viewer 图结构
- 提供 2D / 2.5D 两种关系图查看方式
- 展示节点、pair edge、directed edge 的详情
- 支持人物头像上传与本地持久化
- 支持导出单文件 HTML 便于分享和离线查看

它不负责：

- LLM 调用
- engine 内部诊断
- SQLite 直连
- correction 写回
- engine 日志面板

## 当前主输入

主路径只认：

```text
export/character_graph.json
```

首选 contract：

```json
{
  "schema": "novel-graph-character-graph",
  "schema_version": 1,
  "project": {},
  "nodes": [],
  "pair_edges": [],
  "directed_edges": []
}
```

注意：

- `character_graph.json` 可以不带 `chapters`
- viewer 现在会自动从节点和边上的章节 id 推断章节列表
- heavy contract 只是 loader fallback，不应污染组件层
- engine 现在还会输出一些稳定图谱评估元数据，viewer 当前默认忽略这些附加字段

## 当前功能

### 图谱查看

- `3d` 视图：接近 2.5D 的空间关系图
- `2d` 视图：Sigma + ForceAtlas2 + Noverlap
- 节点点击打开人物详情
- 边点击打开关系详情

### 人物头像

- 在人物详情中上传头像
- 使用 IndexedDB 本地保存
- 3D 节点会显示圆盘头像
- 2D 节点会优先显示图片节点

### 外观与状态

- 支持中英文切换
- 支持多种暗色背景切换
- 支持导出 / 导入 viewer state

### 单文件导出

- 支持导出一个独立 `.html`
- 导出文件会内联样式、脚本、图数据和当前 viewer state
- 适合离线查看和直接分享

## 开发命令

```bash
npm run dev
npm run build
```

命令行导出单文件 HTML：

```bash
npm run export:html -- --project path\to\character_graph.json
```

可选参数：

- `--state path\to\viewer-state.json`
- `--out path\to\output.html`
- `--source-name custom-name.json`

## 当前关键文件

- `src/data/loadProjectGraph.ts`
- `src/types/viewerGraph.ts`
- `src/data/graphAdapters.ts`
- `src/data/forceGraphAdapter.ts`
- `src/components/graph/SigmaCanvas.tsx`
- `src/components/graph/ForceGraph3DCanvas.tsx`
- `src/data/avatarStore.ts`
- `src/data/htmlExport.ts`
- `src/pages/GraphPage.tsx`

## 处理 bug 的优先顺序

1. 先看实际导出的 `character_graph.json`
2. 再看 `loadProjectGraph.ts` 是否按当前 contract 转换
3. 再看 `viewerGraph.ts`、adapter、page、inspector 是否仍使用统一字段
4. 最后再怀疑 engine 侧

常见问题：

- 报 `chapters must be an array`
  原因：导出文件缺 `chapters`，但 loader 没走当前兼容逻辑

- 导出里多了很多 `stable_graph_*`、`profile_*` 字段
  原因：这是 engine 新增元数据，不是 viewer 必须消费的主 contract

- 导出 HTML 失败或空白
  原因通常是 `dist` 产物不存在、不完整，或导出链路被改坏

- 背景选项和实际背景不一致
  同时检查 `TopBar.tsx`、`StarfieldBackground.tsx`、`viewerState.ts`

## 文档

- `HANDOFF.md`
- `docs/VIEWER_ARCHITECTURE.md`

如果要新开会话接手，先看这两份，再看源码。
