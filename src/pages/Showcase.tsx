import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Share2, 
  ExternalLink, 
  Zap, 
  MessageCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  LayoutGrid,
  LayoutDashboard,
  X,
  Trophy,
  ArrowLeft,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import type { Link, Profile } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Showcase: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShowcaseData = async () => {
      setIsLoading(true);
      try {
        // 1. Buscar perfil pelo username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError || !profileData) {
          throw new Error('Usuário não encontrado');
        }

        setProfile(profileData as Profile);

        // 2. Buscar links ativos deste usuário
        const { data: linksData, error: linksError } = await supabase
          .from('links')
          .select('*')
          .eq('user_id', profileData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (linksError) throw linksError;

        setLinks(linksData as Link[]);
      } catch (err: any) {
        console.error('Erro ao carregar vitrine:', err);
        setError(err.message || 'Erro ao carregar os produtos.');
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchShowcaseData();
    }
  }, [username]);

  const handleShareShowcase = () => {
    const text = `Confira minha vitrine de ofertas no Affilehub! 🚀\n\n${window.location.href}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareProduct = (link: Link) => {
    const text = `🔥 *OFERTA IMPERDÍVEL!* 🔥\n\n*${link.title}*\n\n🛒 Compre agora: ${window.location.origin}/go/${link.short_code}\n\nVia Affilehub ⚡`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (link: Link) => {
    const url = `${window.location.origin}/go/${link.short_code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrar links com base na busca
  const filteredLinks = links.filter(link => 
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (link.platform && link.platform.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Agrupar links filtrados por plataforma
  const platforms = ['Shopee', 'Amazon', 'Mercado Livre', 'Magalu', 'Hotmart', 'Kiwify', 'Outras'];
  
  const groupedLinks = filteredLinks.reduce((acc, link) => {
    let platform = link.platform || 'Outras';
    const normalized = platforms.find(p => platform.toLowerCase().includes(p.toLowerCase())) || 'Outras';
    
    if (!acc[normalized]) acc[normalized] = [];
    acc[normalized].push(link);
    return acc;
  }, {} as Record<string, Link[]>);

  const renderStars = (rating: number = 5) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Zap 
        key={i} 
        className={`w-3 h-3 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/20'}`} 
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary w-8 h-8 fill-primary" />
        </div>
        <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] mt-8 animate-pulse">
          Sintonizando as melhores ofertas...
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mb-8">
          <AlertCircle className="w-12 h-12 text-danger" />
        </div>
        <h1 className="text-3xl font-black mb-4 tracking-tighter">Ops! Vitrine não encontrada</h1>
        <p className="text-muted-foreground max-w-md mb-10 font-medium leading-relaxed">
          O link que você acessou pode estar incorreto ou o usuário ainda não configurou sua vitrine.
        </p>
        <Button variant="primary" onClick={() => window.location.href = '/'} className="rounded-2xl px-8 py-6 font-black uppercase tracking-widest text-xs">
          Voltar para Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0A0A0A] pb-24 selection:bg-primary/20">
      <Helmet>
        <title>{profile.full_name || 'Afiliado'} | Vitrine de Ofertas Affilehub</title>
        <meta name="description" content={`Confira as melhores ofertas e produtos selecionados por ${profile.full_name || 'nosso parceiro'}.`} />
        {profile.avatar_url && <meta property="og:image" content={profile.avatar_url} />}
      </Helmet>
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Header Ultra Premium */}
      <header className="bg-white/70 dark:bg-black/70 backdrop-blur-2xl border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary to-purple-600 p-[1px] shadow-lg shadow-primary/20">
              <div className="w-full h-full rounded-[15px] bg-white dark:bg-card flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-primary text-xl">{profile.full_name?.charAt(0) || 'U'}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-black uppercase tracking-tight text-foreground leading-none">
                {profile.full_name || 'Afiliado Profissional'}
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                  Vitrine Oficial Verificada
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user?.id === profile.id && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')} 
                className="rounded-xl border border-border/50 hidden sm:flex"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                <span className="font-black text-[10px] uppercase tracking-widest">Painel</span>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShareShowcase} 
              className="rounded-xl border-border/50 hover:bg-primary hover:text-white hover:border-primary transition-all group"
            >
              <Share2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline font-black text-[10px] uppercase tracking-widest">Compartilhar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Showcase Premium */}
      <section className="relative py-12 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Zap className="w-12 h-12 text-primary fill-primary mx-auto mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter text-foreground leading-none">
              OFERTAS <span className="text-primary italic">EXCLUSIVAS</span>
            </h2>
            <p className="text-muted-foreground text-[10px] md:text-sm font-bold uppercase tracking-[0.4em] max-w-xl mx-auto leading-relaxed mb-12">
              Produtos validados com as melhores condições do mercado
            </p>

            {/* Search Bar Premium */}
            <div className="max-w-xl mx-auto relative group">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center bg-white dark:bg-card border border-border/50 rounded-2xl p-2 shadow-xl backdrop-blur-xl">
                <div className="pl-4 pr-2">
                  <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                </div>
                <input 
                  type="text" 
                  placeholder="O que você está procurando hoje?..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-3"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="p-2 hover:bg-muted rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categorized Links Grid */}
      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {Object.keys(groupedLinks).length > 0 ? (
          <div className="space-y-24">
            {platforms.map(platformName => {
              const platformLinks = groupedLinks[platformName];
              if (!platformLinks || platformLinks.length === 0) return null;
              
              return (
                <section key={platformName} className="relative">
                  <div className="flex items-center gap-6 mb-12">
                    <div className="flex-1 h-[1px] bg-linear-to-r from-transparent via-border to-transparent" />
                    <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white dark:bg-card border border-border/50 shadow-sm">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">
                        {platformName}
                      </h3>
                      <div className="w-1.5 h-1.5 bg-border rounded-full" />
                      <span className="text-[10px] text-primary font-black uppercase tracking-widest">
                        {platformLinks.length} Itens
                      </span>
                    </div>
                    <div className="flex-1 h-[1px] bg-linear-to-r from-transparent via-border to-transparent" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {platformLinks.map((link, idx) => (
                      <motion.div 
                        key={link.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -8 }}
                      >
                        <Card className="h-full flex flex-col p-0 overflow-hidden border-border/50 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 bg-white dark:bg-card group rounded-3xl">
                          <div className="aspect-square relative overflow-hidden bg-muted/20">
                            {link.thumbnail_url ? (
                              <img 
                                src={link.thumbnail_url} 
                                alt={link.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                <ShoppingBag className="w-12 h-12 text-muted-foreground/20" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Sem imagem</span>
                              </div>
                            )}
                            
                            {/* Badges Flutuantes */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                              {link.is_featured && (
                                <div className="bg-primary text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-white/20">
                                  <Trophy className="w-3 h-3" />
                                  Destaque
                                </div>
                              )}
                              <div className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/10 shadow-lg w-fit">
                                {platformName}
                              </div>
                            </div>
                            
                            {link.original_price && link.sale_price && (
                              <div className="absolute top-4 right-4 bg-danger text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl animate-bounce">
                                -{Math.round((1 - link.sale_price / link.original_price) * 100)}% OFF
                              </div>
                            )}

                            <div className="absolute bottom-4 right-4 flex gap-2 translate-y-12 group-hover:translate-y-0 transition-all duration-300">
                              <button 
                                onClick={() => handleCopyLink(link)}
                                className="w-10 h-10 bg-white/90 dark:bg-black/80 backdrop-blur-xl rounded-2xl shadow-xl flex items-center justify-center hover:text-primary transition-colors border border-border/20"
                                title="Copiar Link"
                              >
                                {copiedId === link.id ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                              </button>
                              <button 
                                onClick={() => handleShareProduct(link)}
                                className="w-10 h-10 bg-white/90 dark:bg-black/80 backdrop-blur-xl rounded-2xl shadow-xl flex items-center justify-center hover:text-primary transition-colors border border-border/20"
                                title="Compartilhar no WhatsApp"
                              >
                                <MessageCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-6 flex-1 flex flex-col">
                            <h4 className="font-bold text-sm md:text-base line-clamp-2 mb-2 min-h-[3rem] group-hover:text-primary transition-colors leading-snug">
                              {link.title}
                            </h4>

                            <div className="flex items-center gap-1 mb-4">
                              {renderStars(link.rating)}
                              <span className="text-[10px] text-muted-foreground ml-1 font-bold">(5.0)</span>
                            </div>
                            
                            <div className="mt-auto space-y-6">
                              <div className="flex flex-col gap-1">
                                {link.original_price && (
                                  <span className="text-[10px] text-muted-foreground line-through font-bold uppercase tracking-widest opacity-60">
                                    De R$ {link.original_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-primary">R$</span>
                                  <span className="text-3xl font-black text-foreground tracking-tighter">
                                    {(link.sale_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>

                              <Button 
                                variant="primary" 
                                className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/25 group/btn relative overflow-hidden"
                                onClick={() => window.open(`${window.location.origin}/go/${link.short_code}`, '_blank')}
                              >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                  RESGATAR OFERTA <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-linear-to-r from-primary to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="py-32 text-center bg-white dark:bg-card rounded-[3rem] border-2 border-dashed border-border/50 shadow-inner">
            <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-black tracking-tighter mb-4">Aguardando novidades...</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
              Esta vitrine está sendo preparada com as melhores ofertas do mercado. Volte em breve!
            </p>
          </div>
        )}
      </div>

          {/* Footer Branding */}
      <footer className="mt-20 py-16 border-t border-border/30 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-primary/5 opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="text-white w-5 h-5 fill-white" />
            </div>
            <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-muted-foreground">Affilehub</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">
            Crie sua própria vitrine gratuita em <span className="text-primary hover:underline cursor-pointer">affilehub.com</span>
          </p>
          <div className="max-w-xs mx-auto p-3 rounded-xl bg-green-500/5 border border-green-500/10">
            <p className="text-[9px] text-green-500/60 font-bold uppercase tracking-widest">
              Ambiente Seguro & Verificado
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Showcase;
