import { useEffect, useRef } from "react";
import Sigma from "sigma";
import type Graph from "graphology";
import type {
  SigmaEdgeAttributes,
  SigmaNodeAttributes,
} from "../../data/graphAdapters";

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

    const sigma = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      defaultNodeType: "circle",
      defaultEdgeType: "line",
      labelDensity: 0.08,
      labelGridCellSize: 120,
      labelRenderedSizeThreshold: 8,
    });

    sigma.on("clickNode", ({ node }) => onNodeClick(node));
    sigma.on("clickEdge", ({ edge }) => {
      const kind = graph.getEdgeAttribute(edge, "kind");
      onEdgeClick(edge, kind);
    });
    sigma.on("clickStage", () => onStageClick());

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
