import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Link as LinkIcon, 
  Sparkles, 
  Search, 
  Globe, 
  Shield, 
  Cpu,
  ArrowRight,
  Rocket,
  MousePointer2,
  Lock,
  ChevronRight,
  TrendingUp,
  Layout,
  Star,
  CheckCircle2,
  Users,
  Megaphone,
  ArrowUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Helmet } from 'react-helmet-async';

const Landing: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#F8F9FA] overflow-x-hidden selection:bg-blue-500/30 font-sans">
      <Helmet>
        <title>AfiliateFlow IA | Inteligência Artificial para Afiliados de Elite</title>
        <meta name="description" content="Domine o mercado de afiliados com automação inteligente, IA de alta conversão e monitoramento em tempo real." />
      </Helmet>
      
      {/* Background Glows + Balões Flutuantes */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ overflow: 'hidden', contain: 'strict' }}>
        
        {/* Balão 1: Lilás - Topo Esquerdo */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            top: '-10%',
            left: '-10%',
            background: 'radial-gradient(circle at 40% 40%, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.05) 50%, transparent 80%)',
            filter: 'blur(70px)',
          }}
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Balão 2: Verde - Direita */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            top: '15%',
            right: '-5%',
            background: 'radial-gradient(circle at 30% 30%, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.04) 50%, transparent 80%)',
            filter: 'blur(60px)',
          }}
          animate={{ y: [0, 40, 0], x: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Balão 3: Lilás - Centro Esquerda */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 700,
            height: 700,
            top: '40%',
            left: '-15%',
            background: 'radial-gradient(circle at 60% 40%, rgba(168,85,247,0.1) 0%, rgba(168,85,247,0.03) 50%, transparent 80%)',
            filter: 'blur(80px)',
          }}
          animate={{ y: [0, 30, 0], x: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />

        {/* Balão 4: Verde - Inferior Centro */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            bottom: '-15%',
            right: '20%',
            background: 'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.09) 0%, rgba(34,197,94,0.03) 50%, transparent 80%)',
            filter: 'blur(75px)',
          }}
          animate={{ y: [0, -40, 0], x: [0, -30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* Balão 5: Lilás - Inferior Direita */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 550,
            height: 550,
            bottom: '-5%',
            right: '-10%',
            background: 'radial-gradient(circle at 30% 60%, rgba(124,58,237,0.11) 0%, rgba(124,58,237,0.04) 50%, transparent 80%)',
            filter: 'blur(65px)',
          }}
          animate={{ y: [0, -25, 0], x: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </div>

      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#020617]/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/afiliatFlow_.png" 
              alt="AfiliateFlow IA" 
              className="h-10 md:h-14 w-auto object-contain" 
            />
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            {['Recursos', 'Performance', 'Tecnologia'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className="text-[11px] font-medium text-white/50 hover:text-white transition-all tracking-[0.2em] uppercase"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <button className="hidden sm:block text-[10px] font-medium tracking-widest uppercase text-white/50 hover:text-white transition-colors">
                LOGIN
              </button>
            </Link>
            <Link to="/login">
              <Button variant="premium" size="xs" className="rounded-full px-5 py-2 group">
                COMEÇAR AGORA <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-56 md:pb-40 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-10">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">IA Driven Performance</span>
              </div>
              
              <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-white">
                Multiplique suas comissões: <br />
                <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-indigo-400 to-purple-500 text-3xl md:text-6xl">
                  transforme cliques em massa em receita automática.
                </span>
              </h1>
              
              <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-normal">
                Plataforma de Inteligência de Compartilhamento de links de afiliados, 
                Analytics e buscas avançadas em massa. - Tudo em um único lugar.
              </p>
              
              <div className="flex flex-col sm:row items-center justify-center gap-6">
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="premium" size="sm" className="w-full sm:w-auto rounded-full px-10 py-6 text-xs tracking-widest group">
                    TESTE GRÁTIS AGORA <Rocket className="w-4 h-4 ml-2 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </Link>
                <div className="flex items-center gap-4 group cursor-help">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-[#020617] bg-slate-800 shadow-xl overflow-hidden">
                        <div className="w-full h-full bg-linear-to-br from-slate-700 to-slate-900" />
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-black text-white/90 uppercase tracking-widest">+2.500 AFILIADOS</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest">Ativos hoje</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="mt-32 relative max-w-6xl mx-auto"
            >
              <div className="absolute -inset-4 bg-blue-500/20 blur-[120px] opacity-30 rounded-full" />
              <div className="relative rounded-[2.5rem] border border-white/10 bg-slate-900/30 backdrop-blur-3xl p-3 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-tr from-blue-500/5 via-transparent to-purple-500/5" />
                <div className="aspect-video rounded-[2rem] overflow-hidden border border-white/5 bg-[#020617] relative group">
                  <img 
                    src="/images/dashboard-mockup.png" 
                    alt="Affilehub Dashboard" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-1000"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop';
                    }}
                  />
                  {/* Floating Elements */}
                  <div className="absolute top-8 left-8 p-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl animate-bounce">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="absolute bottom-12 right-12 p-6 rounded-3xl bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 shadow-2xl">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Taxa de Conversão</div>
                    <div className="text-3xl font-black text-white">24.8%</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="mt-16 mb-12"
            >
              <h3 className="text-3xl md:text-6xl font-black tracking-tighter italic bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-indigo-400 to-purple-500 py-2">
                Inteligência que escala seus lucros
              </h3>
            </motion.div>

            {/* Process Cycle Illustration */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative w-full max-w-[480px] aspect-square mx-auto mt-4 mb-20 flex items-center justify-center"
            >
              <div className="absolute -inset-10 bg-blue-500/10 blur-[100px] opacity-20 rounded-full" />
              
              {/* === SVG: Trilha do círculo === */}
              <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full" style={{ overflow: 'hidden' }}>
                <defs>
                  <filter id="orb-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="node-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Glow de fundo central */}
                <circle cx="200" cy="200" r="90" fill="url(#centerGlow)" />

                {/* Trilha principal — círculo base */}
                <circle cx="200" cy="200" r="130" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />

                {/* Trilha pontilhada */}
                <circle cx="200" cy="200" r="130" fill="none" stroke="#3b82f6" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3 10" />

                {/* Círculo interno (ornamental) */}
                <circle cx="200" cy="200" r="60" fill="none" stroke="#6366f1" strokeOpacity="0.1" strokeWidth="1" />

                {/* Segmentos conectores (raios dos ícones ao centro) */}
                {[270, 342, 54, 126, 198].map((deg, i) => {
                  const rad = (deg * Math.PI) / 180;
                  const x = 200 + 130 * Math.cos(rad);
                  const y = 200 + 130 * Math.sin(rad);
                  return (
                    <line key={i}
                      x1="200" y1="200"
                      x2={x} y2={y}
                      stroke="white" strokeOpacity="0.04" strokeWidth="1"
                    />
                  );
                })}
              </svg>

              {/* === ORBITADOR PRINCIPAL: container full-size, bolinha na borda do círculo === */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                style={{ pointerEvents: 'none' }}
              >
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: 'calc(50% - 32.5%)',
                  transform: 'translate(-50%, -50%)',
                  width: 14,
                  height: 14,
                }}>
                  <div className="absolute rounded-full bg-blue-400 opacity-70"
                    style={{ inset: -8, filter: 'blur(8px)' }} />
                  <div className="relative w-full h-full rounded-full bg-white shadow-lg"
                    style={{ boxShadow: '0 0 12px 4px rgba(96,165,250,0.8)' }} />
                </div>
              </motion.div>

              {/* === ORBITADOR SECUNDÁRIO: sentido oposto, mais lento === */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: -360 }}
                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                style={{ pointerEvents: 'none' }}
              >
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: 'calc(50% - 32.5%)',
                  transform: 'translate(-50%, -50%)',
                  width: 8,
                  height: 8,
                }}>
                  <div className="absolute rounded-full bg-purple-400 opacity-50"
                    style={{ inset: -5, filter: 'blur(5px)' }} />
                  <div className="relative w-full h-full rounded-full bg-purple-300"
                    style={{ boxShadow: '0 0 8px 2px rgba(168,85,247,0.6)' }} />
                </div>
              </motion.div>

              {/* === Badge Central === */}
              <motion.div
                className="absolute z-10"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-20 h-20 rounded-full bg-[#050d1f] border border-blue-500/25 flex flex-col items-center justify-center shadow-2xl shadow-blue-500/20 backdrop-blur-xl">
                  <div className="text-[7px] font-black text-blue-400 uppercase tracking-[0.2em] leading-tight">Affiliate</div>
                  <div className="text-[7px] font-black text-blue-400 uppercase tracking-[0.2em] leading-tight">Flow</div>
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5"
                    animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              {/* === Ícones posicionados no círculo === */}
              {[
                { icon: Search,       label: 'Encontrar',  color: 'text-blue-400',   border: 'border-blue-500/30',   shadow: 'shadow-blue-500/20',   deg: 270 },
                { icon: Megaphone,    label: 'Promover',   color: 'text-purple-400', border: 'border-purple-500/30', shadow: 'shadow-purple-500/20', deg: 342 },
                { icon: CheckCircle2, label: 'Track',      color: 'text-green-400',  border: 'border-green-500/30',  shadow: 'shadow-green-500/20',  deg: 54  },
                { icon: Sparkles,     label: 'Comissões',  color: 'text-amber-400',  border: 'border-amber-500/30',  shadow: 'shadow-amber-500/20',  deg: 126 },
                { icon: Users,        label: 'Escala',     color: 'text-indigo-400', border: 'border-indigo-500/30', shadow: 'shadow-indigo-500/20', deg: 198 },
              ].map((node, i) => {
                const rad = (node.deg * Math.PI) / 180;
                // r=130, container=400 → fração = 130/400 = 0.325
                const cx = 50 + 32.5 * Math.cos(rad);
                const cy = 50 + 32.5 * Math.sin(rad);
                return (
                  <motion.div
                    key={i}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-20"
                    style={{ left: `${cx}%`, top: `${cy}%` }}
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.6, ease: 'easeInOut' }}
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-[#080f20] backdrop-blur-xl border ${node.border} flex items-center justify-center shadow-lg ${node.shadow} transition-all duration-300 hover:scale-110`}>
                      <node.icon className={`w-5 h-5 ${node.color}`} />
                    </div>
                    <span className="text-[8px] font-black text-white/45 uppercase tracking-widest whitespace-nowrap">{node.label}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Value Proposition */}
        <section id="recursos" className="pt-16 pb-32 px-6 relative border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                <span style={{
                  background: 'linear-gradient(90deg, #ffffff 0%, #e9d5ff 50%, #c084fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  O que você encontra aqui!
                </span>
              </h2>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-16 items-center">
              {[
                { 
                  icon: Sparkles, 
                  title: 'IA Persuasiva', 
                  desc: 'Scripts e copys que tocam na dor do seu cliente e aceleram a venda.',
                  color: 'text-blue-400',
                  bg: 'bg-blue-400/10'
                },
                { 
                  icon: Rocket, 
                  title: 'Escala Rápida', 
                  desc: 'Gerencie milhares de links e campanhas com o clique de um botão.',
                  color: 'text-purple-400',
                  bg: 'bg-purple-400/10'
                },
                { 
                  icon: Shield, 
                  title: 'Anti-Bloqueio', 
                  desc: 'Tecnologia avançada para proteger seus links de banimentos.',
                  color: 'text-indigo-400',
                  bg: 'bg-indigo-400/10'
                },
                { 
                  icon: Search, 
                  title: 'Buscador Turbo', 
                  desc: 'Buscas Avançadas com ferramentas OSINT integradas para minerar oportunidades.',
                  color: 'text-green-400',
                  bg: 'bg-green-400/10'
                },
                { 
                  icon: Lock, 
                  title: 'Link Inspector AI', 
                  desc: 'Inspetor de Links maliciosos com Análise multicamadas de links, phishing e detecção preditiva.',
                  color: 'text-red-400',
                  bg: 'bg-red-400/10'
                },
                { 
                  icon: Layout, 
                  title: 'Vitrine de Links', 
                  desc: 'Compartilhamento profissional, organização e alcance para crescer seu público com autoridade.',
                  color: 'text-amber-400',
                  bg: 'bg-amber-400/10'
                }
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className={`w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/5 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{item.title}</h3>
                  <p className="text-slate-400 font-light leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── Seção: Controle total na palma da mão ── */}
        <section className="py-16 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(12,10,35,0.92) 0%, rgba(15,10,42,0.92) 100%)',
                border: '1px solid rgba(139,92,246,0.12)',
                boxShadow: '0 20px 60px rgba(139,92,246,0.08)',
              }}
            >
              {/* Glow sutil interno */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 25% 60%, rgba(139,92,246,0.07) 0%, transparent 65%)' }}
              />

              <div className="relative z-10 flex flex-col md:flex-row items-stretch">

                {/* Coluna esquerda — Texto */}
                <div className="flex flex-col justify-center gap-6 p-8 md:p-12 md:w-[50%] shrink-0">

                  {/* Badge */}
                  <div className="inline-flex w-fit items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/15">
                    <MousePointer2 className="w-3 h-3 text-violet-400" />
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em]">Mobile First</span>
                  </div>

                  {/* Título degradê branco → lilás */}
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
                    <span className="text-white">Controle total</span>{' '}
                    <span style={{
                      background: 'linear-gradient(90deg, #e9d5ff 0%, #c084fc 55%, #a855f7 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      na palma da mão
                    </span>
                  </h2>

                  {/* Descrição */}
                  <p className="text-sm md:text-lg text-slate-400 leading-relaxed max-w-md">
                    Monitore comissões, gere links e acompanhe campanhas em tempo real — direto do celular ou tablet.
                  </p>

                  {/* Bullets compactos */}
                  <ul className="flex flex-col gap-4">
                    {[
                      { icon: TrendingUp, text: 'Dashboard em tempo real' },
                      { icon: Shield,     text: 'Dados seguros e criptografados' },
                      { icon: Zap,        text: 'Alertas instantâneos de conversão' },
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm md:text-base text-white/80">
                        <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center shrink-0">
                          <item.icon className="w-4 h-4 text-violet-400" />
                        </div>
                        {item.text}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link to="/register" className="mt-4">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm md:text-base font-bold text-white tracking-wide"
                      style={{
                        background: 'linear-gradient(135deg, #6d28d9, #9333ea)',
                        boxShadow: '0 6px 24px rgba(109,40,217,0.3)',
                      }}
                    >
                      Começar grátis
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
                </div>

                {/* Coluna direita — Imagem Animada */}
                <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-r-3xl p-6 md:p-10 bg-[#020617]/50 backdrop-blur-sm border-l border-white/5">
                  <motion.div
                    animate={{ y: [-8, 8, -8] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-full max-w-[500px]"
                  >
                    <img
                      src="/black_.png"
                      alt="Afiliado controlando dashboard pelo tablet"
                      className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(168,85,247,0.15)]"
                    />
                  </motion.div>
                </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-40 px-6">
          <div className="max-w-6xl mx-auto relative group">
            {/* Glow de fundo */}
            <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-[4rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
            
            {/* Wrapper com p-[1px] (borda fina) e track super sutil */}
            <div className="relative p-[1px] rounded-[4rem] overflow-hidden bg-white/[0.03]">
              
              {/* Efeito de linha circulando (Google Studio style) */}
              <div className="absolute inset-[-50%] pointer-events-none">
                 <div className="w-full h-full animate-[spin_4s_linear_infinite]"
                      style={{ background: 'conic-gradient(from 0deg, transparent 70%, #3b82f6 85%, #a855f7 100%)' }} />
              </div>

              {/* Core content */}
              <div className="relative bg-[#050505] rounded-[calc(4rem-1px)] p-12 md:p-32 text-center overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] pointer-events-none" />
                
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">O sucesso não espera.</h2>
                <p className="text-sm md:text-base text-slate-400 mb-10 max-w-xl mx-auto">
                  Pare de perder vendas por falta de dados. Junte-se aos afiliados que já usam a inteligência da AfiliateFlow IA.
                </p>
                <div className="flex flex-col items-center gap-8">
                  <Link to="/login">
                    <Button variant="premium" size="md" className="rounded-full px-12 py-6 text-xs tracking-[0.2em] font-bold">
                      CRIAR CONTA AGORA
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2 text-white/30 text-[9px] font-bold uppercase tracking-[0.2em]">
                    <Lock className="w-3 h-3" />
                    Privacidade total garantida
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#010101]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:row items-center justify-between gap-12 mb-12">
            <div className="flex items-center gap-2">
              <img 
                src="/afiliatFlow_.png" 
                alt="AfiliateFlow IA" 
                className="h-10 md:h-14 w-auto object-contain" 
              />
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {['Instagram', 'Youtube', 'Twitter', 'Suporte'].map((item) => (
                <a key={item} href="#" className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/30 hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center border-t border-white/5 pt-8 gap-6">
            <div className="flex flex-col items-center gap-1 md:gap-2 text-center">
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.1em]">
                © 2026 AFILIATEFLOW IA INC. TODOS OS DIREITOS RESERVADOS.
              </div>
              <div className="text-[10px] text-purple-400 font-medium tracking-[0.1em] flex items-center justify-center gap-1.5 opacity-80">
                <span>{'{'} cidengenharia desenvolvimento ia - sidney sales {'}'}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6">
              <span className="text-[9px] text-white/10 font-medium tracking-widest uppercase cursor-pointer hover:text-white/30 transition-colors">Termos</span>
              <span className="text-[9px] text-white/10 font-medium tracking-widest uppercase cursor-pointer hover:text-white/30 transition-colors">Privacidade</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-blue-600/80 hover:bg-blue-500 text-white rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 border border-white/10"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Landing;

