import { useEffect, useRef } from "react";
import type Graph from "graphology";
import type {
  SigmaEdgeAttributes,
  SigmaNodeAttributes,
} from "../../data/graphAdapters";

type Canvas3DGraphProps = {
  graph: Graph<SigmaNodeAttributes, SigmaEdgeAttributes>;
  onNodeClick: (nodeId: string) => void;
  onStageClick: () => void;
};

type Point3D = {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  hidden?: boolean;
  screenX: number;
  screenY: number;
  depth: number;
};

type Link3D = {
  source: string;
  target: string;
  color: string;
  size: number;
  hidden?: boolean;
};

function hashToZ(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0;
  }

  return ((Math.abs(hash) % 2000) / 1000 - 1) * 5;
}

function drawScene(
  canvas: HTMLCanvasElement,
  nodes: Point3D[],
  links: Link3D[],
  rotationX: number,
  rotationY: number,
) {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = rect.width;
  const height = rect.height;

  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) * 0.055;
  const perspective = 34;
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);

  for (const node of nodes) {
    const yRotX = node.x * cosY - node.z * sinY;
    const yRotZ = node.x * sinY + node.z * cosY;
    const xRotY = node.y * cosX - yRotZ * sinX;
    const xRotZ = node.y * sinX + yRotZ * cosX;
    const projection = perspective / (perspective + xRotZ);

    node.screenX = centerX + yRotX * scale * projection;
    node.screenY = centerY + xRotY * scale * projection;
    node.depth = xRotZ;
  }

  context.lineCap = "round";

  for (const link of links) {
    if (link.hidden) {
      continue;
    }

    const source = nodes.find((node) => node.id === link.source);
    const target = nodes.find((node) => node.id === link.target);
    if (!source || !target || source.hidden || target.hidden) {
      continue;
    }

    const alpha = Math.max(0.12, Math.min(0.5, 0.28 + (source.depth + target.depth) / 80));
    context.strokeStyle = link.color.replace(")", `, ${alpha})`).replace("rgb", "rgba");
    context.lineWidth = Math.max(0.6, link.size * 0.65);
    context.beginPath();
    context.moveTo(source.screenX, source.screenY);
    context.lineTo(target.screenX, target.screenY);
    context.stroke();
  }

  const visibleNodes = nodes
    .filter((node) => !node.hidden)
    .sort((left, right) => left.depth - right.depth);

  for (const node of visibleNodes) {
    const radius = Math.max(4, node.size * (1 + node.depth / 70));
    const halo = radius * 2.2;

    const gradient = context.createRadialGradient(
      node.screenX,
      node.screenY,
      0,
      node.screenX,
      node.screenY,
      halo,
    );
    gradient.addColorStop(0, node.color);
    gradient.addColorStop(1, "rgba(15, 23, 42, 0)");

    context.fillStyle = gradient;
    context.globalAlpha = 0.42;
    context.beginPath();
    context.arc(node.screenX, node.screenY, halo, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;

    context.fillStyle = node.color;
    context.beginPath();
    context.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2);
    context.fill();

    if (radius > 7) {
      context.font = "600 12px ui-sans-serif, system-ui";
      context.fillStyle = "rgba(226, 232, 240, 0.86)";
      context.fillText(node.label, node.screenX + radius + 6, node.screenY + 4);
    }
  }
}

export function Canvas3DGraph({
  graph,
  onNodeClick,
  onStageClick,
}: Canvas3DGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef({ x: -0.42, y: 0.65 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const nodesRef = useRef<Point3D[]>([]);

  useEffect(() => {
    const nodes: Point3D[] = [];
    const links: Link3D[] = [];

    graph.forEachNode((id, attributes) => {
      nodes.push({
        id,
        label: attributes.label,
        x: attributes.x,
        y: attributes.y,
        z: hashToZ(id),
        size: attributes.size,
        color: attributes.color,
        hidden: attributes.hidden,
        screenX: 0,
        screenY: 0,
        depth: 0,
      });
    });

    graph.forEachEdge((id, attributes, source, target) => {
      void id;
      links.push({
        source,
        target,
        color: attributes.kind === "pair-edge" ? "rgb(56, 189, 248)" : "rgb(251, 146, 60)",
        size: attributes.size,
        hidden: attributes.hidden,
      });
    });

    nodesRef.current = nodes;

    let animationFrame = 0;
    const animate = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        if (!dragRef.current) {
          rotationRef.current.y += 0.0012;
        }
        drawScene(canvas, nodes, links, rotationRef.current.x, rotationRef.current.y);
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, [graph]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) {
      return;
    }

    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    rotationRef.current.y += dx * 0.006;
    rotationRef.current.x += dy * 0.004;
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const hit = nodesRef.current
      .filter((node) => !node.hidden)
      .find((node) => {
        const dx = node.screenX - x;
        const dy = node.screenY - y;
        return Math.sqrt(dx * dx + dy * dy) <= Math.max(9, node.size + 5);
      });

    if (hit) {
      onNodeClick(hit.id);
    } else {
      onStageClick();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="canvas-3d-graph"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
    />
  );
}
