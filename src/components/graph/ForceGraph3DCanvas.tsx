import { useEffect, useMemo, useRef } from "react";
import ForceGraph3D from "3d-force-graph";
import * as THREE from "three";
import {
  toForceGraphData,
  type ForceGraphLink,
  type ForceGraphNode,
} from "../../data/forceGraphAdapter";
import type { ViewerProject } from "../../types/viewerGraph";

type ForceGraph3DCanvasProps = {
  data: ViewerProject;
  onNodeClick: (nodeId: string) => void;
  onStageClick: () => void;
};

function makeLabelTexture(text: string, accent: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  const fontSize = 42;
  const paddingX = 24;
  const paddingY = 14;

  context.font = `700 ${fontSize}px "Microsoft YaHei", "Noto Sans SC", sans-serif`;
  const metrics = context.measureText(text);
  canvas.width = Math.ceil(metrics.width + paddingX * 2);
  canvas.height = fontSize + paddingY * 2;

  context.font = `700 ${fontSize}px "Microsoft YaHei", "Noto Sans SC", sans-serif`;
  context.fillStyle = "rgba(2, 6, 23, 0.72)";
  context.strokeStyle = "rgba(255, 255, 255, 0.16)";
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(1, 1, canvas.width - 2, canvas.height - 2, 18);
  context.fill();
  context.stroke();
  context.fillStyle = accent;
  context.fillText(text, paddingX, fontSize + paddingY - 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeNodeObject(node: ForceGraphNode): THREE.Object3D {
  const group = new THREE.Group();
  const radius = Math.max(8, node.val * 1.4);

  group.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 24),
      new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: node.tier === "core" ? 0.55 : 0.25,
        roughness: 0.42,
        metalness: 0.05,
        transparent: true,
        opacity: 0.92,
      }),
    ),
  );

  group.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.72, 32, 20),
      new THREE.MeshBasicMaterial({
        color: "#f8fafc",
        transparent: true,
        opacity: 0.88,
      }),
    ),
  );

  const labelTexture = makeLabelTexture(node.name, node.color);
  const labelCanvas = labelTexture.image;
  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true,
      depthWrite: false,
    }),
  );
  label.scale.set(labelCanvas.width / 7, labelCanvas.height / 7, 1);
  label.position.set(0, -radius * 2.1, 0);
  group.add(label);

  return group;
}

export function ForceGraph3DCanvas({
  data,
  onNodeClick,
  onStageClick,
}: ForceGraph3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<any>(null);
  const onNodeClickRef = useRef(onNodeClick);
  const onStageClickRef = useRef(onStageClick);
  const graphData = useMemo(() => toForceGraphData(data), [data]);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
    onStageClickRef.current = onStageClick;
  }, [onNodeClick, onStageClick]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const graph = new ForceGraph3D(container, {
      controlType: "orbit",
    }) as any;
    graphRef.current = graph;

    graph
      .backgroundColor("rgba(0,0,0,0)")
      .graphData(graphData)
      .nodeThreeObject((node: ForceGraphNode) => makeNodeObject(node))
      .nodeLabel(() => "")
      .linkLabel(() => "")
      .linkColor((link: ForceGraphLink) => link.color)
      .linkWidth((link: ForceGraphLink) => link.width)
      .linkOpacity(0.72)
      .linkDirectionalArrowLength((link: ForceGraphLink) =>
        link.kind === "directed" ? 5 : 0,
      )
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalParticles((link: ForceGraphLink) =>
        link.kind === "directed" ? 2 : 0,
      )
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleSpeed(0.006)
      .enableNodeDrag(true)
      .showNavInfo(false)
      .onNodeClick((node: ForceGraphNode) => onNodeClickRef.current(node.id))
      .onBackgroundClick(() => onStageClickRef.current());

    graph.d3Force("charge")?.strength?.(-170);
    graph.d3Force("link")?.distance?.((link: ForceGraphLink) =>
      link.kind === "directed" ? 95 : 74,
    );
    graph.cameraPosition({ x: 0, y: 0, z: 520 }, undefined, 800);

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      graph.width(rect.width).height(rect.height);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      graph._destructor?.();
      graphRef.current = null;
    };
  }, [graphData]);

  return <div ref={containerRef} className="force-graph-3d" />;
}
