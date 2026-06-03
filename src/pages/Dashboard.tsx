import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import {
  TrendingUp, MousePointer2, Target, DollarSign, ArrowUpRight, ArrowDownRight,
  Zap, Loader2, LayoutGrid, Calendar, Filter, BarChart3, Link2, Settings,
  Activity, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { analyticsService, OverviewStats, ClickData, LinkStats } from '../services/analyticsService';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [period, setPeriod] = useState(7);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [clickData, setClickData] = useState<ClickData[]>([]);
  const [topLinks, setTopLinks] = useState<LinkStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      setHasError(false);
      try {
        const [stats, clicks, links, activity] = await Promise.all([
          analyticsService.getOverviewStats(period),
          analyticsService.getClickStats(period),
          analyticsService.getTopLinks(5),
          analyticsService.getRecentActivity(5),
        ]);
        setOverview(stats);
        setClickData(clicks);
        setTopLinks(links);
        setRecentActivity(activity);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [period]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatNumber = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  };

  const ctrReal = overview && overview.totalClicks > 0
    ? ((overview.totalConversions / overview.totalClicks) * 100).toFixed(1)
    : '0.0';

  const emptyOverview: OverviewStats = {
    totalClicks: 0, totalConversions: 0, totalRevenue: 0, totalLinks: 0, averageROI: 0,
    clicksChange: 0, conversionsChange: 0, revenueChange: 0, roiChange: 0
  };

  const stats = overview ?? emptyOverview;

  const kpiCards = [
    { label: 'Cliques Totais', value: formatNumber(stats.totalClicks), change: stats.clicksChange, icon: MousePointer2, color: 'primary' },
    { label: 'Conversões', value: stats.totalConversions, change: stats.conversionsChange, icon: Target, color: 'success' },
    { label: 'Receita Estimada', value: formatCurrency(stats.totalRevenue), change: stats.revenueChange, icon: DollarSign, color: 'warning' },
    { label: 'CTR Real / ROI', value: `${ctrReal}% / ${stats.averageROI.toFixed(1)}x`, change: stats.roiChange, icon: TrendingUp, color: 'accent' },
  ];

  const quickLinks = [
    { label: 'Analytics', desc: 'Métricas detalhadas e gráficos avançados', icon: BarChart3, color: 'from-violet-500 to-indigo-600', path: '/analytics' },
    { label: 'Gerenciar Links', desc: 'Criar, editar e organizar seus links', icon: Link2, color: 'from-emerald-500 to-teal-600', path: '/links' },
    { label: 'Busca Turbo AI', desc: 'OSINT e pesquisa de oportunidades', icon: Zap, color: 'from-amber-500 to-orange-600', path: '/busca-turbo' },
    { label: 'Configurações', desc: 'Perfil, vitrine e preferências', icon: Settings, color: 'from-slate-500 to-slate-700', path: '/settings' },
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Olá, {profile?.full_name?.split(' ')[0] || 'Afiliado'}! 👋
          </h1>
          <p className="text-muted-foreground">Aqui está o resumo executivo do seu negócio.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/analytics')} className="font-bold">
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver Analytics
          </Button>
          <Button variant="primary" onClick={() => navigate('/busca-turbo')} className="shadow-lg shadow-primary/20">
            <Zap className="w-4 h-4 mr-2" />
            Nova Pesquisa AI
          </Button>
        </div>
      </div>

      {/* ── Vitrine ── */}
      <Card className="border-primary/20 bg-primary/5 shadow-inner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Sua Vitrine Pública 🚀</h3>
              <p className="text-sm text-muted-foreground">
                {profile?.username
                  ? 'Compartilhe o link abaixo para que seus clientes vejam todos os seus produtos.'
                  : 'Configure seu nome de usuário nas configurações para ativar sua vitrine pública.'}
              </p>
            </div>
          </div>

          {profile?.username ? (
            <div className="flex flex-col md:flex-row items-center gap-4 flex-1 justify-end">
              <div className="flex items-center gap-2 bg-background border border-border p-2 rounded-xl flex-1 max-w-md shadow-sm">
                <code className="text-xs font-mono text-primary flex-1 truncate px-2">
                  {window.location.origin}/v/{profile.username}
                </code>
                <Button
                  variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/v/${profile.username}`);
                    alert('Link copiado!');
                  }}
                >
                  Copiar Link
                </Button>
              </div>
              <Button
                variant="outline" size="sm" className="font-bold"
                onClick={() => window.open(`/v/${profile.username}`, '_blank')}
              >
                Visualizar Vitrine <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={() => navigate('/settings')}>
              Configurar Vitrine <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>

      {/* ── Filtro de Período ── */}
      <div className="flex items-center justify-end bg-card/50 backdrop-blur-sm border border-border p-1 rounded-2xl shadow-inner w-fit ml-auto">
        {[7, 15, 30].map((d) => (
          <button
            key={d}
            onClick={() => setPeriod(d)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              period === d
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            {d} Dias
          </button>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      {isLoading ? (
        <div className="h-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : hasError ? (
        <Card className="text-center py-10 border-danger/20 bg-danger/5">
          <p className="text-danger font-bold">Erro ao carregar dados. Verifique a conexão com o banco.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setPeriod(p => p)}>
            Tentar novamente
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((item, idx) => (
            <Card key={idx} className="relative overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 border-primary/5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{item.label}</p>
                  <h3 className="text-3xl font-black tracking-tight">{item.value}</h3>
                  <span className={`text-xs flex items-center mt-2 font-bold ${item.change >= 0 ? 'text-success' : 'text-danger'}`}>
                    {item.change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(item.change)}% <span className="text-muted-foreground font-medium ml-1">vs anterior</span>
                  </span>
                </div>
                <div className={`p-3 bg-${item.color}/10 text-${item.color} rounded-2xl group-hover:rotate-12 transition-transform duration-500`}>
                  <item.icon className="w-6 h-6" />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 bg-${item.color}/20 w-full group-hover:bg-${item.color}/40 transition-colors`} />
            </Card>
          ))}
        </div>
      )}

      {/* ── Evolução + Atividade ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card title="Evolução Temporal" className="xl:col-span-2 h-[380px] flex flex-col border-primary/5">
          <div className="flex-1 mt-6">
            {clickData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clickData}>
                  <defs>
                    <linearGradient id="colorClicksDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} dx={-10} />
                  <Tooltip
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 800, color: '#1e293b' }}
                    labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorClicksDash)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-dashed border-2 border-border rounded-xl gap-2 opacity-50">
                <Activity className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nenhum clique registrado no período.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Atividade Recente */}
        <Card title="Atividade em Tempo Real" className="flex flex-col border-primary/5 h-[380px]">
          <div className="space-y-4 mt-4 flex-1 overflow-y-auto">
            {recentActivity.length > 0 ? recentActivity.map((log, i) => (
              <div key={log.id} className="flex items-start gap-4 animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-primary animate-ping' : 'bg-muted-foreground/30'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{log.linkTitle}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center font-medium">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold">{log.device}</span>
                  </div>
                </div>
                <div className="text-[10px] font-black text-primary/60 uppercase tracking-tighter shrink-0 bg-primary/10 px-2 py-0.5 rounded-full">
                  {log.location}
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 gap-2">
                <Activity className="w-8 h-8" />
                <p className="text-sm font-medium">Aguardando cliques...</p>
                <p className="text-xs text-muted-foreground">Os acessos aparecerão aqui em tempo real.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Atalhos Rápidos ── */}
      <div>
        <h2 className="text-lg font-extrabold mb-4 text-foreground/80">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="group text-left p-5 rounded-2xl border border-border bg-card hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-5 h-5" />
              </div>
              <p className="font-extrabold text-sm mb-1">{item.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Top Links (tabela compacta) ── */}
      <Card className="p-0 overflow-hidden border-primary/10 border-2">
        <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Top Links do Período
          </h3>
          <Button variant="ghost" size="sm" className="font-bold text-primary" onClick={() => navigate('/links')}>
            Ver todos <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Produto / Link</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Cliques</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Conv.</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Taxa (CTR)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Receita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topLinks.length > 0 ? topLinks.map((link, idx) => (
                <tr key={link.id} className="hover:bg-primary/5 transition-all duration-300 group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-muted text-[10px] font-black group-hover:bg-primary group-hover:text-white transition-colors">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold truncate max-w-[200px] md:max-w-xs">{link.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center"><span className="text-sm font-medium">{link.clicks}</span></td>
                  <td className="px-6 py-5 text-center"><span className="text-sm font-black text-success">{link.conversions}</span></td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-xs font-extrabold bg-muted px-2 py-1 rounded-md">
                      {link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-sm font-black text-primary">{formatCurrency(link.revenue)}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    Nenhum link com cliques no período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
