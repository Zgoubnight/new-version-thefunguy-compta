import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { Settings } from "@shared/types";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Copy, RefreshCw, Link, Unlink, RefreshCcw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
export default function SettingsPage() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const syncAmazonSales = useStore((state) => state.syncAmazonSales);
  const [feePercentage, setFeePercentage] = useState(15);
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  useEffect(() => {
    if (settings) {
      setFeePercentage(settings.netMarginFeePercentage);
      setApiKey(settings.apiKey || "");
    }
  }, [settings]);
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const updatedSettings = await api<Settings>('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ netMarginFeePercentage: feePercentage }),
      });
      updateSettings(updatedSettings);
      toast.success("Paramètres enregistrés avec succès !");
    } catch (error) {
      toast.error("Échec de l'enregistrement des paramètres.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleRegenerateApiKey = async () => {
    setIsRegenerating(true);
    try {
      const { apiKey: newApiKey } = await api<{ apiKey: string }>('/api/settings/regenerate-api-key', {
        method: 'POST',
      });
      updateSettings({ ...settings!, apiKey: newApiKey });
      setApiKey(newApiKey);
      toast.success("Nouvelle clé API gén��rée avec succès !");
    } catch (error) {
      toast.error("Échec de la génération de la clé API.");
    } finally {
      setIsRegenerating(false);
    }
  };
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success("Clé API copiée dans le presse-papiers !");
  };
  const handleAmazonConnect = async (connect: boolean) => {
    setIsConnecting(true);
    const endpoint = connect ? '/api/settings/amazon/connect' : '/api/settings/amazon/disconnect';
    const successMessage = connect ? "Connecté à Amazon avec succès !" : "Déconnecté d'Amazon.";
    const errorMessage = connect ? "Échec de la connexion à Amazon." : "Échec de la déconnexion.";
    try {
      const updatedSettings = await api<Settings>(endpoint, { method: 'POST' });
      updateSettings(updatedSettings);
      toast.success(successMessage);
    } catch (error) {
      toast.error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };
  const handleAmazonSync = async () => {
    setIsSyncing(true);
    try {
      await syncAmazonSales();
      toast.success("Synchronisation des ventes Amazon terminée !");
    } catch (error) {
      toast.error("Échec de la synchronisation des ventes Amazon.");
    } finally {
      setIsSyncing(false);
    }
  };
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-4xl font-bold tracking-tight">Paramètres</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calculs financiers</CardTitle>
            <CardDescription>
              Configurez les paramètres pour les calculs financiers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feePercentage">Pourcentage des frais de marge nette</Label>
              <div className="flex items-center gap-2">
                <Input id="feePercentage" type="number" value={feePercentage} onChange={(e) => setFeePercentage(parseFloat(e.target.value) || 0)} className="w-32" min="0" max="100" />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Déduit de la marge brute pour estimer la marge nette.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveSettings} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Intégration Amazon Marketplace</CardTitle>
            <CardDescription>
              Connectez votre compte Amazon pour synchroniser les ventes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings?.amazonIntegration?.connected ? (
              <>
                <div className="flex items-center text-green-600">
                  <Link className="mr-2 h-5 w-5" />
                  <span className="font-semibold">Connecté à Amazon</span>
                </div>
                {settings.amazonIntegration.lastSync && (
                  <p className="text-sm text-muted-foreground">
                    Dernière synchronisation : {format(new Date(settings.amazonIntegration.lastSync), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center text-muted-foreground">
                <Unlink className="mr-2 h-5 w-5" />
                <span className="font-semibold">Non connecté</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="gap-2">
            {settings?.amazonIntegration?.connected ? (
              <>
                <Button onClick={() => handleAmazonConnect(false)} variant="destructive" disabled={isConnecting}>
                  {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlink className="mr-2 h-4 w-4" />}
                  Déconnecter
                </Button>
                <Button onClick={handleAmazonSync} disabled={isSyncing}>
                  {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                  Synchroniser les ventes
                </Button>
              </>
            ) : (
              <Button onClick={() => handleAmazonConnect(true)} disabled={isConnecting}>
                {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link className="mr-2 h-4 w-4" />}
                Se connecter à Amazon
              </Button>
            )}
          </CardFooter>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Intégrations & API</CardTitle>
            <CardDescription>
              Gérez votre clé API pour les intégrations externes comme les webhooks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xl space-y-2">
              <Label htmlFor="apiKey">Clé API Webhook</Label>
              <div className="flex items-center gap-2">
                <Input id="apiKey" type="text" readOnly value={apiKey || "Aucune clé générée"} className="font-mono" />
                <Button variant="outline" size="icon" onClick={handleCopyToClipboard} disabled={!apiKey}><Copy className="h-4 w-4" /></Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Utilisez cette clé dans l'en-tête `X-API-KEY` pour authentifier les requêtes webhook.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isRegenerating}>
                  {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Générer une nouvelle clé
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Générer une nouvelle clé API invalidera immédiatement l'ancienne. Vous devrez mettre à jour toutes vos intégrations avec la nouvelle clé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRegenerateApiKey} className="bg-destructive hover:bg-destructive/90">
                    Oui, générer une nouvelle clé
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}