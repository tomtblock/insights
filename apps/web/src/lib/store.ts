import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type HealthStatus = 'green' | 'yellow' | 'red' | 'unknown';

interface FilterState {
  venues: string[];
  domains: string[];
  minEdge: number;
  minScore: number;
  status: string;
  timeWindow: string;
  onlyMapped: boolean;
  onlyHealthy: boolean;
}

interface AppState {
  // UI State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // Health
  healthStatus: HealthStatus;
  readOnlyMode: boolean;
  setHealthStatus: (status: HealthStatus, readOnly?: boolean) => void;
  
  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  
  // Selected items
  selectedMarketId: string | null;
  selectedOpportunityId: string | null;
  selectedEventId: string | null;
  setSelectedMarket: (id: string | null) => void;
  setSelectedOpportunity: (id: string | null) => void;
  setSelectedEvent: (id: string | null) => void;
  
  // Active view state
  opportunityDetailOpen: boolean;
  setOpportunityDetailOpen: (open: boolean) => void;
  
  // Real-time connection
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
}

const defaultFilters: FilterState = {
  venues: [],
  domains: [],
  minEdge: 0,
  minScore: 60,
  status: 'open',
  timeWindow: '24h',
  onlyMapped: false,
  onlyHealthy: true,
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // UI State
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      
      // Health
      healthStatus: 'unknown',
      readOnlyMode: false,
      setHealthStatus: (status, readOnly = false) => set({ healthStatus: status, readOnlyMode: readOnly }),
      
      // Filters
      filters: defaultFilters,
      setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
      resetFilters: () => set({ filters: defaultFilters }),
      
      // Selected items
      selectedMarketId: null,
      selectedOpportunityId: null,
      selectedEventId: null,
      setSelectedMarket: (id) => set({ selectedMarketId: id }),
      setSelectedOpportunity: (id) => set({ selectedOpportunityId: id }),
      setSelectedEvent: (id) => set({ selectedEventId: id }),
      
      // Active view state
      opportunityDetailOpen: false,
      setOpportunityDetailOpen: (open) => set({ opportunityDetailOpen: open }),
      
      // Real-time connection
      isConnected: false,
      setConnected: (connected) => set({ isConnected: connected }),
    }),
    {
      name: 'arb-platform-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        filters: state.filters,
      }),
    }
  )
);

