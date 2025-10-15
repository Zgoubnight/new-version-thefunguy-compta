export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type SaleChannel = "site" | "amazon" | "pharmacy" | "influencer" | "reseller" | "cse" | "unknown";
export interface Product {
  id: string; // SKU can be used as ID
  name: string;
  sku: string;
  purchasePrice: number;
  salePrice: number;
  initialStock: number;
  stockChezMoi: number;
  stockAmazon: number;
  createdAt: string; // ISO 8601 date string
}
export interface Sale {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  source: string;
  saleDate: string; // ISO 8601 date string
  channel: SaleChannel;
  costOfSale: number;
  promoCode?: string;
}
export interface Customer {
  id: string;
  name: string;
  email?: string;
  source: string;
  createdAt: string; // ISO 8601 date string
}
export interface Goal {
  id: string; // e.g., "2024-07"
  month: number; // 1-12
  year: number;
  salesTarget: number;
  revenueTarget: number;
  createdAt: string; // ISO 8601 date string
}
export interface Report {
  id: string; // e.g., "2024-07"
  month: number;
  year: number;
  totalSales: number;
  revenue: number;
  grossMargin: number;
  netMargin: number;
  createdAt: string; // ISO 8601 date string
}
export interface Settings {
  id: 'global';
  netMarginFeePercentage: number; // e.g., 15 for 15%
  apiKey?: string;
  dataMigration2015To2025Done?: boolean;
  amazonIntegration?: {
    connected: boolean;
    lastSync?: string; // ISO 8601 date string
  };
}
export interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'batch-import';
  entity: 'product' | 'sale' | 'customer' | 'goal' | 'settings' | 'donation';
  entityId: string;
  details: string;
  timestamp: string; // ISO 8601 date string
}
export interface Donation {
  id: string;
  productId: string; // SKU
  quantity: number;
  reason: string;
  donationDate: string; // ISO 8601 date string
}