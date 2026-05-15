import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter,
  MousePointer2,
  Target,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { analyticsService, ClickData, LinkStats, OverviewStats } from '../services/analyticsService';

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState(7);
  const [clickData, setClickData] = useState<ClickData[]>([]);
  const [topLinks, setTopLinks] = useState<LinkStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [clicks, links, stats, activity] = await Promise.all([
          analyticsService.getClickStats(period),
          analyticsService.getTopLinks(),
          analyticsService.getOverviewStats(),
          analyticsService.getRecentActivity(8)
        ]);
        setClickData(clicks);
        setTopLinks(links);
        setOverview(stats);
        setRecentActivity(activity);
      } catch (error) {
        console.error('Erro ao buscar analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b'];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatNumber = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  };

  if (isLoading || !overview) {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <BarChart3 className="w-8 h-8 text-primary mr-3" />
            Performance & Analytics
          </h1>
          <p className="text-muted-foreground">Métricas inteligentes para impulsionar suas conversões.</p>
        </div>

        <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-border p-1 rounded-2xl shadow-inner">
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
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Cliques Totais', value: formatNumber(overview.totalClicks), change: overview.clicksChange, icon: MousePointer2, color: 'primary' },
          { label: 'Conversões', value: overview.totalConversions, change: overview.conversionsChange, icon: Target, color: 'success' },
          { label: 'Receita Estimada', value: formatCurrency(overview.totalRevenue), change: overview.revenueChange, icon: DollarSign, color: 'warning' },
          { label: 'ROI Médio', value: `${overview.averageROI.toFixed(1)}x`, change: overview.roiChange, icon: TrendingUp, color: 'accent' },
        ].map((item, idx) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Clicks Chart */}
        <Card title="Evolução Temporal" className="lg:col-span-2 h-[480px] flex flex-col border-primary/5">
          <div className="flex-1 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clickData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 800, color: '#1e293b' }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorClicks)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Atividade Recente */}
        <Card title="Atividade em Tempo Real" className="h-[480px] border-primary/5">
          <div className="space-y-6 mt-4">
            {recentActivity.map((log, i) => (
              <div key={log.id} className="flex items-start gap-4 animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-primary animate-ping' : 'bg-muted-foreground/30'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{log.linkTitle}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center font-medium">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold">
                      {log.device}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] font-black text-primary/60 uppercase tracking-tighter shrink-0">
                  {log.location}
                </div>
              </div>
            ))}
            
            {recentActivity.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-40">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-sm font-medium">Aguardando novos cliques...</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Top Links Bar Chart */}
         <Card title="Top Links por Performance" className="h-[450px] flex flex-col border-primary/5">
          <div className="flex-1 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topLinks} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="title" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={140}
                  tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="clicks" 
                  radius={[0, 10, 10, 0]} 
                  barSize={28}
                  animationDuration={2000}
                >
                  {topLinks.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Conversion Stats */}
        <Card className="p-0 overflow-hidden border-primary/10 border-2">
          <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Ranking de Conversão
            </h3>
            <Button variant="ghost" size="sm" className="font-bold text-primary">
              Ver todos <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Produto</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Conv.</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topLinks.map((link, idx) => (
                  <tr key={link.id} className="hover:bg-primary/5 transition-all duration-300 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-muted text-[10px] font-black group-hover:bg-primary group-hover:text-white transition-colors">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-bold truncate max-w-[150px]">{link.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-success">{link.conversions}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-xs font-extrabold bg-muted px-2 py-1 rounded-md">
                        {link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Export Section Footer */}
      <div className="flex items-center justify-between bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-lg">Exportar Relatórios</h4>
            <p className="text-sm text-muted-foreground">Baixe os dados completos em formato CSV ou PDF para apresentações.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold rounded-xl border-2">Exportar CSV</Button>
          <Button variant="primary" className="font-bold rounded-xl shadow-lg shadow-primary/25">Gerar PDF</Button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
