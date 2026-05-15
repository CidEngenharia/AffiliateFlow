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
  Ghost
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../components/ui/Button';

interface ScanResult {
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

const Inspector: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
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

  const handleScan = () => {
    if (!url) return;
    setIsScanning(true);
    setResult(null);
    setScanStep(0);

    // Simulação de scan em etapas
    const interval = setInterval(() => {
      setScanStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            setResult({
              url: url.startsWith('http') ? url : `https://${url}`,
              riskScore: Math.floor(Math.random() * 100),
              status: 'suspicious',
              details: {
                ssl: { valid: true, issuer: "Let's Encrypt", expiry: "2026-08-12" },
                whois: { age: "24 dias", registrar: "NameCheap", country: "Islândia" },
                dns: { spf: true, dmarc: false, mx: true },
                reputation: { blacklisted: true, sources: ["PhishTank", "OpenPhish"] },
                aiInsight: "Este domínio apresenta padrões de Typosquatting (imitação de domínios legítimos) e usa um servidor de hospedagem frequentemente associado a campanhas de phishing financeiro. Recomendamos cautela extrema."
              },
              screenshot: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80"
            });
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
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
        className="bg-card/30 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group"
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
                className="h-full bg-primary"
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
              <div className="bg-card/50 backdrop-blur-xl border border-border p-8 rounded-[2.5rem] flex flex-col items-center">
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

              <div className="bg-card/50 backdrop-blur-xl border border-border p-6 rounded-[2rem] space-y-4">
                <div className="flex items-center space-x-2 font-bold mb-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  <span>AI Insight</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground italic">
                   "{result.details.aiInsight}"
                </p>
              </div>
            </div>

            {/* Coluna 2: Detalhes Técnicos */}
            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SSL Info */}
                <div className="bg-card/50 backdrop-blur-xl border border-border p-6 rounded-3xl group hover:border-primary/50 transition-colors">
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
                <div className="bg-card/50 backdrop-blur-xl border border-border p-6 rounded-3xl group hover:border-primary/50 transition-colors">
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
                <div className="bg-card/50 backdrop-blur-xl border border-border p-6 rounded-3xl group hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-5 h-5 text-red-500" />
                      <span className="font-bold">Blacklists</span>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.details.reputation.sources.map(s => (
                      <span key={s} className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-1 rounded uppercase border border-red-500/20">{s}</span>
                    ))}
                    <span className="bg-muted text-muted-foreground text-[10px] px-2 py-1 rounded uppercase">Google Safe: OK</span>
                  </div>
                </div>

                {/* Sandbox Preview */}
                <div className="bg-card/50 backdrop-blur-xl border border-border p-6 rounded-3xl group hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-5 h-5 text-primary" />
                      <span className="font-bold">Página Real (Sandbox)</span>
                    </div>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-500">
                    <img src={result.screenshot} alt="Screenshot" className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="text-white border-white/20">Ampliar</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end space-x-4">
                 <Button variant="ghost" className="text-muted-foreground">
                   <ChevronRight className="w-4 h-4 mr-2" /> Exportar JSON
                 </Button>
                 <Button variant="primary">
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
