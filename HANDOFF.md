# 项目概览

这份文档给第一次接手 `novel-graph-viz` 的人看。

如果你只是想快速理解这个仓库，先看这里；如果你要继续开发，再去看 [docs/VIEWER_ARCHITECTURE.md](docs/VIEWER_ARCHITECTURE.md)。

---

## 这个项目是什么

`novel-graph-viz` 是 [graph-every-novel](https://github.com/Renakoni/graph-every-novel) 的配套可视化前端。

它的定位很明确：

- 打开导出的小说人物关系图
- 用 2.5D 视图查看人物和关系
- 在本地整理头像、关系和展示状态
- 导出单个 HTML 展示页

它不是分析引擎，也不负责生成图谱数据。

---

## 核心文件类型

### `character_graph.json`

源图谱文件。

- 由 `graph-every-novel` 导出
- 第一次使用时打开它
- viewer 不会直接改写它

### `workspace.json`

工作文件。

- 保存当前工作区快照
- 包含头像、背景、语言和人工编辑结果
- 下次继续工作时，直接打开它即可

### `standalone.html`

展示文件。

- 单个 HTML
- 适合分享、归档和离线展示

---

## 当前产品状态

这已经不是一个早期 demo 了，而是可直接使用的前端产品。

当前已经完成的主链路：

- 打开 `character_graph.json`
- 查看 2.5D 关系图
- 查看人物详情与关系详情
- 上传头像并本地保存
- 保存为 `workspace.json`
- 导出为单个 `HTML`

---

## 当前主输入

主输入仍然是：

```text
export/character_graph.json
```

viewer 主路径消费的是轻量人物图谱数据：

- `project`
- `chapters`
- `nodes`
- `pair_edges`
- `directed_edges`

兼容规则：

- `chapters` 可以缺失
- viewer 会从节点和边上的章节字段自动推断
- `nodes.summary` 就是人物摘要
- `pair_edges.first_seen_chapter_id / last_seen_chapter_id` 可以为空

---

## 现在最重要的几个实现点

### 1. 图谱读取

入口文件：

- `src/data/loadProjectGraph.ts`

职责：

- 读取 `character_graph.json`
- 转成统一的 viewer shape
- 兼容缺失 `chapters` 的情况
- 识别并打开 `workspace.json`

### 2. 2.5D 视图

入口文件：

- `src/components/graph/ForceGraph3DCanvas.tsx`
- `src/data/forceGraphAdapter.ts`

现状：

- 主界面以 2.5D 为主
- 节点是更适合头像展示的圆盘方案
- 支持点击节点、点击关系线、旋转、缩放和平移

### 3. 工作区保存

入口文件：

- `src/data/workspaceState.ts`
- `src/pages/GraphPage.tsx`

现状：

- 保存出来的是完整 `workspace.json`
- 下次可以直接再次打开
- 不再要求“源图谱 + 状态补丁”双开

### 4. HTML 导出

入口文件：

- `src/data/htmlExport.ts`
- `tools/export-single-html.mjs`

现状：

- 支持从界面直接导出
- 也支持命令行导出
- 导出结果是单个可分享 HTML

---

## 推荐阅读顺序

如果你要继续维护这个项目，建议按这个顺序看：

1. [README.md](README.md)
2. 本文档
3. [docs/VIEWER_ARCHITECTURE.md](docs/VIEWER_ARCHITECTURE.md)
4. 对应源码入口文件

---

## 最值得先看的源码文件

- `src/pages/GraphPage.tsx`
- `src/components/graph/ForceGraph3DCanvas.tsx`
- `src/components/layout/TopBar.tsx`
- `src/components/layout/LeftPanel.tsx`
- `src/components/layout/RightPanel.tsx`
- `src/data/loadProjectGraph.ts`
- `src/data/workspaceState.ts`
- `src/data/htmlExport.ts`

---

## 一句话总结

如果只记一句话：

`novel-graph-viz` 当前的核心链路是：

```text
character_graph.json -> 2.5D 查看与整理 -> workspace.json -> standalone HTML
```
