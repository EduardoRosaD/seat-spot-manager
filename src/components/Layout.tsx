import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Armchair, LayoutDashboard, Package, PlusCircle, Calendar, TrendingUp, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'Inventário', path: '/inventory' },
    { icon: PlusCircle, label: 'Novo Aluguel', path: '/rentals/new' },
    { icon: Calendar, label: 'Aluguéis', path: '/rentals/active' },
    { icon: TrendingUp, label: 'Relatórios', path: '/reports' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - SEMPRE 64px no mobile */}
      <div className="fixed left-0 top-0 h-screen bg-slate-800 border-r border-gray-700 w-16 z-50 flex flex-col">
        
        {/* Logo */}
        <div className="p-3 border-b border-gray-700">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Armchair className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="block">
                <div 
                  className={`mx-2 mb-2 h-12 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-green-600 text-white' 
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon size={20} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-700">
          <div 
            className="h-12 rounded-lg flex items-center justify-center cursor-pointer text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            onClick={signOut}
            title="Sair"
          >
            <LogOut size={20} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 ml-16">
        <div className="p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
