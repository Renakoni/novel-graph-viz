import { MousePointer2, Zap } from "lucide-react";

export function EmptyInspector() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-6 px-4 text-center animate-fade-in">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/10 bg-primary/5">
        <MousePointer2 size={32} className="animate-pulse text-primary/40" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold tracking-tight">Waiting for selection</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Click a node, pair edge, or directed edge in the graph to inspect its
          details here.
        </p>
      </div>
      <div className="w-full border-t border-border/50 pt-6">
        <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-secondary/30 p-4 text-left">
          <Zap size={16} className="mt-0.5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider">
              Interaction
            </p>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Scroll to zoom and drag the stage to inspect local neighborhoods.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
