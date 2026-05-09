import { create } from 'zustand';

export type { MemorySpot } from '@/data/memorySpots';

interface DesktopState {
  booting: boolean;
  setBooting: (booting: boolean) => void;

  activeWindows: Record<string, DesktopWindow>;
  taskbarButtonCenters: Record<string, WindowTargetPoint>;
  highestZIndex: number;
  focusedWindowId: string | null;
  lastOpenedMemory: string | null;

  openWindow: (id: string, title: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  setWindowMaximized: (id: string, maximized: boolean) => void;
  setTaskbarButtonCenter: (id: string, point: WindowTargetPoint | null) => void;
  
  ambientColor: string;
  setAmbientColor: (color: string) => void;
  
  audioMuted: boolean;
  toggleAudio: () => void;
  
  // App specific states
  appOpen: string | null;
  openApp: (app: string) => void;
  closeApp: () => void;
  
  // Edit state
  editingPointId: string | null;
  setEditingPointId: (id: string | null) => void;

  // BBS connection state
  bbsConnected: boolean;
  setBbsConnected: (connected: boolean) => void;
}

interface DesktopWindow {
  id: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

interface WindowTargetPoint {
  x: number;
  y: number;
}

const getNextFocusedWindowId = (windows: Record<string, DesktopWindow>) => {
  const candidates = Object.values(windows).filter((windowItem) => !windowItem.isMinimized);
  if (candidates.length === 0) return null;
  return candidates.reduce((top, current) => (current.zIndex > top.zIndex ? current : top)).id;
};

export const useDesktopStore = create<DesktopState>((set) => ({
  booting: true,
  setBooting: (booting) => set({ booting }),

  activeWindows: {},
  taskbarButtonCenters: {},
  highestZIndex: 10,
  focusedWindowId: null,
  lastOpenedMemory: null,

  openWindow: (id, title) => set((state) => {
    const nextZIndex = state.highestZIndex + 1;
    const existing = state.activeWindows[id];
    return {
      activeWindows: {
        ...state.activeWindows,
        [id]: {
          id,
          title: existing?.title ?? title,
          isMinimized: false,
          isMaximized: existing?.isMaximized ?? false,
          zIndex: nextZIndex,
        },
      },
      highestZIndex: nextZIndex,
      focusedWindowId: id,
      lastOpenedMemory: id === 'food-memories' ? state.lastOpenedMemory : id,
    };
  }),

  closeWindow: (id) => set((state) => {
    const { [id]: _removed, ...remaining } = state.activeWindows;
    const { [id]: _removedTarget, ...remainingTargets } = state.taskbarButtonCenters;
    return {
      activeWindows: remaining,
      taskbarButtonCenters: remainingTargets,
      focusedWindowId: getNextFocusedWindowId(remaining),
    };
  }),

  focusWindow: (id) => set((state) => {
    const current = state.activeWindows[id];
    if (!current) return {};
    const nextZIndex = state.highestZIndex + 1;
    return {
      activeWindows: {
        ...state.activeWindows,
        [id]: {
          ...current,
          isMinimized: false,
          zIndex: nextZIndex,
        },
      },
      highestZIndex: nextZIndex,
      focusedWindowId: id,
    };
  }),

  minimizeWindow: (id) => set((state) => {
    const current = state.activeWindows[id];
    if (!current) return {};
    const nextWindows = {
      ...state.activeWindows,
      [id]: {
        ...current,
        isMinimized: true,
      },
    };
    return {
      activeWindows: nextWindows,
      focusedWindowId: state.focusedWindowId === id ? getNextFocusedWindowId(nextWindows) : state.focusedWindowId,
    };
  }),

  setWindowMaximized: (id, maximized) => set((state) => {
    const current = state.activeWindows[id];
    if (!current) return {};
    return {
      activeWindows: {
        ...state.activeWindows,
        [id]: {
          ...current,
          isMaximized: maximized,
        },
      },
    };
  }),

  setTaskbarButtonCenter: (id, point) => set((state) => {
    if (!point) {
      const { [id]: _removed, ...remaining } = state.taskbarButtonCenters;
      return { taskbarButtonCenters: remaining };
    }
    return {
      taskbarButtonCenters: {
        ...state.taskbarButtonCenters,
        [id]: point,
      },
    };
  }),

  ambientColor: '#000020',
  setAmbientColor: (color) => set({ ambientColor: color }),

  audioMuted: false,
  toggleAudio: () => set((state) => ({ audioMuted: !state.audioMuted })),

  appOpen: null,
  openApp: (app) => set({ appOpen: app }),
  closeApp: () => set({ appOpen: null }),

  editingPointId: null,
  setEditingPointId: (editingPointId) => set({ editingPointId }),

  bbsConnected: false,
  setBbsConnected: (bbsConnected) => set({ bbsConnected }),
}));