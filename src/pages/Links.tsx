import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon,
  Download,
  Upload,
  Loader2,
  AlertCircle,
  Link2
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LinkCard from '../components/links/LinkCard';
import AddLinkModal from '../components/links/AddLinkModal';
import ImportOfferModal from '../components/links/ImportOfferModal';
import type { Link } from '../types';
import { linkService } from '../services/linkService';

const Links: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [linkToEdit, setLinkToEdit] = useState<Link | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await linkService.getAll();
      setLinks(data as Link[]);
    } catch (err: any) {
      console.error('Erro ao buscar links:', err);
      setError('Não foi possível carregar seus links. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const filteredLinks = links.filter(link => 
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.short_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddLink = async (formData: any) => {
    try {
      const tagsArray = typeof formData.tags === 'string' 
        ? formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '')
        : formData.tags;

      await linkService.create({
        ...formData,
        tags: tagsArray,
        clicks_count: 0,
        conversions_count: 0
      });
      
      setIsModalOpen(false);
      fetchLinks();
    } catch (err: any) {
      console.error('Erro ao criar link:', err);
      alert('Erro ao criar link: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleEditLink = (link: Link) => {
    setLinkToEdit(link);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setLinkToEdit(null);
    fetchLinks();
  };

  const handleImportOffer = async (formData: any) => {
    try {
      const tagsArray = typeof formData.tags === 'string' 
        ? formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '')
        : formData.tags;

      await linkService.create({
        ...formData,
        tags: tagsArray,
        clicks_count: 0,
        conversions_count: 0
      });
      
      setIsImportModalOpen(false);
      fetchLinks(); // Recarregar a lista
    } catch (err: any) {
      console.error('Erro ao importar oferta:', err);
      alert('Erro ao importar oferta: ' + (err.message || 'Erro desconhecido'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meus Links</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus links de afiliados e rastreie sua performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Link
          </Button>
        </div>
      </div>

      <AddLinkModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onAdd={handleAddLink}
        linkToEdit={linkToEdit}
      />

      <ImportOfferModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportOffer}
      />

      {/* Filters & Search Bar */}
      <Card noPadding className="p-2">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Pesquisar links, tags ou códigos..." 
              className="w-full bg-transparent border-none focus:ring-0 text-sm pl-10 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto px-2 pb-2 md:pb-0">
            <div className="h-8 w-px bg-border hidden md:block" />
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <div className="flex bg-muted rounded-lg p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}
              >
                <ListIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* States */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando seus links...</p>
        </div>
      ) : error ? (
        <div className="h-64 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-danger mb-4" />
          <h3 className="text-lg font-semibold">Ops! Algo deu errado</h3>
          <p className="text-muted-foreground max-w-sm mt-2">{error}</p>
          <Button variant="outline" className="mt-6" onClick={fetchLinks}>
            Tentar Novamente
          </Button>
        </div>
      ) : filteredLinks.length > 0 ? (
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'flex flex-col gap-4'}
        `}>
          {filteredLinks.map((link) => (
            <LinkCard key={link.id} link={link} onDelete={fetchLinks} onUpdate={fetchLinks} onEdit={handleEditLink} />
          ))}
        </div>
      ) : (
        <Card className="h-64 flex flex-col items-center justify-center border-dashed">
          <Link2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold">Nenhum link encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchTerm ? 'Tente mudar o termo da pesquisa.' : 'Comece criando seu primeiro link de afiliado!'}
          </p>
          <Button variant="primary" size="sm" className="mt-4" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Link
          </Button>
        </Card>
      )}
    </div>
  );
};

export default Links;

