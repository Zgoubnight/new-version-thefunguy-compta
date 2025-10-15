import { Product, Sale, Settings, SaleChannel } from "@shared/types";
import { startOfMonth, format } from 'date-fns';
export interface DashboardMetrics {
  totalRevenue: number;
  totalSales: number;
  grossMargin: number;
  netMargin: number;
  totalProductsInStock: number;
  lowStockItemsCount: number;
  monthlyRevenue: { name: string; revenue: number; sales: number }[];
  salesByChannel: { name: SaleChannel; value: number }[];
}
export const calculateDashboardMetrics = (sales: Sale[], products: Product[], settings: Settings | null): DashboardMetrics => {
  let totalRevenue = 0;
  let totalSales = 0;
  let grossMargin = 0;
  const monthlyData: { [key: string]: { revenue: number; sales: number } } = {};
  const salesByChannelMap = new Map<SaleChannel, number>();
  sales.forEach(sale => {
    totalRevenue += sale.totalPrice;
    totalSales += sale.quantity;
    // Use historical cost of sale for accuracy
    grossMargin += sale.totalPrice - sale.costOfSale;
    const monthKey = format(startOfMonth(new Date(sale.saleDate)), 'MMM yyyy');
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { revenue: 0, sales: 0 };
    }
    monthlyData[monthKey].revenue += sale.totalPrice;
    monthlyData[monthKey].sales += sale.quantity;
    // Aggregate sales by channel
    const currentChannelCount = salesByChannelMap.get(sale.channel) || 0;
    salesByChannelMap.set(sale.channel, currentChannelCount + sale.quantity);
  });
  const salesByChannel = Array.from(salesByChannelMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const totalProductsInStock = products.reduce((acc, p) => acc + p.stockChezMoi + p.stockAmazon, 0);
  const lowStockItemsCount = products.filter(p => {
    const totalStock = p.stockChezMoi + p.stockAmazon;
    return totalStock > 0 && totalStock < 20;
  }).length;
  const monthlyRevenue = Object.entries(monthlyData)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
    .slice(-12); // show last 12 months
  const feePercentage = (settings?.netMarginFeePercentage ?? 15) / 100;
  const netMargin = grossMargin * (1 - feePercentage);
  return {
    totalRevenue,
    totalSales,
    grossMargin,
    netMargin,
    totalProductsInStock,
    lowStockItemsCount,
    monthlyRevenue,
    salesByChannel,
  };
};