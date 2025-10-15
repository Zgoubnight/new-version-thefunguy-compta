import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, MoreHorizontal, Edit, Trash2, PlusCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo, useRef, useState, useEffect } from "react";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Sale, SaleChannel, Customer } from "@shared/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShallow } from "zustand/react/shallow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CHANNEL_BADGE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
const saleChannels: SaleChannel[] = ["site", "amazon", "pharmacy", "influencer", "reseller", "cse", "unknown"];
type MappedSale = { customerName: string; productSku: string; quantity: number; totalPrice: number; source: string; saleDate: string; };
type ColumnMapping = { [key in keyof MappedSale]: string };
const initialSaleFormState = {
  productId: '', customerId: '', customerName: '', quantity: 1, totalPrice: 0, source: '', saleDate: new Date().toISOString().split('T')[0], channel: 'site' as SaleChannel, promoCode: ''
};
export default function SalesPage() {
  const { sales, customers, products, fetchInitialData, updateSale, deleteSale, addSale } = useStore(
    useShallow(s => ({
      sales: s.sales, customers: s.customers, products: s.products, fetchInitialData: s.fetchInitialData, updateSale: s.updateSale, deleteSale: s.deleteSale, addSale: s.addSale
    }))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [importData, setImportData] = useState<{ headers: string[], rows: any[] }>({ headers: [], rows: [] });
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({ customerName: '', productSku: '', quantity: '', totalPrice: '', source: '', saleDate: '' });
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editSaleForm, setEditSaleForm] = useState<Partial<Sale>>({});
  const [createSaleForm, setCreateSaleForm] = useState(initialSaleFormState);
  const [calculatedCosts, setCalculatedCosts] = useState({ unitCost: 0, totalCost: 0 });
  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c.name])), [customers]);
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  useEffect(() => {
    if (createSaleForm.productId) {
      const product = productMap.get(createSaleForm.productId);
      if (product) {
        const unitCost = product.purchasePrice;
        const totalCost = unitCost * createSaleForm.quantity;
        setCalculatedCosts({ unitCost, totalCost });
      }
    } else {
      setCalculatedCosts({ unitCost: 0, totalCost: 0 });
    }
  }, [createSaleForm.productId, createSaleForm.quantity, productMap]);
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let rows: any[]; let headers: string[];
        if (file.name.endsWith('.csv')) {
          const parsed = Papa.parse(data as string, { header: true, skipEmptyLines: true });
          rows = parsed.data; headers = parsed.meta.fields || [];
        } else {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          headers = rows.shift() || [];
          rows = XLSX.utils.sheet_to_json(worksheet);
        }
        setImportData({ headers, rows });
        const newMapping: Partial<ColumnMapping> = {};
        const lowerCaseHeaders = headers.map(h => h.toLowerCase());
        const mappingKeys: { key: keyof MappedSale, terms: string[] }[] = [
            { key: 'customerName', terms: ['customer name', 'client', 'nom du client'] }, { key: 'productSku', terms: ['product sku', 'sku', 'sku du produit'] }, { key: 'quantity', terms: ['quantity', 'quantité'] }, { key: 'totalPrice', terms: ['total price', 'prix total'] }, { key: 'source', terms: ['source'] }, { key: 'saleDate', terms: ['date', 'sale date'] },
        ];
        mappingKeys.forEach(({ key, terms }) => {
            const foundHeader = headers[lowerCaseHeaders.findIndex(h => terms.some(term => h.includes(term)))];
            if (foundHeader) newMapping[key] = foundHeader;
        });
        setColumnMapping(prev => ({ ...prev, ...newMapping }));
        setIsMappingDialogOpen(true);
      } catch (error) {
        toast.error("Échec de la lecture du fichier."); console.error(error);
      }
    };
    reader.readAsBinaryString(file);
    if (event.target) event.target.value = '';
  };
  const processAndImportData = async () => {
    const newSales = importData.rows.map(row => {
      const saleDateRaw = row[columnMapping.saleDate];
      let saleDate;
      if (typeof saleDateRaw === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        saleDate = new Date(excelEpoch.getTime() + saleDateRaw * 24 * 60 * 60 * 1000).toISOString();
      } else {
        saleDate = new Date(saleDateRaw).toISOString();
      }
      return {
        customerName: row[columnMapping.customerName], productSku: row[columnMapping.productSku], quantity: parseInt(row[columnMapping.quantity], 10), totalPrice: parseFloat(row[columnMapping.totalPrice]), source: row[columnMapping.source] || 'Import', saleDate: saleDate,
      };
    }).filter(sale => sale.customerName && sale.productSku && !isNaN(sale.quantity) && !isNaN(sale.totalPrice));
    if (newSales.length === 0) { throw new Error("Aucune donnée de vente valide trouvée après le mappage."); }
    await api('/api/sales/batch', { method: 'POST', body: JSON.stringify(newSales) });
    await fetchInitialData();
    return `${newSales.length} ventes importées avec succès !`;
  };
  const handleConfirmImport = () => {
    toast.promise(processAndImportData(), { loading: 'Importation des ventes...', success: (message) => message, error: (err) => err.message || 'Échec du traitement des données de vente.', });
    setIsMappingDialogOpen(false); setImportData({ headers: [], rows: [] });
  };
  const handleExport = () => {
    const dataToExport = sales.map(sale => ({ 'Nom du client': customerMap.get(sale.customerId) || 'Inconnu', 'Nom du produit': productMap.get(sale.productId)?.name || 'Inconnu', 'SKU du produit': sale.productId, 'Source': sale.source, 'Date': format(new Date(sale.saleDate), 'yyyy-MM-dd'), 'Quantité': sale.quantity, 'Prix total': sale.totalPrice.toFixed(2), 'Coût de vente': sale.costOfSale.toFixed(2), 'Code Promo': sale.promoCode, 'Canal': sale.channel, }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url); link.setAttribute('download', `fungicount-ventes-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("Données de vente exportées avec succès !");
  };
  const handleEditSale = (sale: Sale) => { setSelectedSale(sale); setEditSaleForm({ quantity: sale.quantity, totalPrice: sale.totalPrice, channel: sale.channel, promoCode: sale.promoCode }); setIsEditDialogOpen(true); };
  const handleUpdateSale = async () => {
    if (!selectedSale) return;
    try {
      const updated = await api<Sale>(`/api/sales/${selectedSale.id}`, { method: 'PUT', body: JSON.stringify(editSaleForm) });
      updateSale(updated); await fetchInitialData(); toast.success("Vente mise à jour avec succès !");
      setIsEditDialogOpen(false); setSelectedSale(null);
    } catch (error) { toast.error("Échec de la mise à jour de la vente."); }
  };
  const handleDeleteSale = async (saleId: string) => {
    try {
      await api(`/api/sales/${saleId}`, { method: 'DELETE' });
      deleteSale(saleId); await fetchInitialData(); toast.success("Vente supprimée avec succès !");
    } catch (error) { toast.error("Échec de la suppression de la vente."); }
  };
  const handleCreateSale = async () => {
    const { customerId, customerName, ...saleData } = createSaleForm;
    if (!saleData.productId || (!customerId && !customerName)) {
      toast.error("Produit et client sont requis."); return;
    }
    try {
      const payload = { ...saleData, saleDate: new Date(saleData.saleDate).toISOString(), customerId: customerId === 'new' ? undefined : customerId, customerName: customerId === 'new' ? customerName : undefined };
      const { sale, customer } = await api<{ sale: Sale, customer?: Customer }>('/api/sales', { method: 'POST', body: JSON.stringify(payload) });
      addSale(sale, customer); await fetchInitialData(); toast.success("Vente créée avec succès !");
      setIsCreateDialogOpen(false); setCreateSaleForm(initialSaleFormState);
    } catch (error) { toast.error("Échec de la création de la vente."); }
  };
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Ventes</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Créer une vente</Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Importer</Button>
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Exporter</Button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv,.xlsx,.xls" className="hidden" />
      </div>
      <Card>
        <CardHeader><CardTitle>Toutes les transactions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Produit</TableHead><TableHead>Canal</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Qté</TableHead><TableHead className="text-right">Prix Total</TableHead><TableHead className="text-right">Coût de vente</TableHead><TableHead>Code Promo</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {sales.length === 0 ? (<TableRow><TableCell colSpan={9} className="h-24 text-center">Aucune vente trouvée.</TableCell></TableRow>) : (sales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()).map((sale) => (<TableRow key={sale.id} className="hover:bg-muted/50"><TableCell className="font-medium">{customerMap.get(sale.customerId) || 'Client inconnu'}</TableCell><TableCell>{productMap.get(sale.productId)?.name || 'Produit inconnu'}</TableCell><TableCell><Badge variant="secondary" className={cn("capitalize", CHANNEL_BADGE_COLORS[sale.channel] || CHANNEL_BADGE_COLORS.unknown)}>{sale.channel}</Badge></TableCell><TableCell>{format(new Date(sale.saleDate), 'PP', { locale: fr })}</TableCell><TableCell className="text-right">{sale.quantity}</TableCell><TableCell className="text-right">{sale.totalPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</TableCell><TableCell className="text-right">{sale.costOfSale.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</TableCell><TableCell>{sale.promoCode || '-'}</TableCell><TableCell className="text-right"><AlertDialog><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Ouvrir</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem onClick={() => handleEditSale(sale)}><Edit className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem><DropdownMenuSeparator /><AlertDialogTrigger asChild><DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem></AlertDialogTrigger></DropdownMenuContent></DropdownMenu><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. La vente sera définitivement supprimée.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSale(sale.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow>)))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Modifier la vente</DialogTitle><DialogDescription>Mettez à jour les détails de la vente.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="quantity" className="text-right">Quantité</Label><Input id="quantity" type="number" value={editSaleForm.quantity} onChange={(e) => setEditSaleForm({ ...editSaleForm, quantity: parseInt(e.target.value) || 0 })} className="col-span-3" /></div><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="totalPrice" className="text-right">Prix Total</Label><Input id="totalPrice" type="number" value={editSaleForm.totalPrice} onChange={(e) => setEditSaleForm({ ...editSaleForm, totalPrice: parseFloat(e.target.value) || 0 })} className="col-span-3" /></div><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="promoCode" className="text-right">Code promo</Label><Input id="promoCode" value={editSaleForm.promoCode || ''} onChange={(e) => setEditSaleForm({ ...editSaleForm, promoCode: e.target.value })} className="col-span-3" /></div><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="channel" className="text-right">Canal</Label><Select value={editSaleForm.channel} onValueChange={(value: SaleChannel) => setEditSaleForm({ ...editSaleForm, channel: value })}><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionner un canal" /></SelectTrigger><SelectContent>{saleChannels.map(channel => (<SelectItem key={channel} value={channel} className="capitalize">{channel}</SelectItem>))}</SelectContent></Select></div></div><DialogFooter><Button type="submit" onClick={handleUpdateSale}>Enregistrer</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isMappingDialogOpen} onOpenChange={setIsMappingDialogOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Mapper les colonnes du fichier</DialogTitle><DialogDescription>Associez les colonnes de votre fichier aux champs de données requis.</DialogDescription></DialogHeader><div className="grid gap-4 py-4">{Object.keys(columnMapping).map((key) => (<div key={key} className="grid grid-cols-3 items-center gap-4"><Label htmlFor={key} className="text-right capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label><Select value={columnMapping[key as keyof ColumnMapping]} onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [key]: value }))}><SelectTrigger className="col-span-2"><SelectValue placeholder="Sélectionner une colonne" /></SelectTrigger><SelectContent>{importData.headers.map(header => (<SelectItem key={header} value={header}>{header}</SelectItem>))}</SelectContent></Select></div>))}</div><DialogFooter><Button variant="outline" onClick={() => setIsMappingDialogOpen(false)}>Annuler</Button><Button onClick={handleConfirmImport}>Confirmer l'importation</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Créer une nouvelle vente</DialogTitle><DialogDescription>Remplissez les détails pour enregistrer une nouvelle transaction.</DialogDescription></DialogHeader><div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="product" className="text-right">Produit</Label><Select value={createSaleForm.productId} onValueChange={(v) => setCreateSaleForm(p => ({ ...p, productId: v }))}><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger><SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="customer" className="text-right">Client</Label><Select value={createSaleForm.customerId} onValueChange={(v) => setCreateSaleForm(p => ({ ...p, customerId: v }))}><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionner un client" /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}<SelectItem value="new">Nouveau client...</SelectItem></SelectContent></Select></div>
        {createSaleForm.customerId === 'new' && <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="customerName" className="text-right">Nom du client</Label><Input id="customerName" value={createSaleForm.customerName} onChange={(e) => setCreateSaleForm(p => ({ ...p, customerName: e.target.value }))} className="col-span-3" /></div>}
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="quantity" className="text-right">Quantité</Label><Input id="quantity" type="number" value={createSaleForm.quantity} onChange={(e) => setCreateSaleForm(p => ({ ...p, quantity: +e.target.value }))} className="col-span-3" /></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="totalPrice" className="text-right">Prix Total</Label><Input id="totalPrice" type="number" value={createSaleForm.totalPrice} onChange={(e) => setCreateSaleForm(p => ({ ...p, totalPrice: +e.target.value }))} className="col-span-3" /></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="unitCost" className="text-right">Coût unitaire</Label><Input id="unitCost" type="text" readOnly value={calculatedCosts.unitCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} className="col-span-3 bg-muted" /></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="totalCost" className="text-right">Coût de vente total</Label><Input id="totalCost" type="text" readOnly value={calculatedCosts.totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} className="col-span-3 bg-muted" /></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="saleDate" className="text-right">Date</Label><Input id="saleDate" type="date" value={createSaleForm.saleDate} onChange={(e) => setCreateSaleForm(p => ({ ...p, saleDate: e.target.value }))} className="col-span-3" /></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="source" className="text-right">Source</Label><Input id="source" value={createSaleForm.source} onChange={(e) => setCreateSaleForm(p => ({ ...p, source: e.target.value }))} className="col-span-3" /></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="promoCode" className="text-right">Code promo</Label><Input id="promoCode" value={createSaleForm.promoCode} onChange={(e) => setCreateSaleForm(p => ({ ...p, promoCode: e.target.value }))} className="col-span-3" /></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="channel" className="text-right">Canal</Label><Select value={createSaleForm.channel} onValueChange={(v: SaleChannel) => setCreateSaleForm(p => ({ ...p, channel: v }))}><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionner un canal" /></SelectTrigger><SelectContent>{saleChannels.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent></Select></div>
      </div><DialogFooter><Button onClick={handleCreateSale}>Enregistrer la vente</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}