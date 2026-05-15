import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Link as LinkIcon, 
  Sparkles, 
  BarChart3, 
  Search, 
  Globe, 
  Shield, 
  Cpu,
  ArrowRight,
  CheckCircle2,
  Rocket,
  MousePointer2,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

import { Helmet } from 'react-helmet-async';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#020202] text-[#F8F9FA] overflow-x-hidden selection:bg-primary/30">
      <Helmet>
        <title>Affilehub | Gestão de Afiliados de Elite com IA e OSINT</title>
        <meta name="description" content="A plataforma definitiva para afiliados. Gestão de links em massa, IA para copy persuasiva, busca turbo com OSINT e vitrine personalizada." />
      </Helmet>
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] opacity-20" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] opacity-10" />
      </div>
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-white to-white/60">Affilehub</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-bold text-white/50 hover:text-primary transition-all tracking-widest uppercase text-[10px]">Recursos</a>
            <a href="#performance" className="text-sm font-bold text-white/50 hover:text-primary transition-all tracking-widest uppercase text-[10px]">Performance</a>
            <a href="#osint" className="text-sm font-bold text-white/50 hover:text-primary transition-all tracking-widest uppercase text-[10px]">OSINT</a>
          </div>
          <Link to="/login">
            <Button variant="primary" className="rounded-full px-8 py-2 font-black text-[11px] tracking-widest uppercase group">
              ENTRAR <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-40 pb-20 md:pt-56 md:pb-32 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary mb-8 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">A Próxima Geração de Afiliados</span>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1] text-white">
                Gestão e Compartilhamento de <br />
                <span className="bg-clip-text text-transparent bg-linear-to-r from-primary via-purple-400 to-blue-500">links de afiliados</span> em massa
              </h1>
              
              <p className="text-lg md:text-2xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
                Potencialize seus resultados com automação inteligente, IA persuasiva e ferramentas OSINT avançadas para dominar o mercado de afiliados.
              </p>
              
              <div className="flex flex-col sm:row items-center justify-center gap-6">
                <Link to="/login">
                  <Button variant="primary" size="lg" className="rounded-2xl px-12 py-8 text-xl font-black shadow-[0_20px_50px_rgba(59,130,246,0.3)] group relative overflow-hidden">
                    <span className="relative z-10 flex items-center gap-3">
                      COMEÇAR AGORA <Rocket className="w-6 h-6 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-linear-to-r from-primary to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </Link>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Configuração em segundos</span>
                  </div>
                </div>
              </div>

              {/* Nota sobre Navegadores */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 inline-block max-w-xl mx-auto"
              >
                <p className="text-green-500 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Nota: Navegadores bloqueiam aberturas múltiplas. Clique nos botões acima para forçar a abertura se necessário.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 px-4 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tighter">Poder além da imaginação</h2>
              <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Tudo o que você precisa em um só lugar</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1: AI Copy */}
              <motion.div whileHover={{ y: -10 }} transition={{ duration: 0.3 }}>
                <Card className="p-10 h-full bg-white/[0.03] backdrop-blur-3xl border-white/5 hover:border-primary/30 transition-all rounded-[2.5rem] group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-white">Crie copys persuasivas com IA</h3>
                  <p className="text-white/50 text-sm leading-relaxed font-medium">
                    Nossa inteligência artificial treinada em conversão gera legendas, e-mails e scripts de vendas altamente persuasivos em segundos.
                  </p>
                </Card>
              </motion.div>

              {/* Feature 2: Analytics */}
              <motion.div whileHover={{ y: -10 }} transition={{ duration: 0.3 }}>
                <Card className="p-10 h-full bg-white/[0.03] backdrop-blur-3xl border-white/5 hover:border-purple-500/30 transition-all rounded-[2.5rem] group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-8 border border-purple-500/20">
                    <BarChart3 className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-white">Acompanhamento de Performance & Analytics</h3>
                  <p className="text-white/50 text-sm leading-relaxed font-medium">
                    Visualize cliques, conversões e ROI em tempo real. Tome decisões baseadas em dados reais das suas campanhas com dashboards intuitivos.
                  </p>
                </Card>
              </motion.div>

              {/* Feature 3: OSINT */}
              <motion.div whileHover={{ y: -10 }} transition={{ duration: 0.3 }} id="osint">
                <Card className="p-10 h-full bg-white/[0.03] backdrop-blur-3xl border-white/5 hover:border-green-500/30 transition-all rounded-[2.5rem] group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-8 border border-green-500/20">
                    <Search className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-white">Buscas Avançada com Operadores OSINT</h3>
                  <p className="text-white/50 text-sm leading-relaxed font-medium">
                    Utilize técnicas de Open Source Intelligence para encontrar brechas no mercado, analisar concorrentes e descobrir novos nichos lucrativos.
                  </p>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview / Carousel Section */}
        <section id="performance" className="py-32 px-4 overflow-hidden bg-white/[0.02]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:row items-center gap-20">
              <div className="flex-1 space-y-10">
                <div className="w-16 h-16 rounded-[1.5rem] bg-linear-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/30">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white">Infraestrutura de Elite</h2>
                <p className="text-white/60 text-lg leading-relaxed font-medium">
                  Domine o mercado com ferramentas profissionais. O Affilehub foi desenhado para quem não aceita menos que a excelência.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { icon: Zap, text: 'Redirecionamento ultra-rápido' },
                    { icon: Shield, text: 'Segurança nível bancário' },
                    { icon: MousePointer2, text: 'Filtros de tráfego real' },
                    { icon: Globe, text: 'Acesso global 24/7' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <item.icon className="w-5 h-5 text-primary" />
                      <span className="text-sm font-black uppercase tracking-widest text-[10px]">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 relative group w-full">
                <div className="absolute -inset-10 bg-primary/20 blur-[100px] opacity-20 rounded-full" />
                
                {/* Premium Carousel */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="relative rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-3xl p-3 shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  <div className="aspect-[16/10] relative overflow-hidden rounded-[2.2rem]">
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
                    
                    <motion.div 
                      className="flex"
                      animate={{ x: ["0%", "-100%", "-200%", "-300%", "-400%"] }}
                      transition={{ 
                        duration: 25, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        repeatType: "loop"
                      }}
                    >
                      {[
                        { src: "/images/carousel-1.png", title: "Gestão Inteligente" },
                        { src: "/images/carousel-2.jpg", title: "Analytics de Elite" },
                        { src: "/images/carousel-3.png", title: "Busca OSINT Turbo" },
                        { src: "/images/carousel-4.png", title: "Automação de Links" },
                        { src: "/images/carousel-5.png", title: "Vitrine Mobile Premium" }
                      ].map((slide, i) => (
                        <div key={i} className="min-w-full h-full relative group">
                          <img 
                            src={slide.src} 
                            alt={slide.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                          <div className="absolute bottom-12 left-12 z-20">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2 block">{slide.title}</span>
                            <h4 className="text-2xl font-black text-white tracking-tighter">Performance de Alta Precisão</h4>
                          </div>
                        </div>
                      ))}
                    </motion.div>

                    {/* Navigation Dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                      {[0,1,2,3,4].map((dot) => (
                        <div key={dot} className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-40 px-4">
          <div className="max-w-5xl mx-auto rounded-[4rem] bg-linear-to-br from-primary via-purple-600 to-blue-600 p-[1px]">
            <div className="bg-[#0A0A0A] rounded-[3.9rem] p-12 md:p-24 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] opacity-50" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 blur-[100px] opacity-30" />
              
              <div className="relative z-10">
                <h2 className="text-5xl md:text-7xl font-black mb-10 text-white tracking-tighter">Pronto para dominar?</h2>
                <p className="text-white/50 text-xl mb-14 max-w-2xl mx-auto font-medium">
                  Junte-se a elite dos afiliados e transforme sua operação com inteligência artificial e dados reais.
                </p>
                <div className="flex flex-col items-center gap-8">
                  <Link to="/login">
                    <Button variant="primary" size="lg" className="rounded-2xl px-16 py-9 text-2xl font-black shadow-2xl shadow-primary/30 hover:scale-105 transition-transform">
                      CRIAR MINHA CONTA GRÁTIS
                    </Button>
                  </Link>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    Sem cartão de crédito necessário
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:row items-center justify-between gap-10 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="font-black text-xl tracking-tighter text-white">Affilehub</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Termos</a>
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Contato</a>
            </div>
          </div>
          <div className="flex flex-col md:row items-center justify-between border-t border-white/5 pt-10 gap-6">
            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">
              © 2026 Affilehub Inc. Sempre preserve compatibilidade.
            </p>
            <div className="flex items-center gap-6">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <Globe className="w-4 h-4 text-white/40" />
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <Shield className="w-4 h-4 text-white/40" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
