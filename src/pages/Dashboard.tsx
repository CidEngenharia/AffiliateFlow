import React from 'react';
import Card from '../components/ui/Card';
import {
  ArrowUpRight, Zap, LayoutGrid, BarChart3, Link2, Settings, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

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

      {/* ── Botões de Acesso Rápido ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {quickLinks.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="group text-left p-5 rounded-2xl border border-border bg-card hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-5 h-5" />
              </div>
              <p className="font-extrabold text-sm mb-1">{item.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
