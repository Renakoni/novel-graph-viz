import { useEffect, useRef } from "react";
import Sigma from "sigma";
import type Graph from "graphology";
import { NodeImageProgram } from "@sigma/node-image";
import type { NodeProgramType } from "sigma/rendering";
import type {
  SigmaEdgeAttributes,
  SigmaNodeAttributes,
} from "../../data/graphAdapters";

const TypedNodeImageProgram = NodeImageProgram as unknown as NodeProgramType<
  SigmaNodeAttributes,
  SigmaEdgeAttributes
>;

type SigmaCanvasProps = {
  graph: Graph<SigmaNodeAttributes, SigmaEdgeAttributes>;
  onNodeClick: (nodeId: string) => void;
  onEdgeClick: (edgeId: string, kind: "pair-edge" | "directed-edge") => void;
  onStageClick: () => void;
  fitRequest: number;
};

export function SigmaCanvas({
  graph,
  onNodeClick,
  onEdgeClick,
  onStageClick,
  fitRequest,
}: SigmaCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<Sigma<SigmaNodeAttributes, SigmaEdgeAttributes> | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let hoveredEdge: string | null = null;
    let hoveredSource: string | null = null;
    let hoveredTarget: string | null = null;

    const sigma = new Sigma<SigmaNodeAttributes, SigmaEdgeAttributes>(
      graph,
      containerRef.current,
      {
      renderLabels: true,
      renderEdgeLabels: false,
      enableEdgeEvents: true,
      doubleClickZoomingRatio: 1,
      doubleClickZoomingDuration: 0,
      defaultNodeType: "circle",
      defaultEdgeType: "line",
      nodeProgramClasses: {
        image: TypedNodeImageProgram,
      },
      labelDensity: 0.045,
      labelGridCellSize: 150,
      labelRenderedSizeThreshold: 9,
      labelFont: "Microsoft YaHei, Noto Sans SC, sans-serif",
      labelWeight: "700",
      labelSize: 12,
      labelColor: { color: "#e5edf7" },
      minEdgeThickness: 0.65,
      zIndex: true,
      itemSizesReference: "positions",
      nodeReducer: (node, data) => ({
        ...data,
        color: data.hidden
          ? "rgba(100, 116, 139, 0.12)"
          : hoveredSource === node || hoveredTarget === node
          ? "#fbbf24"
          : data.color,
        size: data.hidden
          ? data.size * 0.55
          : hoveredSource === node || hoveredTarget === node
          ? data.size * 1.18
          : data.size,
        forceLabel: Boolean(hoveredSource === node || hoveredTarget === node),
        zIndex: data.zIndex,
      }),
      edgeReducer: (edge, data) => ({
        ...data,
        color: data.hidden
          ? "rgba(71, 85, 105, 0.04)"
          : hoveredEdge === edge
          ? data.kind === "pair-edge"
            ? "rgba(186, 230, 253, 0.9)"
            : "rgba(251, 191, 36, 0.94)"
          : data.kind === "pair-edge"
          ? "rgba(186, 230, 253, 0.24)"
          : "rgba(251, 146, 60, 0.46)",
        size: data.hidden ? 0.2 : hoveredEdge === edge ? data.size * 2.2 : data.size,
        zIndex: hoveredEdge === edge ? 100 : data.zIndex,
      }),
      },
    );

    sigma.on("clickNode", ({ node, event }) => {
      event.preventSigmaDefault();
      onNodeClick(node);
    });
    sigma.on("clickEdge", ({ edge, event }) => {
      event.preventSigmaDefault();
      const kind = graph.getEdgeAttribute(edge, "kind");
      onEdgeClick(edge, kind);
    });
    sigma.on("enterEdge", ({ edge }) => {
      hoveredEdge = edge;
      const [source, target] = graph.extremities(edge);
      hoveredSource = source;
      hoveredTarget = target;
      sigma.refresh();
    });
    sigma.on("leaveEdge", () => {
      hoveredEdge = null;
      hoveredSource = null;
      hoveredTarget = null;
      sigma.refresh();
    });
    sigma.on("clickStage", ({ event }) => {
      event.preventSigmaDefault();
      onStageClick();
    });
    sigma.on("doubleClickStage", ({ event }) => event.preventSigmaDefault());
    sigma.on("doubleClickNode", ({ event }) => event.preventSigmaDefault());

    sigmaRef.current = sigma;

    return () => {
      sigma.kill();
      sigmaRef.current = null;
    };
  }, [graph, onEdgeClick, onNodeClick, onStageClick]);

  useEffect(() => {
    if (!sigmaRef.current) {
      return;
    }

    sigmaRef.current.getCamera().setState({ x: 0.5, y: 0.5, angle: 0, ratio: 1.2 });
  }, [fitRequest]);

  return <div className="sigma-canvas" ref={containerRef} />;
}
