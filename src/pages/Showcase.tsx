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
  Search,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import type { Link, Profile } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const getPlatformLogo = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes('shopee')) return '/shopee.png';
  if (normalized.includes('amazon')) return '/Amazon.png';
  if (normalized.includes('magalu')) return '/Magalu-1-1.png';
  if (normalized.includes('hotmart')) return '/hotmart.png';
  if (normalized.includes('kiwify')) return '/kiwify.png';
  return null;
};

const ProductImageCarousel: React.FC<{ images: string[]; title: string }> = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full h-full relative group/carousel overflow-hidden bg-muted/20">
      <img 
        src={images[currentIndex]} 
        alt={`${title} - Imagem ${currentIndex + 1}`} 
        className="w-full h-full object-cover transition-all duration-500" 
      />
      {images.length > 1 && (
        <>
          {/* Indicadores inferiores */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'bg-primary scale-125' : 'bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
          
          {/* Setas de navegacao lateral */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-black/75 cursor-pointer z-10"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-black/75 cursor-pointer z-10"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
};

const Showcase: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    const text = `Confira minha vitrine de ofertas no AfiliateFlow IA! 🚀\n\n${window.location.href}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareProduct = (link: Link) => {
    const text = `🔥 *OFERTA IMPERDÍVEL!* 🔥\n\n*${link.title}*\n\n🛒 Compre agora: ${window.location.origin}/go/${link.short_code}\n\nVia AfiliateFlow IA ⚡`;
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
  const platforms = ['Shopee', 'Amazon', 'Magalu', 'Hotmart', 'Kiwify', 'Outras'];
  
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
    <div className="min-h-screen bg-background pb-24 selection:bg-primary/20">
      <Helmet>
        <title>{profile.full_name || 'Afiliado'} | Vitrine de Ofertas AfiliateFlow IA</title>
        <meta name="description" content={`Confira as melhores ofertas e produtos selecionados por ${profile.full_name || 'nosso parceiro'}.`} />
        {profile.avatar_url && <meta property="og:image" content={profile.avatar_url} />}
      </Helmet>
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Header Ultra Premium */}
      <header className="bg-card/70 backdrop-blur-2xl border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary to-purple-600 p-[1px] shadow-lg shadow-primary/20">
              <div className="w-full h-full rounded-[15px] bg-card flex items-center justify-center overflow-hidden">
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
              Top Achadinhos <span className="text-orange-500 italic">da Semana!</span>
            </h2>
            <p className="text-muted-foreground text-[10px] md:text-sm font-bold uppercase tracking-[0.4em] max-w-xl mx-auto leading-relaxed mb-4">
              Produtos rastreados por Inteligência Artificial.
            </p>
            <div className="mb-12 text-center text-xs md:text-sm text-blue-900 dark:text-blue-300 font-normal uppercase tracking-wider">
              Seja afiliado também, Conheça a{' '}
              <a 
                href="/" 
                className="text-blue-900 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 underline transition-colors"
              >
                AfiliateFlow IA
              </a>
              .
            </div>

            {/* Search Bar Premium */}
            <div className="max-w-xl mx-auto relative group">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center bg-card border border-border/50 rounded-2xl p-2 shadow-xl backdrop-blur-xl">
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
        {Object.keys(groupedLinks).length > 0 && (
          <div className="flex justify-between items-center mb-10 border-b border-border/20 pb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vitrine de Ofertas</h3>
            <div className="flex items-center gap-1 bg-muted/40 border border-border/40 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-xs border border-border/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-xs border border-border/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Visualização em Lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {Object.keys(groupedLinks).length > 0 ? (
          <div className="space-y-24">
            {platforms.map(platformName => {
              const platformLinks = groupedLinks[platformName];
              if (!platformLinks || platformLinks.length === 0) return null;
              
              return (
                <section key={platformName} className="relative">
                  <div className="flex items-center gap-6 mb-12">
                    <div className="flex-1 h-[1px] bg-linear-to-r from-transparent via-border to-transparent" />
                    <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-card border border-border/50 shadow-sm">
                      {getPlatformLogo(platformName) ? (
                        <img 
                          src={getPlatformLogo(platformName)!} 
                          alt={platformName} 
                          className="h-10 md:h-12 object-contain" 
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">
                            {platformName}
                          </h3>
                        </div>
                      )}
                      <div className="w-1.5 h-1.5 bg-border rounded-full" />
                      <span className="text-[10px] text-primary font-black uppercase tracking-widest">
                        {platformLinks.length} Itens
                      </span>
                    </div>
                    <div className="flex-1 h-[1px] bg-linear-to-r from-transparent via-border to-transparent" />
                  </div>

                  <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-6"}>
                    {platformLinks.map((link, idx) => (
                      <motion.div 
                        key={link.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -8 }}
                      >
                        <Card 
                          onClick={() => setSelectedLink(link)}
                          className={`p-0 overflow-hidden border border-border/50 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 bg-card group rounded-3xl cursor-pointer flex ${
                            viewMode === 'grid' ? 'flex-col h-full' : 'flex-col sm:flex-row h-auto sm:h-56'
                          }`}
                        >
                          <div className={`relative overflow-hidden bg-muted/20 shrink-0 ${
                            viewMode === 'grid' ? 'aspect-square w-full' : 'aspect-square sm:aspect-auto w-full sm:w-56 sm:h-full'
                          }`}>
                            {link.thumbnail_url ? (
                              (() => {
                                try {
                                  if (link.thumbnail_url.startsWith('[')) {
                                    const imgs = JSON.parse(link.thumbnail_url);
                                    if (Array.isArray(imgs) && imgs.length > 0) {
                                      return <ProductImageCarousel images={imgs} title={link.title} />;
                                    }
                                  }
                                } catch (e) {
                                  // fallback
                                }
                                return (
                                  <img 
                                    src={link.thumbnail_url} 
                                    alt={link.title} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                  />
                                );
                              })()
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
                              <div className="absolute top-4 right-4 bg-danger text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl">
                                -{Math.round((1 - link.sale_price / link.original_price) * 100)}% OFF
                              </div>
                            )}
                          </div>

                          <div className="p-6 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className={`font-bold text-sm md:text-base line-clamp-2 mb-2 ${viewMode === 'grid' ? 'min-h-[3rem]' : ''} group-hover:text-primary transition-colors leading-snug`}>
                                {link.title}
                              </h4>

                              <div className="flex items-center gap-1 mb-4">
                                {renderStars(link.rating)}
                                <span className="text-[10px] text-muted-foreground ml-1 font-bold">(5.0)</span>
                              </div>
                            </div>
                            
                            <div className={`flex ${
                              viewMode === 'grid' 
                                ? 'flex-col gap-6 mt-auto' 
                                : 'flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-auto sm:gap-6'
                            }`}>
                              <div className="flex flex-col gap-1">
                                {link.original_price && (
                                  <span className="text-[10px] text-muted-foreground line-through font-bold uppercase tracking-widest opacity-60">
                                    De R$ {link.original_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                                <div className="flex items-center gap-3">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xs font-black text-primary">R$</span>
                                    <span className="text-3xl font-black text-foreground tracking-tighter">
                                      {(link.sale_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 ml-2 self-end mb-1">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyLink(link);
                                      }}
                                      className="p-1 rounded-md text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                      title="Copiar Link"
                                    >
                                      {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShareProduct(link);
                                      }}
                                      className="p-1 rounded-md text-muted-foreground hover:text-green-500 transition-colors cursor-pointer"
                                      title="Compartilhar no WhatsApp"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <Button 
                                variant="primary" 
                                className={`h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/25 group/btn relative overflow-hidden ${
                                  viewMode === 'grid' ? 'w-full' : 'w-full sm:w-fit sm:px-8'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`${window.location.origin}/go/${link.short_code}`, '_blank');
                                }}
                              >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                  RESGATAR OFERTA <ArrowRight className="w-4 h-4" />
                                </span>
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
          <div className="py-32 text-center bg-card rounded-[3rem] border-2 border-dashed border-border/50 shadow-inner">
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
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Zap className="text-white w-5 h-5 fill-white" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-muted-foreground">
                AfiliateFlow IA
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Crie sua própria vitrine gratuita em <span className="text-primary hover:underline cursor-pointer">afiliateflow.ia</span>
            </p>

            <div className="max-w-xs mx-auto p-3 rounded-xl bg-green-500/5 border border-green-500/10">
              <p className="text-[9px] text-green-500/60 font-bold uppercase tracking-widest">
                Ambiente Seguro & Verificado
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-md" 
              onClick={() => setSelectedLink(null)}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedLink(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-card/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Product Info */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Image Container - suporta array JSON de imagens */}
                <div className="w-full bg-muted/20 rounded-2xl overflow-hidden" style={{ height: '240px' }}>
                  {selectedLink.thumbnail_url ? (
                    (() => {
                      try {
                        if (selectedLink.thumbnail_url.startsWith('[')) {
                          const imgs = JSON.parse(selectedLink.thumbnail_url);
                          if (Array.isArray(imgs) && imgs.length > 0) {
                            return <ProductImageCarousel images={imgs} title={selectedLink.title} />;
                          }
                        }
                      } catch (e) {
                        // fallback para img simples
                      }
                      return (
                        <img 
                          src={selectedLink.thumbnail_url} 
                          alt={selectedLink.title} 
                          className="w-full h-full object-contain bg-white p-4"
                        />
                      );
                    })()
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <ShoppingBag className="w-10 h-10 text-muted-foreground/20" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Sem imagem</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Platform Badge */}
                  <div className="inline-block bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-border">
                    {selectedLink.platform || 'Outra'}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold leading-snug">
                    {selectedLink.title}
                  </h3>

                  {/* Description */}
                  {selectedLink.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedLink.description}
                    </p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {renderStars(selectedLink.rating)}
                    <span className="text-xs text-muted-foreground ml-1 font-bold">(5.0)</span>
                  </div>
                </div>

                {/* Price and Sharing Buttons */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/50">
                  <div className="flex flex-col gap-1">
                    {selectedLink.original_price && (
                      <span className="text-xs text-muted-foreground line-through font-bold uppercase tracking-widest opacity-60">
                        De R$ {selectedLink.original_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-primary">R$</span>
                        <span className="text-3xl font-black text-foreground tracking-tighter">
                          {(selectedLink.sale_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 self-end mb-1">
                        <button 
                          onClick={() => handleCopyLink(selectedLink)}
                          className="w-7 h-7 rounded-lg bg-card hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          title="Copiar Link"
                        >
                          {copiedId === selectedLink.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={() => handleShareProduct(selectedLink)}
                          className="w-7 h-7 rounded-lg bg-card hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-green-500 transition-colors cursor-pointer"
                          title="Compartilhar no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 bg-muted/10 border-t border-border/50">
                <Button 
                  variant="primary" 
                  className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/25 relative overflow-hidden"
                  onClick={() => {
                    window.open(`${window.location.origin}/go/${selectedLink.short_code}`, '_blank');
                    setSelectedLink(null);
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    COMPRAR AGORA <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Showcase;
