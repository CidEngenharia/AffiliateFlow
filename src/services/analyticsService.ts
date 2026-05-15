import { supabase } from '../lib/supabase';

export interface ClickData {
  date: string;
  clicks: number;
}

export interface LinkStats {
  id: string;
  title: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface OverviewStats {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalLinks: number;
  averageROI: number;
  clicksChange: number;
  conversionsChange: number;
  revenueChange: number;
  roiChange: number;
}

export const analyticsService = {
  async getClickStats(days: number = 7): Promise<ClickData[]> {
    const { data, error } = await supabase
      .from('analytics')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching click stats:', error);
      return [];
    }

    // Processar dados para o gráfico (agrupar por data)
    const stats: Record<string, number> = {};
    
    // Inicializar dias com zero
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      stats[dateStr] = 0;
    }

    data.forEach(item => {
      const dateStr = new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (stats[dateStr] !== undefined) {
        stats[dateStr]++;
      }
    });

    return Object.entries(stats)
      .map(([date, clicks]) => ({ date, clicks }))
      .reverse();
  },

  async getTopLinks(limit: number = 5): Promise<LinkStats[]> {
    const { data: links, error } = await supabase
      .from('links')
      .select('id, title, clicks_count, conversions_count')
      .order('clicks_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top links:', error);
      return [];
    }

    return links.map(link => ({
      id: link.id,
      title: link.title,
      clicks: link.clicks_count || 0,
      conversions: link.conversions_count || 0,
      revenue: (link.conversions_count || 0) * 45.0, // Supondo ticket médio de R$ 45
    }));
  },

  async getOverviewStats(): Promise<OverviewStats> {
    // Em produção, isso viria de uma query agregada ou view no Supabase
    // Para o MVP, vamos buscar os totais da tabela de links
    const { data: links, error } = await supabase
      .from('links')
      .select('clicks_count, conversions_count');

    if (error) {
      console.error('Error fetching overview stats:', error);
      return {
        totalClicks: 0, totalConversions: 0, totalRevenue: 0, totalLinks: 0, averageROI: 0,
        clicksChange: 0, conversionsChange: 0, revenueChange: 0, roiChange: 0
      };
    }

    const totalClicks = links.reduce((sum, link) => sum + (link.clicks_count || 0), 0);
    const totalConversions = links.reduce((sum, link) => sum + (link.conversions_count || 0), 0);
    const totalRevenue = totalConversions * 45.0; // Exemplo de ticket médio
    const averageROI = totalClicks > 0 ? (totalRevenue / (totalClicks * 0.5)) : 0; // Exemplo: custo de R$ 0.50 por clique

    return {
      totalClicks,
      totalConversions,
      totalRevenue,
      totalLinks: links.length,
      averageROI,
      clicksChange: 12.5, // Simulado para o dashboard
      conversionsChange: 8.2,
      revenueChange: -2.4,
      roiChange: 5.1
    };
  },

  async getRecentActivity(limit: number = 10) {
    const { data, error } = await supabase
      .from('analytics')
      .select(`
        id,
        created_at,
        country_code,
        device_type,
        links (title)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      timestamp: item.created_at,
      linkTitle: Array.isArray(item.links) ? item.links[0]?.title : (item.links as any)?.title || 'Link Removido',
      location: item.country_code || 'Brasil', // Fallback
      device: item.device_type || 'Desktop'
    }));
  }
};
