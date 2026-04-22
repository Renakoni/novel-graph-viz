import type { BackgroundVariant } from "../components/background/StarfieldBackground";

export type Language = "zh" | "en";

export const GRAPH_PAGE_COPY = {
  zh: {
    topbarBrand: "小说关系图查看器",
    topbarEmpty: "打开导出的 project.json",
    openProject: "打开项目",
    exportHtml: "导出 HTML",
    exportFullHtml: "完整导出",
    exportHtmlWithoutIsolates: "去孤点导出",
    exportState: "导出工作状态",
    importState: "导入工作状态",
    language: "语言",
    nodes: "节点",
    edges: "边",
    loadingTitle: "正在加载项目图谱",
    loadingDesc: "正在解析 project.json...",
    eyebrow: "本地项目查看器",
    heroTitle: "直接打开导出的角色关系图，在本地查看。",
    heroDesc:
      "这个 viewer 直接读取 project.json，聚焦节点、对等边、指向边、摘要和章节范围。",
    card1Title: "轻量 Contract",
    card1Desc: "直接读取 project、chapters、nodes、pair_edges 和 directed_edges。",
    card2Title: "Inspector",
    card2Desc: "面向图谱阅读，不绑定 engine 诊断面板。",
    card3Title: "本地文件",
    card3Desc: "直接消费你机器上的导出 JSON。",
    contractTitle: "期望输入",
    contractType: "Viewer Contract",
    note:
      "pair_edges.first_seen_chapter_id 和 pair_edges.last_seen_chapter_id 可以为空，viewer 会兼容。",
    required: "必需",
    view3d: "3D",
    view2d: "2D",
    editMode: "编辑模式",
    background: "背景",
    backgrounds: {
      starfield: "深空星野",
      grid: "网格",
      snow: "飘雪",
      bubble: "气泡",
      firefly: "萤火虫",
      wave: "粒子海洋",
      tyndall: "丁达尔光",
    },
  },
  en: {
    topbarBrand: "Novel Graph Viewer",
    topbarEmpty: "Open an exported project.json",
    openProject: "Open Project",
    exportHtml: "Export HTML",
    exportFullHtml: "Full Export",
    exportHtmlWithoutIsolates: "No Isolates",
    exportState: "Export Workspace",
    importState: "Import Workspace",
    language: "Language",
    nodes: "nodes",
    edges: "edges",
    loadingTitle: "Loading Project Graph",
    loadingDesc: "Parsing project.json...",
    eyebrow: "Local Project Viewer",
    heroTitle: "Open a clean exported graph and inspect it locally.",
    heroDesc:
      "This viewer reads the engine export directly from project.json and focuses on nodes, pair edges, directed edges, summaries, and chapter ranges.",
    card1Title: "Light Contract",
    card1Desc: "Reads project, chapters, nodes, pair_edges, and directed_edges.",
    card2Title: "Inspector",
    card2Desc: "Built for graph reading, not engine diagnostics.",
    card3Title: "Local File",
    card3Desc: "Works directly with the exported JSON on your machine.",
    contractTitle: "Expected Input",
    contractType: "Viewer Contract",
    note:
      "pair_edges.first_seen_chapter_id and pair_edges.last_seen_chapter_id may be empty. The viewer accepts that.",
    required: "Required",
    view3d: "3D",
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
} satisfies Record<
  Language,
  {
    topbarBrand: string;
    topbarEmpty: string;
    openProject: string;
    exportHtml: string;
    exportFullHtml: string;
    exportHtmlWithoutIsolates: string;
    exportState: string;
    importState: string;
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
    language: string;
    backgrounds: Record<BackgroundVariant, string>;
  }
>;

export function getLandingContent(language: Language) {
  if (language === "zh") {
    return {
      eyebrow: "本地查看器",
      title: "可视化小说人物关系图",
      description:
        "这里更适合做一件事：快速看人物、关系、摘要，以及章节里的出现范围，而不是先读一堆工程字段。",
      cards: [
        {
          title: "直接看图",
          desc: "打开后默认就是关系图，点击人物即可查看详情、摘要和关联关系。",
        },
        {
          title: "更像阅读器",
          desc: "重点是人物关系本身，不是导出结构，也不是工程诊断界面。",
        },
        {
          title: "先试试看",
          desc: "你可以先加载示例，再决定要不要导入自己的 project.json。",
        },
      ],
      stepsTitle: "第一次使用",
      steps: [
        {
          title: "1. 先加载一个项目",
          desc: "使用“打开项目”按钮加载你本地的 project.json；如果只是想先看效果，也可以点“加载示例”。",
        },
        {
          title: "2. 再点击人物",
          desc: "点球体或节点，右侧会滑出人物详情。除了摘要、别名和评分，你还可以给人物上传头像，头像会保存并覆盖到球体上。",
        },
        {
          title: "3. 最后导出展示页",
          desc: "背景、头像和视图都调好之后，可以直接导出成单个 HTML，用来分享、归档或离线展示。",
        },
      ],
      note: "",
    };
  }

  return {
    eyebrow: "Local Viewer",
    title: "Open your novel relationship graph directly",
    description:
      "This page is meant to feel like a reading surface, not a schema sheet. Use it to inspect characters, links, summaries, and chapter presence.",
    cards: [
      {
        title: "See the graph first",
        desc: "The viewer is built around the graph itself. Click a node to inspect the character.",
      },
      {
        title: "Made for reading",
        desc: "This is about understanding the network, not reading export fields or engine diagnostics.",
      },
      {
        title: "Try the demo",
        desc: "You can load the demo first, then decide whether to open your own project.json.",
      },
    ],
    stepsTitle: "Quick Start",
    steps: [
      {
        title: "1. Load a project",
        desc: "Use the Open Project button to load your local project.json, or start with the demo if you just want a quick look.",
      },
      {
        title: "2. Click a character",
        desc: "Selecting a node opens the detail panel with summaries, aliases, scores, and avatar upload for that character.",
      },
      {
        title: "3. Export a shareable page",
        desc: "Once the background, avatars, and view feel right, export a single HTML file for sharing or offline use.",
      },
    ],
    note: "",
  };
}

export function getEmptyStateContent(language: Language) {
  if (language === "zh") {
    return {
      eyebrow: "本地查看器",
      title: "把小说人物关系图直接打开来看。",
      description:
        "这里不该先让人读接口字段。它更适合做一件事：快速看人物、关系、摘要，以及章节里的出现范围。",
      cards: [
        {
          title: "直接看图",
          desc: "打开后默认就是关系图，点击人物即可查看详情、摘要和关联关系。",
        },
        {
          title: "更像阅读器",
          desc: "重点是人物关系本身，不是导出结构，也不是工程诊断界面。",
        },
        {
          title: "先试试看",
          desc: "你可以先加载示例，再决定要不要导入自己的 project.json。",
        },
      ],
      stepsTitle: "第一次使用",
      steps: [
        {
          title: "1. 先加载一个项目",
          desc: "右上角可以打开你导出的 project.json，也可以先点“加载示例”。",
        },
        {
          title: "2. 再点击人物",
          desc: "点球体或节点，右侧会滑出人物详情，包括摘要、别名和评分信息。",
        },
        {
          title: "3. 最后导出展示页",
          desc: "背景和头像调好之后，可以直接导出成单个 HTML 用来分享。",
        },
      ],
      hintTitle: "导入说明",
      hintDesc:
        "通常你不需要理解底层字段；只要导出的 JSON 是标准 viewer 数据，页面就能读取。",
      miniSpecLabel: "最低需要",
      miniSpecValue: "project、chapters、nodes、pair_edges、directed_edges",
      note:
        "如果某条关系没有 first_seen_chapter_id / last_seen_chapter_id，也没关系，viewer 会自动兼容。",
    };
  }

  return {
    eyebrow: "Local Viewer",
    title: "Open your novel relationship graph and read it directly.",
    description:
      "This page should feel like a reading surface, not a schema sheet. Use it to inspect characters, links, summaries, and chapter presence.",
    cards: [
      {
        title: "See the graph first",
        desc: "The viewer is built around the graph itself. Click a node to inspect the character.",
      },
      {
        title: "Made for reading",
        desc: "This is about understanding the network, not reading export fields or engine diagnostics.",
      },
      {
        title: "Try the demo",
        desc: "You can load the demo first, then decide whether to open your own project.json.",
      },
    ],
    stepsTitle: "Quick Start",
    steps: [
      {
        title: "1. Load a project",
        desc: "Open your exported project.json from the top-right, or start with the demo.",
      },
      {
        title: "2. Click a character",
        desc: "Selecting a node opens the detail panel with summaries, aliases, and scores.",
      },
      {
        title: "3. Export a shareable page",
        desc: "Once the background and avatars look right, export a single HTML file.",
      },
    ],
    hintTitle: "Import Notes",
    hintDesc:
      "You usually do not need to care about the low-level fields. If the exported JSON follows the viewer contract, it will load.",
    miniSpecLabel: "Minimum data",
    miniSpecValue: "project, chapters, nodes, pair_edges, directed_edges",
    note:
      "If pair_edges.first_seen_chapter_id or last_seen_chapter_id is missing, the viewer still works.",
  };
}
