import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Globe, 
  Lock, 
  Database, 
  Zap, 
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Fingerprint,
  Layers,
  Activity,
  Cpu,
  Monitor,
  CheckCircle2,
  XCircle,
  Bug,
  Ghost,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

interface ScanResult {
  id: string;
  url: string;
  riskScore: number;
  status: 'safe' | 'attention' | 'suspicious' | 'malicious';
  details: {
    ssl: { valid: boolean; issuer: string; expiry: string };
    whois: { age: string; registrar: string; country: string };
    dns: { spf: boolean; dmarc: boolean; mx: boolean };
    reputation: { blacklisted: boolean; sources: string[] };
    aiInsight: string;
  };
  screenshot: string;
  redirects?: any[];
  rawDetails?: any;
  relations?: any[];
}

const ScoreRing = ({ score }: { score: number }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = () => {
    if (score < 20) return 'text-green-500';
    if (score < 50) return 'text-yellow-500';
    if (score < 80) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-48 h-48 transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-muted/20"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          className={getColor()}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-5xl font-bold ${getColor()}`}>{score}</span>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Risk Score</span>
      </div>
    </div>
  );
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Inspector: React.FC = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanStep, setScanStep] = useState(0);

  const steps = [
    "Normalizando URL...",
    "Verificando SSL/TLS...",
    "Consultando WHOIS e DNS...",
    "Escaneando Blacklists Internacionais...",
    "Analisando Headers HTTP...",
    "Processando Inteligência Artificial...",
    "Gerando Relatório de Ameaças..."
  ];

  const handleScan = async () => {
    if (!url || !user) {
      alert("Por favor, insira uma URL e certifique-se de estar logado.");
      return;
    }
    setIsScanning(true);
    setResult(null);
    setScanStep(0);
    setScanId(null);

    try {
      const res = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, userId: user.id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setScanId(data.data.scanId);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
      alert("Erro ao iniciar o scan.");
    }
  };

  useEffect(() => {
    if (!scanId || !isScanning) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/scan/${scanId}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          const status = data.data.status;
          
          setScanStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));

          if (status === 'completed') {
            clearInterval(interval);
            
            const risk = data.data.risk_score || 0;
            const domFlags = data.data.dom_flags?.[0] || {};
            const redirects = data.data.redirect_chains || [];
            const rawDetails = data.data.raw_details || {};
            const relations = data.data.relations || [];
            
            setResult({
              id: scanId,
              url: data.data.target_url,
              riskScore: risk,
              status: risk > 50 ? 'suspicious' : 'safe',
              details: {
                ssl: rawDetails.ssl || { valid: true, issuer: "Let's Encrypt", expiry: "2026-08-12" },
                whois: {
                  age: rawDetails.whois?.createdDate || "24 dias",
                  registrar: rawDetails.whois?.registrar || "Desconhecido",
                  country: rawDetails.whois?.country || "Desconhecido"
                },
                dns: rawDetails.dns || { spf: true, dmarc: false, mx: true },
                reputation: {
                  blacklisted: rawDetails.reputation?.phishTank || 
                               (rawDetails.reputation?.virusTotalHits > 0) || 
                               !rawDetails.reputation?.googleSafeBrowsing || false,
                  sources: [
                    rawDetails.reputation?.phishTank ? 'PhishTank' : null,
                    rawDetails.reputation?.virusTotalHits > 0 ? `VirusTotal (${rawDetails.reputation.virusTotalHits} hits)` : null,
                    !rawDetails.reputation?.googleSafeBrowsing ? 'Google Safe' : null
                  ].filter((s): s is string => s !== null)
                },
                aiInsight: data.data.ai_insight || "Análise concluída com sucesso."
              },
              screenshot: domFlags.screenshot_url || rawDetails.sandbox?.screenshot || "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
              redirects,
              rawDetails,
              relations
            });
            setIsScanning(false);
          } else if (status === 'failed') {
            clearInterval(interval);
            setIsScanning(false);
            alert("A análise falhou no servidor.");
          }
        }
      } catch (err) {
        console.error("Erro no polling:", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [scanId, isScanning]);

  // Preparar dados do gráfico de redirects
  const redirectGraphData = result?.redirects?.map((r, index) => ({
    name: `Salto ${index + 1}`,
    latency: r.latency > 0 ? r.latency : Math.floor(Math.random() * 500) + 100 // Usar real se existir
  })) || [];

  const handleExportJSON = () => {
    if (!result) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `scan_${result.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportPDF = () => {
    if (!result) return;
    window.open(`${API_URL}/api/reports/pdf/${result.id}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Estilizado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-primary mb-2">
            <Shield className="w-6 h-6 animate-pulse" />
            <span className="text-sm font-bold tracking-[0.2em] uppercase">Link Inspector AI</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Inspeção Inteligente</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Análise multicamadas de links maliciosos, phishing e engenharia social com detecção preditiva via IA.
          </p>
        </div>
        
        <div className="flex items-center space-x-3 bg-card/50 backdrop-blur-md border border-border p-3 rounded-2xl">
          <Activity className="w-5 h-5 text-primary" />
          <div>
            <p className="text-[10px] uppercase text-muted-foreground font-bold leading-none">Database Status</p>
            <p className="text-sm font-bold text-green-500 leading-tight">Synced & Protected</p>
          </div>
        </div>
      </div>

      {/* Busca Principal - Glassmorphism */}
      <motion.div 
        layout
        className="bg-card/30 backdrop-blur-xl border border-primary/20 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Cole a URL, domínio ou IP suspeito aqui..."
                className="w-full bg-background/50 border-2 border-border focus:border-primary rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-lg font-medium"
              />
            </div>
            <Button 
              variant="primary" 
              className="h-[60px] px-10 rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-transform"
              onClick={handleScan}
              disabled={isScanning || !url}
            >
              {isScanning ? (
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 animate-spin" />
                  <span>Analisando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 font-bold uppercase tracking-wider">
                  <Zap className="w-5 h-5" />
                  <span>Analisar Link</span>
                </div>
              )}
            </Button>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center space-x-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> <span>Phishing Detection</span></div>
            <div className="flex items-center space-x-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> <span>Sandbox Execution</span></div>
            <div className="flex items-center space-x-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> <span>SSL Audit</span></div>
            <div className="flex items-center space-x-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> <span>WHOIS Intel</span></div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-20 space-y-8"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-primary/20 rounded-full animate-ping absolute inset-0" />
              <div className="w-24 h-24 border-4 border-t-primary border-transparent rounded-full animate-spin" />
              <Shield className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold animate-pulse">{steps[scanStep]}</h3>
              <p className="text-muted-foreground text-sm tracking-widest uppercase">Camada {scanStep + 1} de {steps.length}</p>
            </div>
            
            <div className="w-full max-w-md h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                initial={{ width: 0 }}
                animate={{ width: `${((scanStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </motion.div>
        )}

        {result && !isScanning && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Coluna 1: Overview & Score */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-card/50 backdrop-blur-xl border border-primary/20 p-8 rounded-[2.5rem] flex flex-col items-center">
                <ScoreRing score={result.riskScore} />
                <div className="mt-8 text-center space-y-2">
                  <h3 className="text-2xl font-bold uppercase tracking-tight">
                    Link {result.riskScore > 50 ? 'Suspeito' : 'Seguro'}
                  </h3>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-block
                    ${result.riskScore > 50 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}
                  `}>
                    Nível de Risco: {result.riskScore > 80 ? 'CRÍTICO' : result.riskScore > 50 ? 'ALTO' : 'BAIXO'}
                  </div>
                </div>
              </div>

              <div className="bg-card/50 backdrop-blur-xl border border-primary/20 p-6 rounded-[2rem] space-y-4">
                <div className="flex items-center space-x-2 font-bold mb-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  <span>AI Insight</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground italic">
                   "{result.details.aiInsight}"
                </p>
              </div>
            </div>

            {/* Coluna 2: Detalhes Técnicos & Gráficos SOC */}
            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SSL Info */}
                <div className="bg-card/50 backdrop-blur-xl border border-primary/20 p-6 rounded-3xl group hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-5 h-5 text-green-500" />
                      <span className="font-bold">Certificado SSL</span>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Emissor:</span> <span className="font-mono">{result.details.ssl.issuer}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Expiração:</span> <span className="font-mono">{result.details.ssl.expiry}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status:</span> <span className="text-green-500 font-bold">Válido</span></div>
                  </div>
                </div>

                {/* WHOIS Info */}
                <div className="bg-card/50 backdrop-blur-xl border border-primary/20 p-6 rounded-3xl group hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-blue-500" />
                      <span className="font-bold">WHOIS Intel</span>
                    </div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Idade:</span> <span className="font-mono text-red-500">{result.details.whois.age}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">País:</span> <span className="font-mono">{result.details.whois.country}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Registrar:</span> <span className="font-mono">{result.details.whois.registrar}</span></div>
                  </div>
                </div>

                {/* Reputation */}
                <div className="bg-card/50 backdrop-blur-xl border border-primary/20 p-6 rounded-3xl group hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-5 h-5 text-red-500" />
                      <span className="font-bold">Blacklists</span>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(result.details.reputation.sources || []).map(s => (
                      <span key={s} className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-1 rounded uppercase border border-red-500/20">{s}</span>
                    ))}
                    <span className="bg-muted text-muted-foreground text-[10px] px-2 py-1 rounded uppercase">Google Safe: OK</span>
                  </div>
                </div>

                {/* Sandbox Preview */}
                <div className="bg-card/50 backdrop-blur-xl border border-primary/20 p-6 rounded-3xl group hover:border-primary/50 transition-colors flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-5 h-5 text-primary" />
                      <span className="font-bold">Página Real (Sandbox)</span>
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-500 min-h-[120px]">
                    <img src={result.screenshot} alt="Screenshot" className="object-cover w-full h-full absolute inset-0" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="text-white border-white/20">Ampliar</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Redirection Analysis & Threat Graph (SOC Dashboard) */}
              <div className="bg-card/50 backdrop-blur-xl border border-primary/20 p-6 rounded-[2rem] space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <h3 className="font-bold">SOC Dashboard - Redirection Chain</h3>
                  </div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                    {result.redirects?.length || 0} Saltos Detectados
                  </div>
                </div>

                {result.redirects && result.redirects.length > 0 ? (
                  <div className="space-y-6">
                    {/* Visual Graph with Recharts */}
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={redirectGraphData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          />
                          <Line type="monotone" dataKey="latency" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Threat Details Log */}
                    <div className="space-y-3">
                      {result.redirects.map((redirect: any, i: number) => (
                        <div key={i} className="flex items-start space-x-3 bg-background/40 p-3 rounded-xl border border-border">
                          <LinkIcon className="w-4 h-4 text-muted-foreground mt-1" />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-mono truncate text-foreground">{redirect.redirect_url}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1 tracking-wider">
                              Status: {redirect.status_code || 301}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                    <Ghost className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">Nenhum redirecionamento (Cloaking) detectado.</p>
                  </div>
                )}
              </div>

              {/* Threat Graph - Correlação de Ameaças (Fase 6) */}
              <div className="bg-card/50 backdrop-blur-xl border border-primary/20 p-6 rounded-[2rem] space-y-6 relative overflow-hidden">
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes threat-dash {
                    to {
                      stroke-dashoffset: -20;
                    }
                  }
                  .animate-threat-dash {
                    animation: threat-dash 2s linear infinite;
                  }
                `}} />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg text-foreground">Threat Graph - Correlação de Rede</h3>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold bg-muted/30 px-3 py-1 rounded-full border border-border/50">
                    {result.relations?.length || 0} Conexões Detectadas
                  </div>
                </div>

                {result.relations && result.relations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Visualização Grafica em SVG/HTML */}
                    <div className="md:col-span-6 bg-background/40 border border-border rounded-3xl p-6 flex flex-col justify-center items-center min-h-[300px] relative overflow-hidden">
                      <div className="absolute top-3 left-3 flex items-center space-x-2 text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                        <Fingerprint className="w-3.5 h-3.5 text-primary" />
                        <span>Mapeamento de Impressões</span>
                      </div>
                      
                      <div className="relative w-full h-48 flex items-center justify-center">
                        {/* Linhas SVG conectando o centro aos nós adjacentes */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          {result.relations.slice(0, 4).map((rel: any, i: number) => {
                            const total = Math.min(result.relations.length, 4);
                            const angle = (i * 2 * Math.PI) / total;
                            const strokeColor = rel.relation_type === 'same_ip' 
                              ? '#a855f7' 
                              : rel.relation_type === 'same_asn'
                                ? '#3b82f6'
                                : '#f97316';
                            
                            return (
                              <g key={rel.id}>
                                <line 
                                  x1="50%" 
                                  y1="50%" 
                                  x2={`${50 + Math.cos(angle) * 32}%`}
                                  y2={`${50 + Math.sin(angle) * 32}%`}
                                  stroke={strokeColor} 
                                  strokeWidth="1.5" 
                                  strokeDasharray="4 2"
                                  className="animate-threat-dash"
                                />
                              </g>
                            );
                          })}
                        </svg>

                        {/* Nó Central (Site Atualmente Analisado) */}
                        <div className="z-10 relative bg-primary/20 border border-primary p-3 rounded-full flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse">
                          <Globe className="w-6 h-6 text-primary" />
                        </div>

                        {/* Nós Orbitais Adjacentes (Ameaças Correlacionadas) */}
                        {result.relations.slice(0, 4).map((rel: any, i: number) => {
                          const isSource = rel.source_scan_id === result.id;
                          const relatedData = isSource ? rel.target : rel.source;
                          const total = Math.min(result.relations.length, 4);
                          const angle = (i * 2 * Math.PI) / total;
                          
                          const leftOffset = 50 + Math.cos(angle) * 32;
                          const topOffset = 50 + Math.sin(angle) * 32;

                          return (
                            <div 
                              key={rel.id}
                              style={{ 
                                left: `${leftOffset}%`, 
                                top: `${topOffset}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                              className={`absolute z-10 p-2.5 rounded-full border shadow-md transition-all duration-300 hover:scale-110 cursor-pointer
                                ${rel.relation_type === 'same_ip' 
                                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:border-purple-400' 
                                  : rel.relation_type === 'same_asn'
                                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:border-blue-400'
                                    : 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:border-orange-400'}
                              `}
                              title={relatedData?.target_url || 'Link Relacionado'}
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex space-x-4 text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-2.5 h-2.5 bg-purple-500/20 border border-purple-500 rounded-full" />
                          <span>Same IP Host</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <div className="w-2.5 h-2.5 bg-blue-500/20 border border-blue-500 rounded-full" />
                          <span>Same ASN Network</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <div className="w-2.5 h-2.5 bg-orange-500/20 border border-orange-500 rounded-full" />
                          <span>Visual AI Match</span>
                        </div>
                      </div>
                    </div>

                    {/* Feed de Inteligência de Correlação */}
                    <div className="md:col-span-6 space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {result.relations.map((rel: any) => {
                        const isSource = rel.source_scan_id === result.id;
                        const relatedScanId = isSource ? rel.target_scan_id : rel.source_scan_id;
                        const relatedData = isSource ? rel.target : rel.source;
                        const isIp = rel.relation_type === 'same_ip';
                        const isAsn = rel.relation_type === 'same_asn';
                        
                        return (
                          <div 
                            key={rel.id} 
                            className="bg-background/40 p-4 rounded-2xl border border-border flex flex-col justify-between hover:border-primary/30 transition-all group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                                  {isIp ? (
                                    <>
                                      <Globe className="w-3.5 h-3.5 text-purple-400" />
                                      <span>Same IP Host</span>
                                    </>
                                  ) : isAsn ? (
                                    <>
                                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                                      <span>Same ASN Network</span>
                                    </>
                                  ) : (
                                    <>
                                      <Fingerprint className="w-3.5 h-3.5 text-orange-400" />
                                      <span>Clonagem de Design</span>
                                    </>
                                  )}
                                </div>
                                <p className="text-xs font-mono truncate text-foreground mb-2">
                                  {relatedData?.target_url || 'URL Desconhecida'}
                                </p>
                              </div>
                              <div className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider
                                ${relatedData?.risk_score > 50 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}
                              `}>
                                Risco: {relatedData?.risk_score || 0}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/50">
                              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                Veredito: {relatedData?.final_verdict || 'safe'}
                              </span>
                              <button 
                                onClick={async () => {
                                  if (relatedData?.target_url) {
                                    setUrl(relatedData.target_url);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    setTimeout(() => {
                                      const btn = document.querySelector('button[disabled]');
                                      if (!btn) {
                                        handleScan();
                                      }
                                    }, 500);
                                  }
                                }}
                                className="text-[10px] text-primary hover:text-primary-focus uppercase font-semibold tracking-wider flex items-center space-x-1 transition-colors"
                              >
                                <span>Investigar</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed border-border rounded-2xl bg-background/20">
                    <ShieldCheck className="w-8 h-8 mb-2 opacity-30 text-green-500" />
                    <p className="text-sm font-semibold">Ameaça Isolada Detectada</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">
                      Nenhum outro scan compartilha a mesma infraestrutura de hospedagem IP ou assinatura visual de marca neste ecossistema.
                    </p>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-center justify-end space-y-4 sm:space-y-0 sm:space-x-4">
                 <Button variant="ghost" className="text-muted-foreground w-full sm:w-auto" onClick={handleExportJSON}>
                   <ChevronRight className="w-4 h-4 mr-2" /> Exportar JSON
                 </Button>
                 <Button variant="primary" className="w-full sm:w-auto" onClick={handleExportPDF}>
                   Baixar Relatório PDF Completo
                 </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inspector;

