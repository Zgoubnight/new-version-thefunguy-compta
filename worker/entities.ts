import { IndexedEntity } from "./core-utils";
import type { Product, Sale, Customer, Goal, Report, Settings, AuditLog, Donation } from "@shared/types";
// PRODUCT ENTITY
export class ProductEntity extends IndexedEntity<Product> {
  static readonly entityName = "product";
  static readonly indexName = "products";
  static readonly initialState: Product = {
    id: "",
    name: "",
    sku: "",
    purchasePrice: 0,
    salePrice: 0,
    initialStock: 0,
    stockChezMoi: 0,
    stockAmazon: 0,
    createdAt: "",
  };
}
// SALE ENTITY
export class SaleEntity extends IndexedEntity<Sale> {
  static readonly entityName = "sale";
  static readonly indexName = "sales";
  static readonly initialState: Sale = {
    id: "",
    customerId: "",
    productId: "",
    quantity: 0,
    totalPrice: 0,
    source: "unknown",
    saleDate: "",
    channel: "unknown",
    costOfSale: 0,
    promoCode: "",
  };
}
// CUSTOMER ENTITY
export class CustomerEntity extends IndexedEntity<Customer> {
  static readonly entityName = "customer";
  static readonly indexName = "customers";
  static readonly initialState: Customer = {
    id: "",
    name: "",
    email: "",
    source: "unknown",
    createdAt: "",
  };
}
// GOAL ENTITY
export class GoalEntity extends IndexedEntity<Goal> {
  static readonly entityName = "goal";
  static readonly indexName = "goals";
  static readonly initialState: Goal = {
    id: "",
    month: 0,
    year: 0,
    salesTarget: 0,
    revenueTarget: 0,
    createdAt: "",
  };
}
// REPORT ENTITY
export class ReportEntity extends IndexedEntity<Report> {
  static readonly entityName = "report";
  static readonly indexName = "reports";
  static readonly initialState: Report = {
    id: "",
    month: 0,
    year: 0,
    totalSales: 0,
    revenue: 0,
    grossMargin: 0,
    netMargin: 0,
    createdAt: "",
  };
}
// SETTINGS ENTITY
export class SettingsEntity extends IndexedEntity<Settings> {
  static readonly entityName = "settings";
  static readonly indexName = "settings"; // Not really indexed, but required
  static readonly initialState: Settings = {
    id: 'global',
    netMarginFeePercentage: 15, // Default to 15%
    apiKey: "",
    dataMigration2015To2025Done: false,
    amazonIntegration: {
      connected: false,
    },
  };
}
// AUDIT LOG ENTITY
export class AuditLogEntity extends IndexedEntity<AuditLog> {
  static readonly entityName = "auditlog";
  static readonly indexName = "auditlogs";
  static readonly initialState: AuditLog = {
    id: "",
    action: 'create',
    entity: 'product',
    entityId: "",
    details: "",
    timestamp: "",
  };
}
// DONATION ENTITY
export class DonationEntity extends IndexedEntity<Donation> {
  static readonly entityName = "donation";
  static readonly indexName = "donations";
  static readonly initialState: Donation = {
    id: "",
    productId: "",
    quantity: 0,
    reason: "",
    donationDate: "",
  };
}