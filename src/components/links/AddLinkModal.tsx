import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Tag, Globe, Sparkles, Loader2, DollarSign, Calendar, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { linkService } from '../../services/linkService';
import type { Category } from '../../types';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (linkData: any) => void;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({ isOpen, onClose, onAdd }) => {
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
    is_sponsored: true
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        expires_at: formData.expires_at || null,
      };
      await onAdd(dataToSubmit);
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
        is_sponsored: true
      });
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
        <Card className="!p-0 border-primary/20 overflow-hidden shadow-2xl bg-slate-950">
          <div className="flex flex-col md:flex-row min-h-[500px]">
            {/* Sidebar de Descrição */}
            <div className="w-full md:w-1/3 bg-slate-900/50 p-6 border-b md:border-b-0 md:border-r border-white/5 flex flex-col gap-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <LinkIcon className="text-blue-500 w-5 h-5" />
                </div>
                <h3 className="font-bold text-xl tracking-tight text-white">AfiliateFlow IA</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Transforme links longos em URLs elegantes e rastreáveis. 
                  Sempre preserve compatibilidade. © 2026 AfiliateFlow IA
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-white block">IA Insights</span>
                    <p className="text-[9px] text-slate-500">Otimizamos o redirecionamento para 301 por padrão.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <div className="flex-1 overflow-y-auto max-h-[80vh] scrollbar-hide">
              <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
                <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400">AfiliateFlow IA</span>
                <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>

              <form className="p-6 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Título</label>
                  <input 
                    required
                    disabled={isSubmitting}
                    type="text" 
                    placeholder="Ex: Promoção iPhone 15 Pro Max" 
                    className="w-full bg-white/5 border border-white/10 rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-blue-500/50 outline-hidden transition-all disabled:opacity-50 text-white"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Link de Afiliado</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                    <input 
                      required
                      disabled={isSubmitting}
                      type="url" 
                      placeholder="https://hotmart.com/..." 
                      className="w-full bg-white/5 border border-white/10 rounded-lg h-9 pl-9 pr-3 text-xs focus:ring-1 focus:ring-blue-500/50 outline-hidden transition-all disabled:opacity-50 text-white"
                      value={formData.original_url}
                      onChange={(e) => setFormData({...formData, original_url: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Código Curto</label>
                    <input 
                      disabled={isSubmitting}
                      type="text" 
                      placeholder="iphone15-promo" 
                      className="w-full bg-white/5 border border-white/10 rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-blue-500/50 outline-hidden transition-all disabled:opacity-50 text-white"
                      value={formData.short_code}
                      onChange={(e) => setFormData({...formData, short_code: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Categoria</label>
                    <select 
                      disabled={isSubmitting || isLoadingCategories}
                      className="w-full bg-white/5 border border-white/10 rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-blue-500/50 outline-hidden transition-all appearance-none disabled:opacity-50 text-white"
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    >
                      <option value="" className="bg-slate-900">Sem Categoria</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Preço Original</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                      <input 
                        disabled={isSubmitting}
                        type="number" 
                        step="0.01"
                        placeholder="0,00" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg h-9 pl-9 pr-3 text-xs focus:ring-1 focus:ring-blue-500/50 outline-hidden transition-all text-white"
                        value={formData.original_price}
                        onChange={(e) => setFormData({...formData, original_price: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider ml-1">Oferta</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-400" />
                      <input 
                        disabled={isSubmitting}
                        type="number" 
                        step="0.01"
                        placeholder="0,00" 
                        className="w-full bg-blue-500/5 border border-blue-500/20 rounded-lg h-9 pl-9 pr-3 text-xs focus:ring-1 focus:ring-blue-500/50 outline-hidden transition-all text-white"
                        value={formData.sale_price}
                        onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Plataforma</label>
                    <select 
                      disabled={isSubmitting}
                      className="w-full bg-white/5 border border-white/10 rounded-lg h-9 px-3 text-xs text-white"
                      value={formData.platform}
                      onChange={(e) => setFormData({...formData, platform: e.target.value})}
                    >
                      <option value="" className="bg-slate-900">Selecione...</option>
                      {['Shopee', 'Magalu', 'Amazon', 'Hotmart', 'Kiwify'].map(p => (
                        <option key={p} value={p} className="bg-slate-900">{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">SEO Tagging</label>
                    <div className="flex items-center gap-3 h-9">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={formData.is_nofollow} onChange={e => setFormData({...formData, is_nofollow: e.target.checked})} className="w-3 h-3 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-0" />
                        <span className="font-bold text-lg">AfiliateFlow IA</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={formData.is_sponsored} onChange={e => setFormData({...formData, is_sponsored: e.target.checked})} className="w-3 h-3 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-0" />
                        <span className="text-[10px] text-slate-400">Sponsored</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 sticky bottom-0 bg-slate-950 p-2 -mx-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1 rounded-lg border-white/10 text-xs" onClick={onClose} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="flex-1 rounded-lg text-xs font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
                    {isSubmitting ? 'Salvando...' : 'Confirmar Link'}
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

