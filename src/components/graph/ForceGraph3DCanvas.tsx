import { useEffect, useMemo, useRef } from "react";
import ForceGraph3D from "3d-force-graph";
import * as THREE from "three";
import { forceCollide, forceX, forceY, forceZ } from "d3-force-3d";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import {
  toForceGraphData,
  type ForceGraphLink,
  type ForceGraphNode,
} from "../../data/forceGraphAdapter";
import type {
  ViewerDirectedEdge,
  ViewerPairEdge,
  ViewerProject,
} from "../../types/viewerGraph";

type ForceGraph3DCanvasProps = {
  data: ViewerProject;
  avatarByNodeId: Record<string, string>;
  onNodeClick: (nodeId: string) => void;
  onLinkClick: (edgeId: string, kind: "pair-edge" | "directed-edge") => void;
  onStageClick: () => void;
};

const labelTextureCache = new Map<string, THREE.CanvasTexture>();
const avatarDiscTextureCache = new Map<string, THREE.CanvasTexture>();
const nodeDiscTextureCache = new Map<string, THREE.CanvasTexture>();
const glowTextureCache = new Map<string, THREE.CanvasTexture>();
const LINK_SIDE_FALLBACK = new THREE.Vector3(1, 0, 0);

type LinkObject = THREE.Group & {
  userData: {
    mainLine: Line2;
    edgeId: string;
    edgeKind: "pair-edge" | "directed-edge";
    baseOpacity: number;
    baseWidth: number;
  };
};

function nodeDiscSize(node: ForceGraphNode): number {
  return Math.max(14, node.val * 5.15);
}

function makeLabelTexture(text: string, accent: string): THREE.CanvasTexture {
  const cacheKey = `${text}::${accent}`;
  const cached = labelTextureCache.get(cacheKey);
  if (cached) {
    return cached;
  }

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
  context.fillStyle = "rgba(2, 6, 23, 0.68)";
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
  labelTextureCache.set(cacheKey, texture);
  return texture;
}

function disableRaycast(object: THREE.Object3D) {
  object.raycast = () => undefined;
}

function restrictSpriteRaycastToCircle(sprite: THREE.Sprite, radius = 0.48) {
  const baseRaycast = sprite.raycast.bind(sprite);

  sprite.raycast = (raycaster, intersects) => {
    const previousLength = intersects.length;
    baseRaycast(raycaster, intersects);

    for (let index = intersects.length - 1; index >= previousLength; index -= 1) {
      const uv = intersects[index]?.uv;
      if (!uv) {
        continue;
      }

      const dx = uv.x - 0.5;
      const dy = uv.y - 0.5;
      if (Math.sqrt(dx * dx + dy * dy) > radius) {
        intersects.splice(index, 1);
      }
    }
  };
}

function makeBaseTextureCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d")!;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  return { canvas, context };
}

function finalizeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createGlowTexture(color: string): THREE.CanvasTexture {
  const cached = glowTextureCache.get(color);
  if (cached) {
    return cached;
  }

  const { canvas, context } = makeBaseTextureCanvas(512);
  const gradient = context.createRadialGradient(256, 256, 24, 256, 256, 220);
  gradient.addColorStop(0, "rgba(255,255,255,0.32)");
  gradient.addColorStop(0.18, `${color}88`);
  gradient.addColorStop(0.45, `${color}2e`);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);

  const texture = finalizeTexture(canvas);
  glowTextureCache.set(color, texture);
  return texture;
}

function createPlainNodeTexture(color: string): THREE.CanvasTexture {
  const cached = nodeDiscTextureCache.get(color);
  if (cached) {
    return cached;
  }

  const { canvas, context } = makeBaseTextureCanvas(768);
  const center = 384;
  const outerRadius = 300;
  const innerRadius = 250;

  context.clearRect(0, 0, 768, 768);

  context.beginPath();
  context.arc(center, center, outerRadius, 0, Math.PI * 2);
  const outer = context.createRadialGradient(center - 84, center - 92, 20, center, center, outerRadius);
  outer.addColorStop(0, "#ffffff");
  outer.addColorStop(0.3, "#f8fafc");
  outer.addColorStop(1, color);
  context.fillStyle = outer;
  context.fill();

  context.beginPath();
  context.arc(center, center, innerRadius, 0, Math.PI * 2);
  const inner = context.createRadialGradient(center - 76, center - 88, 24, center, center, innerRadius);
  inner.addColorStop(0, "#ffffff");
  inner.addColorStop(0.78, "#f8fafc");
  inner.addColorStop(1, "#e2e8f0");
  context.fillStyle = inner;
  context.fill();

  context.beginPath();
  context.arc(center, center, innerRadius + 8, 0, Math.PI * 2);
  context.lineWidth = 8;
  context.strokeStyle = "rgba(255,255,255,0.7)";
  context.stroke();

  const gloss = context.createLinearGradient(198, 118, 330, 340);
  gloss.addColorStop(0, "rgba(255,255,255,0.35)");
  gloss.addColorStop(0.45, "rgba(255,255,255,0.12)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gloss;
  context.beginPath();
  context.ellipse(302, 270, 122, 88, -0.58, 0, Math.PI * 2);
  context.fill();

  const texture = finalizeTexture(canvas);
  nodeDiscTextureCache.set(color, texture);
  return texture;
}

function createAvatarDiscTexture(dataUrl: string): THREE.CanvasTexture {
  const cached = avatarDiscTextureCache.get(dataUrl);
  if (cached) {
    return cached;
  }

  const { canvas, context } = makeBaseTextureCanvas(1024);
  const texture = finalizeTexture(canvas);

  const drawBase = () => {
    context.clearRect(0, 0, 1024, 1024);

    context.beginPath();
    context.arc(512, 512, 390, 0, Math.PI * 2);
    const disc = context.createRadialGradient(428, 392, 28, 512, 512, 390);
    disc.addColorStop(0, "#ffffff");
    disc.addColorStop(0.72, "#f8fafc");
    disc.addColorStop(1, "#dbe6f2");
    context.fillStyle = disc;
    context.fill();

    context.beginPath();
    context.arc(512, 512, 404, 0, Math.PI * 2);
    context.lineWidth = 12;
    context.strokeStyle = "rgba(255,255,255,0.82)";
    context.stroke();

    context.beginPath();
    context.arc(512, 512, 418, 0, Math.PI * 2);
    context.lineWidth = 8;
    context.strokeStyle = "rgba(148,163,184,0.26)";
    context.stroke();
  };

  drawBase();

  const image = new Image();
  image.onload = () => {
    drawBase();

    context.save();
    context.beginPath();
    context.arc(512, 512, 364, 0, Math.PI * 2);
    context.closePath();
    context.clip();
    context.drawImage(image, 148, 148, 728, 728);
    context.restore();

    const gloss = context.createLinearGradient(266, 190, 470, 468);
    gloss.addColorStop(0, "rgba(255,255,255,0.18)");
    gloss.addColorStop(0.42, "rgba(255,255,255,0.06)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gloss;
    context.beginPath();
    context.ellipse(386, 358, 154, 116, -0.58, 0, Math.PI * 2);
    context.fill();

    texture.needsUpdate = true;
  };
  image.src = dataUrl;

  avatarDiscTextureCache.set(dataUrl, texture);
  return texture;
}

function makeNodeObject(node: ForceGraphNode, avatarDataUrl?: string): THREE.Object3D {
  const group = new THREE.Group();
  const size = nodeDiscSize(node);

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture(node.color),
      transparent: true,
      depthWrite: false,
      opacity: avatarDataUrl ? 0.1 : node.tier === "core" ? 0.16 : 0.1,
      blending: THREE.AdditiveBlending,
    }),
  );
  glow.scale.set(size * 1.48, size * 1.48, 1);
  glow.position.set(0, 0, -1);
  disableRaycast(glow);
  group.add(glow);

  const disc = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: avatarDataUrl
        ? createAvatarDiscTexture(avatarDataUrl)
        : createPlainNodeTexture(node.color),
      transparent: true,
      depthWrite: true,
      depthTest: true,
      alphaTest: 0.22,
    }),
  );
  disc.scale.set(size, size, 1);
  disc.renderOrder = 3;
  disc.userData.nodeId = node.id;
  restrictSpriteRaycastToCircle(disc, 0.46);
  group.add(disc);

  const labelTexture = makeLabelTexture(node.name, avatarDataUrl ? "#f8fafc" : node.color);
  const labelCanvas = labelTexture.image;
  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }),
  );
  label.renderOrder = 5;
  label.scale.set(labelCanvas.width / 7.4, labelCanvas.height / 7.4, 1);
  label.position.set(0, -size * 0.78, 0);
  disableRaycast(label);
  group.add(label);

  return group;
}

function createLinkObject(link: ForceGraphLink): LinkObject {
  const group = new THREE.Group() as LinkObject;
  group.userData.linkKind = link.kind;
  group.userData.edgeId = link.id;
  group.userData.edgeKind = link.kind === "pair" ? "pair-edge" : "directed-edge";
  group.userData.baseOpacity = link.kind === "directed" ? 0.74 : 0.34;
  group.userData.baseWidth = linkDisplayWidth(link);
  const mainGeometry = new LineGeometry();
  mainGeometry.setPositions([0, 0, 0, 0, 0, 0]);
  mainGeometry.setColors(linkGradientColors(link));
  const mainMaterial = new LineMaterial({
    transparent: true,
    opacity: group.userData.baseOpacity,
    linewidth: group.userData.baseWidth,
    vertexColors: true,
    worldUnits: false,
    depthWrite: false,
  });
  const mainLine = new Line2(mainGeometry, mainMaterial);
  mainLine.renderOrder = 1;
  mainLine.userData.linkKind = link.kind;
  mainLine.userData.edgeId = link.id;
  mainLine.userData.edgeKind = group.userData.edgeKind;
  group.add(mainLine);
  group.userData.mainLine = mainLine;

  return group;
}

function linkDisplayWidth(link: ForceGraphLink): number {
  return link.kind === "directed"
    ? Math.max(1.7, link.width * 0.72)
    : Math.max(1.25, link.width * 0.58);
}

function updateLine2(line: Line2, start: THREE.Vector3, end: THREE.Vector3) {
  const geometry = line.geometry as LineGeometry;
  geometry.setPositions([start.x, start.y, start.z, end.x, end.y, end.z]);
  geometry.computeBoundingSphere();

  const material = line.material as LineMaterial;
  material.resolution.set(window.innerWidth, window.innerHeight);
}

function linkGradientColors(link: ForceGraphLink): number[] {
  if (link.kind === "pair") {
    const color = new THREE.Color("#bae6fd");
    return [color.r * 0.68, color.g * 0.68, color.b * 0.68, color.r, color.g, color.b];
  }

  const start = new THREE.Color("#5b3417");
  const end = new THREE.Color("#fed7aa");
  return [start.r, start.g, start.b, end.r, end.g, end.b];
}

function linkHoverLabel(link: ForceGraphLink): string {
  if (link.kind === "pair") {
    const raw = link.raw as ViewerPairEdge;
    const summary = raw.summary?.trim() ? raw.summary.trim() : "No summary";
    const title = link.label || raw.type || "Pair Relation";
    return `<div style="max-width:320px;padding:6px 8px;line-height:1.45"><strong>${title}</strong><div style="opacity:.82;margin-top:4px">${summary}</div></div>`;
  }

  const raw = link.raw as ViewerDirectedEdge;
  const summary = raw.summary?.trim() ? raw.summary.trim() : "No summary";
  const title = link.label || raw.display_relation || "Directed Relation";
  return `<div style="max-width:320px;padding:6px 8px;line-height:1.45"><strong>${title}</strong><div style="opacity:.82;margin-top:4px">${summary}</div></div>`;
}

function trimLinkToNodeDiscs(
  group: LinkObject,
  coords: { start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number } },
  link: ForceGraphLink,
): boolean {
  const sourceNode = link.source as unknown as ForceGraphNode;
  const targetNode = link.target as unknown as ForceGraphNode;
  const startRadius = nodeDiscSize(sourceNode) * 0.43;
  const endRadius = nodeDiscSize(targetNode) * 0.43;

  const dx = coords.end.x - coords.start.x;
  const dy = coords.end.y - coords.start.y;
  const dz = coords.end.z - coords.start.z;
  const lineLength = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (!Number.isFinite(lineLength) || lineLength <= startRadius + endRadius + 1) {
    return false;
  }

  const startT = startRadius / lineLength;
  const endT = 1 - endRadius / lineLength;
  const trimmedStart = new THREE.Vector3(
    coords.start.x + dx * startT,
    coords.start.y + dy * startT,
    coords.start.z + dz * startT,
  );
  const trimmedEnd = new THREE.Vector3(
    coords.start.x + dx * endT,
    coords.start.y + dy * endT,
    coords.start.z + dz * endT,
  );

  if (link.lane !== 0) {
    const side = new THREE.Vector3(-dy, dx, 0);
    if (side.lengthSq() < 0.001) {
      side.copy(LINK_SIDE_FALLBACK);
    }
    side.normalize().multiplyScalar(link.lane * Math.max(7, linkDisplayWidth(link) * 4.2));
    trimmedStart.add(side);
    trimmedEnd.add(side);
  }

  const direction = new THREE.Vector3().subVectors(trimmedEnd, trimmedStart);
  const trimmedLength = direction.length();

  if (trimmedLength <= 0.001) {
    return false;
  }

  updateLine2(group.userData.mainLine, trimmedStart, trimmedEnd);

  return true;
}

function setLinkObjectHighlighted(object: LinkObject, highlighted: boolean) {
  const material = object.userData.mainLine.material as LineMaterial;
  material.linewidth = object.userData.baseWidth * (highlighted ? 1.85 : 1);
  material.opacity = Math.min(
    0.96,
    object.userData.baseOpacity * (highlighted ? 1.75 : 1),
  );
  material.needsUpdate = true;
  object.userData.mainLine.renderOrder = highlighted ? 6 : 1;
}

function setGraphCursor(container: HTMLDivElement, cursor: string) {
  container.style.cursor = cursor;
  const canvas = container.querySelector("canvas");
  if (canvas) {
    canvas.style.cursor = cursor;
  }
}

export function ForceGraph3DCanvas({
  data,
  avatarByNodeId,
  onNodeClick,
  onLinkClick,
  onStageClick,
}: ForceGraph3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<any>(null);
  const onNodeClickRef = useRef(onNodeClick);
  const onLinkClickRef = useRef(onLinkClick);
  const onStageClickRef = useRef(onStageClick);
  const graphData = useMemo(() => toForceGraphData(data), [data]);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
    onLinkClickRef.current = onLinkClick;
    onStageClickRef.current = onStageClick;
  }, [onLinkClick, onNodeClick, onStageClick]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const graph = new ForceGraph3D(container, {
      controlType: "orbit",
    }) as any;
    graphRef.current = graph;
    let isPointerDown = false;
    let highlightedLinkObject: LinkObject | null = null;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const updateCursorFromPointer = (event: PointerEvent) => {
      const canvas = container.querySelector("canvas");
      const scene = graph.scene?.();
      const camera = graph.camera?.();
      if (!canvas || !scene || !camera) {
        setGraphCursor(container, isPointerDown ? "grabbing" : "default");
        return;
      }

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      raycaster.params.Line2 = { threshold: 5 };

      const intersections = raycaster.intersectObjects(scene.children, true);
      const hasNode = intersections.some((intersection) => {
        const object = intersection.object;
        return Boolean(object.userData.nodeId);
      });

      if (hasNode) {
        setGraphCursor(container, "pointer");
        return;
      }

      const hasLink = intersections.some((intersection) => {
        const object = intersection.object;
        return Boolean(object.userData.linkKind);
      });

      if (hasLink) {
        setGraphCursor(container, "help");
        return;
      }

      setGraphCursor(container, isPointerDown ? "grabbing" : "default");
    };

    const updateCursorAfterGraph = (event: PointerEvent) => {
      updateCursorFromPointer(event);
      window.requestAnimationFrame(() => updateCursorFromPointer(event));
    };

    graph
      .backgroundColor("rgba(0,0,0,0)")
      .graphData(graphData)
      .nodeThreeObject((node: ForceGraphNode) =>
        makeNodeObject(node, avatarByNodeId[node.id]),
      )
      .nodeLabel(() => "")
      .linkLabel((link: ForceGraphLink) => linkHoverLabel(link))
      .linkThreeObject((link: ForceGraphLink) => createLinkObject(link))
      .linkColor((link: ForceGraphLink) => link.color)
      .linkWidth((link: ForceGraphLink) => link.width)
      .linkOpacity(0.42)
      .linkHoverPrecision(10)
      .linkPositionUpdate((object: LinkObject, coords: any, link: ForceGraphLink) =>
        trimLinkToNodeDiscs(object, coords, link),
      )
      .linkDirectionalArrowLength(0)
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalParticles(0)
      .linkDirectionalParticleWidth(0)
      .linkDirectionalParticleSpeed(0)
      .enableNodeDrag(true)
      .showNavInfo(false)
      .onNodeClick((node: ForceGraphNode) => onNodeClickRef.current(node.id))
      .onLinkClick((link: ForceGraphLink) =>
        onLinkClickRef.current(
          link.id,
          link.kind === "pair" ? "pair-edge" : "directed-edge",
        ),
      )
      .onLinkHover((link: ForceGraphLink | null) => {
        if (highlightedLinkObject) {
          setLinkObjectHighlighted(highlightedLinkObject, false);
          highlightedLinkObject = null;
        }

        const scene = graph.scene?.();
        if (!link || !scene) {
          return;
        }

        scene.traverse((object: THREE.Object3D) => {
          if (highlightedLinkObject) {
            return;
          }

          const candidate = object as Partial<LinkObject>;
          if (
            candidate.userData?.edgeId === link.id &&
            candidate.userData.mainLine
          ) {
            highlightedLinkObject = candidate as LinkObject;
            setLinkObjectHighlighted(highlightedLinkObject, true);
          }
        });
      })
      .onBackgroundClick(() => onStageClickRef.current());

    const handlePointerDown = (event: PointerEvent) => {
      isPointerDown = true;
      updateCursorAfterGraph(event);
    };
    const handlePointerUp = (event: PointerEvent) => {
      isPointerDown = false;
      updateCursorAfterGraph(event);
    };
    const handlePointerMove = (event: PointerEvent) => {
      updateCursorAfterGraph(event);
    };
    const handlePointerLeave = () => {
      isPointerDown = false;
      setGraphCursor(container, "default");
    };

    container.addEventListener("pointerdown", handlePointerDown, true);
    container.addEventListener("pointermove", handlePointerMove, true);
    container.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    setGraphCursor(container, "default");

    graph
      .d3Force(
        "collide",
        forceCollide<ForceGraphNode>((node) =>
          Math.max(12, node.val * 2.85 + (node.degree === 0 ? 14 : 4)),
        )
          .strength(0.95)
          .iterations(3),
      );
    graph
      .d3Force(
        "x",
        forceX<ForceGraphNode>((node) => node.targetX).strength((node) =>
          node.degree === 0 ? 0.42 : 0.11,
        ),
      );
    graph
      .d3Force(
        "y",
        forceY<ForceGraphNode>((node) => node.targetY).strength((node) =>
          node.degree === 0 ? 0.42 : 0.11,
        ),
      );
    graph
      .d3Force(
        "z",
        forceZ<ForceGraphNode>((node) => node.targetZ).strength((node) =>
          node.degree === 0 ? 0.16 : 0.048,
        ),
      );
    graph.d3Force("charge")?.strength?.((node: ForceGraphNode) =>
      -(58 + node.val * node.val * 2 + (node.degree === 0 ? 84 : 18)),
    );
    graph.d3Force("link")?.distance?.((link: ForceGraphLink) =>
      link.kind === "directed" ? 144 : 112,
    );
    graph.d3Force("link")?.strength?.((link: ForceGraphLink) =>
      link.kind === "directed" ? 0.34 : 0.5,
    );
    graph.d3VelocityDecay?.(0.28);
    graph.d3AlphaDecay?.(0.032);
    graph.cameraPosition({ x: 0, y: 0, z: 500 }, undefined, 800);

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      graph.width(rect.width).height(rect.height);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown, true);
      container.removeEventListener("pointermove", handlePointerMove, true);
      container.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("resize", handleResize);
      graph._destructor?.();
      graphRef.current = null;
    };
  }, [avatarByNodeId, graphData]);

  return <div ref={containerRef} className="force-graph-3d" />;
}
