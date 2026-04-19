export function tierColor(tier: string): string {
  switch (tier) {
    case "core":
      return "#38bdf8"; // Sky 400 - Electric Blue
    case "active":
      return "#818cf8"; // Indigo 400
    case "background":
      return "#94a3b8"; // Slate 400
    case "transient":
      return "#475569"; // Slate 600
    default:
      return "#94a3b8";
  }
}

export function edgeColor(kind: "pair" | "directed"): string {
  return kind === "pair" ? "rgba(148, 163, 184, 0.15)" : "rgba(56, 189, 248, 0.4)";
}
