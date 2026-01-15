import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConfigState {
  port: number;
  apiKeys: string[];
  selectedProviders: string[];
  setPort: (port: number) => void;
  addApiKey: (key: string) => void;
  removeApiKey: (index: number) => void;
  setSelectedProviders: (
    providers: string[] | ((prev: string[]) => string[]),
  ) => void;
  reset: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      port: 8317,
      apiKeys: [],
      selectedProviders: [],
      setPort: (port) => set({ port }),
      addApiKey: (key) =>
        set((state) => ({ apiKeys: [...state.apiKeys, key] })),
      removeApiKey: (index) =>
        set((state) => ({
          apiKeys: state.apiKeys.filter((_, idx) => idx !== index),
        })),
      setSelectedProviders: (providers) =>
        set((state) => ({
          selectedProviders:
            typeof providers === "function"
              ? providers(state.selectedProviders)
              : providers,
        })),
      reset: () => set({ port: 8317, apiKeys: [], selectedProviders: [] }),
    }),
    {
      name: "cliproxies-config",
      partialize: (state) => ({
        port: state.port,
        apiKeys: state.apiKeys,
        selectedProviders: state.selectedProviders,
      }),
    },
  ),
);
