import React, { useState } from 'react';
import { 
  MoreVertical, 
  ExternalLink, 
  Copy, 
  QrCode, 
  BarChart2, 
  Calendar,
  Tag,
  Trash2,
  Edit,
  Check,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import type { Link } from '../../types';
import { linkService } from '../../services/linkService';

interface LinkCardProps {
  link: Link;
  onEdit?: (link: Link) => void;
  onDelete?: () => void;
  onUpdate?: () => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onDelete, onUpdate, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const copyToClipboard = () => {
    const shortUrl = `${window.location.origin}/go/${link.short_code}`;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrCode = async () => {
    const shortUrl = `${window.location.origin}/go/${link.short_code}`;
    try {
      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(shortUrl)}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${link.short_code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar QR Code:', error);
      alert('Erro ao baixar QR Code. Você pode salvar a imagem clicando com o botão direito nela.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este link? Esta ação não pode ser desfeita.')) return;
    
    setIsDeleting(true);
    try {
      await linkService.delete(link.id);
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Erro ao deletar link:', error);
      alert('Erro ao deletar link. Tente novamente.');
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  return (
    <Card className="group overflow-visible relative">
      {isDeleting && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
              {link.thumbnail_url ? (
                <img src={link.thumbnail_url} alt={link.title} className="w-full h-full object-cover" />
              ) : (
                <LinkIcon className="text-primary w-6 h-6" />
              )}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-lg group-hover:text-primary transition-colors truncate">{link.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{link.original_url}</p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-accent transition-colors shrink-0"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 w-48 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <button 
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent transition-colors text-left"
                    onClick={() => { if (onEdit) { onEdit(link); setShowMenu(false); } }}
                  >
                    <Edit className="w-4 h-4" />
                    Editar Link
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-danger/10 text-danger transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart2 className="w-4 h-4" />
              <span>{link.clicks_count || 0} cliques</span>
            </div>
            <div className="flex items-center gap-2 text-success font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>{link.conversions_count || 0} conv.</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {link.tags && link.tags.length > 0 ? (
              link.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-accent text-[10px] font-bold rounded-md uppercase tracking-wider">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-muted-foreground italic">Sem tags</span>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button 
              variant={copied ? "success" : "ghost"} 
              size="icon" 
              onClick={copyToClipboard} 
              title="Copiar Link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              title="Ver QR Code"
              onClick={() => setShowQrModal(true)}
            >
              <QrCode className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => window.open(`${window.location.origin}/go/${link.short_code}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm z-10 bg-slate-950 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-6"
            >
              <div className="w-full flex items-center justify-between border-b border-white/5 pb-3">
                <span className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-500" />
                  QR Code do Link
                </span>
                <button 
                  onClick={() => setShowQrModal(false)} 
                  className="p-1 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="w-56 h-56 bg-white p-3 rounded-xl shadow-inner flex items-center justify-center relative overflow-hidden group">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/go/${link.short_code}`)}`} 
                  alt={`QR Code para ${link.title}`}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="w-full space-y-1.5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Link Curto</span>
                <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 font-mono break-all relative group flex items-center justify-between gap-2">
                  <span className="truncate select-all">{`${window.location.origin}/go/${link.short_code}`}</span>
                  <button
                    onClick={copyToClipboard}
                    className="p-1 hover:bg-white/10 rounded-md transition-all shrink-0 text-slate-400 hover:text-white"
                    title="Copiar Link"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowQrModal(false)}
                  className="rounded-lg text-xs border-white/10"
                >
                  Fechar
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={downloadQrCode}
                  className="rounded-lg text-xs font-bold"
                >
                  Baixar PNG
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// Internal icons needed
const LinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const TrendingUp = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);

export default LinkCard;

