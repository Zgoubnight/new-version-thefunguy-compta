import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
export default function ReportsPage() {
  const reports = useStore(state => state.reports);
  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [reports]);
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-4xl font-bold tracking-tight">Rapports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Rapports mensuels</CardTitle>
          <CardDescription>
            Un résumé de vos performances financières pour chaque mois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead className="text-right">Ventes totales (unités)</TableHead>
                <TableHead className="text-right">Chiffre d'affaires</TableHead>
                <TableHead className="text-right">Marge brute</TableHead>
                <TableHead className="text-right">Marge nette (estimée)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Aucun rapport généré. Les rapports apparaîtront ici après que des ventes aient été enregistrées.
                  </TableCell>
                </TableRow>
              ) : (
                sortedReports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium capitalize">
                      {format(new Date(report.year, report.month - 1), 'MMMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">{report.totalSales.toLocaleString('fr-FR')}</TableCell>
                    <TableCell className="text-right">
                      {report.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                    <TableCell className="text-right">
                      {report.grossMargin.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                    <TableCell className="text-right">
                      {report.netMargin.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}