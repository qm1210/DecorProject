import { create } from "zustand";

interface Preset {
  loaiCongTrinh: string;
  phongCach: string;
}

interface PresetState {
  preset: Preset | null;
  setPreset: (p: Preset) => void;
  clearPreset: () => void;
}

const usePresetStore = create<PresetState>((set) => ({
  preset: null,
  setPreset: (p) => set({ preset: p }),
  clearPreset: () => set({ preset: null }),
}));

export default usePresetStore;