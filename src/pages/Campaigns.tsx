import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Send, 
  MessageSquare, 
  History, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Users,
  Smartphone,
  ExternalLink,
  Loader2,
  Settings,
  HelpCircle,
  Database,
  RefreshCw,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  QrCode,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { whatsappService, WAGroup, WASegment, WACampaignReport, WAConnectionState } from '../services/whatsappService';

const Campaigns: React.FC = () => {
  // Estado de navegação lateral interna
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'whatsapp' | 'segments' | 'monitor' | 'reports'>('overview');
  
  // Estado global do WhatsApp
  const [connection, setConnection] = useState<WAConnectionState>({ connected: false });
  const [groups, setGroups] = useState<WAGroup[]>([]);
  const [segments, setSegments] = useState<WASegment[]>([]);
  const [reports, setReports] = useState<WACampaignReport[]>([]);
  const [stats, setStats] = useState({ totalSent: 0, totalSegments: 0, queueCount: 0, connected: false });

  // Modal QR Code
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [qrStep, setQrStep] = useState<'idle' | 'generating' | 'ready' | 'connecting' | 'success'>('idle');
  const [qrProgress, setQrProgress] = useState(0);

  // Form de Envio
  const [message, setMessage] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [delayMin, setDelayMin] = useState(1);
  const [delayMax, setDelayMax] = useState(4);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Form de Segmentos
  const [newSegmentName, setNewSegmentName] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Config do Monitoramento
  const [monitorSegmentId, setMonitorSegmentId] = useState<string>('');
  const [monitorActive, setMonitorActive] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const conn = whatsappService.getConnection();
    const grps = whatsappService.getGroups();
    const segs = whatsappService.getSegments();
    const reps = whatsappService.getReports();
    const st = whatsappService.getStats();
    const dly = whatsappService.getDelay();
    const mon = whatsappService.getMonitorConfig();

    setConnection(conn);
    setGroups(grps);
    setSegments(segs);
    setReports(reps);
    setStats(st);
    setDelayMin(dly.min);
    setDelayMax(dly.max);
    
    if (mon.monitoredSegmentId) {
      setMonitorSegmentId(mon.monitoredSegmentId);
      setMonitorActive(true);
    } else {
      setMonitorActive(false);
    }

    if (segs.length > 0 && !selectedSegmentId) {
      setSelectedSegmentId(segs[0].id);
    }
    if (segs.length > 0 && !monitorSegmentId) {
      setMonitorSegmentId(segs[0].id);
    }
  };

  // Simular Conexão QR Code
  const handleStartConnection = () => {
    setQrStep('generating');
    setIsQrModalOpen(true);
    
    // Simula geração de QR Code
    setTimeout(() => {
      setQrCodeValue(`https://wa.me/qr/AFILIATEFLOW_${Date.now()}`);
      setQrStep('ready');
      setQrProgress(100);
    }, 1500);
  };

  // Efeito de escaneamento simulado do QR Code
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (qrStep === 'ready') {
      timeout = setTimeout(() => {
        setQrStep('connecting');
        timeout = setTimeout(() => {
          whatsappService.connect('+55 11 99999-9999', 'Sidney Afiliado');
          setQrStep('success');
          setConnection({ connected: true, phone: '+55 11 99999-9999', name: 'Sidney Afiliado' });
          loadData();
          
          timeout = setTimeout(() => {
            setIsQrModalOpen(false);
            setQrStep('idle');
            setActiveTab('whatsapp'); // Vai para aba WhatsApp após conectar
          }, 1500);
        }, 2000);
      }, 5000); // Aguarda 5 segundos o escaneamento
    }
    return () => clearTimeout(timeout);
  }, [qrStep]);

  // Desconectar WhatsApp
  const handleDisconnect = () => {
    if (confirm('Deseja realmente desconectar esta conta do WhatsApp?')) {
      whatsappService.disconnect();
      setConnection({ connected: false });
      loadData();
    }
  };

  // Atualizar grupos
  const handleRefreshGroups = () => {
    whatsappService.refreshGroups();
    loadData();
  };

  // Criar Segmento
  const handleCreateSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSegmentName.trim()) return;
    if (selectedGroupIds.length === 0) {
      alert('Selecione pelo menos um grupo para o segmento.');
      return;
    }

    whatsappService.createSegment(newSegmentName, selectedGroupIds);
    setNewSegmentName('');
    setSelectedGroupIds([]);
    loadData();
  };

  // Excluir Segmento
  const handleDeleteSegment = (id: string) => {
    if (confirm('Deseja realmente excluir este segmento?')) {
      whatsappService.deleteSegment(id);
      loadData();
    }
  };

  // Alternar checkbox de grupos no segmento
  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  // Disparar Campanha
  const handleSendCampaign = () => {
    if (!connection.connected) {
      setSendError('Conecte o WhatsApp antes de realizar disparos.');
      return;
    }
    if (!message.trim()) {
      setSendError('Digite uma mensagem.');
      return;
    }
    if (!selectedSegmentId) {
      setSendError('Selecione um segmento de destino.');
      return;
    }

    setSendError(null);
    setIsSending(true);

    const targetSeg = segments.find(s => s.id === selectedSegmentId);
    const totalGroups = targetSeg ? targetSeg.groupIds.length : 0;

    // Criar relatório inicial como "sending"
    const newReport = whatsappService.addReport({
      title: message.length > 50 ? message.substring(0, 47) + '...' : message,
      platform: 'WhatsApp',
      status: 'sending',
      progress: 0,
      sent: 0,
      failed: 0,
      delayMin,
      delayMax
    });

    loadData();

    // Simular progresso de envio com delay real
    let currentSent = 0;
    const interval = setInterval(() => {
      currentSent += 1;
      const progress = Math.min(Math.round((currentSent / totalGroups) * 100), 100);
      
      const reportsList = whatsappService.getReports();
      const updatedReports = reportsList.map(r => {
        if (r.id === newReport.id) {
          return {
            ...r,
            sent: currentSent,
            progress,
            status: progress === 100 ? 'completed' as const : 'sending' as const,
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      });

      localStorage.setItem('wa_reports', JSON.stringify(updatedReports));
      loadData();

      if (currentSent >= totalGroups) {
        clearInterval(interval);
        setIsSending(false);
        setMessage('');
        setActiveTab('reports'); // Redireciona para relatórios
      }
    }, 2000); // 2 segundos por grupo para simulação rápida
  };

  // Salvar configuração de monitoramento
  const handleSaveMonitor = () => {
    whatsappService.saveMonitorConfig({
      monitoredSegmentId: monitorActive ? monitorSegmentId : null,
      autoGroupIds: []
    });
    alert('Configuração de monitoramento salva com sucesso!');
    loadData();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Megaphone className="w-8 h-8 text-emerald-500 mr-3" />
            Campanhas & Disparos WhatsApp
          </h1>
          <p className="text-muted-foreground text-sm">Dispare links de ofertas em massa de forma inteligente para seus grupos de WhatsApp.</p>
        </div>
        
        <div className="flex gap-2">
          {connection.connected ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold px-4 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              WhatsApp Conectado
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500 flex items-center gap-2 rounded-xl"
              onClick={handleStartConnection}
            >
              <QrCode className="w-4 h-4" />
              Conectar WhatsApp
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-xl">
            <Clock className="w-4 h-4 mr-2" />
            Agendamentos
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navegação Lateral Interna */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-border/80 pr-0 lg:pr-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-2 border-emerald-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            Visão Geral
          </button>
          
          <button
            onClick={() => setActiveTab('send')}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'send'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-2 border-emerald-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Send className="w-4 h-4" />
            Enviar Mensagem
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-2 border-emerald-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp / Grupos
          </button>

          <button
            onClick={() => setActiveTab('segments')}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'segments'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-2 border-emerald-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Users className="w-4 h-4" />
            Segmentos
          </button>

          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'monitor'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-2 border-emerald-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Monitoramento
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'reports'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-2 border-emerald-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <History className="w-4 h-4" />
            Relatórios
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 min-w-0">
          {/* ABA: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Cards de Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5 border-border/80">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Mensagens Enviadas</div>
                  <div className="text-3xl font-black text-foreground">{stats.totalSent}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total acumulado de envios</div>
                </Card>

                <Card className="p-5 border-border/80">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Segmentos Ativos</div>
                  <div className="text-3xl font-black text-foreground">{stats.totalSegments}</div>
                  <div className="text-xs text-muted-foreground mt-1">Filtros de grupos configurados</div>
                </Card>

                <Card className="p-5 border-border/80">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Fila de Espera</div>
                  <div className="text-3xl font-black text-foreground">{stats.queueCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Campanhas aguardando disparo</div>
                </Card>

                <Card className="p-5 border-border/80 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Instância WhatsApp</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${connection.connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-sm font-bold text-foreground">
                        {connection.connected ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                  </div>
                  {connection.connected && (
                    <span className="text-[10px] text-muted-foreground mt-2 block overflow-hidden text-ellipsis whitespace-nowrap">
                      {connection.phone}
                    </span>
                  )}
                </Card>
              </div>

              {/* Status do Disparador Inteligente */}
              <Card className="p-6 border-emerald-500/20 bg-emerald-500/5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Status do Disparador</h3>
                    <p className="text-sm text-muted-foreground">O monitoramento automático de novos produtos de vitrine está {monitorActive ? 'ATIVO' : 'DESATIVADO'}.</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button 
                      variant="primary" 
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
                      onClick={() => setActiveTab('send')}
                    >
                      Criar Nova Campanha
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded-xl"
                      onClick={() => setActiveTab('whatsapp')}
                    >
                      Ver Status Conexão
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Dicas e Ajuda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5 border-border/80">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-emerald-500" />
                    Como funciona o Disparador Inteligente?
                  </h4>
                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0">1</span>
                      <span><strong>Conecte seu WhatsApp:</strong> Clique em "Conectar WhatsApp" e escaneie o QR Code no seu aplicativo.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0">2</span>
                      <span><strong>Crie seus Segmentos:</strong> Agrupe seus canais/grupos para enviar para públicos específicos simultaneamente.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0">3</span>
                      <span><strong>Configure o Envio Automático:</strong> Deixe a IA disparar ofertas automaticamente quando um produto com alta classificação for rastreado.</span>
                    </li>
                  </ul>
                </Card>

                <Card className="p-5 border-border/80">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-orange-500" />
                    Dicas contra Bloqueios (Anti-Ban)
                  </h4>
                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 shrink-0 mt-0.5">•</span>
                      <span>Utilize delays amplos entre os disparos (recomendado de 15 a 60 segundos por grupo).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 shrink-0 mt-0.5">•</span>
                      <span>Evite enviar para números que não te adicionaram ou em grupos que você não é administrador (ou que não permitem envio).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 shrink-0 mt-0.5">•</span>
                      <span>Use a IA do AffiliateFlow para gerar copies diversificadas e dinâmicas para o mesmo produto.</span>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          )}

          {/* ABA: ENVIAR */}
          {activeTab === 'send' && (
            <div className="space-y-6">
              <Card className="p-6 border-border/80">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold">Nova Campanha WhatsApp</h3>
                    <p className="text-xs text-muted-foreground">Envie uma mensagem personalizada para todos os grupos de um segmento.</p>
                  </div>

                  {sendError && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{sendError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Segmento de Destino */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Segmento de Destino</label>
                      {segments.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-2">
                          Nenhum segmento cadastrado. <button onClick={() => setActiveTab('segments')} className="text-emerald-500 font-bold hover:underline">Criar segmento</button>
                        </div>
                      ) : (
                        <select 
                          value={selectedSegmentId} 
                          onChange={(e) => setSelectedSegmentId(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        >
                          {segments.map(seg => (
                            <option key={seg.id} value={seg.id}>
                              {seg.name} ({seg.groupIds.length} grupos)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Delay */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delay Mínimo (segundos)</label>
                        <input 
                          type="number" 
                          min={1} 
                          value={delayMin} 
                          onChange={(e) => setDelayMin(Number(e.target.value))}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delay Máximo (segundos)</label>
                        <input 
                          type="number" 
                          min={delayMin} 
                          value={delayMax} 
                          onChange={(e) => setDelayMax(Number(e.target.value))}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        />
                      </div>
                    </div>

                    {/* Editor de Texto */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mensagem</label>
                        <span className="text-xs text-muted-foreground">{message.length}/4000</span>
                      </div>
                      <textarea
                        rows={6}
                        placeholder="Insira o texto da sua oferta, links promocionais e emojis..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none leading-relaxed"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setMessage('')}
                      disabled={isSending}
                      className="rounded-xl"
                    >
                      Limpar
                    </Button>
                    <Button 
                      variant="primary" 
                      className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 rounded-xl"
                      onClick={handleSendCampaign}
                      disabled={isSending || !connection.connected || segments.length === 0}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
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
          )}

          {/* ABA: WHATSAPP / GRUPOS */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              {/* Card de Conexão */}
              <Card className="p-6 border-border/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">
                        {connection.connected ? `Instância ativa: ${connection.name}` : 'Instância do WhatsApp'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {connection.connected 
                          ? `Telefone vinculado: ${connection.phone}. Pronto para envios.` 
                          : 'Conecte seu aparelho escaneando o QR Code para disparar em massa.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {connection.connected ? (
                      <Button variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/5 rounded-xl text-xs font-bold" onClick={handleDisconnect}>
                        Desconectar Aparelho
                      </Button>
                    ) : (
                      <Button variant="primary" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2" onClick={handleStartConnection}>
                        <QrCode className="w-4 h-4" />
                        Gerar Novo QR Code
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Tabela de Grupos Importados */}
              <Card className="p-0 overflow-hidden border-border/80">
                <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm">Meus Grupos de WhatsApp</h3>
                    <p className="text-xs text-muted-foreground">Canais e grupos importados automaticamente da sua conta.</p>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl text-xs" 
                    onClick={handleRefreshGroups}
                    disabled={!connection.connected}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-2" />
                    Sincronizar Grupos
                  </Button>
                </div>

                {!connection.connected ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Conecte o WhatsApp para sincronizar e listar seus grupos de ofertas.
                  </div>
                ) : groups.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Nenhum grupo sincronizado ainda. Clique em "Sincronizar Grupos".
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/10 font-bold uppercase tracking-wider text-muted-foreground">
                          <th className="p-4">Nome do Grupo</th>
                          <th className="p-4">Participantes</th>
                          <th className="p-4">Sou Administrador</th>
                          <th className="p-4 text-center">ID Instância</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {groups.map(g => (
                          <tr key={g.id} className="hover:bg-muted/10">
                            <td className="p-4 font-semibold text-foreground">{g.name}</td>
                            <td className="p-4">{g.participants} membros</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                g.isAdmin 
                                  ? 'bg-emerald-500/10 text-emerald-500' 
                                  : 'bg-red-500/10 text-red-500'
                              }`}>
                                {g.isAdmin ? 'Sim' : 'Não'}
                              </span>
                            </td>
                            <td className="p-4 text-center font-mono text-[10px] text-muted-foreground">{g.id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ABA: SEGMENTOS */}
          {activeTab === 'segments' && (
            <div className="space-y-6">
              {/* Criar Segmento */}
              <Card className="p-6 border-border/80">
                <form onSubmit={handleCreateSegment} className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold">Criar Segmento de Envio</h3>
                    <p className="text-xs text-muted-foreground">Agrupe vários grupos de WhatsApp em uma única lista de transmissão inteligente.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome do Segmento</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Grupo de Ofertas VIP, Tech, Geral" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                      value={newSegmentName}
                      onChange={(e) => setNewSegmentName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Selecionar Grupos do Segmento</label>
                    {groups.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2">
                        Nenhum grupo disponível. Conecte o WhatsApp para listar seus grupos.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-border rounded-xl p-3 bg-muted/10">
                        {groups.map(g => (
                          <label key={g.id} className="flex items-center gap-3 p-2 hover:bg-muted/30 rounded-lg cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedGroupIds.includes(g.id)}
                              onChange={() => toggleGroupSelection(g.id)}
                              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                            />
                            <div className="text-xs">
                              <div className="font-semibold text-foreground">{g.name}</div>
                              <div className="text-[10px] text-muted-foreground">{g.participants} membros</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold"
                      disabled={!newSegmentName || selectedGroupIds.length === 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Novo Segmento
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Lista de Segmentos Existentes */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm">Meus Segmentos</h3>
                {segments.length === 0 ? (
                  <Card className="p-8 text-center text-xs text-muted-foreground border-border/80">
                    Nenhum segmento criado. Use o formulário acima para agrupar seus grupos.
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {segments.map(seg => (
                      <Card key={seg.id} className="p-5 border-border/80 relative flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm text-foreground">{seg.name}</h4>
                            <button 
                              onClick={() => handleDeleteSegment(seg.id)}
                              className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="text-xs text-muted-foreground space-y-2 mt-3">
                            <div className="font-bold text-foreground">Grupos inclusos:</div>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                              {seg.groupIds.map(id => {
                                const g = groups.find(gp => gp.id === id);
                                return (
                                  <span key={id} className="bg-muted px-2 py-0.5 rounded text-[10px]">
                                    {g ? g.name : id}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-border mt-4 pt-3 flex justify-between items-center text-[10px] text-muted-foreground">
                          <span>Criado em: {new Date(seg.createdAt).toLocaleDateString()}</span>
                          <span className="font-bold text-emerald-500 uppercase">{seg.groupIds.length} grupos</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA: MONITORAMENTO */}
          {activeTab === 'monitor' && (
            <div className="space-y-6">
              <Card className="p-6 border-border/80">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold">Envio Automático (Vitrine Inteligente)</h3>
                    <p className="text-xs text-muted-foreground">Dispare ofertas automaticamente para seus grupos quando novos cupons ou produtos com grande desconto forem minerados pela IA.</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-xl">
                    <div className="space-y-1 pr-4">
                      <div className="text-sm font-bold text-foreground">Status do Envio Automático</div>
                      <div className="text-xs text-muted-foreground">Se ativo, novos produtos adicionados à vitrine com desconto {'>'}= 50% dispararão para o WhatsApp.</div>
                    </div>

                    <button 
                      onClick={() => setMonitorActive(!monitorActive)}
                      className="text-emerald-500 hover:scale-105 transition-transform"
                    >
                      {monitorActive ? (
                        <ToggleRight className="w-12 h-12" />
                      ) : (
                        <ToggleLeft className="w-12 h-12 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {monitorActive && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Segmento de Grupos Alvo</label>
                        {segments.length === 0 ? (
                          <div className="text-xs text-muted-foreground">
                            Nenhum segmento cadastrado para monitoramento.
                          </div>
                        ) : (
                          <select 
                            value={monitorSegmentId}
                            onChange={(e) => setMonitorSegmentId(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                          >
                            {segments.map(seg => (
                              <option key={seg.id} value={seg.id}>
                                {seg.name} ({seg.groupIds.length} grupos)
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-orange-500 text-xs">
                        <strong>Aviso importante:</strong> O Envio Automático monitora sua vitrine a cada 10 minutos. O delay configurado de {delayMin}s a {delayMax}s será respeitado entre os envios em cada grupo para prevenir bloqueios.
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button 
                      variant="primary" 
                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold"
                      onClick={handleSaveMonitor}
                    >
                      Salvar Configurações
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ABA: RELATÓRIOS */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Histórico de Disparos</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl text-xs text-red-500 border-red-500/20 hover:bg-red-500/5"
                  onClick={() => {
                    if (confirm('Deseja apagar todo o histórico de relatórios?')) {
                      whatsappService.clearReports();
                      loadData();
                    }
                  }}
                >
                  Limpar Relatórios
                </Button>
              </div>

              {reports.length === 0 ? (
                <Card className="p-8 text-center text-xs text-muted-foreground border-border/80">
                  Nenhum disparo registrado até o momento.
                </Card>
              ) : (
                <div className="space-y-3">
                  {reports.map((rep) => (
                    <Card key={rep.id} className="p-4 border-border/80">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{rep.platform}</div>
                          <h4 className="font-semibold text-sm text-foreground">{rep.title}</h4>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                            <span>Iniciado em: {new Date(rep.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>Delay: {rep.delayMin}s - {rep.delayMax}s</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {/* Barra de Progresso */}
                          <div className="w-32 space-y-1 text-right">
                            <div className="text-[10px] font-bold text-foreground">{rep.progress}% Concluído</div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div 
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: `${rep.progress}%` }} 
                              />
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              rep.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                              rep.status === 'sending' ? 'bg-orange-500/10 text-orange-500 animate-pulse' :
                              rep.status === 'queue' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {rep.status === 'completed' ? 'Concluído' :
                               rep.status === 'sending' ? 'Enviando' :
                               rep.status === 'queue' ? 'Fila' : 'Falhou'}
                            </span>
                            <div className="text-[10px] text-muted-foreground mt-1">{rep.sent} envios</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal QR Code */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <Card className="max-w-md w-full p-6 space-y-6 relative border-border/80">
            <button 
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              ×
            </button>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">Conectar WhatsApp</h3>
              <p className="text-xs text-muted-foreground">Escaneie o QR Code abaixo usando o leitor de aparelhos conectados do seu WhatsApp.</p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-muted/10 rounded-2xl border border-border/60">
              {qrStep === 'generating' && (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                  <span className="text-xs font-semibold text-muted-foreground">Gerando QR Code criptografado...</span>
                </div>
              )}

              {qrStep === 'ready' && qrCodeValue && (
                <div className="space-y-4 flex flex-col items-center">
                  <div className="p-3 bg-white rounded-xl shadow-md">
                    <QRCodeSVG value={qrCodeValue} size={200} />
                  </div>
                  <span className="text-xs font-semibold text-emerald-500 animate-pulse">Aguardando leitura do celular...</span>
                </div>
              )}

              {qrStep === 'connecting' && (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                  <span className="text-xs font-semibold text-muted-foreground">Carregando grupos e conversas...</span>
                </div>
              )}

              {qrStep === 'success' && (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                    <Check className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-emerald-500">Conectado com sucesso!</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <div className="font-bold text-foreground">Instruções:</div>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Abra o WhatsApp no seu celular</li>
                <li>Toque em Mais opções (três pontos) ou Configurações e selecione Dispositivos conectados</li>
                <li>Toque em Conectar um dispositivo</li>
                <li>Aponte seu celular para esta tela para capturar o código</li>
              </ol>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
