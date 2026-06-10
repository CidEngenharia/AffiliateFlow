import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Share2, 
  Zap, 
  MessageCircle,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  LayoutGrid,
  LayoutDashboard,
  X,
  Trophy,
  Search,
  List,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Eye,
  MousePointer,
  Calendar,
  SlidersHorizontal,
  Twitter,
  Facebook,
  Link2,
  Star,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import type { Link, Profile } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useTheme } from '../context/ThemeContext';

type LinkStats = {
  clicks: number;
  views: number;
  created_at: string;
};

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
  const { theme, toggleTheme } = useTheme();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Todos');
  const [linkStats, setLinkStats] = useState<Record<string, LinkStats>>({});
  const [shareMenuLink, setShareMenuLink] = useState<Link | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showShareShowcase, setShowShareShowcase] = useState(false);
  const [showcaseLinkCopied, setShowcaseLinkCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const storageKey = 'affilehub-showcase-timer-target';
    let target = localStorage.getItem(storageKey);
    
    if (!target) {
      const newTarget = Date.now() + 30 * 60 * 1000;
      localStorage.setItem(storageKey, String(newTarget));
      target = String(newTarget);
    } else {
      if (Number(target) < Date.now()) {
        const newTarget = Date.now() + 30 * 60 * 1000;
        localStorage.setItem(storageKey, String(newTarget));
        target = String(newTarget);
      }
    }

    const targetTime = Number(target);

    const updateTimer = () => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

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

  // Tracking de visualização quando modal abre
  const trackLinkView = useCallback(async (link: Link) => {
    // Incrementa views no estado local
    setLinkStats(prev => ({
      ...prev,
      [link.id]: {
        clicks: (prev[link.id]?.clicks ?? 0),
        views: (prev[link.id]?.views ?? 0) + 1,
        created_at: prev[link.id]?.created_at ?? link.created_at
      }
    }));
    // Persiste no Supabase (campo click_count = views do modal)
    try {
      await supabase.rpc('increment_link_views', { link_id: link.id });
    } catch (_) { /* silencioso */ }
  }, []);

  // Tracking de clique no botão "Comprar"
  const trackLinkClick = useCallback(async (link: Link) => {
    setLinkStats(prev => ({
      ...prev,
      [link.id]: {
        clicks: (prev[link.id]?.clicks ?? 0) + 1,
        views: (prev[link.id]?.views ?? 0),
        created_at: prev[link.id]?.created_at ?? link.created_at
      }
    }));
    try {
      await supabase.rpc('increment_link_clicks', { link_id: link.id });
    } catch (_) { /* silencioso */ }
  }, []);

  const handleOpenModal = (link: Link) => {
    setSelectedLink(link);
    trackLinkView(link);
  };

  const handleShareShowcase = () => {
    const text = `Confira minha vitrine de ofertas no AfiliateFlow IA! 🚀\n\n${window.location.href}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareShowcaseOnNetwork = (network: string) => {
    const url = window.location.href;
    const text = `Confira minha vitrine de ofertas no AfiliateFlow IA! 🚀`;
    let shareUrl = '';
    switch (network) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setShowcaseLinkCopied(true);
        setTimeout(() => { setShowcaseLinkCopied(false); setShowShareShowcase(false); }, 2000);
        return;
    }
    if (shareUrl) window.open(shareUrl, '_blank');
    setShowShareShowcase(false);
  };

  const handleShareProduct = (link: Link) => {
    setShareMenuLink(link);
  };

  const shareOnNetwork = (network: string, link: Link) => {
    const url = `${window.location.origin}/go/${link.short_code}`;
    const text = `🔥 OFERTA IMPERDÍVEL! ${link.title} — Compre agora:`;
    let shareUrl = '';
    switch (network) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`🔥 *OFERTA IMPERDÍVEL!* 🔥\n\n*${link.title}*\n\n🛒 Compre agora: ${url}\n\nVia AfiliateFlow IA ⚡`)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopiedId(link.id);
        setTimeout(() => { setCopiedId(null); setShareMenuLink(null); }, 2000);
        return;
    }
    if (shareUrl) window.open(shareUrl, '_blank');
    setShareMenuLink(null);
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (link: Link) => {
    const url = `${window.location.origin}/go/${link.short_code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredLinks = links.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (link.platform && link.platform.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (selectedPlatform === 'Todos') return matchesSearch;
    
    const linkPlatform = (link.platform || 'Outras').toLowerCase();
    
    if (selectedPlatform === 'Outras') {
      const mainPlatforms = ['shopee', 'amazon', 'magalu', 'hotmart', 'kiwify'];
      const matchesMain = mainPlatforms.some(p => linkPlatform.includes(p));
      return matchesSearch && !matchesMain;
    }
    
    return matchesSearch && linkPlatform.includes(selectedPlatform.toLowerCase());
  });

  const platforms = ['Shopee', 'Amazon', 'Magalu', 'Hotmart', 'Kiwify', 'Outras'];
  
  const groupedLinks = filteredLinks.reduce((acc, link) => {
    const platform = link.platform || 'Outras';
    const normalized = platforms.find(p => platform.toLowerCase().includes(p.toLowerCase())) || 'Outras';
    if (!acc[normalized]) acc[normalized] = [];
    acc[normalized].push(link);
    return acc;
  }, {} as Record<string, Link[]>);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderStars = (rating: number = 5) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
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

      {/* Header estilo Shopee */}
      <header className="sticky top-0 z-50 shadow-md" style={{ backgroundColor: '#EE4D2D' }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 p-[1px] shadow overflow-hidden border border-white/30">
              <div className="w-full h-full rounded-[10px] bg-white/10 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-white text-lg">{profile.full_name?.charAt(0) || 'U'}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-black uppercase tracking-tight text-white leading-none">
                {profile.full_name || 'Afiliado Profissional'}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                <span className="text-[9px] text-white/80 font-black uppercase tracking-widest">
                  Vitrine Verificada
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botão Dark / Light Mode */}
            <button
              onClick={toggleTheme}
              className="relative p-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 transition-all duration-300 cursor-pointer"
              title={theme === 'dark' ? 'Mudar para Light Mode' : 'Mudar para Dark Mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-4 h-4 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {user?.id === profile.id && (
              <button
                onClick={() => navigate('/dashboard')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-white" />
                <span className="text-white font-black text-[10px] uppercase tracking-widest">Painel</span>
              </button>
            )}
            
            {/* Botão WhatsApp */}
            <button
              onClick={handleShareShowcase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#EE4D2D] hover:bg-white/90 transition-all cursor-pointer shadow-sm"
              title="Compartilhar no WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline font-black text-[10px] uppercase tracking-widest">WhatsApp</span>
            </button>

            {/* Botão Outras Redes */}
            <div className="relative">
              <button
                onClick={() => setShowShareShowcase(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white transition-all cursor-pointer"
                title="Compartilhar em outras redes"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline font-black text-[10px] uppercase tracking-widest">Mais</span>
              </button>
              <AnimatePresence>
                {showShareShowcase && (
                  <>
                    {/* Overlay para fechar o menu */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowShareShowcase(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-10 z-50 bg-card border border-border rounded-2xl shadow-2xl p-2 min-w-[180px]"
                    >
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest px-3 py-1 mb-1">Compartilhar em</p>
                      <button
                        onClick={() => shareShowcaseOnNetwork('facebook')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-500/10 text-blue-500 transition-colors cursor-pointer"
                      >
                        <Facebook className="w-4 h-4" />
                        <span className="text-xs">Facebook</span>
                      </button>
                      <button
                        onClick={() => shareShowcaseOnNetwork('twitter')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-sky-400/10 text-sky-400 transition-colors cursor-pointer"
                      >
                        <Twitter className="w-4 h-4" />
                        <span className="text-xs">Twitter / X</span>
                      </button>
                      <button
                        onClick={() => shareShowcaseOnNetwork('telegram')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-400/10 text-blue-400 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs">Telegram</span>
                      </button>
                      <div className="h-px bg-border my-1" />
                      <button
                        onClick={() => shareShowcaseOnNetwork('copy')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted transition-colors cursor-pointer text-foreground"
                      >
                        {showcaseLinkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        <span className="text-xs">{showcaseLinkCopied ? 'Link copiado!' : 'Copiar link'}</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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
            <h2 className="text-4xl md:text-6xl font-black mb-3 tracking-tighter text-foreground leading-none">
              Top Achadinhos <span className="text-orange-500 italic">da Semana!</span>
            </h2>

            {/* Título + bio + contador de promoção na mesma linha */}
            <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
              <p className="text-gray-600 dark:text-gray-400 text-[10px] md:text-sm tracking-[0.1em] md:tracking-[0.15em]">
                {profile.bio || 'Produtos rastreados por Inteligência Artificial.'}
              </p>
              {/* Badge Promoção com contador inline — sem modal */}
              <div className="flex items-center gap-1.5">
                <Flame className="w-5 h-5 fill-orange-500 text-orange-500 animate-pulse shrink-0 drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                <span className="text-orange-500 text-[11px] font-black tracking-widest">hot price</span>
                <span className="text-muted-foreground font-bold text-[11px] tabular-nums">
                  {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="mb-8 text-center text-xs md:text-sm text-blue-900 dark:text-blue-300 uppercase tracking-wider">
              Seja afiliado também, Conheça a{' '}
              <a href="/" className="text-blue-900 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 underline transition-colors">
                AfiliateFlow IA
              </a>.
            </div>

            {/* Search Bar Google Style — ampliada com controles integrados */}
            <div className="max-w-3xl mx-auto relative group mb-8">
              <div className="relative flex items-center bg-card hover:bg-card/90 border border-border/80 rounded-full px-5 py-2 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-primary/50 transition-all duration-300 gap-2">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input 
                  type="text" 
                  placeholder="Pesquise produtos, ofertas ou marcas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm py-2.5 text-foreground placeholder:text-muted-foreground/60"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="p-1.5 hover:bg-muted rounded-full transition-colors cursor-pointer">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}

                {/* Divisor */}
                <div className="w-px h-5 bg-border/60 mx-1 shrink-0" />

                {/* Ícones de visualização grid/lista integrados */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Visualização em Grade"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Visualização em Lista"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Divisor */}
                <div className="w-px h-5 bg-border/60 mx-1 shrink-0" />

                {/* Botão filtro */}
                <button
                  onClick={() => setShowFilterPanel(p => !p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                    showFilterPanel || selectedPlatform !== 'Todos'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title="Filtrar por plataforma"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px] uppercase tracking-widest">Filtrar</span>
                  {selectedPlatform !== 'Todos' && (
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </button>
              </div>

              {/* Painel de filtro de categorias */}
              <AnimatePresence>
                {showFilterPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl p-4 z-20"
                  >
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-3">Filtrar por plataforma</p>
                    <div className="flex flex-wrap gap-2">
                      {['Todos', 'Shopee', 'Amazon', 'Magalu', 'Hotmart', 'Kiwify', 'Outras'].map((cat) => {
                        const isSelected = selectedPlatform === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => { setSelectedPlatform(cat); setShowFilterPanel(false); }}
                            className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105'
                                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Categories (chips visíveis sempre) */}
            <div className="flex items-center justify-center flex-wrap gap-2 max-w-2xl mx-auto mb-6">
              {['Todos', 'Shopee', 'Amazon', 'Magalu', 'Hotmart', 'Kiwify', 'Outras'].map((cat) => {
                const isSelected = selectedPlatform === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedPlatform(cat)}
                    className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105'
                        : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categorized Links Grid */}
      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {Object.keys(groupedLinks).length > 0 && (
          <div className="flex justify-between items-center mb-10 border-b border-border/20 pb-6">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Vitrine de Ofertas</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="tabular-nums">{filteredLinks.length} produto{filteredLinks.length !== 1 ? 's' : ''}</span>
              <span>|</span>
              <span className="tabular-nums">
                {Object.keys(groupedLinks).filter(p => groupedLinks[p] && groupedLinks[p].length > 0).length} plataforma{Object.keys(groupedLinks).filter(p => groupedLinks[p] && groupedLinks[p].length > 0).length !== 1 ? 's' : ''}
              </span>
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
                          onClick={() => handleOpenModal(link)}
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
                                {(() => {
                                  const discount = link.original_price && link.sale_price 
                                    ? Math.round(((link.original_price - link.sale_price) / link.original_price) * 100)
                                    : 0;
                                  if (discount >= 50) {
                                    return (
                                      <span className="inline-flex items-center gap-1 ml-2">
                                        <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse drop-shadow-[0_0_5px_rgba(249,115,22,0.7)]" />
                                        <span className="text-orange-500 text-[9px] font-black tracking-wider">hot price</span>
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
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
                                      className="p-1 rounded-md text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                      title="Compartilhar"
                                    >
                                      <Share2 className="w-3.5 h-3.5" />
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

      {/* Share Menu Modal */}
      <AnimatePresence>
        {shareMenuLink && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShareMenuLink(null)} />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-6 z-10"
            >
              <button onClick={() => setShareMenuLink(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Compartilhar produto</p>
              <p className="text-sm leading-snug mb-5 line-clamp-2">{shareMenuLink.title}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => shareOnNetwork('whatsapp', shareMenuLink)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors cursor-pointer text-xs uppercase tracking-wider"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
                <button
                  onClick={() => shareOnNetwork('telegram', shareMenuLink)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-500 transition-colors cursor-pointer text-xs uppercase tracking-wider"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
                  Telegram
                </button>
                <button
                  onClick={() => shareOnNetwork('twitter', shareMenuLink)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-sky-500 transition-colors cursor-pointer text-xs uppercase tracking-wider"
                >
                  <Twitter className="w-4 h-4" /> Twitter / X
                </button>
                <button
                  onClick={() => shareOnNetwork('facebook', shareMenuLink)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-500 transition-colors cursor-pointer text-xs uppercase tracking-wider"
                >
                  <Facebook className="w-4 h-4" /> Facebook
                </button>
              </div>
              <button
                onClick={() => shareOnNetwork('copy', shareMenuLink)}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted text-muted-foreground transition-colors cursor-pointer text-xs uppercase tracking-wider"
              >
                {copiedId === shareMenuLink.id ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                {copiedId === shareMenuLink.id ? 'Link copiado!' : 'Copiar link'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedLink(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-card/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Product Info */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Image Container */}
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
                      } catch (_) { /* fallback */ }
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
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40">Sem imagem</span>
                    </div>
                  )}
                </div>

                {/* Stats: cliques, visualizações, data de postagem */}
                <div className="flex items-center gap-3 px-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MousePointer className="w-3.5 h-3.5" />
                    <span className="text-xs tabular-nums">
                      <motion.span
                        key={linkStats[selectedLink.id]?.clicks ?? (selectedLink as any).click_count ?? 0}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="inline-block"
                      >
                        {(linkStats[selectedLink.id]?.clicks ?? (selectedLink as any).click_count ?? 0).toLocaleString('pt-BR')}
                      </motion.span>
                      <span className="ml-1 text-[10px] uppercase tracking-wider">cliques</span>
                    </span>
                  </div>
                  <div className="w-px h-3 bg-border" />
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-xs tabular-nums">
                      <motion.span
                        key={linkStats[selectedLink.id]?.views ?? 0}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="inline-block"
                      >
                        {(linkStats[selectedLink.id]?.views ?? 0).toLocaleString('pt-BR')}
                      </motion.span>
                      <span className="ml-1 text-[10px] uppercase tracking-wider">visualizações</span>
                    </span>
                  </div>
                  <div className="w-px h-3 bg-border" />
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs">
                      {formatDate(selectedLink.created_at)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="inline-block bg-muted text-muted-foreground text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg border border-border">
                    {selectedLink.platform || 'Outra'}
                  </div>

                  <h3 className="text-xl leading-snug">
                    {selectedLink.title}
                  </h3>

                  {selectedLink.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedLink.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1">
                    {renderStars(selectedLink.rating)}
                    <span className="text-xs text-muted-foreground ml-1">(5.0)</span>
                    {selectedLink.original_price && selectedLink.sale_price &&
                      Math.round(((selectedLink.original_price - selectedLink.sale_price) / selectedLink.original_price) * 100) >= 50 && (
                        <span className="inline-flex items-center gap-1 ml-2">
                          <Flame className="w-5 h-5 fill-orange-500 text-orange-500 animate-pulse drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                          <span className="text-orange-500 text-[10px] font-black tracking-wider">hot price</span>
                        </span>
                    )}
                  </div>
                </div>

                {/* Price and Share Buttons */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/50">
                  <div className="flex flex-col gap-1">
                    {selectedLink.original_price && (
                      <span className="text-xs text-muted-foreground line-through uppercase tracking-widest opacity-60">
                        De R$ {selectedLink.original_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-primary">R$</span>
                        <span className="text-3xl text-foreground tracking-tighter">
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
                          className="w-7 h-7 rounded-lg bg-card hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          title="Compartilhar"
                        >
                          <Share2 className="w-3.5 h-3.5" />
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
                  className="w-full h-14 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/25 relative overflow-hidden"
                  onClick={() => {
                    trackLinkClick(selectedLink);
                    window.open(`${window.location.origin}/go/${selectedLink.short_code}`, '_blank');
                    setSelectedLink(null);
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    COMPRAR AGORA <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Showcase;
