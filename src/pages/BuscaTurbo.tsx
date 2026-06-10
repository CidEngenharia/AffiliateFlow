import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Zap, 
  Shield, 
  Globe, 
  Database, 
  Cpu, 
  Sparkles,
  History,
  Star,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Filter,
  BrainCircuit,
  Command,
  SearchCode,
  Check,
  X,
  Mic,
  Camera,
  Gauge,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { SEARCH_PLATFORMS, QUICK_SHORTCUTS, ADVANCED_OPERATORS } from '../constants/platforms';
import { aiService } from '../services/aiService';
import { searchService } from '../services/searchService';
import { useAuth } from '../context/AuthContext';
import type { Search as SearchType } from '../types';

const BuscaTurbo: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['google', 'github', 'reddit']);
  const [isHeavyScanning, setIsHeavyScanning] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchType[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [activeResults, setActiveResults] = useState<{id: string, name: string, url: string, opened: boolean}[] | null>(null);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const fetchHistory = async () => {
    try {
      const data = await searchService.getHistory();
      setSearchHistory(data);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearch = async (customQuery?: string) => {
    const finalQuery = customQuery || query;
    if (!finalQuery) return;

    const resultsToOpen = selectedPlatforms.map(id => {
      const platform = SEARCH_PLATFORMS.find(p => p.id === id);
      return {
        id,
        name: platform?.name || id,
        url: `${platform?.url}${encodeURIComponent(finalQuery)}`,
        opened: false
      };
    });

    setActiveResults(resultsToOpen);

    // Try to open the first one immediately (usually allowed)
    if (resultsToOpen.length > 0) {
      window.open(resultsToOpen[0].url, '_blank');
      resultsToOpen[0].opened = true;
      setActiveResults([...resultsToOpen]);
    }

    // Attempt to open others with a small delay (may be blocked by browser)
    // We will show buttons for those that were blocked
    for (let i = 1; i < resultsToOpen.length; i++) {
      setTimeout(() => {
        const win = window.open(resultsToOpen[i].url, '_blank');
        if (win) {
          resultsToOpen[i].opened = true;
          setActiveResults([...resultsToOpen]);
        }
      }, i * 600);
    }

    // Save to history in Supabase
    if (user) {
      try {
        await searchService.saveSearch({
          user_id: user.id,
          query: finalQuery,
          refined_query: query !== finalQuery ? finalQuery : null,
          platforms: selectedPlatforms,
          ai_summary: null,
          is_favorite: false
        });
        fetchHistory();
      } catch (error) {
        console.error('Erro ao salvar busca:', error);
      }
    }
  };

  const handleHeavyScan = async () => {
    if (!query) return;
    setIsHeavyScanning(true);
    
    // Simulate deep scanning
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // In a real scenario, this would call an Edge Function
    const heavyPlatforms = ['google', 'bing', 'reddit', 'github', 'youtube'];
    const resultsToOpen = heavyPlatforms.map(id => {
      const platform = SEARCH_PLATFORMS.find(p => p.id === id);
      return {
        id,
        name: platform?.name || id,
        url: `${platform?.url}${encodeURIComponent(query)}`,
        opened: false
      };
    });

    setActiveResults(resultsToOpen);

    // Try to open the first one
    window.open(resultsToOpen[0].url, '_blank');
    resultsToOpen[0].opened = true;
    setActiveResults([...resultsToOpen]);

    setIsHeavyScanning(false);
  };

  const handleRefine = async () => {
    if (!query) return;
    setIsRefining(true);
    try {
      const suggestions = await aiService.refineSearchQuery(query);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefining(false);
    }
  };

  const applyShortcut = (shortcutQuery: string) => {
    setQuery(prev => `${prev} ${shortcutQuery}`.trim());
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <Gauge className="w-8 h-8 text-primary" />
          Buscador Turbo <span className="text-primary">Quant</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          Pesquisas avançadas multi-plataforma com operadores inteligentes.
        </p>

        {/* Barra de busca estilo Google */}
        <div className="flex items-center w-full max-w-2xl mx-auto mt-6 bg-card border border-border/80 rounded-full px-4 py-1.5 shadow-md hover:shadow-lg focus-within:shadow-lg focus-within:border-primary/40 transition-all">
          <Search className="w-5 h-5 text-muted-foreground/60 ml-1" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquise ou digite uma consulta..."
            className="flex-1 bg-transparent border-0 outline-hidden ring-0 focus:ring-0 focus:outline-hidden text-sm text-foreground px-3 py-2 placeholder-muted-foreground/60"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1.5 hover:bg-accent rounded-full transition-colors mr-1"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button 
            type="button"
            onClick={() => handleSearch()}
            disabled={!query}
            className="h-9 w-9 bg-primary hover:bg-primary/90 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-1 flex-shrink-0"
            title="Iniciar busca"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>



        {/* Nota sobre Navegadores */}
        <button
          onClick={() => {
            const el = document.getElementById('console-popups');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="mt-4 text-green-500 hover:text-green-400 transition-colors text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 mx-auto cursor-pointer"
        >
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Se seu navegador bloquear a abertura das abas , desbloquei abaixo manualmente.
        </button>

        {/* Trends + Filtros Rápidos */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">🔥 Em Alta:</span>
          {['Ofertas Relâmpago', 'Promo Shopee'].map((trend) => (
            <button
              key={trend}
              onClick={() => setQuery(trend)}
              className="px-3 py-1.5 rounded-full bg-accent/50 hover:bg-primary/20 border border-border/50 text-[10px] font-bold transition-all"
            >
              {trend}
            </button>
          ))}
          <div className="w-px h-4 bg-border/60 mx-1" />
          <button
            onClick={() => setSelectedPlatforms(['google', 'bing'])}
            className="px-3 py-1.5 rounded-full bg-accent/50 hover:bg-primary/20 border border-border/50 text-[10px] font-bold transition-all"
          >
            Imagens
          </button>
          <button
            onClick={() => setSelectedPlatforms(['youtube'])}
            className="px-3 py-1.5 rounded-full bg-accent/50 hover:bg-primary/20 border border-border/50 text-[10px] font-bold transition-all"
          >
            Vídeos
          </button>
        </div>
      </div>

      {/* Main Search Console */}
      <Card className="p-1 border-primary/20 bg-card/50 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-10" />
        
        <div className="relative p-6 space-y-6">
          {/* Platforms Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                <Globe className="w-4 h-4" /> Selecione os motores busca de sua preferência
              </h3>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                {selectedPlatforms.length} Selecionados
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-3 bg-background/20 p-4 rounded-2xl border border-border/40">
              {SEARCH_PLATFORMS.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2.5 cursor-pointer text-xs text-foreground select-none py-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(p.id)}
                    onChange={() => togglePlatform(p.id)}
                    className="w-4 h-4 rounded border-emerald-500 text-emerald-600 bg-background focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <p.icon 
                    className="w-4 h-4 shrink-0" 
                    style={{ color: p.color }}
                  />
                  <span className="font-medium text-muted-foreground hover:text-foreground transition-colors truncate">
                    {p.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/60 my-4" />

          {/* OSINT Operators Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                <Filter className="w-4 h-4" /> Selecione os Operadores OSINT
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-3 bg-background/20 p-4 rounded-2xl border border-border/40">
              {ADVANCED_OPERATORS.map((op) => (
                <label
                  key={op.operator}
                  className="flex items-center gap-2.5 cursor-pointer text-xs text-foreground select-none py-1"
                >
                  <input
                    type="checkbox"
                    checked={query.includes(op.operator)}
                    onChange={() => {
                      if (query.includes(op.operator)) {
                        setQuery(prev => prev.replace(op.operator, '').replace(/\s+/g, ' ').trim());
                      } else {
                        setQuery(prev => `${prev} ${op.operator}`.trim());
                      }
                    }}
                    className="w-4 h-4 rounded border-emerald-500 text-emerald-600 bg-background focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <code className="text-primary font-black text-xs shrink-0">{op.operator}</code>
                  <span className="text-[11px] text-muted-foreground font-medium uppercase truncate">
                    {op.description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button 
              variant="primary" 
              size="md"
              className="font-bold rounded-xl shadow-lg shadow-primary/10 group overflow-hidden px-8"
              onClick={() => handleSearch()}
            >
              <span className="relative flex items-center gap-2">
                LANÇAR BUSCA <Zap className="w-4 h-4 fill-white" />
              </span>
            </Button>
            
            <Button 
              variant="primary"
              size="md"
              className={`font-bold rounded-xl transition-all duration-300 relative px-8 shadow-lg shadow-primary/20
                ${isHeavyScanning 
                  ? 'opacity-70' 
                  : 'hover:scale-105 active:scale-95'}
              `}
              onClick={handleHeavyScan}
              disabled={isHeavyScanning}
            >
              {isHeavyScanning ? (
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 animate-spin" /> PROCESSANDO...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  VARREDURA PESADA <Shield className="w-4 h-4" />
                </div>
              )}
              {isHeavyScanning && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="absolute bottom-0 left-0 h-0.5 bg-white/30"
                  transition={{ duration: 3 }}
                />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Active Search Results / Popup Helper */}
      <AnimatePresence>
        {activeResults && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div id="console-popups">
              <Card className="p-4 border-primary/20 bg-muted/5 relative overflow-hidden group mb-8">
              <div className="absolute inset-0 bg-linear-to-r from-muted/10 to-transparent opacity-30" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Zap className="text-primary w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base tracking-tight">Console de pop-up bloqeuados</h3>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Verifique as abas abertas ou abra manualmente as bloqueadas</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveResults(null)}
                    className="text-muted-foreground hover:text-white transition-colors"
                  >
                    Limpar
                  </Button>
                </div>
                
                <div className="flex flex-wrap justify-center gap-8 py-4">
                  {activeResults.map((res, i) => {
                    const platform = SEARCH_PLATFORMS.find(p => p.id === res.id);
                    const Icon = platform?.icon || Globe;
                    
                    return (
                      <motion.div
                        key={res.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <button
                          onClick={() => {
                            window.open(res.url, '_blank');
                            const newResults = [...activeResults];
                            newResults[i].opened = true;
                            setActiveResults(newResults);
                          }}
                          className={`
                            relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
                            ${res.opened 
                              ? 'bg-primary/20 text-primary border-2 border-primary/30' 
                              : 'bg-primary text-white shadow-lg shadow-primary/30 hover:scale-110 active:scale-95'}
                          `}
                        >
                          <Icon className="w-6 h-6" />
                          {res.opened && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 bg-background rounded-full p-0.5"
                            >
                              <Check className="w-3 h-3 text-primary" />
                            </motion.div>
                          )}
                        </button>
                        <div className="text-center">
                          <p className="text-xs font-bold text-foreground">{res.name}</p>
                          <p className={`text-[9px] font-medium uppercase tracking-tighter ${res.opened ? 'text-primary' : 'text-muted-foreground'}`}>
                            {res.opened ? 'Aberto' : 'Pendente'}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                <div className="mt-6 flex items-center gap-2 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                  <Shield className="w-4 h-4 text-green-500" />
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">
                    Nota: Navegadores bloqueiam aberturas múltiplas. Clique nos botões acima para forçar a abertura se necessário, Busca turbinada.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* AI Suggestions Panel */}
      <AnimatePresence>
        {aiSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3 mb-4">
                <BrainCircuit className="text-primary w-6 h-6" />
                <h3 className="font-bold text-lg">Sugestões da IA</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {aiSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(s)}
                    className="p-4 rounded-2xl bg-background/60 border border-white/5 hover:border-primary/50 text-left transition-all group"
                  >
                    <p className="text-sm font-medium text-muted-foreground mb-2 italic">Versão {i + 1}</p>
                    <p className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-2">{s}</p>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts Section */}
      <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-xl relative overflow-hidden">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Command className="w-5 h-5 text-primary" /> Selecione Atalhos Inteligentes
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {QUICK_SHORTCUTS.map((s) => {
              const active = query.includes(s.query);
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    if (active) {
                      setQuery(prev => prev.replace(s.query, '').replace(/\s+/g, ' ').trim());
                    } else {
                      setQuery(prev => `${prev} ${s.query}`.trim());
                    }
                  }}
                  className={`flex items-center gap-3 p-4 rounded-2xl bg-background border transition-all relative text-left group cursor-pointer ${
                    active 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-white/5 hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    active ? 'bg-emerald-500/25 text-emerald-500' : 'bg-muted/50 text-muted-foreground group-hover:text-primary'
                  }`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-xs truncate ${active ? 'text-emerald-500' : 'text-foreground'}`}>{s.name}</h4>
                  </div>
                  {active && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-0.5 flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BuscaTurbo;
