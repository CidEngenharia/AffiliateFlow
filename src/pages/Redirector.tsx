import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const Redirector: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      if (!code) {
        navigate('/');
        return;
      }

      try {
        // 1. Buscar o link original
        const { data: link, error: linkError } = await supabase
          .from('links')
          .select('*')
          .eq('short_code', code)
          .single();

        if (linkError || !link) {
          console.error('Link não encontrado:', code);
          navigate('/');
          return;
        }

        // 2. Registrar o analytics (não bloqueante para o usuário)
        const recordAnalytics = async () => {
          try {
            // Incrementar contador no link
            await supabase.rpc('increment_clicks', { link_id: link.id });

            // Inserir log detalhado
            await supabase.from('analytics').insert([{
              link_id: link.id,
              user_id: link.user_id,
              user_agent: navigator.userAgent,
              referer: document.referrer || 'direto',
              device_type: window.innerWidth < 768 ? 'mobile' : 'desktop'
            }]);
          } catch (e) {
            console.error('Erro ao gravar analytics:', e);
          }
        };

        recordAnalytics();

        // 3. Redirecionar usando replace para não sujar o histórico
        window.location.replace(link.original_url);

      } catch (error) {
        console.error('Erro no redirecionador:', error);
        navigate('/');
      }
    };

    handleRedirect();
  }, [code, navigate]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
          <Loader2 className="w-8 h-8 text-primary animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2 className="text-xl font-bold tracking-tight animate-pulse">Redirecionando...</h2>
        <p className="text-muted-foreground text-sm">Você está sendo levado ao destino final.</p>
      </div>
    </div>
  );
};

export default Redirector;
