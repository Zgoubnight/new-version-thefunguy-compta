import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { useStore } from '@/lib/store';
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, BarChart2 } from 'lucide-react';
export function HomePage() {
  const navigate = useNavigate();
  const [isAuthenticated] = useState(!!localStorage.getItem('authToken'));
  const fetchInitialData = useStore((state) => state.fetchInitialData);
  const isLoading = useStore((state) => state.isLoading);
  const error = useStore((state) => state.error);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      fetchInitialData();
    }
  }, [isAuthenticated, navigate, fetchInitialData]);
  if (!isAuthenticated) {
    return null; // Or a loading spinner, as navigation is happening
  }
  return (
    <div className="h-screen flex bg-background text-foreground">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1">
        <header className="md:hidden flex items-center justify-between h-16 px-4 border-b bg-card">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">FungiCount</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground border-r-0">
              <Sidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-12 w-1/4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-96" />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <h2 className="text-2xl font-semibold text-destructive">Échec du chargement des données</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
      <Toaster richColors />
    </div>
  );
}