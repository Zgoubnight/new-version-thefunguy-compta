import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Package, ShoppingCart, Target, BarChart2, Users, FileText, LogOut, Settings, History, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
const mainNavigation = [
  { name: 'Tableau de bord', href: '/', icon: Home },
  { name: 'Inventaire', href: '/inventory', icon: Package },
  { name: 'Ventes', href: '/sales', icon: ShoppingCart },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Rapports', href: '/reports', icon: FileText },
  { name: 'Prévisions', href: '/forecasting', icon: Target },
  { name: 'Dons', href: '/donations', icon: Gift },
];
const settingsNavigation = [
  { name: 'Journal d\'audit', href: '/audit-log', icon: History },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];
interface SidebarProps {
  onLinkClick?: () => void;
}
export function Sidebar({ onLinkClick }: SidebarProps) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    if (onLinkClick) onLinkClick();
    navigate('/login');
  };
  const NavItems = ({ items }: { items: { name: string, href: string, icon: React.ElementType }[] }) => (
    <>
      {items.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          end={item.href === '/'}
          onClick={onLinkClick}
          className={({ isActive }) =>
            cn(
              'group flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors duration-150',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )
          }
        >
          <item.icon className="mr-3 h-6 w-6" aria-hidden="true" />
          {item.name}
        </NavLink>
      ))}
    </>
  );
  return (
    <aside className="w-64 min-w-[256px] flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-full">
      <div className="h-16 flex items-center justify-center px-4 border-b border-sidebar-border">
        <BarChart2 className="h-8 w-8 text-sidebar-primary" />
        <h1 className="ml-3 text-2xl font-bold text-sidebar-foreground">FungiCount</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItems items={mainNavigation} />
        </nav>
        <div className="px-4 pb-6">
          <Separator className="my-4 bg-sidebar-border" />
          <nav className="space-y-2">
            <NavItems items={settingsNavigation} />
          </nav>
        </div>
      </div>
      <div className="p-4 border-t border-sidebar-border space-y-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-base font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-6 w-6" />
          Déconnexion
        </Button>
        <p className="text-xs text-center text-sidebar-foreground/50">
          Construit avec ❤�� chez Cloudflare
        </p>
      </div>
    </aside>
  );
}