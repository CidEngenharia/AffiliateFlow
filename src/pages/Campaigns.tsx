import React, { useState } from 'react';
import { 
  Megaphone, 
  Send, 
  MessageSquare, 
  SendHorizontal, 
  History, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Users,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { automationService, AutomationPayload } from '../services/automationService';

const Campaigns: React.FC = () => {
  const [platform, setPlatform] = useState<'whatsapp' | 'telegram'>('whatsapp');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('todos_contatos');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSend = async () => {
    if (!message) {
      setStatus({ type: 'error', text: 'Por favor, escreva uma mensagem antes de disparar.' });
      return;
    }

    setIsSending(true);
    setStatus(null);

    try {
      await automationService.triggerBroadcast({
        platform,
        message,
        target,
      });
      setStatus({ type: 'success', text: `Disparo para ${platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'} iniciado com sucesso!` });
      setMessage('');
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message || 'Erro ao conectar com o n8n. Verifique o webhook.' });
    } finally {
      setIsSending(false);
    }
  };

  const recentCampaigns = [
    { id: 1, title: 'Promoção Black Friday', platform: 'whatsapp', status: 'concluído', date: '10/05/2026', reach: '1,240' },
    { id: 2, title: 'Aviso de Novo Curso', platform: 'telegram', status: 'agendado', date: '15/05/2026', reach: '5,000' },
    { id: 3, title: 'Oferta Relâmpago', platform: 'whatsapp', status: 'falhou', date: '08/05/2026', reach: '0' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Megaphone className="w-8 h-8 text-primary mr-3" />
            Campanhas & Automações
          </h1>
          <p className="text-muted-foreground">Gerencie seus disparos em massa e integração com n8n.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Clock className="w-4 h-4 mr-2" />
            Agendamentos
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir n8n
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor de Mensagem */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPlatform('whatsapp')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    platform === 'whatsapp' 
                    ? 'border-success bg-success/5 text-success' 
                    : 'border-border hover:border-success/30'
                  }`}
                >
                  <Smartphone className="w-8 h-8" />
                  <span className="font-bold">WhatsApp</span>
                </button>
                <button
                  onClick={() => setPlatform('telegram')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    platform === 'telegram' 
                    ? 'border-info bg-info/5 text-info' 
                    : 'border-border hover:border-info/30'
                  }`}
                >
                  <SendHorizontal className="w-8 h-8" />
                  <span className="font-bold">Telegram</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Público Alvo</label>
                  <select 
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  >
                    <option value="todos_contatos">Todos os Contatos (LeadHub)</option>
                    <option value="grupo_vip">Grupo VIP Mentoria</option>
                    <option value="leads_quentes">Leads Quentes (Últimos 7 dias)</option>
                    <option value="lista_espera">Lista de Espera Re-lançamento</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Mensagem da Campanha</label>
                    <span className="text-xs text-muted-foreground">{message.length}/4096</span>
                  </div>
                  <textarea
                    rows={8}
                    placeholder="Escreva sua copy aqui... (Dica: Use o Gerador de IA para melhores resultados)"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none resize-none font-sans text-sm leading-relaxed"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
              </div>

              {status && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300 ${
                  status.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  <span className="text-sm font-medium">{status.text}</span>
                </div>
              )}

              <Button 
                variant="primary" 
                className="w-full py-6 text-lg"
                onClick={handleSend}
                disabled={isSending}
              >
                {isSending ? 'Processando...' : `Disparar para ${platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'}`}
                {!isSending && <Send className="w-5 h-5 ml-2" />}
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar: Status e Histórico */}
        <div className="space-y-6">
          <Card title="Status do n8n" className="bg-muted/30">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
                <span className="text-sm font-medium">Conectado</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">v1.24.0</span>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm">Histórico Recente</h3>
            </div>
            <div className="divide-y divide-border">
              {recentCampaigns.map((camp) => (
                <div key={camp.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold">{camp.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      camp.status === 'concluído' ? 'bg-success/10 text-success' :
                      camp.status === 'agendado' ? 'bg-info/10 text-info' : 'bg-danger/10 text-danger'
                    }`}>
                      {camp.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {camp.date}
                    </span>
                    <span className="flex items-center gap-1 uppercase">
                      {camp.platform}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {camp.reach}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors">
              Ver Relatório Completo
            </button>
          </Card>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-xl">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Total da Audiência
            </h4>
            <div className="text-3xl font-black mb-1">6,240</div>
            <p className="text-xs opacity-80 leading-relaxed">
              Sua audiência cresceu 15% nos últimos 30 dias. Ótimo momento para uma nova campanha!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
