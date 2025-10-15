import { create } from 'zustand';
import { Product, Sale, Customer, Goal, Report, Settings, AuditLog, Donation } from '@shared/types';
import { api } from './api-client';
import { DashboardMetrics, calculateDashboardMetrics } from './calculations';
interface AppState {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  goals: Goal[];
  reports: Report[];
  settings: Settings | null;
  auditLog: AuditLog[];
  donations: Donation[];
  dashboardMetrics: DashboardMetrics | null;
  isLoading: boolean;
  error: string | null;
  fetchInitialData: () => Promise<void>;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addSale: (sale: Sale, newCustomer?: Customer) => void;
  addSales: (sales: Sale[]) => void;
  updateSale: (sale: Sale) => void;
  deleteSale: (saleId: string) => void;
  upsertGoal: (goal: Goal) => void;
  updateSettings: (settings: Settings) => void;
  addDonation: (donation: Donation) => Promise<void>;
  syncAmazonSales: () => Promise<void>;
}
const recalculateMetrics = (state: AppState): DashboardMetrics => {
  return calculateDashboardMetrics(state.sales, state.products, state.settings);
};
export const useStore = create<AppState>((set, get) => ({
  products: [],
  sales: [],
  customers: [],
  goals: [],
  reports: [],
  settings: null,
  auditLog: [],
  donations: [],
  dashboardMetrics: null,
  isLoading: true,
  error: null,
  fetchInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [productsRes, salesRes, customersRes, goalsRes, reportsRes, settingsRes, auditLogRes, donationsRes] = await Promise.all([
        api<{ items: Product[] }>('/api/products'),
        api<{ items: Sale[] }>('/api/sales'),
        api<{ items: Customer[] }>('/api/customers'),
        api<{ items: Goal[] }>('/api/goals'),
        api<{ items: Report[] }>('/api/reports'),
        api<Settings>('/api/settings'),
        api<{ items: AuditLog[] }>('/api/audit-log'),
        api<{ items: Donation[] }>('/api/donations'),
      ]);
      const products = productsRes.items;
      const sales = salesRes.items;
      const settings = settingsRes;
      const metrics = calculateDashboardMetrics(sales, products, settings);
      set({
        products,
        sales,
        customers: customersRes.items,
        goals: goalsRes.items,
        reports: reportsRes.items,
        settings,
        auditLog: auditLogRes.items,
        donations: donationsRes.items,
        dashboardMetrics: metrics,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ isLoading: false, error: errorMessage });
      console.error("Failed to fetch initial data:", error);
    }
  },
  addProduct: (product: Product) => {
    set((state) => {
      const newState = { ...state, products: [...state.products, product] };
      return { ...newState, dashboardMetrics: recalculateMetrics(newState) };
    });
  },
  updateProduct: (updatedProduct: Product) => {
    set((state) => {
      const updatedProducts = state.products.map((p) =>
        p.id === updatedProduct.id ? updatedProduct : p
      );
      const newState = { ...state, products: updatedProducts };
      return { ...newState, dashboardMetrics: recalculateMetrics(newState) };
    });
  },
  deleteProduct: (productId: string) => {
    set((state) => {
      const updatedProducts = state.products.filter((p) => p.id !== productId);
      const newState = { ...state, products: updatedProducts };
      return { ...newState, dashboardMetrics: recalculateMetrics(newState) };
    });
  },
  addSale: (sale: Sale, newCustomer?: Customer) => {
    set((state) => {
      const newState = {
        ...state,
        sales: [...state.sales, sale],
        customers: newCustomer ? [...state.customers, newCustomer] : state.customers,
      };
      return { ...newState, dashboardMetrics: recalculateMetrics(newState) };
    });
  },
  addSales: (newSales: Sale[]) => {
    set((state) => {
      const updatedSales = [...state.sales, ...newSales];
      const newState = { ...state, sales: updatedSales };
      return { ...newState, dashboardMetrics: recalculateMetrics(newState) };
    });
  },
  updateSale: (updatedSale: Sale) => {
    set((state) => {
      const updatedSales = state.sales.map((s) => (s.id === updatedSale.id ? updatedSale : s));
      const newState = { ...state, sales: updatedSales };
      return { ...newState, dashboardMetrics: recalculateMetrics(newState) };
    });
  },
  deleteSale: (saleId: string) => {
    set((state) => {
      const updatedSales = state.sales.filter((s) => s.id !== saleId);
      const newState = { ...state, sales: updatedSales };
      return { ...newState, dashboardMetrics: recalculateMetrics(newState) };
    });
  },
  upsertGoal: (goal: Goal) => {
    set((state) => {
      const existingGoalIndex = state.goals.findIndex((g) => g.id === goal.id);
      let updatedGoals;
      if (existingGoalIndex > -1) {
        updatedGoals = [...state.goals];
        updatedGoals[existingGoalIndex] = goal;
      } else {
        updatedGoals = [...state.goals, goal];
      }
      return { goals: updatedGoals };
    });
  },
  updateSettings: (settings: Settings) => {
    set((state) => {
      const newState = { ...state, settings };
      return { ...newState, dashboardMetrics: recalculateMetrics(newState) };
    });
  },
  addDonation: async (donation: Donation) => {
    set((state) => ({ donations: [...state.donations, donation] }));
    // Refetch products to get updated stock
    const productsRes = await api<{ items: Product[] }>('/api/products');
    set((state) => {
      const newState = { ...state, products: productsRes.items };
      return { ...newState, dashboardMetrics: recalculateMetrics(newState) };
    });
  },
  syncAmazonSales: async () => {
    await api('/api/settings/amazon/sync-sales', { method: 'POST' });
    // After sync, refetch all data to update the entire app state
    await get().fetchInitialData();
  },
}));