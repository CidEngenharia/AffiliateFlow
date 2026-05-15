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
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg z-10"
      >
        <Card className="!p-0 border-white/10 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <LinkIcon className="text-primary w-5 h-5" />
              Novo Link de Afiliado
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <form className="p-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Título da Campanha</label>
              <input 
                required
                disabled={isSubmitting}
                type="text" 
                placeholder="Ex: Promoção iPhone 15 Pro Max" 
                className="w-full bg-muted/50 border border-border rounded-xl h-11 px-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all disabled:opacity-50"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Link Original (Afiliado)</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  required
                  disabled={isSubmitting}
                  type="url" 
                  placeholder="https://hotmart.com/..." 
                  className="w-full bg-muted/50 border border-border rounded-xl h-11 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all disabled:opacity-50"
                  value={formData.original_url}
                  onChange={(e) => setFormData({...formData, original_url: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1 flex items-center justify-between">
                URL da Imagem do Produto
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Opcional</span>
              </label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  disabled={isSubmitting}
                  type="url" 
                  placeholder="https://exemplo.com/foto.jpg" 
                  className="w-full bg-muted/50 border border-border rounded-xl h-11 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all disabled:opacity-50"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Código Curto</label>
                <input 
                  disabled={isSubmitting}
                  type="text" 
                  placeholder="Ex: iphone15-promo" 
                  className="w-full bg-muted/50 border border-border rounded-xl h-11 px-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all disabled:opacity-50"
                  value={formData.short_code}
                  onChange={(e) => setFormData({...formData, short_code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Categoria</label>
                <div className="relative">
                  <select 
                    disabled={isSubmitting || isLoadingCategories}
                    className="w-full bg-muted/50 border border-border rounded-xl h-11 px-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all appearance-none disabled:opacity-50"
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  >
                    <option value="">Sem Categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {isLoadingCategories && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  )}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Preço Original (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    disabled={isSubmitting}
                    type="number" 
                    step="0.01"
                    placeholder="0,00" 
                    className="w-full bg-muted/50 border border-border rounded-xl h-11 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all disabled:opacity-50"
                    value={formData.original_price}
                    onChange={(e) => setFormData({...formData, original_price: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1 text-primary">Preço de Oferta (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input 
                    disabled={isSubmitting}
                    type="number" 
                    step="0.01"
                    placeholder="0,00" 
                    className="w-full bg-primary/5 border border-primary/20 rounded-xl h-11 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all disabled:opacity-50"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Expira em</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    disabled={isSubmitting}
                    type="date" 
                    className="w-full bg-muted/50 border border-border rounded-xl h-11 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all disabled:opacity-50"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Redirecionamento</label>
                <div className="relative">
                  <ArrowRightLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select 
                    disabled={isSubmitting}
                    className="w-full bg-muted/50 border border-border rounded-xl h-11 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all appearance-none disabled:opacity-50"
                    value={formData.redirect_type}
                    onChange={(e) => setFormData({...formData, redirect_type: e.target.value})}
                  >
                    <option value="301">301 (Permanente)</option>
                    <option value="307">307 (Temporário)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-6 px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.is_nofollow}
                    onChange={(e) => setFormData({...formData, is_nofollow: e.target.checked})}
                  />
                  <div className="w-5 h-5 border-2 border-border rounded-md bg-muted/50 peer-checked:bg-primary peer-checked:border-primary transition-all"></div>
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Rel="nofollow"</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.is_sponsored}
                    onChange={(e) => setFormData({...formData, is_sponsored: e.target.checked})}
                  />
                  <div className="w-5 h-5 border-2 border-border rounded-md bg-muted/50 peer-checked:bg-primary peer-checked:border-primary transition-all"></div>
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Rel="sponsored"</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1 text-primary">Plataforma</label>
              <div className="relative">
                <select 
                  disabled={isSubmitting}
                  className="w-full bg-primary/5 border border-primary/20 rounded-xl h-11 px-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all appearance-none disabled:opacity-50"
                  value={formData.platform}
                  onChange={(e) => setFormData({...formData, platform: e.target.value})}
                >
                  <option value="">Outras Plataformas</option>
                  <option value="Shopee">Shopee</option>
                  <option value="Magalu">Magalu</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Hotmart">Hotmart</option>
                  <option value="Kiwify">Kiwify</option>
                  <option value="Braip">Braip</option>
                  <option value="Eduzz">Eduzz</option>
                  <option value="Mercado Livre">Mercado Livre</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1 flex items-center justify-between">
                Tags (Separadas por vírgula)
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Opcional</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  disabled={isSubmitting}
                  type="text" 
                  placeholder="Ex: promoção, apple, 2026" 
                  className="w-full bg-muted/50 border border-border rounded-xl h-11 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all disabled:opacity-50"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="flex-1 group" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                )}
                {isSubmitting ? 'Criando...' : 'Criar Link'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default AddLinkModal;

