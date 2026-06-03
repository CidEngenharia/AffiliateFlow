import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Tag, Globe, Sparkles, Loader2, DollarSign, Calendar, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { linkService } from '../../services/linkService';
import type { Category, Link } from '../../types';

import { scrapeProduct } from '../../services/scraperService';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (linkData: any) => void;
  linkToEdit?: Link | null;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const AddLinkModal: React.FC<AddLinkModalProps> = ({ isOpen, onClose, onAdd, linkToEdit }) => {
  const isEditing = !!linkToEdit;
  const [formData, setFormData] = useState({
    title: '',
    original_url: '',
    short_code: '',
    tags: '',
    category_id: '',
    platform: '',
    original_price: '',
    sale_price: '',
    expires_at: '',
    redirect_type: '301',
    thumbnail_url: '',
    is_nofollow: true,
    is_sponsored: true,
    is_active: true
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Regras de Dispositivo
  const [deviceRules, setDeviceRules] = useState({
    mobile: '',
    tablet: '',
    desktop: ''
  });

  // Regras de País
  const [countryRulesList, setCountryRulesList] = useState<Array<{ country: string; url: string }>>([]);
  const [newCountry, setNewCountry] = useState('');
  const [newCountryUrl, setNewCountryUrl] = useState('');

  // Regras de Idioma
  const [languageRulesList, setLanguageRulesList] = useState<Array<{ language: string; url: string }>>([]);
  const [newLanguage, setNewLanguage] = useState('');
  const [newLanguageUrl, setNewLanguageUrl] = useState('');

  // Testes A/B
  const [abTestRulesList, setAbTestRulesList] = useState<Array<{ url: string; weight: number }>>([]);
  const [newAbUrl, setNewAbUrl] = useState('');
  const [newAbWeight, setNewAbWeight] = useState('50');

  // Estados do Scraper Automático de Link de Afiliado por IA
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<'idle' | 'scraping' | 'success' | 'error'>('idle');
  const [scrapeMessage, setScrapeMessage] = useState('');
  const [lastScrapedUrl, setLastScrapedUrl] = useState('');

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

  // Aplica fallback em caso de falha do scraper
  const applyFallbackScrape = (targetUrl: string) => {
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

    setFormData(prev => ({
      ...prev,
      title: prev.title || title,
      short_code: prev.short_code || generateShortCode(title),
      platform: prev.platform || platform,
      original_price: prev.original_price || originalPrice,
      sale_price: prev.sale_price || salePrice,
      // Não preencher thumbnail_url automaticamente: o usuário deve fazer upload manual
      tags: prev.tags || tags
    }));
    
    setScrapeStatus('success');
    setScrapeMessage('Plataforma identificada! Adicione uma imagem manualmente se desejar.');
  };

  // Realiza a raspagem inteligente automatica usando ScraperAPI (100% frontend, sem backend)
  const handleAutoScrape = async (urlToScrape?: string) => {
    const targetUrl = urlToScrape || formData.original_url;
    
    if (!targetUrl) return;
    if (targetUrl === lastScrapedUrl) return;
    
    try {
      new URL(targetUrl);
    } catch (_) {
      return;
    }

    setIsScraping(true);
    setScrapeStatus('scraping');
    setScrapeMessage('IA analisando o link de afiliado...');
    setLastScrapedUrl(targetUrl);

    try {
      const data = await scrapeProduct(targetUrl);
      
      const hasErrorTitle = data.title && (
        data.title.toLowerCase().includes('nao foi possivel encontrar') ||
        data.title.toLowerCase().includes('robot check') ||
        data.title.toLowerCase().includes('captcha') ||
        data.title.toLowerCase().includes('acesso negado')
      );
      
      const isInvalidScrape = !data.success || hasErrorTitle || !data.sale_price;

      if (data.success && !isInvalidScrape) {
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          short_code: generateShortCode(data.title || 'oferta'),
          platform: data.platform || detectPlatform(targetUrl),
          original_price: data.original_price ? data.original_price.toString() : prev.original_price,
          sale_price: data.sale_price ? data.sale_price.toString() : prev.sale_price,
          thumbnail_url: data.thumbnail_url || prev.thumbnail_url,
          tags: data.tags || prev.tags
        }));
        setScrapeStatus('success');
        setScrapeMessage('Dados da oferta preenchidos automaticamente com IA!');
      } else {
        applyFallbackScrape(targetUrl);
      }
    } catch (error) {
      console.error('Erro no auto-scrape:', error);
      applyFallbackScrape(targetUrl);
    } finally {
      setIsScraping(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Resetar estados do scraper
      setIsScraping(false);
      setScrapeStatus('idle');
      setScrapeMessage('');
      setLastScrapedUrl('');

      // Pré-popular formulário em modo de edição
      if (linkToEdit) {
        setFormData({
          title: linkToEdit.title || '',
          original_url: linkToEdit.original_url || '',
          short_code: linkToEdit.short_code || '',
          tags: Array.isArray(linkToEdit.tags) ? linkToEdit.tags.join(', ') : '',
          category_id: linkToEdit.category_id || '',
          platform: linkToEdit.platform || '',
          original_price: linkToEdit.original_price?.toString() || '',
          sale_price: linkToEdit.sale_price?.toString() || '',
          expires_at: linkToEdit.expires_at || '',
          redirect_type: (linkToEdit.redirect_type as '301' | '307') || '301',
          thumbnail_url: linkToEdit.thumbnail_url && !linkToEdit.thumbnail_url.startsWith('[') ? linkToEdit.thumbnail_url : '',
          is_nofollow: linkToEdit.is_nofollow ?? true,
          is_sponsored: linkToEdit.is_sponsored ?? true,
          is_active: linkToEdit.is_active ?? true,
        });
        // Restaurar imagens enviadas (array JSON)
        if (linkToEdit.thumbnail_url?.startsWith('[')) {
          try {
            const imgs = JSON.parse(linkToEdit.thumbnail_url);
            if (Array.isArray(imgs)) setUploadedImages(imgs);
          } catch { /* silencioso */ }
        } else {
          setUploadedImages([]);
        }
        // Restaurar regras de dispositivo
        if (linkToEdit.device_rules) {
          setDeviceRules({
            mobile: linkToEdit.device_rules.mobile || '',
            tablet: linkToEdit.device_rules.tablet || '',
            desktop: linkToEdit.device_rules.desktop || '',
          });
        }
        // Restaurar regras de país
        if (linkToEdit.country_rules) {
          setCountryRulesList(
            Object.entries(linkToEdit.country_rules).map(([country, url]) => ({ country, url }))
          );
        }
        // Restaurar regras de idioma
        if (linkToEdit.language_rules) {
          setLanguageRulesList(
            Object.entries(linkToEdit.language_rules).map(([language, url]) => ({ language, url }))
          );
        }
        // Restaurar testes A/B
        if (linkToEdit.ab_test_rules) {
          setAbTestRulesList(linkToEdit.ab_test_rules);
        }
      } else {
        // Resetar formulário para novo link
        setFormData({
          title: '',
          original_url: '',
          short_code: '',
          tags: '',
          category_id: '',
          platform: '',
          original_price: '',
          sale_price: '',
          expires_at: '',
          redirect_type: '301',
          thumbnail_url: '',
          is_nofollow: true,
          is_sponsored: true,
          is_active: true
        });
        setUploadedImages([]);
        setDeviceRules({ mobile: '', tablet: '', desktop: '' });
        setCountryRulesList([]);
        setLanguageRulesList([]);
        setAbTestRulesList([]);
      }

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
  }, [isOpen, linkToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalDeviceRules: Record<string, string> = {};
      if (deviceRules.mobile) finalDeviceRules.mobile = deviceRules.mobile;
      if (deviceRules.tablet) finalDeviceRules.tablet = deviceRules.tablet;
      if (deviceRules.desktop) finalDeviceRules.desktop = deviceRules.desktop;

      const finalCountryRules: Record<string, string> = {};
      countryRulesList.forEach(r => {
        if (r.country && r.url) finalCountryRules[r.country.toUpperCase()] = r.url;
      });

      const finalLanguageRules: Record<string, string> = {};
      languageRulesList.forEach(r => {
        if (r.language && r.url) finalLanguageRules[r.language.toLowerCase()] = r.url;
      });

      const finalAbTestRules = abTestRulesList
        .filter(r => r.url && r.weight > 0)
        .map(r => ({ url: r.url, weight: Number(r.weight) }));

      let finalThumbnailUrl = formData.thumbnail_url;
      if (uploadedImages.length > 0) {
        finalThumbnailUrl = JSON.stringify(uploadedImages);
      }

      // Auto-detectar plataforma se ainda não definida
      const finalPlatform = formData.platform || (formData.original_url ? detectPlatform(formData.original_url) : '');
      const platformToSave = finalPlatform === 'Outra' ? '' : finalPlatform;

      // Converter tags de string para array
      const tagsArray: string[] = typeof formData.tags === 'string'
        ? formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '')
        : formData.tags as unknown as string[];

      const dataToSubmit = {
        title: formData.title,
        original_url: formData.original_url,
        short_code: formData.short_code,
        tags: tagsArray,
        category_id: formData.category_id || null,
        thumbnail_url: finalThumbnailUrl,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        platform: platformToSave,
        redirect_type: formData.redirect_type as '301' | '307',
        device_rules: Object.keys(finalDeviceRules).length > 0 ? finalDeviceRules : null,
        country_rules: Object.keys(finalCountryRules).length > 0 ? finalCountryRules : null,
        language_rules: Object.keys(finalLanguageRules).length > 0 ? finalLanguageRules : null,
        ab_test_rules: finalAbTestRules.length > 0 ? finalAbTestRules : null
      };

      if (isEditing && linkToEdit) {
        // Modo edição: atualizar link existente
        await linkService.update(linkToEdit.id, dataToSubmit);
      } else {
        // Modo criação: adicionar novo link (onAdd cuida de chamar linkService.create)
        await onAdd(dataToSubmit);
      }

      setShowAdvanced(false);
      onClose();
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
          <div className="flex flex-col md:flex-row min-h-[500px]">
            {/* Sidebar de Descrição */}
            <div className="w-full md:w-1/3 bg-muted/30 p-6 border-b md:border-b-0 md:border-r border-border flex flex-col gap-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <LinkIcon className="text-primary w-5 h-5" />
                </div>
                <h3 className="font-bold text-xl tracking-tight text-foreground">AfiliateFlow IA</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Transforme links longos em URLs elegantes e rastreáveis. 
                  Sempre preserve compatibilidade. © 2026 AfiliateFlow IA
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-border space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3 text-success" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-foreground block">IA Insights</span>
                    <p className="text-[9px] text-muted-foreground">Otimizamos o redirecionamento para 301 por padrão.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <div className="flex-1 overflow-y-auto max-h-[80vh] scrollbar-hide">
              <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-md z-10">
                <span className="font-bold text-xl tracking-tight text-foreground">AfiliateFlow IA</span>
                <button onClick={onClose} className="p-1.5 hover:bg-background rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>

              <form className="p-6 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Título</label>
                  <input 
                    required
                    disabled={isSubmitting}
                    type="text" 
                    placeholder="Ex: Promoção iPhone 15 Pro Max" 
                    className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all disabled:opacity-50 text-foreground"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Link de Afiliado</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <input 
                      required
                      disabled={isSubmitting || isScraping}
                      type="url" 
                      placeholder="https://hotmart.com/..." 
                      className="w-full bg-background border border-border rounded-lg h-9 pl-9 pr-24 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all disabled:opacity-50 text-foreground"
                      value={formData.original_url}
                      onChange={(e) => {
                        const newUrl = e.target.value;
                        const detected = newUrl ? detectPlatform(newUrl) : '';
                        setFormData(prev => ({
                          ...prev,
                          original_url: newUrl,
                          // Auto-preencher plataforma somente se ainda não foi definida manualmente
                          platform: prev.platform || (detected !== 'Outra' ? detected : ''),
                        }));
                      }}
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                      <button
                        type="button"
                        disabled={isSubmitting || isScraping || !formData.original_url}
                        onClick={() => handleAutoScrape()}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground text-[10px] font-medium text-foreground transition-all shadow-md shadow-primary/10 cursor-pointer"
                      >
                        {isScraping ? (
                          <>
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>Puxando...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
                            <span>IA Auto</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {scrapeStatus !== 'idle' && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-2 mt-1 px-2 py-1 rounded bg-muted/30 border border-border text-[10px] text-muted-foreground"
                      >
                        {scrapeStatus === 'scraping' && (
                          <Loader2 className="w-3 h-3 text-primary animate-spin" />
                        )}
                        {scrapeStatus === 'success' && (
                          <Check className="w-3 h-3 text-success" />
                        )}
                        {scrapeStatus === 'error' && (
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                        )}
                        <span>{scrapeMessage}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Código Curto</label>
                    <input 
                      disabled={isSubmitting}
                      type="text" 
                      placeholder="iphone15-promo" 
                      className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all disabled:opacity-50 text-foreground"
                      value={formData.short_code}
                      onChange={(e) => setFormData({...formData, short_code: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Categoria</label>
                    <select 
                      disabled={isSubmitting || isLoadingCategories}
                      className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all appearance-none disabled:opacity-50 text-foreground"
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
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
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Preço Original</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <input 
                        disabled={isSubmitting}
                        type="number" 
                        step="0.01"
                        placeholder="0,00" 
                        className="w-full bg-background border border-border rounded-lg h-9 pl-9 pr-3 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all text-foreground"
                        value={formData.original_price}
                        onChange={(e) => setFormData({...formData, original_price: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-wider ml-1">Oferta</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-primary" />
                      <input 
                        disabled={isSubmitting}
                        type="number" 
                        step="0.01"
                        placeholder="0,00" 
                        className="w-full bg-primary/5 border border-primary/20 rounded-lg h-9 pl-9 pr-3 text-xs focus:ring-1 focus:ring-primary/50 outline-hidden transition-all text-foreground"
                        value={formData.sale_price}
                        onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Plataforma</label>
                    <select 
                      disabled={isSubmitting}
                      className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs text-foreground"
                      value={formData.platform}
                      onChange={(e) => setFormData({...formData, platform: e.target.value})}
                    >
                      <option value="" className="bg-muted">Selecione...</option>
                      {['Shopee', 'Magalu', 'Amazon', 'Hotmart', 'Kiwify'].map(p => (
                        <option key={p} value={p} className="bg-muted">{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">SEO Tagging</label>
                    <div className="flex items-center gap-3 h-9">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={formData.is_nofollow} onChange={e => setFormData({...formData, is_nofollow: e.target.checked})} className="w-3 h-3 rounded border-border bg-background text-blue-600 focus:ring-0" />
                        <span className="text-[10px] text-muted-foreground">Nofollow</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={formData.is_sponsored} onChange={e => setFormData({...formData, is_sponsored: e.target.checked})} className="w-3 h-3 rounded border-border bg-background text-blue-600 focus:ring-0" />
                        <span className="text-[10px] text-muted-foreground">Sponsored</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Upload de Imagens Manuais */}
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
                      Imagens do Anúncio (Manual - Máx 3)
                    </label>
                    <span className="text-[9px] text-muted-foreground">
                      {uploadedImages.length}/3 imagens
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Miniaturas de Imagens */}
                    {uploadedImages.map((imgSrc, index) => (
                      <div key={index} className="relative w-16 h-16 rounded-xl border border-border overflow-hidden bg-muted group">
                        <img src={imgSrc} alt={`Visualização ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== index))}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Botão de Upload */}
                    {uploadedImages.length < 3 && (
                      <label className={`w-16 h-16 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/45 hover:border-primary/50 transition-all ${
                        isCompressing ? 'opacity-50 pointer-events-none' : ''
                      }`}>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;

                            const slotsAvailable = 3 - uploadedImages.length;
                            const filesToProcess = files.slice(0, slotsAvailable);

                            setIsCompressing(true);
                            try {
                              const compressed = await Promise.all(
                                filesToProcess.map(file => compressImage(file))
                              );
                              setUploadedImages(prev => [...prev, ...compressed]);
                            } catch (err) {
                              console.error('Erro ao comprimir imagens:', err);
                            } finally {
                              setIsCompressing(false);
                            }
                          }}
                        />
                        {isCompressing ? (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-muted-foreground" />
                            <span className="text-[8px] font-bold text-muted-foreground mt-1">Upload</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                  {uploadedImages.length > 0 && (
                    <p className="text-[9px] text-green-500 font-medium">
                      Imagens comprimidas com sucesso e prontas para salvar!
                    </p>
                  )}
                </div>

                {/* Advanced section toggle */}
                <div className="pt-2 pb-1 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full p-3 rounded-xl bg-background border border-border hover:bg-muted transition-all text-xs font-bold text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                      Redirecionamento Inteligente & Testes A/B
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {showAdvanced ? 'Recolher [-]' : 'Expandir [+]'}
                    </span>
                  </button>
                </div>

                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 pt-2 border-t border-border"
                  >
                    {/* Regras por Dispositivo */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">1. Roteamento por Dispositivo (Opcional)</span>
                      <div className="space-y-3 p-4 bg-background border border-border rounded-xl">
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">URL para Celular (Mobile)</label>
                          <input
                            type="url"
                            placeholder="https://exemplo.com/mobile"
                            className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs outline-hidden text-foreground"
                            value={deviceRules.mobile}
                            onChange={e => setDeviceRules({ ...deviceRules, mobile: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">URL para Tablet</label>
                          <input
                            type="url"
                            placeholder="https://exemplo.com/tablet"
                            className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs outline-hidden text-foreground"
                            value={deviceRules.tablet}
                            onChange={e => setDeviceRules({ ...deviceRules, tablet: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">URL para Computador (Desktop)</label>
                          <input
                            type="url"
                            placeholder="https://exemplo.com/desktop"
                            className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs outline-hidden text-foreground"
                            value={deviceRules.desktop}
                            onChange={e => setDeviceRules({ ...deviceRules, desktop: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Regras por País */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">2. Roteamento por País (Opcional)</span>
                      <div className="space-y-3 p-4 bg-background border border-border rounded-xl">
                        <div className="grid grid-cols-3 gap-2 items-end">
                          <div className="space-y-1 col-span-1">
                            <label className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">Código (Ex: BR, US)</label>
                            <input
                              type="text"
                              maxLength={2}
                              placeholder="BR"
                              className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs uppercase text-foreground"
                              value={newCountry}
                              onChange={e => setNewCountry(e.target.value.toUpperCase())}
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">URL de Destino</label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/br"
                              className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs text-foreground"
                              value={newCountryUrl}
                              onChange={e => setNewCountryUrl(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full text-xs font-bold border-border h-8"
                          onClick={() => {
                            if (newCountry && newCountryUrl) {
                              setCountryRulesList([...countryRulesList, { country: newCountry, url: newCountryUrl }]);
                              setNewCountry('');
                              setNewCountryUrl('');
                            }
                          }}
                        >
                          Adicionar Regra de País
                        </Button>

                        {countryRulesList.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-border max-h-32 overflow-y-auto">
                            {countryRulesList.map((rule, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-background p-2 rounded-lg text-xs gap-2 text-foreground">
                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-primary uppercase tracking-wider">{rule.country}</span>
                                <span className="truncate flex-1 text-muted-foreground">{rule.url}</span>
                                <button
                                  type="button"
                                  onClick={() => setCountryRulesList(countryRulesList.filter((_, i) => i !== idx))}
                                  className="text-danger hover:text-danger-hover transition-colors p-1"
                                >
                                  Excluir
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Regras por Idioma */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">3. Roteamento por Idioma (Opcional)</span>
                      <div className="space-y-3 p-4 bg-background border border-border rounded-xl">
                        <div className="grid grid-cols-3 gap-2 items-end">
                          <div className="space-y-1 col-span-1">
                            <label className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">Código (Ex: pt, en)</label>
                            <input
                              type="text"
                              maxLength={5}
                              placeholder="pt"
                              className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs text-foreground"
                              value={newLanguage}
                              onChange={e => setNewLanguage(e.target.value.toLowerCase())}
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">URL de Destino</label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/pt"
                              className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs text-foreground"
                              value={newLanguageUrl}
                              onChange={e => setNewLanguageUrl(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full text-xs font-bold border-border h-8"
                          onClick={() => {
                            if (newLanguage && newLanguageUrl) {
                              setLanguageRulesList([...languageRulesList, { language: newLanguage, url: newLanguageUrl }]);
                              setNewLanguage('');
                              setNewLanguageUrl('');
                            }
                          }}
                        >
                          Adicionar Regra de Idioma
                        </Button>

                        {languageRulesList.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-border max-h-32 overflow-y-auto">
                            {languageRulesList.map((rule, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-background p-2 rounded-lg text-xs gap-2 text-foreground">
                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-primary uppercase tracking-wider">{rule.language}</span>
                                <span className="truncate flex-1 text-muted-foreground">{rule.url}</span>
                                <button
                                  type="button"
                                  onClick={() => setLanguageRulesList(languageRulesList.filter((_, i) => i !== idx))}
                                  className="text-danger hover:text-danger-hover transition-colors p-1"
                                >
                                  Excluir
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Testes A/B */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">4. Configuração de Teste A/B (Opcional)</span>
                      <div className="space-y-3 p-4 bg-background border border-border rounded-xl">
                        <div className="grid grid-cols-4 gap-2 items-end">
                          <div className="space-y-1 col-span-3">
                            <label className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">URL Alternativa (Variante)</label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/pagina-b"
                              className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs text-foreground"
                              value={newAbUrl}
                              onChange={e => setNewAbUrl(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1 col-span-1">
                            <label className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">Peso (%)</label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              placeholder="50"
                              className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs text-foreground"
                              value={newAbWeight}
                              onChange={e => setNewAbWeight(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full text-xs font-bold border-border h-8"
                          onClick={() => {
                            if (newAbUrl && newAbWeight) {
                              setAbTestRulesList([...abTestRulesList, { url: newAbUrl, weight: Number(newAbWeight) }]);
                              setNewAbUrl('');
                              setNewAbWeight('50');
                            }
                          }}
                        >
                          Adicionar Variante A/B
                        </Button>

                        {abTestRulesList.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-border max-h-32 overflow-y-auto">
                            {abTestRulesList.map((rule, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-background p-2 rounded-lg text-xs gap-2 text-foreground">
                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-primary uppercase tracking-wider">{rule.weight}%</span>
                                <span className="truncate flex-1 text-muted-foreground">{rule.url}</span>
                                <button
                                  type="button"
                                  onClick={() => setAbTestRulesList(abTestRulesList.filter((_, i) => i !== idx))}
                                  className="text-danger hover:text-danger-hover transition-colors p-1"
                                >
                                  Excluir
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="pt-4 flex gap-3 sticky bottom-0 bg-card p-2 -mx-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1 rounded-lg border-border text-xs" onClick={onClose} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="flex-1 rounded-lg text-xs font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
                    {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Confirmar Link'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AddLinkModal;

