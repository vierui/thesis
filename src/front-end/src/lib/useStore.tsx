import { create } from 'zustand';

interface AppState {
  triggerFunction: () => void;
  setFunction: (fn: () => void) => void;
}

interface SidebarState {
  isOpen: boolean,
  setIsOpen: (newState: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  triggerFunction: () => {},
  setFunction: (fn) => set({ triggerFunction: fn }),
}));

export const useSidebarState = create<SidebarState>((set) => ({
  isOpen: false,
  setIsOpen: (newState) => set({ isOpen: newState })
}))

