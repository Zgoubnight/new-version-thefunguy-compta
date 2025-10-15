import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Customer } from "@shared/types";
interface CustomerWithStats extends Customer {
  totalOrders: number;
  totalSpent: number;
}
export default function ClientsPage() {
  const { customers, sales } = useStore(
    useShallow(s => ({ customers: s.customers, sales: s.sales }))
  );
  const clientsWithStats: CustomerWithStats[] = useMemo(() => {
    const salesByCustomer = new Map<string, { totalOrders: number; totalSpent: number }>();
    sales.forEach(sale => {
      const stats = salesByCustomer.get(sale.customerId) || { totalOrders: 0, totalSpent: 0 };
      stats.totalOrders += 1;
      stats.totalSpent += sale.totalPrice;
      salesByCustomer.set(sale.customerId, stats);
    });
    return customers
      .map(customer => ({
        ...customer,
        totalOrders: salesByCustomer.get(customer.id)?.totalOrders || 0,
        totalSpent: salesByCustomer.get(customer.id)?.totalSpent || 0,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, sales]);
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-4xl font-bold tracking-tight">Clients</h1>
      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom du client</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Commandes totales</TableHead>
                <TableHead className="text-right">Total dépensé</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsWithStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucun client trouv��.
                  </TableCell>
                </TableRow>
              ) : (
                clientsWithStats.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.source}</TableCell>
                    <TableCell className="text-right">{client.totalOrders}</TableCell>
                    <TableCell className="text-right">
                      {client.totalSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
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