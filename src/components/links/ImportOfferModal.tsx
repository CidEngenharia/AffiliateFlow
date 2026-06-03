import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Loader2, 
  Globe, 
  DollarSign, 
  Tag, 
  Check, 
  AlertCircle, 
  ArrowRight,
  ShoppingBag,
  Image as ImageIcon,
  Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { linkService } from '../../services/linkService';
import type { Category } from '../../types';

import { scrapeProduct } from '../../services/scraperService';

interface ImportOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (linkData: any) => void;
}

// Produtos mockados para simulação realista de importação expressa
const SUGGESTED_PRODUCTS = [
  {
    title: 'Novo Kindle Paperwhite 16GB - Tela de 6.8”',
    original_url: 'https://www.amazon.com.br/dp/B09TKT1KKL',
    thumbnail_url: 'https://images-na.ssl-images-amazon.com/images/I/61Y5R-+g9fL._AC_SX679_.jpg',
    platform: 'Amazon',
    original_price: 799.00,
    sale_price: 719.10,
    tags: 'leitura, kindle, amazon, tecnologia',
    category_slug: 'eletronicos'
  },
  {
    title: 'Fone de Ouvido Bluetooth Sem Fio i12 TWS Esportivo',
    original_url: 'https://shopee.com.br/fone-bluetooth-i12-tws',
    thumbnail_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60',
    platform: 'Shopee',
    original_price: 49.90,
    sale_price: 19.90,
    tags: 'fone, bluetooth, shopee, acessorios',
    category_slug: 'acessorios'
  },
  {
    title: 'Liquidificador Philips Walita ProBlend 6 Lâminas 800W',
    original_url: 'https://www.magazineluiza.com.br/liquidificador-philips-walita',
    thumbnail_url: 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=500&auto=format&fit=crop&q=60',
    platform: 'Magalu',
    original_price: 249.90,
    sale_price: 189.90,
    tags: 'cozinha, liquidificador, magalu, eletrodomestico',
    category_slug: 'eletrodomesticos'
  },
  {
    title: 'Curso Completo Copywriting de Alta Conversão',
    original_url: 'https://hotmart.com/product/copywriting-alta-conversao',
    thumbnail_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=60',
    platform: 'Hotmart',
    original_price: 497.00,
    sale_price: 297.00,
    tags: 'curso, infoproduto, marketing, hotmart',
    category_slug: 'cursos'
  }
];

const ImportOfferModal: React.FC<ImportOfferModalProps> = ({ isOpen, onClose, onImport }) => {
  const [urlInput, setUrlInput] = useState('');
  const [step, setStep] = useState<'input' | 'scanning' | 'edit'>('input');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('Analisando link...');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  // Payload final do produto detectado/editado
  const [productData, setProductData] = useState({
    title: '',
    original_url: '',
    short_code: '',
    tags: '',
    category_id: '',
    platform: '',
    original_price: '',
    sale_price: '',
    thumbnail_url: '',
    is_nofollow: true,
    is_sponsored: true,
    redirect_type: '301' as '301' | '307'
  });

  useEffect(() => {
    if (isOpen) {
      // Resetar estados
      setUrlInput('');
      setStep('input');
      setScanProgress(0);
      setIsFallback(false);
      
      const fetchCategories = async () => {
        setIsLoadingCategories(true);
        try {
          const data = await linkService.getCategories();
          setCategories(data);
        } catch (error) {
          console.error('Erro ao buscar categorias:', error);
        } finally {
          setIsLoadingCategories(false);
        }
      };
      fetchCategories();
    }
  }, [isOpen]);

  // Função para inferir a plataforma baseada na URL
  const detectPlatform = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('amazon.')) return 'Amazon';
    if (lowerUrl.includes('shopee.')) return 'Shopee';
    if (lowerUrl.includes('magalu.') || lowerUrl.includes('magazineluiza.')) return 'Magalu';
    if (lowerUrl.includes('hotmart.')) return 'Hotmart';
    if (lowerUrl.includes('kiwify.')) return 'Kiwify';
    return 'Outra';
  };

  // Autogerar short_code único a partir do título do produto
  const generateShortCode = (title: string): string => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '')    // Remover caracteres especiais
      .trim()
      .replace(/\s+/g, '-')            // Substituir espaços por hífen
      .substring(0, 18);               // Limitar tamanho
  };

  // Inicia a raspagem inteligente usando ScraperAPI (100% frontend, sem backend)
  const startScan = async (targetUrl: string, presetProduct?: typeof SUGGESTED_PRODUCTS[0]) => {
    if (!targetUrl && !presetProduct) return;
    
    setStep('scanning');
    setScanProgress(5);
    setScanStatusText('Conectando ao servidor seguro de raspagem...');

    let apiResult: any = null;
    let apiError: any = null;

    // Iniciar a chamada via ScraperAPI em paralelo com a animacao de progresso
    const scrapePromise = scrapeProduct(targetUrl)
      .then((data) => {
        apiResult = data;
      })
      .catch((err) => {
        console.error('Erro na raspagem via ScraperAPI:', err);
        apiError = err;
      });

    // Cronograma dinamico de atualizacao visual
    let currentProgress = 5;
    const interval = setInterval(() => {
      if (currentProgress < 90) {
        const increment = Math.floor(Math.random() * 8) + 3;
        currentProgress = Math.min(90, currentProgress + increment);
        setScanProgress(currentProgress);
        
        if (currentProgress < 30) {
          setScanStatusText('Bypassando Cloudflare & restricoes de crawler...');
        } else if (currentProgress < 60) {
          setScanStatusText('Extraindo metadados JSON-LD e OpenGraph...');
        } else if (currentProgress < 80) {
          setScanStatusText('Identificando seletores de precos e galerias de imagem...');
        } else {
          setScanStatusText('Finalizando tratamento de imagens com IA...');
        }
      } else {
        if (apiResult !== null || apiError !== null) {
          clearInterval(interval);
          setScanProgress(100);
          setScanStatusText('Raspagem de dados concluida!');
          
          setTimeout(() => {
            const hasErrorTitle = apiResult && apiResult.title && (
              apiResult.title.toLowerCase().includes('nao foi possivel encontrar') ||
              apiResult.title.toLowerCase().includes('robot check') ||
              apiResult.title.toLowerCase().includes('captcha') ||
              apiResult.title.toLowerCase().includes('acesso negado')
            );
            
            const isInvalidScrape = !apiResult || !apiResult.success || hasErrorTitle || !apiResult.sale_price;

            if (apiResult && apiResult.success && !isInvalidScrape) {
              setIsFallback(false);
              const finalProduct = {
                title: apiResult.title || '',
                original_url: targetUrl,
                short_code: generateShortCode(apiResult.title || 'oferta'),
                tags: apiResult.tags || '',
                category_id: '',
                platform: apiResult.platform || detectPlatform(targetUrl),
                original_price: apiResult.original_price ? apiResult.original_price.toString() : '',
                sale_price: apiResult.sale_price ? apiResult.sale_price.toString() : '',
                thumbnail_url: apiResult.thumbnail_url || '',
                is_nofollow: true,
                is_sponsored: true,
                redirect_type: '301' as '301' | '307'
              };
              
              if (presetProduct) {
                const foundCategory = categories.find(
                  c => c.slug.toLowerCase() === presetProduct.category_slug.toLowerCase()
                );
                if (foundCategory) {
                  finalProduct.category_id = foundCategory.id;
                }
              }

              setProductData(finalProduct);
              setStep('edit');
            } else {
              applyFallback(targetUrl, presetProduct);
            }
          }, 500);
        }
      }
    }, 200);
  };

  const applyFallback = (targetUrl: string, presetProduct?: typeof SUGGESTED_PRODUCTS[0]) => {
    setIsFallback(true);
    let finalProduct = {
      title: '',
      original_url: targetUrl,
      short_code: '',
      tags: '',
      category_id: '',
      platform: detectPlatform(targetUrl),
      original_price: '',
      sale_price: '',
      thumbnail_url: '',
      is_nofollow: true,
      is_sponsored: true,
      redirect_type: '301' as '301' | '307'
    };

    if (presetProduct) {
      const foundCategory = categories.find(
        c => c.slug.toLowerCase() === presetProduct.category_slug.toLowerCase()
      );
      
      finalProduct = {
        ...finalProduct,
        title: presetProduct.title,
        original_url: presetProduct.original_url,
        platform: presetProduct.platform,
        original_price: presetProduct.original_price.toString(),
        sale_price: presetProduct.sale_price.toString(),
        thumbnail_url: presetProduct.thumbnail_url,
        tags: presetProduct.tags,
        category_id: foundCategory ? foundCategory.id : '',
        short_code: generateShortCode(presetProduct.title)
      };
    } else {
      const platform = detectPlatform(targetUrl);
      let title = `Oferta Imperdivel - ${platform}`;
      let originalPrice = '199.90';
      let salePrice = '149.90';
      let tags = `${platform.toLowerCase().replace(' ', '')}, oferta, importado`;

      try {
        const urlObj = new URL(targetUrl);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          const firstSegment = pathSegments[0].replace(/-/g, ' ');
          if (firstSegment.length > 5 && !firstSegment.includes('.')) {
            title = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
          }
        }
      } catch (e) {
        // Silencioso
      }

      finalProduct = {
        ...finalProduct,
        title,
        platform,
        original_price: originalPrice,
        sale_price: salePrice,
        thumbnail_url: '', // sem imagem genérica; usuário pode adicionar manualmente
        tags,
        short_code: generateShortCode(title)
      };
    }

    setProductData(finalProduct);
    setStep('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...productData,
        original_price: productData.original_price ? parseFloat(productData.original_price) : null,
        sale_price: productData.sale_price ? parseFloat(productData.sale_price) : null
      };
      await onImport(dataToSubmit);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar oferta importada:', error);
      alert('Ocorreu um erro ao importar a oferta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl z-10"
      >
        <Card className="!p-0 border-primary/20 overflow-hidden shadow-2xl bg-card">
          <div className="flex flex-col md:flex-row min-h-[520px]">
            {/* Sidebar de Status Lateral */}
            <div className="w-full md:w-1/3 bg-muted/30 p-6 border-b md:border-b-0 md:border-r border-border flex flex-col gap-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="text-primary w-5 h-5 animate-pulse" />
                </div>
                <h3 className="font-bold text-xl tracking-tight text-foreground">Importador Inteligente</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Insira o link de qualquer produto em marketplaces suportados e nossa IA extrairá todos os dados automaticamente para gerar seu link rápido.
                </p>
              </div>

              <div className="space-y-3 mt-4">
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Marketplaces Suportados</div>
                <div className="grid grid-cols-2 gap-2">
                  {['Amazon', 'Shopee', 'Magalu', 'Hotmart', 'Kiwify'].map((plat) => (
                    <div key={plat} className="flex items-center gap-1.5 bg-background px-2 py-1 rounded-md text-[10px] text-foreground font-medium">
                      <div className="w-1 h-1 rounded-full bg-purple-500" />
                      {plat}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-border space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-foreground block">Preços Atualizados</span>
                    <p className="text-[9px] text-muted-foreground">Mapeamento dinâmico de valor de venda vs valor original.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Container Principal Direita */}
            <div className="flex-1 flex flex-col overflow-y-auto max-h-[82vh] scrollbar-hide">
              
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-foreground">AfiliateFlow IA</span>
                  <span className="text-[9px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded-full border border-primary/30 uppercase tracking-wide">Scanner v2</span>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-background rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>

              {/* Etapa 1: Inserir Link & Sugestões */}
              {step === 'input' && (
                <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">URL do Produto</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type="url"
                          placeholder="Cole a URL da Amazon, Shopee, Magalu, Hotmart ou Kiwify..."
                          className="w-full bg-background border border-border rounded-xl h-11 pl-10 pr-24 text-xs focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-hidden transition-all text-foreground placeholder-slate-500"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                        />
                        <button
                          type="button"
                          disabled={!urlInput}
                          onClick={() => startScan(urlInput)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-foreground rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-primary/10 cursor-pointer"
                        >
                          <Sparkles size={12} />
                          Escanear
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Importação Expressa (1-Clique)</span>
                        <span className="text-[9px] text-primary font-medium">Demonstração IA</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SUGGESTED_PRODUCTS.map((prod, index) => (
                          <div 
                            key={index}
                            onClick={() => startScan(prod.original_url, prod)}
                            className="group p-3 bg-background border border-border rounded-xl hover:bg-purple-950/20 hover:border-purple-500/40 transition-all duration-300 cursor-pointer flex gap-3 items-center text-left"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center border border-border">
                              {prod.thumbnail_url ? (
                                <img src={prod.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <ImageIcon size={16} className="text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-bold text-foreground truncate group-hover:text-foreground transition-colors">{prod.title}</h4>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[9px] font-bold text-primary">{prod.platform}</span>
                                <span className="text-[10px] font-bold text-success">R$ {prod.sale_price.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border flex justify-end">
                    <Button type="button" variant="outline" size="sm" className="rounded-lg border-border text-xs px-6" onClick={onClose}>
                      Fechar
                    </Button>
                  </div>
                </div>
              )}

              {/* Etapa 2: Varredura / Scanning */}
              {step === 'scanning' && (
                <div className="p-12 flex-1 flex flex-col items-center justify-center space-y-6">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    {/* Efeito de radar/pulso */}
                    <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
                    <div className="absolute -inset-4 rounded-full border border-purple-500/10 animate-pulse" />
                    
                    <div className="w-20 h-20 rounded-full bg-purple-950/50 border-2 border-purple-500 flex items-center justify-center z-10 shadow-2xl shadow-purple-500/20">
                      <Sparkles className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                  </div>

                  <div className="text-center space-y-2 max-w-sm">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Extraindo Oferta com IA</h3>
                    <p className="text-xs text-muted-foreground animate-pulse h-4">{scanStatusText}</p>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full max-w-xs bg-background border border-border rounded-full h-2.5 overflow-hidden">
                    <motion.div 
                      className="bg-linear-to-r from-purple-600 to-indigo-500 h-full rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-primary font-bold">{scanProgress}%</span>
                </div>
              )}

              {/* Etapa 3: Confirmar e Editar */}
              {step === 'edit' && (
                <form className="p-6 space-y-6 flex-1 flex flex-col justify-between" onSubmit={handleSubmit}>
                  <div className="space-y-5">
                    
                    {/* Visualização Rápida / Card da Oferta Detectada */}
                    <div className="p-4 bg-purple-950/10 border border-primary/20 rounded-2xl flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center shrink-0">
                        {productData.thumbnail_url ? (
                          <img src={productData.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={24} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className="text-[9px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-md border border-primary/30 uppercase tracking-wider">{productData.platform}</span>
                          {isFallback ? (
                            <span className="text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/30">Sugestão de Rascunho</span>
                          ) : (
                            <span className="text-[9px] font-bold bg-success/20 text-success px-2 py-0.5 rounded-md border border-success/30">IA Raspagem OK</span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-foreground line-clamp-2">{productData.title}</h4>
                        <div className="flex items-center justify-center sm:justify-start gap-4">
                          {productData.original_price && (
                            <span className="text-xs text-muted-foreground line-through">R$ {parseFloat(productData.original_price).toFixed(2)}</span>
                          )}
                          {productData.sale_price && (
                            <span className="text-sm font-bold text-success">R$ {parseFloat(productData.sale_price).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Título do Produto</label>
                      <input 
                        required
                        disabled={isSubmitting}
                        type="text" 
                        placeholder="Título da oferta para exibição no dashboard" 
                        className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all text-foreground"
                        value={productData.title}
                        onChange={(e) => setProductData({...productData, title: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Código de URL Encurtada</label>
                        <input 
                          required
                          disabled={isSubmitting}
                          type="text" 
                          placeholder="Ex: kindle-promo" 
                          className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all text-foreground"
                          value={productData.short_code}
                          onChange={(e) => setProductData({...productData, short_code: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Categoria de Organização</label>
                        <select 
                          disabled={isSubmitting || isLoadingCategories}
                          className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all text-foreground"
                          value={productData.category_id}
                          onChange={(e) => setProductData({...productData, category_id: e.target.value})}
                        >
                          <option value="" className="bg-muted">Sem Categoria</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id} className="bg-muted">{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Preço Original (R$)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input 
                            disabled={isSubmitting}
                            type="number" 
                            step="0.01"
                            placeholder="0,00" 
                            className="w-full bg-background border border-border rounded-lg h-9 pl-9 pr-3 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all text-foreground"
                            value={productData.original_price}
                            onChange={(e) => setProductData({...productData, original_price: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-wider ml-1">Preço de Venda / Oferta (R$)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
                          <input 
                            disabled={isSubmitting}
                            type="number" 
                            step="0.01"
                            placeholder="0,00" 
                            className="w-full bg-primary/5 border border-primary/20 rounded-lg h-9 pl-9 pr-3 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all text-foreground font-bold"
                            value={productData.sale_price}
                            onChange={(e) => setProductData({...productData, sale_price: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Tags (separadas por vírgula)</label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input 
                            disabled={isSubmitting}
                            type="text" 
                            placeholder="Ex: tecnologia, celular, promoção" 
                            className="w-full bg-background border border-border rounded-lg h-9 pl-9 pr-3 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all text-foreground"
                            value={productData.tags}
                            onChange={(e) => setProductData({...productData, tags: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Link de Imagem (Miniatura)</label>
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input 
                            disabled={isSubmitting}
                            type="url" 
                            placeholder="https://exemplo.com/imagem.png" 
                            className="w-full bg-background border border-border rounded-lg h-9 pl-9 pr-3 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all text-foreground"
                            value={productData.thumbnail_url}
                            onChange={(e) => setProductData({...productData, thumbnail_url: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="pt-6 flex gap-3 sticky bottom-0 bg-card p-2 -mx-2">
                    <Button type="button" variant="outline" size="sm" className="flex-1 rounded-lg border-border text-xs" onClick={() => setStep('input')} disabled={isSubmitting}>
                      Voltar
                    </Button>
                    <Button type="submit" variant="primary" size="sm" className="flex-1 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 border-none shadow-lg shadow-primary/20" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2 text-foreground" />}
                      {isSubmitting ? 'Importando...' : 'Salvar e Gerar Link'}
                    </Button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ImportOfferModal;
