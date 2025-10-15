import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Donation } from "@shared/types";
import { useShallow } from "zustand/react/shallow";
export default function DonationsPage() {
  const { donations, products, addDonation } = useStore(
    useShallow(s => ({ donations: s.donations, products: s.products, addDonation: s.addDonation }))
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState({ productId: '', quantity: 1, reason: '' });
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products]);
  const sortedDonations = useMemo(() => {
    return [...donations].sort((a, b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime());
  }, [donations]);
  const handleAddDonation = async () => {
    if (!formState.productId || formState.quantity <= 0) {
      toast.error("Veuillez sélectionner un produit et entrer une quantité valide.");
      return;
    }
    try {
      const newDonation = await api<Donation>('/api/donations', {
        method: 'POST',
        body: JSON.stringify(formState),
      });
      await addDonation(newDonation);
      toast.success("Don enregistré avec succès ! Le stock a été mis à jour.");
      setIsDialogOpen(false);
      setFormState({ productId: '', quantity: 1, reason: '' });
    } catch (error) {
      toast.error("Échec de l'enregistrement du don.");
      console.error(error);
    }
  };
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Dons</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Enregistrer un don
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enregistrer un nouveau don</DialogTitle>
              <DialogDescription>
                Enregistrez un don de produit. Le stock sera automatiquement déduit.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product" className="text-right">Produit</Label>
                <Select value={formState.productId} onValueChange={(value) => setFormState(prev => ({ ...prev, productId: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>{product.name} ({product.sku})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantité</Label>
                <Input id="quantity" type="number" min="1" value={formState.quantity} onChange={(e) => setFormState(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="reason" className="text-right pt-2">Raison</Label>
                <Textarea id="reason" placeholder="Ex: Don à une association, produit périmé..." value={formState.reason} onChange={(e) => setFormState(prev => ({ ...prev, reason: e.target.value }))} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddDonation}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historique des dons</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead>Raison</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDonations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucun don enregistré.
                  </TableCell>
                </TableRow>
              ) : (
                sortedDonations.map((donation) => (
                  <TableRow key={donation.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{format(new Date(donation.donationDate), 'd MMM yyyy', { locale: fr })}</TableCell>
                    <TableCell>{productMap.get(donation.productId) || donation.productId}</TableCell>
                    <TableCell className="text-right">{donation.quantity}</TableCell>
                    <TableCell>{donation.reason || '-'}</TableCell>
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