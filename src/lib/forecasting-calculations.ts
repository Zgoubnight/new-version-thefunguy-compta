import { Sale, Goal } from '@shared/types';
import { getYear, getMonth, format } from 'date-fns';
import { fr } from 'date-fns/locale';
export interface MonthlyForecast {
  month: string;
  monthIndex: number;
  // Budget
  salesTarget: number;
  revenueTarget: number;
  cumulativeRevenueTarget: number;
  // Actual
  actualSales: number;
  actualRevenue: number;
  cumulativeActualRevenue: number;
  revenueAchievementPercent: number;
  // Variance
  salesVariance: number;
  revenueVariance: number;
  cumulativeRevenueVariance: number;
  cumulativeRevenueVariancePercent: number;
}
export interface AnnualForecast {
  year: number;
  monthlyData: MonthlyForecast[];
  totals: {
    salesTarget: number;
    revenueTarget: number;
    actualSales: number;
    actualRevenue: number;
    revenueAchievementPercent: number;
    salesVariance: number;
    revenueVariance: number;
  };
}
export const calculateAnnualForecast = (sales: Sale[], goals: Goal[], year: number): AnnualForecast => {
  const currentYear = year;
  const monthlyData: MonthlyForecast[] = [];
  let cumulativeRevenueTarget = 0;
  let cumulativeActualRevenue = 0;
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(currentYear, i, 1);
    const monthName = format(monthDate, 'MMM', { locale: fr });
    const goal = goals.find(g => g.year === currentYear && g.month === i + 1);
    const salesTarget = goal?.salesTarget ?? 0;
    const revenueTarget = goal?.revenueTarget ?? 0;
    const monthSales = sales.filter(s => {
      const saleDate = new Date(s.saleDate);
      return getYear(saleDate) === currentYear && getMonth(saleDate) === i;
    });
    const actualSales = monthSales.reduce((sum, s) => sum + s.quantity, 0);
    const actualRevenue = monthSales.reduce((sum, s) => sum + s.totalPrice, 0);
    cumulativeRevenueTarget += revenueTarget;
    cumulativeActualRevenue += actualRevenue;
    const revenueAchievementPercent = revenueTarget > 0 ? (actualRevenue / revenueTarget) * 100 : 0;
    const salesVariance = actualSales - salesTarget;
    const revenueVariance = actualRevenue - revenueTarget;
    const cumulativeRevenueVariance = cumulativeActualRevenue - cumulativeRevenueTarget;
    const cumulativeRevenueVariancePercent = cumulativeRevenueTarget > 0 ? (cumulativeRevenueVariance / cumulativeRevenueTarget) * 100 : 0;
    monthlyData.push({
      month: monthName,
      monthIndex: i,
      salesTarget,
      revenueTarget,
      cumulativeRevenueTarget,
      actualSales,
      actualRevenue,
      cumulativeActualRevenue,
      revenueAchievementPercent,
      salesVariance,
      revenueVariance,
      cumulativeRevenueVariance,
      cumulativeRevenueVariancePercent,
    });
  }
  const totals = {
    salesTarget: monthlyData.reduce((sum, m) => sum + m.salesTarget, 0),
    revenueTarget: monthlyData.reduce((sum, m) => sum + m.revenueTarget, 0),
    actualSales: monthlyData.reduce((sum, m) => sum + m.actualSales, 0),
    actualRevenue: monthlyData.reduce((sum, m) => sum + m.actualRevenue, 0),
    get revenueAchievementPercent() {
      return this.revenueTarget > 0 ? (this.actualRevenue / this.revenueTarget) * 100 : 0;
    },
    get salesVariance() {
      return this.actualSales - this.salesTarget;
    },
    get revenueVariance() {
      return this.actualRevenue - this.revenueTarget;
    },
  };
  return {
    year: currentYear,
    monthlyData,
    totals,
  };
};