import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@fungicount.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api<{ token: string }>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('authToken', response.token);
      navigate('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Identifiants invalides.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-fungi-gray dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm shadow-lg animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <BarChart2 className="h-10 w-10 text-fungi-slate dark:text-fungi-gray" />
            <h1 className="ml-3 text-3xl font-bold text-fungi-slate dark:text-fungi-gray">FungiCount</h1>
          </div>
          <CardTitle className="text-2xl">Bienvenue</CardTitle>
          <CardDescription>Entrez vos identifiants pour accéder à votre tableau de bord.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-fungi-slate hover:bg-fungi-slate/90 text-white dark:bg-fungi-green dark:hover:bg-fungi-green/90" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Se connecter
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}