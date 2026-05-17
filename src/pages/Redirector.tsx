import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) return 'mobile';
  return 'desktop';
};

const getLanguage = (): string => {
  return (navigator.language || 'pt').substring(0, 2).toLowerCase();
};

const getCountryCode = async (): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // Timeout rápido de 1.5s
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return data.country_code ? data.country_code.toUpperCase() : null;
    }
  } catch (err) {
    console.warn('Geolocalizacao nao disponivel:', err);
  }
  return null;
};

const determineRedirectUrl = (
  link: any,
  device: string,
  lang: string,
  country: string | null
): string => {
  // 1. Verificar Teste A/B
  if (Array.isArray(link.ab_test_rules) && link.ab_test_rules.length > 0) {
    const random = Math.random() * 100;
    let accumulatedWeight = 0;
    for (const rule of link.ab_test_rules) {
      accumulatedWeight += rule.weight;
      if (random <= accumulatedWeight) {
        return rule.url;
      }
    }
    if (link.ab_test_rules[0]?.url) {
      return link.ab_test_rules[0].url;
    }
  }

  // 2. Regras de Dispositivo
  if (link.device_rules && typeof link.device_rules === 'object') {
    const targetUrl = link.device_rules[device];
    if (targetUrl) return targetUrl;
  }

  // 3. Regras de Idioma
  if (link.language_rules && typeof link.language_rules === 'object') {
    const targetUrl = link.language_rules[lang];
    if (targetUrl) return targetUrl;
  }

  // 4. Regras de Pais (Geolocalizacao)
  if (country && link.country_rules && typeof link.country_rules === 'object') {
    const targetUrl = link.country_rules[country];
    if (targetUrl) return targetUrl;
  }

  // URL Padrao
  return link.original_url;
};

const Redirector: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          console.error('Link nao encontrado:', code);
          setErrorMsg('O link de redirecionamento nao foi localizado.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // 2. Avaliar expiracao
        if (link.expires_at) {
          const isExpired = new Date(link.expires_at).getTime() < Date.now();
          if (isExpired) {
            setErrorMsg('Este link expirou e nao esta mais disponivel.');
            setTimeout(() => navigate('/'), 3000);
            return;
          }
        }

        // 3. Avaliar se o link esta ativo
        if (link.is_active === false) {
          setErrorMsg('Este link de afiliado esta temporariamente inativo.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // 4. Detectar propriedades do cliente
        const deviceType = getDeviceType();
        const browserLang = getLanguage();
        const detectedCountry = await getCountryCode();

        // 5. Determinar URL final com base nas regras inteligentes
        const finalUrl = determineRedirectUrl(link, deviceType, browserLang, detectedCountry);

        // 6. Gravar estatisticas de forma asincrona
        const recordAnalytics = async () => {
          try {
            await supabase.rpc('increment_clicks', { link_id: link.id });

            await supabase.from('analytics').insert([{
              link_id: link.id,
              user_id: link.user_id,
              user_agent: navigator.userAgent,
              referer: document.referrer || 'direto',
              device_type: deviceType,
              country_code: detectedCountry || 'BR',
              is_conversion: false,
              revenue_estimated: 0
            }]);
          } catch (e) {
            console.error('Erro ao gravar analytics:', e);
          }
        };

        recordAnalytics();

        // 7. Redirecionar usando replace para nao sujar o historico
        window.location.replace(finalUrl);

      } catch (error) {
        console.error('Erro no redirecionador:', error);
        navigate('/');
      }
    };

    handleRedirect();
  }, [code, navigate]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
      <div className="text-center space-y-4 max-w-sm px-6">
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/20 rounded-full animate-pulse" />
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin absolute" />
        </div>
        {errorMsg ? (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-rose-500">Ops! Ocorreu um problema</h2>
            <p className="text-slate-400 text-xs leading-relaxed">{errorMsg}</p>
            <p className="text-slate-500 text-[10px] animate-pulse">Redirecionando para a pagina inicial...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-white animate-pulse">Conectando...</h2>
            <p className="text-slate-400 text-xs">Redirecionando voce de forma segura para o destino de compra.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Redirector;
