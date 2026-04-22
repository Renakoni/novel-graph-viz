import type { BackgroundVariant } from "../components/background/StarfieldBackground";

export type Language = "zh" | "en";

type PageCopy = {
  topbarBrand: string;
  topbarEmpty: string;
  openProject: string;
  exportHtml: string;
  exportFullHtml: string;
  exportHtmlWithoutIsolates: string;
  exportState: string;
  importState: string;
  language: string;
  nodes: string;
  edges: string;
  loadingTitle: string;
  loadingDesc: string;
  eyebrow: string;
  heroTitle: string;
  heroDesc: string;
  card1Title: string;
  card1Desc: string;
  card2Title: string;
  card2Desc: string;
  card3Title: string;
  card3Desc: string;
  contractTitle: string;
  contractType: string;
  note: string;
  required: string;
  view3d: string;
  view2d: string;
  editMode: string;
  background: string;
  backgrounds: Record<BackgroundVariant, string>;
};

export const GRAPH_PAGE_COPY: Record<Language, PageCopy> = {
  zh: {
    topbarBrand: "小说关系图查看器",
    topbarEmpty: "打开导出的图谱文件",
    openProject: "打开项目",
    exportHtml: "导出 HTML",
    exportFullHtml: "完整导出",
    exportHtmlWithoutIsolates: "去孤点导出",
    exportState: "导出工作文件",
    importState: "导入工作文件",
    language: "语言",
    nodes: "节点",
    edges: "边",
    loadingTitle: "正在载入图谱",
    loadingDesc: "正在解析图谱文件...",
    eyebrow: "本地小说图谱查看器",
    heroTitle: "打开图谱，看人物、关系和摘要",
    heroDesc:
      "这个 viewer 用来配合 engine 导出的图谱文件。它适合查看人物关系、补头像、保存工作文件，以及导出可分享的单页展示。",
    card1Title: "读取源图谱",
    card1Desc: "直接打开 engine 导出的 character_graph.json。",
    card2Title: "继续上次工作",
    card2Desc: "保存后的 workspace.json 可以直接再次打开，继续编辑头像、关系和设置。",
    card3Title: "导出展示页",
    card3Desc: "可导出离线 HTML，用于展示、分享或归档。",
    contractTitle: "文件说明",
    contractType: "Viewer Files",
    note: "浏览器不会自动改写你的源图谱文件；继续工作请保存并重新打开 workspace.json。",
    required: "必需",
    view3d: "2.5D",
    view2d: "2D",
    editMode: "编辑模式",
    background: "背景",
    backgrounds: {
      starfield: "深空星野",
      grid: "网格",
      snow: "飘雪",
      bubble: "气泡",
      firefly: "萤火",
      wave: "粒子海洋",
      tyndall: "丁达尔光",
    },
  },
  en: {
    topbarBrand: "Novel Graph Viewer",
    topbarEmpty: "Open an exported graph file",
    openProject: "Open Project",
    exportHtml: "Export HTML",
    exportFullHtml: "Full Export",
    exportHtmlWithoutIsolates: "No Isolates",
    exportState: "Export Workspace",
    importState: "Import Workspace",
    language: "Language",
    nodes: "nodes",
    edges: "edges",
    loadingTitle: "Loading Graph",
    loadingDesc: "Parsing graph file...",
    eyebrow: "Local Novel Graph Viewer",
    heroTitle: "Open the graph and read characters, links, and summaries",
    heroDesc:
      "This viewer is meant to work alongside the engine export. Use it to inspect relationships, add portraits, save workspace files, and export a shareable standalone page.",
    card1Title: "Read the source graph",
    card1Desc: "Open the character_graph.json exported by the engine.",
    card2Title: "Resume your work",
    card2Desc: "A saved workspace.json can be opened directly to continue portraits, relations, and view settings.",
    card3Title: "Export a showcase page",
    card3Desc:
      "Export an offline HTML page for presentation, sharing, or archiving.",
    contractTitle: "File Guide",
    contractType: "Viewer Files",
    note: "The browser does not rewrite your source graph file. Save and reopen workspace.json when you want to continue working.",
    required: "Required",
    view3d: "2.5D",
    view2d: "2D",
    editMode: "Edit",
    background: "Background",
    backgrounds: {
      starfield: "Deep Starfield",
      grid: "Grid",
      snow: "Snow",
      bubble: "Bubble",
      firefly: "Firefly",
      wave: "Particle Ocean",
      tyndall: "Tyndall",
    },
  },
};

export function getLandingContent(language: Language) {
  if (language === "zh") {
    return {
      eyebrow: "本地查看器",
      title: "配合 engine 导出的小说人物关系图使用",
      description:
        "欢迎页不需要讲太多 schema 细节，更重要的是告诉你这里能做什么：打开源图谱、保存工作文件、导出展示页。",
      cards: [
        {
          title: "源图谱",
          desc: "第一次使用时，打开 engine 导出的 character_graph.json。",
        },
        {
          title: "工作文件",
          desc: "保存后会生成 workspace.json。下次继续时，直接打开它就可以。",
        },
        {
          title: "展示页",
          desc: "可导出离线 HTML，用于展示、分享或归档。",
        },
      ],
      stepsTitle: "建议流程",
      steps: [
        {
          title: "1. 先打开图谱文件",
          desc: "右上角“打开项目”支持直接读取 character_graph.json，也支持再次打开之前保存的 workspace.json。",
        },
        {
          title: "2. 浏览并补充信息",
          desc: "点击人物查看详情，可以补头像、编辑摘要或关系，并把这些改动存进工作文件。",
        },
        {
          title: "3. 最后导出展示页",
          desc: "当背景、头像和视角都调整好后，再导出离线 HTML 用于展示、分享或归档。",
        },
      ],
      hintTitle: "文件说明",
      hintDesc:
        "这个查看器现在主要围绕三种文件工作。源图谱负责承载原始数据，工作文件负责承载你的继续编辑，HTML 用于最终展示。",
      miniSpecLabel: "支持直接打开",
      miniSpecValue: "character_graph.json / workspace.json",
      note: "如果只是继续上次工作，直接打开 workspace.json 就够了。",
    };
  }

  return {
    eyebrow: "Local Viewer",
    title: "Built to work with the engine export for novel relationship graphs",
    description:
      "The landing page should explain the actual workflow: open the source graph, save a workspace, then export a showcase page.",
    cards: [
      {
        title: "Source Graph",
        desc: "On first use, open the character_graph.json exported by the engine.",
      },
      {
        title: "Workspace File",
        desc: "Saving creates a workspace.json. Next time, open that file directly to continue.",
      },
      {
        title: "Showcase Page",
        desc: "Export an offline HTML page for presentation, sharing, or archiving.",
      },
    ],
    stepsTitle: "Suggested Flow",
    steps: [
      {
        title: "1. Open a graph file",
        desc: "The Open Project button accepts both character_graph.json and a previously saved workspace.json.",
      },
      {
        title: "2. Inspect and enrich",
        desc: "Click characters to review details, add portraits, and adjust summaries or relations inside the workspace.",
      },
      {
        title: "3. Export the showcase page",
        desc: "Once the background, portraits, and camera feel right, export an offline HTML page for sharing or archiving.",
      },
    ],
    hintTitle: "File Guide",
    hintDesc:
      "This viewer revolves around three file types. The source graph carries the raw data, the workspace carries your ongoing edits, and HTML is the final presentation format.",
    miniSpecLabel: "Can open directly",
    miniSpecValue: "character_graph.json / workspace.json",
    note: "If you just want to continue your previous work, opening workspace.json is enough.",
  };
}

export function getEmptyStateContent(language: Language) {
  if (language === "zh") {
    return {
      eyebrow: "本地查看器",
      title: "打开图谱文件，直接进入人物关系阅读",
      description:
        "这里不是 engine 的诊断面板，而是配套的查看界面。你可以从源图谱开始，也可以从 workspace.json 直接接着上次工作。",
      cards: [
        {
          title: "源图谱导入",
          desc: "支持读取 engine 导出的 character_graph.json。",
        },
        {
          title: "工作文件续作",
          desc: "头像、关系调整和界面设置都可以保存进 workspace.json，并在下次直接恢复。",
        },
        {
          title: "单页导出",
          desc: "最终可以导出离线 HTML 页面，用于演示、分享或归档。",
        },
      ],
      stepsTitle: "第一次使用",
      steps: [
        {
          title: "1. 打开一个文件",
          desc: "点击右上角“打开项目”，可以选择 character_graph.json，也可以直接选择之前保存的 workspace.json。",
        },
        {
          title: "2. 点击人物查看详情",
          desc: "人物详情里可以看摘要、别名、关系，也可以补头像。头像会跟着工作文件一起保存。",
        },
        {
          title: "3. 保存或导出",
          desc: "想继续修改就保存 workspace.json；想给别人看就导出单个 HTML。",
        },
      ],
      hintTitle: "文件说明",
      hintDesc:
        "源图谱文件不会被浏览器直接改写。你在 viewer 里的调整，会通过保存工作文件的方式单独保留下来。",
      miniSpecLabel: "推荐文件流转",
      miniSpecValue: "character_graph.json -> workspace.json -> standalone HTML",
      note: "如果只是接着上次做，不需要再重新导入源图谱，直接打开 workspace.json 即可。",
    };
  }

  return {
    eyebrow: "Local Viewer",
    title: "Open a graph file and start reading character relationships",
    description:
      "This is not the engine diagnostics panel. It is the companion viewer, and you can start either from the source graph or directly from workspace.json.",
    cards: [
      {
        title: "Source Graph Import",
        desc: "Reads character_graph.json exported by the engine.",
      },
      {
        title: "Workspace Resume",
        desc: "Portraits, relation edits, and view settings can be saved into workspace.json and restored next time.",
      },
      {
        title: "Single-Page Export",
        desc: "Export an offline HTML page for demos, sharing, or archiving.",
      },
    ],
    stepsTitle: "First Use",
    steps: [
      {
        title: "1. Open a file",
        desc: "Use Open Project in the top-right. It accepts both character_graph.json and a previously saved workspace.json.",
      },
      {
        title: "2. Click a character",
        desc: "Character details show summaries, aliases, and relations, and portraits can be added there as well.",
      },
      {
        title: "3. Save or export",
        desc: "Save workspace.json when you want to keep working later, or export a standalone HTML when you want to share.",
      },
    ],
    hintTitle: "File Guide",
    hintDesc:
      "The browser does not rewrite the source graph directly. Your adjustments are stored separately when you save a workspace file.",
    miniSpecLabel: "Recommended flow",
    miniSpecValue: "character_graph.json -> workspace.json -> standalone HTML",
    note: "If you only want to continue your previous work, opening workspace.json directly is enough.",
  };
}
