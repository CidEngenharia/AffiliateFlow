export interface AutomationPayload {
  platform: 'whatsapp' | 'telegram';
  message: string;
  target?: string;
  scheduledAt?: string;
}

export const automationService = {
  async triggerBroadcast(payload: AutomationPayload) {
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    
    if (!webhookUrl || webhookUrl === 'URL_DO_SEU_WEBHOOK_N8N') {
      throw new Error('URL do Webhook n8n não configurada no .env');
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          source: 'AffiliateHub-Frontend',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao disparar automação no n8n');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na automação:', error);
      throw error;
    }
  }
};
