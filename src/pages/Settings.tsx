import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  AtSign, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Settings: React.FC = () => {
  const { profile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setMessage(null);

    try {
      // Validar username (apenas letras, números e underscores)
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (formData.username && !usernameRegex.test(formData.username)) {
        throw new Error('O nome de usuário deve conter apenas letras, números e underscores.');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username.toLowerCase(),
          avatar_url: formData.avatar_url,
          updated_at: new Error().toISOString() // Simples hack para o updated_at se não houver trigger
        })
        .eq('id', user.id);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este nome de usuário já está em uso. Tente outro.');
        }
        throw error;
      }

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      
      // Recarregar a página após um curto delay para atualizar o contexto
      setTimeout(() => window.location.reload(), 1500);
      
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setMessage({ type: 'error', text: err.message || 'Ocorreu um erro ao atualizar o perfil.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu perfil e as configurações da sua vitrine.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar de Configurações */}
        <div className="space-y-4">
          <Card className="p-2 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium">
              <User size={18} />
              Perfil
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors text-left">
              <LayoutGrid size={18} />
              Vitrine
            </button>
          </Card>
        </div>

        {/* Formulário Principal */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit}>
            <Card title="Informações do Perfil">
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6 pb-6 border-b border-border">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold overflow-hidden border-2 border-primary/20">
                      {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        formData.full_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <button 
                      type="button"
                      className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-white rounded-full border-2 border-background shadow-lg hover:scale-110 transition-transform"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold">Sua Foto</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Isso será exibido na sua vitrine pública.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1">E-mail (Não alterável)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        disabled
                        type="email" 
                        className="w-full bg-muted/30 border border-border rounded-xl h-11 pl-10 pr-4 outline-hidden opacity-70 cursor-not-allowed"
                        value={user?.email || ''}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        required
                        type="text" 
                        placeholder="Seu nome" 
                        className="w-full bg-muted/50 border border-border rounded-xl h-11 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1 text-primary">Nome de Usuário (URL da Vitrine)</label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <input 
                        required
                        type="text" 
                        placeholder="Ex: joaosilva" 
                        className="w-full bg-primary/5 border border-primary/20 rounded-xl h-11 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all font-medium"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground ml-1">
                      Sua vitrine será: {window.location.origin}/v/{formData.username || '...'}
                    </p>
                  </div>
                </div>

                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-center gap-3 ${
                      message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
                    }`}
                  >
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-medium">{message.text}</span>
                  </motion.div>
                )}

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-full md:w-auto px-8"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
