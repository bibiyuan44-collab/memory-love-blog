import { create } from 'zustand';

export type { MemorySpot } from '@/data/memorySpots';

interface DesktopState {
  booting: boolean;
  setBooting: (booting: boolean) => void;
  
  openWindows: string[];
  windowOrder: string[]; // z-index management
  activeMemory: string | null;
  lastOpenedMemory: string | null;
  
  openWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  
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

export const useDesktopStore = create<DesktopState>((set) => ({
  booting: true,
  setBooting: (booting) => set({ booting }),
  
  openWindows: [],
  windowOrder: [],
  activeMemory: null,
  lastOpenedMemory: null,
  
  openWindow: (id) => set((state) => {
    if (state.openWindows.includes(id)) {
      return {
        windowOrder: [...state.windowOrder.filter(w => w !== id), id],
        activeMemory: id,
        lastOpenedMemory: id
      };
    }
    return {
      openWindows: [...state.openWindows, id],
      windowOrder: [...state.windowOrder, id],
      activeMemory: id,
      lastOpenedMemory: id
    };
  }),
  
  closeWindow: (id) => set((state) => {
    const newOpen = state.openWindows.filter(w => w !== id);
    const newOrder = state.windowOrder.filter(w => w !== id);
    return {
      openWindows: newOpen,
      windowOrder: newOrder,
      activeMemory: newOrder.length > 0 ? newOrder[newOrder.length - 1] : null
    };
  }),
  
  focusWindow: (id) => set((state) => ({
    windowOrder: [...state.windowOrder.filter(w => w !== id), id],
    activeMemory: id
  })),
  
  ambientColor: '#000020',
  setAmbientColor: (color) => set({ ambientColor: color }),
  
  audioMuted: false,
  toggleAudio: () => set((state) => ({ audioMuted: !state.audioMuted })),
  
  appOpen: null,
  openApp: (app) => set({ appOpen: app }),
  closeApp: () => set({ appOpen: null, openWindows: [], windowOrder: [], activeMemory: null }),
  
  editingPointId: null,
  setEditingPointId: (editingPointId) => set({ editingPointId }),

  bbsConnected: false,
  setBbsConnected: (bbsConnected) => set({ bbsConnected }),
}));