import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import { 
  TrendingUp, 
  MousePointer2, 
  Link as LinkIcon, 
  DollarSign,
  ArrowUpRight,
  Flame,
  Star,
  Trophy,
  Zap,
  Wand2,
  Loader2,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { analyticsService, OverviewStats, ClickData } from '../services/analyticsService';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  trend: string | number;
  icon: React.ElementType;
  color: string;
  isLoading?: boolean;
}> = ({ title, value, trend, icon: Icon, color, isLoading }) => (
  <Card hoverEffect>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
        {isLoading ? (
          <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
        ) : (
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        )}
        {!isLoading && (
          <p className={`text-xs mt-2 flex items-center font-medium ${Number(trend) >= 0 ? 'text-success' : 'text-danger'}`}>
            <TrendingUp className={`w-3 h-3 mr-1 ${Number(trend) < 0 ? 'rotate-180' : ''}`} />
            {Number(trend) > 0 ? `+${trend}` : trend}% este mês
          </p>
        )}
      </div>
      <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40 flex items-center justify-center">
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </Card>
);
const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [chartData, setChartData] = useState<ClickData[]>([]);
  const [topLinks, setTopLinks] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [overview, clicks, top] = await Promise.all([
          analyticsService.getOverviewStats(),
          analyticsService.getClickStats(7),
          analyticsService.getTopLinks(3)
        ]);
        setStats(overview);
        setChartData(clicks);
        setTopLinks(top);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const metrics = [
    { 
      title: 'Total de Cliques', 
      value: stats?.totalClicks.toLocaleString() || '0', 
      trend: stats?.clicksChange || 0, 
      icon: MousePointer2, 
      color: 'bg-primary' 
    },
    { 
      title: 'Links Ativos', 
      value: stats?.totalLinks || '0', 
      trend: 5, 
      icon: LinkIcon, 
      color: 'bg-primary' 
    },
    { 
      title: 'Conversões', 
      value: stats?.totalConversions.toLocaleString() || '0', 
      trend: stats?.conversionsChange || 0, 
      icon: TrendingUp, 
      color: 'bg-success' 
    },
    { 
      title: 'Receita Est.', 
      value: `R$ ${stats?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      trend: stats?.revenueChange || 0, 
      icon: DollarSign, 
      color: 'bg-warning' 
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Olá, {profile?.full_name?.split(' ')[0] || 'Afiliado'}! 👋
          </h1>
          <p className="text-muted-foreground">Bem-vindo ao seu centro de controle de afiliados.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="primary" onClick={() => navigate('/busca-turbo')}>
            <Zap className="w-4 h-4 mr-2" />
            Nova Pesquisa AI
          </Button>
        </div>
      </div>

      {/* Vitrine Link Section */}
      <Card className="border-primary/20 bg-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">Sua Vitrine Pública 🚀</h3>
              <p className="text-sm text-muted-foreground">
                {profile?.username 
                  ? 'Compartilhe o link abaixo para que seus clientes vejam todos os seus produtos.'
                  : 'Configure seu nome de usuário nas configurações para ativar sua vitrine pública.'}
              </p>
            </div>
          </div>
          
          {profile?.username ? (
            <div className="flex flex-col md:flex-row items-center gap-4 flex-1 justify-end">
              <div className="flex items-center gap-2 bg-background border border-border p-2 rounded-xl flex-1 max-w-md">
                <code className="text-xs font-mono text-primary flex-1 truncate px-2">
                  {window.location.origin}/v/{profile.username}
                </code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/v/${profile.username}`);
                    alert('Link copiado!');
                  }}
                >
                  Copiar Link
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`/v/${profile.username}`, '_blank')}
              >
                Visualizar Vitrine
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={() => navigate('/settings')}>
              Configurar Vitrine
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((stat, i) => (
          <MetricCard key={i} {...stat} isLoading={isLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card title="Desempenho de Cliques (Últimos 7 dias)" className="lg:col-span-2 min-h-[400px] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : chartData.length > 0 ? (
            <div className="flex-1 mt-4">
              <AnalyticsChart data={chartData} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-dashed border-2 rounded-xl">
              <TrendingUp className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Ainda não há dados de cliques para exibir</p>
            </div>
          )}
        </Card>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <Card title="Links com Melhor Performance" className="flex flex-col gap-4">
            <h4 className="font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Top Links
            </h4>
            <div className="space-y-4 mt-4">
              {isLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)
              ) : topLinks.length > 0 ? (
                topLinks.map((link, i) => (
                  <div key={link.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold w-5 h-5 rounded-full bg-muted flex items-center justify-center">{i + 1}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium line-clamp-1">{link.title}</span>
                        <span className="text-[10px] text-muted-foreground">{link.clicks} cliques</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-success">R$ {link.revenue.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate('/links')}>Ver Todos os Links</Button>
          </Card>


          <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white overflow-hidden relative border-none">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Busca Turbo AI</h4>
              <p className="text-sm opacity-90 mb-4">Utilize inteligência artificial para encontrar as melhores oportunidades e conteúdos.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => navigate('/busca-turbo')}
              >
                Acessar OSINT
              </Button>
            </div>
            <Zap className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 rotate-12" />
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Gerador de Legendas</h4>
                  <p className="text-xs text-muted-foreground">Crie copys com 1 clique</p>
                </div>
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/ai-writer')}
              >
                Abrir Gerador
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

