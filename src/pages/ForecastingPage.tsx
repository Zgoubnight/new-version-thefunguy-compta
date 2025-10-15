import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { useMemo, useState, useEffect } from "react";
import { getMonth, getYear, format } from "date-fns";
import { fr } from 'date-fns/locale';
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Goal } from "@shared/types";
import { useShallow } from "zustand/react/shallow";
import { AnnualForecastTable } from "@/components/AnnualForecastTable";
import { calculateAnnualForecast } from "@/lib/forecasting-calculations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export default function ForecastingPage() {
  const { goals, sales, upsertGoal } = useStore(
    useShallow(s => ({ goals: s.goals, sales: s.sales, upsertGoal: s.upsertGoal }))
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ salesTarget: 0, revenueTarget: 0 });
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(getYear(new Date())); // Always include the current year
    sales.forEach(s => years.add(getYear(new Date(s.saleDate))));
    goals.forEach(g => years.add(g.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [sales, goals]);
  useEffect(() => {
    // Default to the most recent year with data when the component loads or data changes.
    if (availableYears.length > 0 && selectedYear === null) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);
  const annualForecastData = useMemo(() => {
    if (selectedYear === null) return null;
    return calculateAnnualForecast(sales, goals, selectedYear);
  }, [sales, goals, selectedYear]);
  const handleSetGoal = async () => {
    const now = new Date();
    const goalData = {
      month: getMonth(now) + 1,
      year: getYear(now),
      salesTarget: newGoal.salesTarget,
      revenueTarget: newGoal.revenueTarget,
    };
    try {
      const savedGoal = await api<Goal>('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
      });
      upsertGoal(savedGoal);
      toast.success("L'objectif mensuel a été défini avec succès !");
      setIsGoalDialogOpen(false);
    } catch (error) {
      toast.error("Échec de la définition du nouvel objectif.");
      console.error(error);
    }
  };
  const handleOpenDialog = () => {
    const now = new Date();
    const currentMonth = getMonth(now) + 1;
    const currentYear = getYear(now);
    const currentGoal = goals.find(g => g.year === currentYear && g.month === currentMonth);
    setNewGoal({
      salesTarget: currentGoal?.salesTarget ?? 0,
      revenueTarget: currentGoal?.revenueTarget ?? 0,
    });
    setIsGoalDialogOpen(true);
  };
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight">Prévisions Annuelles</h1>
          {selectedYear !== null && (
            <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <PlusCircle className="mr-2 h-4 w-4" /> Définir l'objectif du mois
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Définir l'objectif pour {format(new Date(), 'MMMM yyyy', { locale: fr })}</DialogTitle>
              <DialogDescription>
                Définissez vos objectifs de ventes et de revenus pour le mois en cours.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="salesTarget" className="text-right">Objectif de ventes</Label>
                <Input id="salesTarget" type="number" value={newGoal.salesTarget} onChange={(e) => setNewGoal({ ...newGoal, salesTarget: parseInt(e.target.value) || 0 })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="revenueTarget" className="text-right">Objectif de revenus</Label>
                <Input id="revenueTarget" type="number" value={newGoal.revenueTarget} onChange={(e) => setNewGoal({ ...newGoal, revenueTarget: parseFloat(e.target.value) || 0 })} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSetGoal}>Enregistrer l'objectif</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {annualForecastData ? (
        <Card>
          <CardHeader>
            <CardTitle>Prévisionnel {annualForecastData.year}</CardTitle>
            <CardDescription>
              Comparaison mensuelle des objectifs budgétés par rapport aux performances réelles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnnualForecastTable data={annualForecastData} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Chargement des données prévisionnelles...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}