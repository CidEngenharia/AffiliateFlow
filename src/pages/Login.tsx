import React, { useState, useEffect } from 'react';
import { Zap, Mail, Lock, Chrome, ArrowRight, Loader2, UserPlus, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro Google:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
            }
          }
        });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
      }
    } catch (error: any) {
      alert('Erro na autenticação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Estética Premium de Fundo */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            whileHover={{ rotate: 10 }}
            className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 mx-auto mb-4 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Zap className="text-white w-8 h-8 fill-white" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLogin ? 'Acesse sua conta para gerenciar seus links.' : 'Comece a escalar suas vendas como afiliado hoje.'}
          </p>
        </div>

        <Card isGlass className="p-1 border-white/5 shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex p-1 bg-muted/50 rounded-2xl mb-6">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${isLogin ? 'bg-background text-primary shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LogIn className="w-4 h-4" /> Entrar
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${!isLogin ? 'bg-background text-primary shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <UserPlus className="w-4 h-4" /> Cadastrar
            </button>
          </div>

          <div className="px-4 pb-4 space-y-6">
            <Button 
              variant="outline" 
              className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 font-bold group"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <Chrome className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
              Continuar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-card px-4 text-muted-foreground font-bold">Ou use seu e-mail</span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleAuth}>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    required
                    type="email" 
                    placeholder="voce@exemplo.com" 
                    className="w-full bg-muted/30 border border-white/5 rounded-2xl h-12 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-hidden text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Senha</label>
                  {isLogin && <button type="button" className="text-[10px] font-bold text-primary hover:underline">ESQUECEU A SENHA?</button>}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    required
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full bg-muted/30 border border-white/5 rounded-2xl h-12 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-hidden text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button variant="primary" className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" type="submit" isLoading={loading}>
                {isLogin ? 'ENTRAR AGORA' : 'CRIAR MINHA CONTA'}
                {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>
            </form>

            <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-widest font-medium">
              Sempre preserve compatibilidade. © 2026 Affilehub
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;

