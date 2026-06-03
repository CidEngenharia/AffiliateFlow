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
  Loader2,
  Smartphone,
  Globe2,
  Activity,
  AlertCircle
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
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  analyticsService,
  ClickData,
  LinkStats,
  OverviewStats,
  DeviceStats,
  CountryStats
} from '../services/analyticsService';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b'];

const EmptyState: React.FC<{ icon: React.ElementType; message: string; sub?: string }> = ({ icon: Icon, message, sub }) => (
  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 gap-2 py-10">
    <Icon className="w-10 h-10 text-muted-foreground" />
    <p className="text-sm font-bold text-muted-foreground">{message}</p>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
);

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState(7);
  const [clickData, setClickData] = useState<ClickData[]>([]);
  const [topLinks, setTopLinks] = useState<LinkStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceStats[]>([]);
  const [countryData, setCountryData] = useState<CountryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const [clicks, links, stats, activity, devices, countries] = await Promise.all([
          analyticsService.getClickStats(period),
          analyticsService.getTopLinks(),
          analyticsService.getOverviewStats(period),
          analyticsService.getRecentActivity(8),
          analyticsService.getDeviceStats(period),
          analyticsService.getCountryStats(period)
        ]);
        setClickData(clicks);
        setTopLinks(links);
        setOverview(stats);
        setRecentActivity(activity);
        setDeviceData(devices);
        setCountryData(countries);
      } catch (error) {
        console.error('Erro ao buscar analytics:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatNumber = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  };

  // Estado de erro global
  if (hasError) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-danger" />
        <p className="text-lg font-bold text-danger">Falha ao carregar dados de analytics.</p>
        <p className="text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
        <Button variant="outline" onClick={() => setPeriod(p => p)}>Tentar novamente</Button>
      </div>
    );
  }

  // Loading global apenas no primeiro carregamento
  if (isLoading && !overview) {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const safeOverview = overview ?? {
    totalClicks: 0, totalConversions: 0, totalRevenue: 0, totalLinks: 0, averageROI: 0,
    clicksChange: 0, conversionsChange: 0, revenueChange: 0, roiChange: 0
  };

  const ctrReal = safeOverview.totalClicks > 0
    ? ((safeOverview.totalConversions / safeOverview.totalClicks) * 100).toFixed(1)
    : '0.0';

  const kpiCards = [
    { label: 'Cliques Totais', value: formatNumber(safeOverview.totalClicks), change: safeOverview.clicksChange, icon: MousePointer2, color: 'primary' },
    { label: 'Conversões', value: safeOverview.totalConversions, change: safeOverview.conversionsChange, icon: Target, color: 'success' },
    { label: 'Receita Estimada', value: formatCurrency(safeOverview.totalRevenue), change: safeOverview.revenueChange, icon: DollarSign, color: 'warning' },
    { label: 'CTR Real / ROI', value: `${ctrReal}% / ${safeOverview.averageROI.toFixed(1)}x`, change: safeOverview.roiChange, icon: TrendingUp, color: 'accent' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <BarChart3 className="w-8 h-8 text-primary mr-3 shrink-0" />
            Performance & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Métricas inteligentes para impulsionar suas conversões.</p>
        </div>

        {/* Filtro de Período */}
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

      {/* ── KPI Cards ── */}
      {isLoading ? (
        <div className="h-32 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
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

      {/* ── Evolução Temporal + Atividade ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Evolução de Cliques" className="lg:col-span-2 h-[480px] flex flex-col border-primary/5">
          <div className="flex-1 mt-6">
            {clickData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clickData}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorClicks)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={Activity}
                message="Sem dados de cliques no período"
                sub="Os dados aparecerão aqui assim que seus links receberem acessos."
              />
            )}
          </div>
        </Card>

        {/* Atividade Recente */}
        <Card title="Atividade em Tempo Real" className="h-[480px] flex flex-col border-primary/5">
          <div className="space-y-5 mt-4 flex-1 overflow-y-auto">
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
              <EmptyState
                icon={Activity}
                message="Nenhum acesso recente"
                sub="Os cliques nos seus links aparecerão aqui."
              />
            )}
          </div>
        </Card>
      </div>

      {/* ── Dispositivos + Geolocalização ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Dispositivos de Acesso" className="h-[420px] flex flex-col border-primary/5">
          <div className="flex-1 flex items-center justify-center mt-4">
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                    stroke="none"
                  >
                    {deviceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 800, color: '#1e293b' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value, entry: any) => (
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {value}: {entry.payload.value} cliques
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={Smartphone}
                message="Sem dados de dispositivos"
                sub="Será exibido quando seus links receberem cliques."
              />
            )}
          </div>
        </Card>

        <Card title="Geolocalização de Acessos" className="h-[420px] flex flex-col border-primary/5">
          <div className="flex-1 space-y-5 mt-5 overflow-y-auto px-1">
            {countryData.length > 0 ? (
              countryData.map((c, i) => (
                <div key={c.country} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-extrabold text-primary">
                        {i + 1}
                      </span>
                      <span className="font-bold">{c.country}</span>
                    </div>
                    <span className="text-muted-foreground font-black">{c.clicks} ({c.percentage}%)</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Globe2}
                message="Sem dados geográficos"
                sub="A origem dos seus visitantes aparecerá aqui."
              />
            )}
          </div>
        </Card>
      </div>

      {/* ── Top Links (bar chart) + Ranking de Conversão ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Top Links por Cliques" className="h-[420px] flex flex-col border-primary/5">
          <div className="flex-1 mt-6">
            {topLinks.length > 0 ? (
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
                  <Bar dataKey="clicks" radius={[0, 10, 10, 0]} barSize={28} animationDuration={2000}>
                    {topLinks.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={BarChart3}
                message="Nenhum link com cliques"
                sub="Adicione links e compartilhe para ver o ranking."
              />
            )}
          </div>
        </Card>

        {/* Ranking de Conversão */}
        <Card className="p-0 overflow-hidden border-primary/10 border-2">
          <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Ranking de Conversão
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Produto</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cliques</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Conv.</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topLinks.length > 0 ? topLinks.map((link, idx) => (
                  <tr key={link.id} className="hover:bg-primary/5 transition-all duration-300 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-muted text-[10px] font-black group-hover:bg-primary group-hover:text-white transition-colors">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-bold truncate max-w-[130px]">{link.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{link.clicks}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-success">{link.conversions}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-extrabold bg-muted px-2 py-1 rounded-md">
                        {link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground text-sm">
                      Nenhum dado de conversão para o período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Exportar Relatórios ── */}
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
