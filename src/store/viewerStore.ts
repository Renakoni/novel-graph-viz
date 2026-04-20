import { create } from "zustand";
import { buildGraphIndex, type ViewerGraphIndex } from "../data/graphIndex";
import type {
  LoadedViewerGraph,
  ViewerFilters,
  ViewerSelection,
  ViewerTier,
} from "../types/viewerGraph";

type ViewerStore = {
  loaded: LoadedViewerGraph | null;
  index: ViewerGraphIndex | null;
  selection: ViewerSelection;
  avatarByNodeId: Record<string, string>;
  filters: ViewerFilters;
  isLoading: boolean;
  error: string | null;
  setLoadedGraph: (loaded: LoadedViewerGraph | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  resetFilters: () => void;
  setSelection: (selection: ViewerSelection) => void;
  setSearch: (search: string) => void;
  toggleTier: (tier: ViewerTier) => void;
  setChapterRange: (startId: string | null, endId: string | null) => void;
  togglePairType: (pairType: string) => void;
  toggleDirectedStance: (stance: string) => void;
  toggleDirectedStructuralBase: (base: string) => void;
  setMinDirectedStrength: (value: number) => void;
  setShowPairEdges: (value: boolean) => void;
  setShowDirectedEdges: (value: boolean) => void;
  setAvatarMap: (avatarByNodeId: Record<string, string>) => void;
  setNodeAvatar: (nodeId: string, dataUrl: string) => void;
  removeNodeAvatar: (nodeId: string) => void;
};

const DEFAULT_FILTERS: ViewerFilters = {
  search: "",
  tiers: [],
  chapterStartId: null,
  chapterEndId: null,
  pairTypes: [],
  directedStances: [],
  directedStructuralBases: [],
  minDirectedStrength: 0,
  showPairEdges: true,
  showDirectedEdges: true,
};

function toggleString(values: string[], nextValue: string): string[] {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];
}

export const useViewerStore = create<ViewerStore>((set) => ({
  loaded: null,
  index: null,
  selection: null,
  avatarByNodeId: {},
  filters: DEFAULT_FILTERS,
  isLoading: false,
  error: null,
  setLoadedGraph: (loaded) =>
    set({
      loaded,
      index: loaded ? buildGraphIndex(loaded.data) : null,
      selection: null,
      avatarByNodeId: {},
      filters: DEFAULT_FILTERS,
      isLoading: false,
      error: null,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  resetFilters: () => set({ filters: DEFAULT_FILTERS, selection: null }),
  setSelection: (selection) => set({ selection }),
  setSearch: (search) =>
    set((state) => ({ filters: { ...state.filters, search } })),
  toggleTier: (tier) =>
    set((state) => ({
      filters: {
        ...state.filters,
        tiers: toggleString(state.filters.tiers, tier) as ViewerTier[],
      },
    })),
  setChapterRange: (startId, endId) =>
    set((state) => ({
      filters: {
        ...state.filters,
        chapterStartId: startId,
        chapterEndId: endId,
      },
    })),
  togglePairType: (pairType) =>
    set((state) => ({
      filters: {
        ...state.filters,
        pairTypes: toggleString(state.filters.pairTypes, pairType),
      },
    })),
  toggleDirectedStance: (stance) =>
    set((state) => ({
      filters: {
        ...state.filters,
        directedStances: toggleString(state.filters.directedStances, stance),
      },
    })),
  toggleDirectedStructuralBase: (base) =>
    set((state) => ({
      filters: {
        ...state.filters,
        directedStructuralBases: toggleString(
          state.filters.directedStructuralBases,
          base,
        ),
      },
    })),
  setMinDirectedStrength: (value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        minDirectedStrength: value,
      },
    })),
  setShowPairEdges: (value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        showPairEdges: value,
      },
    })),
  setShowDirectedEdges: (value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        showDirectedEdges: value,
      },
    })),
  setAvatarMap: (avatarByNodeId) => set({ avatarByNodeId }),
  setNodeAvatar: (nodeId, dataUrl) =>
    set((state) => ({
      avatarByNodeId: {
        ...state.avatarByNodeId,
        [nodeId]: dataUrl,
      },
    })),
  removeNodeAvatar: (nodeId) =>
    set((state) => {
      const next = { ...state.avatarByNodeId };
      delete next[nodeId];
      return { avatarByNodeId: next };
    }),
}));
