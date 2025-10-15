import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnnualForecast } from "@/lib/forecasting-calculations";
import { cn } from "@/lib/utils";
interface AnnualForecastTableProps {
  data: AnnualForecast;
}
const formatCurrency = (value: number) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatNumber = (value: number) => value.toLocaleString('fr-FR');
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const getVarianceColor = (value: number) => {
  if (value >= 0) return "text-green-600 dark:text-green-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "";
};
const getPercentVarianceColor = (value: number) => {
  if (value >= 100) return "text-green-600 dark:text-green-400";
  if (value >= 80) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};
export function AnnualForecastTable({ data }: AnnualForecastTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full text-sm">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-48 font-semibold text-foreground">Indicateur</TableHead>
            {data.monthlyData.map(month => (
              <TableHead key={month.monthIndex} className="text-center font-semibold text-foreground capitalize">{month.month}</TableHead>
            ))}
            <TableHead className="text-right font-semibold text-foreground">Total {data.year}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* BUDGET Section */}
          <TableRow className="bg-muted/50 font-bold text-foreground hover:bg-muted/50">
            <TableCell colSpan={14}>BUDGET</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Unité</TableCell>
            {data.monthlyData.map(m => <TableCell key={m.monthIndex} className="text-center">{formatNumber(m.salesTarget)}</TableCell>)}
            <TableCell className="text-right font-semibold">{formatNumber(data.totals.salesTarget)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>MC Budget</TableCell>
            {data.monthlyData.map(m => <TableCell key={m.monthIndex} className="text-center">{formatCurrency(m.revenueTarget)}</TableCell>)}
            <TableCell className="text-right font-semibold">{formatCurrency(data.totals.revenueTarget)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Cumul MC</TableCell>
            {data.monthlyData.map(m => <TableCell key={m.monthIndex} className="text-center">{formatCurrency(m.cumulativeRevenueTarget)}</TableCell>)}
            <TableCell className="text-right font-semibold">{formatCurrency(data.totals.revenueTarget)}</TableCell>
          </TableRow>
          {/* REALISE Section */}
          <TableRow className="bg-muted/50 font-bold text-foreground hover:bg-muted/50">
            <TableCell colSpan={14}>RÉALISÉ</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Effectifs</TableCell>
            {data.monthlyData.map(m => <TableCell key={m.monthIndex} className="text-center">{formatNumber(m.actualSales)}</TableCell>)}
            <TableCell className="text-right font-semibold">{formatNumber(data.totals.actualSales)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>MC Réelle</TableCell>
            {data.monthlyData.map(m => <TableCell key={m.monthIndex} className="text-center">{formatCurrency(m.actualRevenue)}</TableCell>)}
            <TableCell className="text-right font-semibold">{formatCurrency(data.totals.actualRevenue)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Cumul MC</TableCell>
            {data.monthlyData.map(m => <TableCell key={m.monthIndex} className="text-center">{formatCurrency(m.cumulativeActualRevenue)}</TableCell>)}
            <TableCell className="text-right font-semibold">{formatCurrency(data.totals.actualRevenue)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>% MC</TableCell>
            {data.monthlyData.map(m => <TableCell key={m.monthIndex} className={cn("text-center font-semibold", getPercentVarianceColor(m.revenueAchievementPercent))}>{formatPercent(m.revenueAchievementPercent)}</TableCell>)}
            <TableCell className={cn("text-right font-semibold", getPercentVarianceColor(data.totals.revenueAchievementPercent))}>{formatPercent(data.totals.revenueAchievementPercent)}</TableCell>
          </TableRow>
          {/* ECART Section */}
          <TableRow className="bg-muted/50 font-bold text-foreground hover:bg-muted/50">
            <TableCell colSpan={14}>ÉCART</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Effectifs</TableCell>
            {data.monthlyData.map(m => <TableCell key={m.monthIndex} className={cn("text-center font-semibold", getVarianceColor(m.salesVariance))}>{formatNumber(m.salesVariance)}</TableCell>)}
            <TableCell className={cn("text-right font-semibold", getVarianceColor(data.totals.salesVariance))}>{formatNumber(data.totals.salesVariance)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>MC Mensuel</TableCell>
            {data.monthlyData.map(m => <TableCell key={m.monthIndex} className={cn("text-center font-semibold", getVarianceColor(m.revenueVariance))}>{formatCurrency(m.revenueVariance)}</TableCell>)}
            <TableCell className={cn("text-right font-semibold", getVarianceColor(data.totals.revenueVariance))}>{formatCurrency(data.totals.revenueVariance)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>MC Cumul</TableCell>
            {data.monthlyData.map(m => <TableCell key={m.monthIndex} className={cn("text-center font-semibold", getVarianceColor(m.cumulativeRevenueVariance))}>{formatCurrency(m.cumulativeRevenueVariance)}</TableCell>)}
            <TableCell className="text-right font-semibold">-</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>% MC Cumul</TableCell>
            {data.monthlyData.map(m => <TableCell key={m.monthIndex} className={cn("text-center font-semibold", getVarianceColor(m.cumulativeRevenueVariancePercent))}>{formatPercent(m.cumulativeRevenueVariancePercent)}</TableCell>)}
            <TableCell className="text-right font-semibold">-</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}