import { create } from 'zustand';

interface HeaderState {
  title: string | null;
  badgeCount: number | null;
  badgeLabel: string | null;
}

interface HeaderActions {
  setHeader: (_data: { title?: string; count?: number | null; label?: string }) => void;
  resetHeader: () => void;
}

export const useHeaderStore = create<HeaderState & HeaderActions>((set) => ({
  title: null,
  badgeCount: null,
  badgeLabel: null,
  setHeader: (data) => set((state) => ({ 
    title: data.title ?? state.title,
    badgeCount: data.count !== undefined ? data.count : state.badgeCount, 
    badgeLabel: data.label ?? 'Records'
  })),
  resetHeader: () => set({ title: null, badgeCount: null, badgeLabel: null }),
}));