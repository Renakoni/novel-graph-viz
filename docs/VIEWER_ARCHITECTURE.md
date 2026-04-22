# Viewer Architecture

这份文档描述 `novel-graph-viz` 当前的高层结构。

它不再记录零散排障流水，而是回答三个问题：

1. 数据从哪里来
2. 页面如何组织
3. 导出与工作区如何保存

---

## 1. 数据来源

项目的主输入来自：

```text
export/character_graph.json
```

这份文件由 [graph-every-novel](https://github.com/Renakoni/graph-every-novel) 导出。

viewer 主路径读取的结构可以概括为：

- `project`
- `chapters`
- `nodes`
- `pair_edges`
- `directed_edges`

现实兼容规则：

- `chapters` 可以缺失
- loader 会根据节点和边上的章节字段自动推断
- `nodes.summary` 是最终展示摘要
- 额外的 `stable_graph_*`、`profile_*` 元数据目前默认忽略

对应文件：

- `src/data/loadProjectGraph.ts`
- `src/types/viewerGraph.ts`

---

## 2. 页面结构

页面主装配层在：

- `src/pages/GraphPage.tsx`

可以把整个界面理解成 4 块：

### 顶栏

负责：

- 打开项目
- 保存工作区
- 导出 HTML
- 切换编辑模式
- 打开设置

对应文件：

- `src/components/layout/TopBar.tsx`

### 左侧边栏

负责：

- 人物总览
- 筛选
- 孤点工作台

对应文件：

- `src/components/layout/LeftPanel.tsx`

### 中央图谱区

当前以 2.5D 视图为主。

负责：

- 展示人物节点
- 展示关系线
- 处理旋转、缩放、平移和点击

对应文件：

- `src/components/graph/ForceGraph3DCanvas.tsx`
- `src/data/forceGraphAdapter.ts`

### 右侧详情栏

负责：

- 人物详情
- 关系详情
- 编辑模式下的人物与关系修改

对应文件：

- `src/components/layout/RightPanel.tsx`
- `src/components/inspectors/NodeInspector.tsx`
- `src/components/inspectors/PairRelationInspector.tsx`
- `src/components/inspectors/DirectedRelationInspector.tsx`

---

## 3. 2.5D 图谱层

当前主视图不是传统“贴图球体”，而是更接近面向镜头的圆盘节点。

这样做的原因很简单：

- 头像在球体上会出现明显畸变
- 圆盘更适合做人物头像与标签展示
- 仍然保留空间感和可拖拽视角

默认交互：

- 左键拖动：旋转
- 滚轮：缩放
- 中键拖动：平移
- 点击人物：打开人物详情
- 点击关系线：打开关系详情

---

## 4. 工作区保存

当前工作区保存机制已经与源图谱分开。

核心语义：

- `character_graph.json` 是源图谱
- `workspace.json` 是继续工作的文件

保存到 `workspace.json` 的内容包括：

- 图谱快照
- 头像
- 背景
- 语言
- 人工编辑结果

对应文件：

- `src/data/workspaceState.ts`
- `src/pages/GraphPage.tsx`

---

## 5. 头像系统

头像既会反映在详情页，也会覆盖到图上的人物节点。

当前头像链路：

1. 用户上传头像
2. 图片裁切并转成 data URL
3. 写入当前工作区状态
4. 图谱节点同步刷新
5. 保存工作区时一并写入 `workspace.json`

对应文件：

- `src/components/inspectors/NodeInspector.tsx`
- `src/components/graph/ForceGraph3DCanvas.tsx`

---

## 6. HTML 导出

导出的目标是一个单文件展示页。

它的作用不是继续编辑，而是：

- 展示
- 分享
- 归档

导出链路对应文件：

- `src/data/htmlExport.ts`
- `tools/export-single-html.mjs`

命令行入口：

```bash
npm run export:html -- --project path\to\character_graph.json
```

---

## 7. 当前最重要的源码入口

如果你要继续维护这个项目，优先看这几处：

- `src/pages/GraphPage.tsx`
- `src/components/graph/ForceGraph3DCanvas.tsx`
- `src/components/layout/TopBar.tsx`
- `src/data/loadProjectGraph.ts`
- `src/data/workspaceState.ts`
- `src/data/htmlExport.ts`

---

## 8. 一张图理解当前链路

```text
graph-every-novel
  -> character_graph.json
  -> loadProjectGraph.ts
  -> GraphPage
  -> 2.5D graph + side panels
  -> workspace.json / standalone.html
```
