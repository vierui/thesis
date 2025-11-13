import { create } from 'zustand';

// 1. Bikin "KTP" atau interface buat state dan action lo
interface MindMapState {
  mindMapData: string;
  isLoadingMindMap: boolean;
  mindMapDocumentId: string; 
  setMindMapData: (data: string) => void;
  setIsLoadingMindMap: (status: boolean) => void;
  setMindMapDocumentId: (id: string) => void; 
}

// 2. Pasang "KTP" itu ke 'create' pake <MindMapState>
const useMindMapStore = create<MindMapState>((set) => ({
  // State awal harus sesuai sama "KTP"
  mindMapData: '',
  isLoadingMindMap: false,
  mindMapDocumentId: '', 

  // Action juga harus sesuai
  setMindMapData: (data) => set({ mindMapData: data }),
  setIsLoadingMindMap: (status) => set({ isLoadingMindMap: status }),
  setMindMapDocumentId: (id) => set({ mindMapDocumentId: id }), 
}));

export default useMindMapStore;