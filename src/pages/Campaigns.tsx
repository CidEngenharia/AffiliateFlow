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
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { automationService } from '../services/automationService';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white translate-x-[-1px]">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.506 1.201-.827 1.23-.698.064-1.226-.463-1.903-.907-1.06-.694-1.66-1.125-2.684-1.799-1.184-.779-.418-1.207.258-1.907.177-.184 3.247-2.977 3.307-3.233.007-.032.014-.15-.056-.212-.07-.062-.173-.041-.248-.024-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.348-.374-1.296-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.121.1.156.233.17.327.014.095.021.28.01.405z" />
  </svg>
);

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
          <Card className="p-6 border-primary/20">
            <div className="space-y-6">
              {/* Seletor compacto de plataformas */}
              <div className="flex items-center gap-1.5 p-1 bg-muted/40 border border-border/80 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setPlatform('whatsapp')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                    platform === 'whatsapp'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                    <WhatsAppIcon />
                  </div>
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('telegram')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                    platform === 'telegram'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="w-4 h-4 shrink-0 flex items-center justify-center text-sky-500">
                    <TelegramIcon />
                  </div>
                  <span>Telegram</span>
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

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/20 border border-border rounded-2xl">
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-foreground">Disparo Automático</span>
                  <span className="text-xs text-muted-foreground">Inicia o disparo da campanha via {platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'} para o público selecionado.</span>
                </div>
                <Button 
                  variant="primary" 
                  size="sm"
                  className="rounded-xl px-5 h-11 flex items-center gap-2 text-xs uppercase tracking-wider font-bold shrink-0 w-full sm:w-auto"
                  onClick={handleSend}
                  disabled={isSending || (status?.type === 'success')}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : status?.type === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Enviado
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Disparar Campanha
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar: Status e Histórico */}
        <div className="space-y-6">
          <Card title="Status do n8n" className="bg-muted/30 border-primary/20">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
                <span className="text-sm font-medium">Conectado</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">v1.24.0</span>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden border-primary/20">
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
