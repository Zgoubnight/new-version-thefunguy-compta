import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Product } from "@shared/types";
const getStatus = (stock: number) => {
  if (stock === 0) return { text: 'En rupture de stock', variant: 'destructive' as const, className: '' };
  if (stock < 20) return { text: 'Stock faible', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
  return { text: 'En stock', variant: 'default' as const, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
};
type ProductFormState = Omit<Product, 'id' | 'createdAt'>;
export default function InventoryPage() {
  const products = useStore((state) => state.products);
  const addProduct = useStore((state) => state.addProduct);
  const updateProduct = useStore((state) => state.updateProduct);
  const deleteProduct = useStore((state) => state.deleteProduct);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>({ name: '', sku: '', purchasePrice: 0, salePrice: 0, initialStock: 0, stockChezMoi: 0, stockAmazon: 0 });
  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.sku) {
      toast.error("Le nom du produit et le SKU sont requis.");
      return;
    }
    const payload = {
      ...productForm,
      initialStock: productForm.stockChezMoi + productForm.stockAmazon,
    };
    try {
      const createdProduct = await api<Product>('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      addProduct(createdProduct);
      toast.success("Produit ajouté avec succès !");
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error("Échec de l'ajout du produit.");
      console.error(error);
    }
  };
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductForm(product);
    setIsEditDialogOpen(true);
  };
  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    try {
      const updated = await api<Product>(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(productForm),
      });
      updateProduct(updated);
      toast.success("Produit mis à jour avec succès !");
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error("Échec de la mise à jour du produit.");
      console.error(error);
    }
  };
  const handleDeleteProduct = async (productId: string) => {
    try {
      await api(`/api/products/${productId}`, { method: 'DELETE' });
      deleteProduct(productId);
      toast.success("Produit supprimé avec succès !");
    } catch (error) {
      toast.error("Échec de la suppression du produit.");
      console.error(error);
    }
  };
  const ProductForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Nom</Label>
        <Input id="name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="sku" className="text-right">SKU</Label>
        <Input id="sku" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} className="col-span-3" disabled={isEdit} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="purchasePrice" className="text-right">Prix d'achat</Label>
        <Input id="purchasePrice" type="number" value={productForm.purchasePrice} onChange={(e) => setProductForm({ ...productForm, purchasePrice: parseFloat(e.target.value) || 0 })} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="salePrice" className="text-right">Prix de vente</Label>
        <Input id="salePrice" type="number" value={productForm.salePrice} onChange={(e) => setProductForm({ ...productForm, salePrice: parseFloat(e.target.value) || 0 })} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="stockChezMoi" className="text-right">Stock Chez Moi</Label>
        <Input id="stockChezMoi" type="number" value={productForm.stockChezMoi} onChange={(e) => setProductForm({ ...productForm, stockChezMoi: parseInt(e.target.value) || 0 })} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="stockAmazon" className="text-right">Stock Amazon</Label>
        <Input id="stockAmazon" type="number" value={productForm.stockAmazon} onChange={(e) => setProductForm({ ...productForm, stockAmazon: parseInt(e.target.value) || 0 })} className="col-span-3" />
      </div>
    </div>
  );
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Inventaire</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
          setIsAddDialogOpen(isOpen);
          if (!isOpen) setProductForm({ name: '', sku: '', purchasePrice: 0, salePrice: 0, initialStock: 0, stockChezMoi: 0, stockAmazon: 0 });
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau produit</DialogTitle>
              <DialogDescription>Entrez les détails du nouveau produit. Cliquez sur enregistrer lorsque vous avez terminé.</DialogDescription>
            </DialogHeader>
            <ProductForm />
            <DialogFooter>
              <Button type="submit" onClick={handleAddProduct}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Produits</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right">Stock Chez Moi</TableHead>
                <TableHead className="text-right">Stock Amazon</TableHead>
                <TableHead className="text-right">Stock Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Aucun produit trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const totalStock = Number(product.stockChezMoi) + Number(product.stockAmazon);
                  const status = getStatus(totalStock);
                  return (
                    <TableRow key={product.sku} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{product.sku}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={status.variant} className={status.className}>{status.text}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{product.stockChezMoi}</TableCell>
                      <TableCell className="text-right">{product.stockAmazon}</TableCell>
                      <TableCell className="text-right font-semibold">{totalStock}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Ouvrir le menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditProduct(product)}><Edit className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Êtes-vous absolument sûr(e) ?</AlertDialogTitle>
                              <AlertDialogDescription>Cette action est irréversible. Cela supprimera définitivement le produit "{product.name}".</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
            <DialogDescription>Mettez à jour les détails du produit. Cliquez sur enregistrer lorsque vous avez terminé.</DialogDescription>
          </DialogHeader>
          <ProductForm isEdit={true} />
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateProduct}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}