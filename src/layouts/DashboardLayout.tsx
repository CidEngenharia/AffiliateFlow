import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Link2, 
  Megaphone, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Trophy,
  Menu,
  X,
  Bell,
  Wand2,
  SearchCode,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, isActive, collapsed, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
      ${isActive 
        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'}
      ${collapsed ? 'justify-center px-2' : 'space-x-3'}
    `}
  >
    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-primary'}`} />
    {!collapsed && <span className="font-medium">{label}</span>}
  </button>
);

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { id: 'busca-turbo', icon: SearchCode, label: 'Busca Turbo AI', path: '/busca-turbo' },
    { id: 'links', icon: Link2, label: 'Gerenciador de Links', path: '/links' },
    { id: 'vitrine', icon: LayoutGrid, label: 'Minha Vitrine', path: profile?.username ? `/v/${profile.username}` : '#', external: true },
    { id: 'ai-writer', icon: Wand2, label: 'Gerador de IA', path: '/ai-writer' },
    { id: 'campaigns', icon: Megaphone, label: 'Campanhas', path: '/campaigns' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { id: 'settings', icon: Settings, label: 'Configurações', path: '/settings' },
    { id: 'inspector', icon: SearchCode, label: 'Link Inspector', path: '/inspector' },
  ];

  const showcaseLink = profile?.username ? `/v/${profile.username}` : '#';

  const navigate = useNavigate();
  const location = useLocation();

  // Encontrar o item ativo com base no path
  const currentItem = menuItems.find(item => item.path === location.pathname) || menuItems[0];
  const activeTab = currentItem.id;

  const handleNavigation = (path: string, id: string) => {
    if (id === 'vitrine') {
      if (!profile?.username) {
        if (confirm('Você ainda não configurou um nome de usuário para sua vitrine. Deseja ir para as configurações agora?')) {
          navigate('/settings');
        }
        return;
      }
      window.open(`/v/${profile.username}`, '_blank');
      return;
    }
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 280 }}
        className="hidden md:flex flex-col bg-card border-r border-border h-full relative z-20"
      >
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center space-x-3 ${collapsed ? 'hidden' : 'flex'}`}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">AfiliateFlow IA</span>
          </div>
          {collapsed && <Zap className="text-primary w-8 h-8 mx-auto" />}
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg border border-border hover:bg-accent absolute -right-3 top-7 bg-card hidden md:block"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeTab === item.id}
              collapsed={collapsed}
              onClick={() => handleNavigation(item.id === 'vitrine' ? showcaseLink : item.path, item.id)}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <SidebarItem 
            icon={LogOut} 
            label="Sair" 
            collapsed={collapsed} 
            onClick={signOut}
          />
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Mobile & Topbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border z-10">
          <div className="flex items-center">
            <button 
              className="md:hidden p-2 -ml-2 mr-2 rounded-lg hover:bg-accent"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-semibold text-lg capitalize">{activeTab}</h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Nome e Status Simples */}
            <div className="hidden sm:flex items-center space-x-2 mr-2">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-foreground leading-none">{profile?.full_name || 'Usuário'}</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>

            <button className="p-2 rounded-lg hover:bg-accent relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full" />
            </button>
            <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-danger" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
            <div className="h-8 w-px bg-border mx-2 hidden sm:block" />
            <Button variant="primary" size="sm" className="hidden sm:flex">
              <Zap className="w-4 h-4 mr-2" />
              Upgrade PRO
            </Button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Drawer (Simplificado) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card z-40 md:hidden p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <Zap className="text-primary w-6 h-6" />
                  <span className="font-bold text-lg">Affilehub</span>
                </div>
                <button onClick={() => setMobileOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <SidebarItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={activeTab === item.id}
                    onClick={() => {
                      handleNavigation(item.path, item.id);
                      setMobileOpen(false);
                    }}
                  />
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
