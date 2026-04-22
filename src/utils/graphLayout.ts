import type {
  ViewerDirectedEdge,
  ViewerNode,
  ViewerPairEdge,
} from "../types/viewerGraph";

export type PositionedNode = {
  x: number;
  y: number;
  size: number;
  communityId?: string;
  depthBand?: number;
};

type LayoutEdge = {
  source: string;
  target: string;
  weight: number;
};

type LayoutPoint = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
};

type ComponentLayout = {
  ids: string[];
  positions: Map<string, PositionedNode>;
  width: number;
  height: number;
  score: number;
};

type LayoutResult = {
  positions: Map<string, PositionedNode>;
  width: number;
  height: number;
  score: number;
};

const TIER_SIZE_BONUS: Record<ViewerNode["tier"], number> = {
  core: 7,
  active: 4,
  background: 2,
  transient: 0,
};

function nodeSize(node: ViewerNode, degree: number): number {
  const importance = Math.max(0, Math.min(100, node.importance));
  return 5 + TIER_SIZE_BONUS[node.tier] + Math.sqrt(importance) * 0.75 + Math.sqrt(degree);
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function stableUnit(value: string): number {
  return ((stableHash(value) % 1000) / 1000 - 0.5) * 2;
}

function buildEdges(
  pairEdges: ViewerPairEdge[],
  directedEdges: ViewerDirectedEdge[],
  nodeIds: Set<string>,
): LayoutEdge[] {
  const edgeByKey = new Map<string, LayoutEdge>();

  function pairLayoutWeight(edge: ViewerPairEdge): number {
    const confidence = edge.confidence ?? 0.5;
    const sharedIntensity = (edge.shared_intensity_score ?? 45) / 100;
    const stabilityScore =
      edge.stable_graph_eligibility_score ??
      (edge.stable_graph_eligible === true
        ? 68
        : edge.stable_graph_eligible === false
        ? 32
        : 50);
    const stabilityFactor = 0.62 + (stabilityScore / 100) * 0.92;
    const inferredFactor = edge.inferred ? 0.84 : 1;

    return (
      (1.1 + confidence * 1.25 + sharedIntensity * 0.95) *
      stabilityFactor *
      inferredFactor
    );
  }

  function directedLayoutWeight(edge: ViewerDirectedEdge): number {
    const strength = Math.max(0, edge.strength);
    const mentions = Math.min(6, edge.mention_count ?? 0);
    const stabilityScore =
      edge.stable_graph_eligibility_score ??
      (edge.stable_graph_eligible === true
        ? 66
        : edge.stable_graph_eligible === false
        ? 34
        : 50);
    const stabilityFactor = 0.58 + (stabilityScore / 100) * 0.96;

    return (0.72 + strength / 42 + mentions * 0.08) * stabilityFactor;
  }

  function addEdge(source: string, target: string, weight: number) {
    if (!nodeIds.has(source) || !nodeIds.has(target) || source === target) {
      return;
    }

    const left = source < target ? source : target;
    const right = source < target ? target : source;
    const key = `${left}\u0000${right}`;
    const existing = edgeByKey.get(key);

    if (existing) {
      existing.weight += weight;
      return;
    }

    edgeByKey.set(key, { source: left, target: right, weight });
  }

  for (const edge of pairEdges) {
    addEdge(edge.source, edge.target, pairLayoutWeight(edge));
  }

  for (const edge of directedEdges) {
    addEdge(edge.source, edge.target, directedLayoutWeight(edge));
  }

  return [...edgeByKey.values()];
}

function connectedComponents(nodes: ViewerNode[], edges: LayoutEdge[]): string[][] {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }

  const seen = new Set<string>();
  const components: string[][] = [];

  for (const node of nodes) {
    if (seen.has(node.id)) {
      continue;
    }

    const component: string[] = [];
    const stack = [node.id];
    seen.add(node.id);

    while (stack.length > 0) {
      const id = stack.pop()!;
      component.push(id);

      for (const next of adjacency.get(id) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }

    components.push(component);
  }

  return components.sort((left, right) => right.length - left.length);
}

function weightedAdjacency(ids: string[], edges: LayoutEdge[]) {
  const idSet = new Set(ids);
  const adjacency = new Map<string, Array<{ id: string; weight: number }>>();

  for (const id of ids) {
    adjacency.set(id, []);
  }

  for (const edge of edges) {
    if (!idSet.has(edge.source) || !idSet.has(edge.target)) {
      continue;
    }

    adjacency.get(edge.source)?.push({ id: edge.target, weight: edge.weight });
    adjacency.get(edge.target)?.push({ id: edge.source, weight: edge.weight });
  }

  return adjacency;
}

function assignCommunities(
  ids: string[],
  edges: LayoutEdge[],
  nodeById: Map<string, ViewerNode>,
): Map<string, string> {
  if (ids.length <= 4) {
    return new Map(ids.map((id) => [id, ids[0]]));
  }

  const adjacency = weightedAdjacency(ids, edges);
  const labels = new Map(ids.map((id) => [id, id]));
  const orderedIds = [...ids].sort((left, right) => {
    const degreeDelta =
      (adjacency.get(right)?.length ?? 0) - (adjacency.get(left)?.length ?? 0);
    if (degreeDelta !== 0) {
      return degreeDelta;
    }

    return (nodeById.get(right)?.importance ?? 0) - (nodeById.get(left)?.importance ?? 0);
  });

  for (let iteration = 0; iteration < 12; iteration += 1) {
    let changed = false;

    for (const id of orderedIds) {
      const scores = new Map<string, number>();
      const neighbors = adjacency.get(id) ?? [];

      for (const neighbor of neighbors) {
        const label = labels.get(neighbor.id) ?? neighbor.id;
        const bias = 1 + (nodeById.get(neighbor.id)?.importance ?? 0) / 180;
        scores.set(label, (scores.get(label) ?? 0) + neighbor.weight * bias);
      }

      if (scores.size === 0) {
        continue;
      }

      let bestLabel = labels.get(id)!;
      let bestScore = -Infinity;

      for (const [label, score] of scores) {
        const tieBreaker = stableUnit(`${id}::${label}`) * 0.001;
        const current = score + tieBreaker;
        if (current > bestScore) {
          bestScore = current;
          bestLabel = label;
        }
      }

      if (bestLabel !== labels.get(id)) {
        labels.set(id, bestLabel);
        changed = true;
      }
    }

    if (!changed) {
      break;
    }
  }

  const membersByLabel = new Map<string, string[]>();
  for (const id of ids) {
    const label = labels.get(id)!;
    const bucket = membersByLabel.get(label);
    if (bucket) {
      bucket.push(id);
    } else {
      membersByLabel.set(label, [id]);
    }
  }

  const relabelled = new Map<string, string>();
  const sortedCommunities = [...membersByLabel.entries()].sort((left, right) => {
    const leftScore = left[1].reduce((sum, id) => sum + (nodeById.get(id)?.importance ?? 0), 0);
    const rightScore = right[1].reduce((sum, id) => sum + (nodeById.get(id)?.importance ?? 0), 0);
    return rightScore - leftScore || right[1].length - left[1].length;
  });

  sortedCommunities.forEach(([_, memberIds], index) => {
    const communityId = `community_${memberIds[0]}_${index}`;
    for (const id of memberIds) {
      relabelled.set(id, communityId);
    }
  });

  return relabelled;
}

function layoutSingleton(node: ViewerNode, degree: number): ComponentLayout {
  const size = nodeSize(node, degree);

  return {
    ids: [node.id],
    positions: new Map([[node.id, { x: 0, y: 0, size }]]),
    width: size * 3.2,
    height: size * 3.2,
    score: node.importance,
  };
}

function layoutSmallComponent(
  ids: string[],
  nodeById: Map<string, ViewerNode>,
  degreeById: Map<string, number>,
): ComponentLayout {
  const positions = new Map<string, PositionedNode>();
  const sorted = [...ids].sort((left, right) => {
    const leftNode = nodeById.get(left)!;
    const rightNode = nodeById.get(right)!;
    return rightNode.importance - leftNode.importance;
  });
  const radius = 18 + sorted.length * 5;

  sorted.forEach((id, index) => {
    const node = nodeById.get(id)!;
    const angle = (Math.PI * 2 * index) / sorted.length - Math.PI / 2;
    positions.set(id, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: nodeSize(node, degreeById.get(id) ?? 0),
    });
  });

  return {
    ids: sorted,
    positions,
    width: radius * 2 + 40,
    height: radius * 2 + 40,
    score: sorted.reduce((sum, id) => sum + nodeById.get(id)!.importance, 0),
  };
}

function layoutForceComponent(
  ids: string[],
  nodeById: Map<string, ViewerNode>,
  degreeById: Map<string, number>,
  edges: LayoutEdge[],
): ComponentLayout {
  const points = new Map<string, LayoutPoint>();
  const count = ids.length;
  const radius = 36 + Math.sqrt(count) * 24;

  ids.forEach((id, index) => {
    const hash = stableHash(id);
    const jitter = ((hash % 1000) / 1000 - 0.5) * 10;
    const angle = index * Math.PI * (3 - Math.sqrt(5));
    const degree = degreeById.get(id) ?? 0;
    const node = nodeById.get(id)!;

    points.set(id, {
      id,
      x: Math.cos(angle) * (radius + jitter),
      y: Math.sin(angle) * (radius + jitter),
      vx: 0,
      vy: 0,
      mass: 1 + Math.sqrt(degree) + node.importance / 80,
    });
  });

  const localEdges = edges.filter((edge) => points.has(edge.source) && points.has(edge.target));
  const area = Math.max(2000, count * 1500);
  const idealDistance = Math.sqrt(area / count);
  const iterations = Math.min(360, 120 + count * 10);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const temperature = 1 - iteration / iterations;
    const pointList = [...points.values()];

    for (let leftIndex = 0; leftIndex < pointList.length; leftIndex += 1) {
      const left = pointList[leftIndex];
      for (let rightIndex = leftIndex + 1; rightIndex < pointList.length; rightIndex += 1) {
        const right = pointList[rightIndex];
        const dx = left.x - right.x;
        const dy = left.y - right.y;
        const distanceSquared = Math.max(0.01, dx * dx + dy * dy);
        const distance = Math.sqrt(distanceSquared);
        const force = ((idealDistance * idealDistance) / distanceSquared) * 0.9;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        left.vx += fx / left.mass;
        left.vy += fy / left.mass;
        right.vx -= fx / right.mass;
        right.vy -= fy / right.mass;
      }
    }

    for (const edge of localEdges) {
      const source = points.get(edge.source)!;
      const target = points.get(edge.target)!;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
      const desired = idealDistance * (1.55 - Math.min(0.9, edge.weight * 0.18));
      const force = ((distance - desired) / desired) * edge.weight * 0.12;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    for (const point of pointList) {
      point.vx -= point.x * 0.006;
      point.vy -= point.y * 0.006;

      const speed = Math.sqrt(point.vx * point.vx + point.vy * point.vy);
      const limit = 10 * temperature + 0.8;
      if (speed > limit) {
        point.vx = (point.vx / speed) * limit;
        point.vy = (point.vy / speed) * limit;
      }

      point.x += point.vx;
      point.y += point.vy;
      point.vx *= 0.56;
      point.vy *= 0.56;
    }
  }

  const positions = new Map<string, PositionedNode>();
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points.values()) {
    const node = nodeById.get(point.id)!;
    const size = nodeSize(node, degreeById.get(point.id) ?? 0);
    positions.set(point.id, { x: point.x, y: point.y, size });
    minX = Math.min(minX, point.x - size);
    minY = Math.min(minY, point.y - size);
    maxX = Math.max(maxX, point.x + size);
    maxY = Math.max(maxY, point.y + size);
  }

  return {
    ids,
    positions,
    width: Math.max(80, maxX - minX + 56),
    height: Math.max(80, maxY - minY + 56),
    score: ids.reduce((sum, id) => sum + nodeById.get(id)!.importance, 0),
  };
}

function normalizeComponent(component: ComponentLayout): ComponentLayout {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const position of component.positions.values()) {
    minX = Math.min(minX, position.x - position.size);
    minY = Math.min(minY, position.y - position.size);
    maxX = Math.max(maxX, position.x + position.size);
    maxY = Math.max(maxY, position.y + position.size);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const normalized = new Map<string, PositionedNode>();

  for (const [id, position] of component.positions) {
    normalized.set(id, {
      ...position,
      x: position.x - centerX,
      y: position.y - centerY,
    });
  }

  return {
    ...component,
    positions: normalized,
    width: Math.max(40, maxX - minX + 56),
    height: Math.max(40, maxY - minY + 56),
  };
}

function placeComponent(
  target: Map<string, PositionedNode>,
  component: ComponentLayout,
  offsetX: number,
  offsetY: number,
) {
  for (const [id, position] of component.positions) {
    target.set(id, {
      ...position,
      x: position.x + offsetX,
      y: position.y + offsetY,
    });
  }
}

function placeRing(
  target: Map<string, PositionedNode>,
  components: ComponentLayout[],
  startRadius: number,
  ringGap: number,
  ellipseRatio: number,
) {
  if (components.length === 0) {
    return;
  }

  let cursor = 0;
  let ringIndex = 0;

  while (cursor < components.length) {
    const radius = startRadius + ringGap * ringIndex;
    const circumference = Math.max(320, Math.PI * 2 * radius * ellipseRatio);
    const ring: ComponentLayout[] = [];
    let occupied = 0;

    while (cursor < components.length) {
      const next = components[cursor];
      const footprint = Math.max(next.width, next.height) + 46;

      if (ring.length > 0 && occupied + footprint > circumference * 0.94) {
        break;
      }

      ring.push(next);
      occupied += footprint;
      cursor += 1;
    }

    const angularSpan = occupied / radius;
    let angle = -Math.PI / 2 - angularSpan / 2;

    for (const component of ring) {
      const footprint = Math.max(component.width, component.height) + 46;
      const span = footprint / radius;
      angle += span / 2;

      placeComponent(
        target,
        component,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * ellipseRatio,
      );

      angle += span / 2;
    }

    ringIndex += 1;
  }
}

function finalizePackedPositions(positions: Map<string, PositionedNode>): LayoutResult {
  if (positions.size === 0) {
    return {
      positions,
      width: 0,
      height: 0,
      score: 0,
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const position of positions.values()) {
    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
    maxX = Math.max(maxX, position.x);
    maxY = Math.max(maxY, position.y);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  for (const position of positions.values()) {
    position.x = (position.x - centerX) / 36;
    position.y = (position.y - centerY) / 36;
  }

  return {
    positions,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
    score: 0,
  };
}

function packComponents(components: ComponentLayout[]): LayoutResult {
  const positions = new Map<string, PositionedNode>();
  const sorted = components
    .map(normalizeComponent)
    .sort((left, right) => right.score - left.score || right.ids.length - left.ids.length);

  if (sorted.length === 0) {
    return finalizePackedPositions(positions);
  }

  const [primary, ...rest] = sorted;
  placeComponent(positions, primary, 0, 0);

  const clustered = rest.filter((component) => component.ids.length > 1);
  const singletons = rest.filter((component) => component.ids.length === 1);
  const primaryRadius = Math.max(primary.width, primary.height) / 2;

  placeRing(
    positions,
    clustered,
    primaryRadius + 140,
    150,
    0.82,
  );

  placeRing(
    positions,
    singletons,
    primaryRadius + (clustered.length > 0 ? 300 : 220),
    110,
    0.9,
  );
  const result = finalizePackedPositions(positions);
  result.score = sorted.reduce((sum, component) => sum + component.score, 0);
  return result;
}

function annotateCommunities(
  positions: Map<string, PositionedNode>,
  communityByNodeId: Map<string, string>,
) {
  const centers = new Map<
    string,
    { x: number; y: number; size: number; score: number }
  >();

  for (const [nodeId, communityId] of communityByNodeId) {
    const position = positions.get(nodeId);
    if (!position) {
      continue;
    }

    const entry = centers.get(communityId) ?? { x: 0, y: 0, size: 0, score: 0 };
    entry.x += position.x;
    entry.y += position.y;
    entry.size += 1;
    entry.score += position.size;
    centers.set(communityId, entry);
  }

  const orderedCommunityIds = [...centers.entries()]
    .map(([communityId, entry]) => ({
      communityId,
      x: entry.x / entry.size,
      y: entry.y / entry.size,
      score: entry.score,
      radius: Math.sqrt((entry.x / entry.size) ** 2 + (entry.y / entry.size) ** 2),
    }))
    .sort((left, right) => left.radius - right.radius || right.score - left.score);

  const depthBandByCommunity = new Map<string, number>();
  orderedCommunityIds.forEach((entry, index) => {
    if (index === 0) {
      depthBandByCommunity.set(entry.communityId, 0);
      return;
    }

    const magnitude = Math.ceil(index / 2);
    const sign = index % 2 === 0 ? -1 : 1;
    depthBandByCommunity.set(entry.communityId, magnitude * sign);
  });

  for (const [nodeId, position] of positions) {
    const communityId = communityByNodeId.get(nodeId);
    if (!communityId) {
      continue;
    }

    position.communityId = communityId;
    position.depthBand = depthBandByCommunity.get(communityId) ?? 0;
  }
}

function layoutComponentWithCommunities(
  componentIds: string[],
  nodeById: Map<string, ViewerNode>,
  degreeById: Map<string, number>,
  edges: LayoutEdge[],
): ComponentLayout {
  if (componentIds.length === 1) {
    const node = nodeById.get(componentIds[0])!;
    return layoutSingleton(node, degreeById.get(node.id) ?? 0);
  }

  if (componentIds.length <= 4) {
    return layoutSmallComponent(componentIds, nodeById, degreeById);
  }

  const communityByNodeId = assignCommunities(componentIds, edges, nodeById);
  const nodesByCommunity = new Map<string, string[]>();

  for (const nodeId of componentIds) {
    const communityId = communityByNodeId.get(nodeId)!;
    const bucket = nodesByCommunity.get(communityId);
    if (bucket) {
      bucket.push(nodeId);
    } else {
      nodesByCommunity.set(communityId, [nodeId]);
    }
  }

  const communityLayouts = [...nodesByCommunity.values()].map((memberIds) => {
    if (memberIds.length === 1) {
      const node = nodeById.get(memberIds[0])!;
      return layoutSingleton(node, degreeById.get(node.id) ?? 0);
    }

    if (memberIds.length <= 4) {
      return layoutSmallComponent(memberIds, nodeById, degreeById);
    }

    const memberSet = new Set(memberIds);
    return layoutForceComponent(
      memberIds,
      nodeById,
      degreeById,
      edges.filter(
        (edge) => memberSet.has(edge.source) && memberSet.has(edge.target),
      ),
    );
  });

  const packed = packComponents(communityLayouts);
  annotateCommunities(packed.positions, communityByNodeId);

  return {
    ids: componentIds,
    positions: packed.positions,
    width: Math.max(80, packed.width + 56),
    height: Math.max(80, packed.height + 56),
    score: componentIds.reduce((sum, id) => sum + nodeById.get(id)!.importance, 0),
  };
}

export function buildInitialPositions(
  nodes: ViewerNode[],
  pairEdges: ViewerPairEdge[],
  directedEdges: ViewerDirectedEdge[],
): Map<string, PositionedNode> {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges = buildEdges(pairEdges, directedEdges, nodeIds);
  const degreeById = new Map(nodes.map((node) => [node.id, 0]));

  for (const edge of edges) {
    degreeById.set(edge.source, (degreeById.get(edge.source) ?? 0) + 1);
    degreeById.set(edge.target, (degreeById.get(edge.target) ?? 0) + 1);
  }

  const edgeByComponentKey = new Map<string, LayoutEdge[]>();
  const components = connectedComponents(nodes, edges).map((componentIds) => {
    const key = componentIds.join("\u0000");
    const idSet = new Set(componentIds);
    edgeByComponentKey.set(
      key,
      edges.filter((edge) => idSet.has(edge.source) && idSet.has(edge.target)),
    );

    return layoutComponentWithCommunities(
      componentIds,
      nodeById,
      degreeById,
      edgeByComponentKey.get(key) ?? [],
    );
  });

  return packComponents(components).positions;
}
