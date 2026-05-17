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

export interface DeviceStats {
  name: string;
  value: number;
}

export interface CountryStats {
  country: string;
  clicks: number;
  percentage: number;
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

    const stats: Record<string, number> = {};
    
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
      revenue: (link.conversions_count || 0) * 45.0,
    }));
  },

  async getOverviewStats(days: number = 7): Promise<OverviewStats> {
    const { data: links, error: linksError } = await supabase
      .from('links')
      .select('id, clicks_count, conversions_count');

    if (linksError) {
      console.error('Error fetching overview stats links:', linksError);
      return {
        totalClicks: 0, totalConversions: 0, totalRevenue: 0, totalLinks: 0, averageROI: 0,
        clicksChange: 0, conversionsChange: 0, revenueChange: 0, roiChange: 0
      };
    }

    const dateLimit = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data: periodAnalytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('is_conversion, revenue_estimated, created_at')
      .gte('created_at', dateLimit);

    if (analyticsError) {
      console.error('Error fetching analytics overview:', analyticsError);
    }

    const currentClicks = periodAnalytics ? periodAnalytics.length : 0;
    const currentConversions = periodAnalytics ? periodAnalytics.filter(a => a.is_conversion).length : 0;
    const currentRevenue = periodAnalytics ? periodAnalytics.reduce((sum, a) => sum + (a.revenue_estimated || 0), 0) : 0;

    const finalRevenue = currentRevenue > 0 ? currentRevenue : currentConversions * 45.0;
    
    const totalCost = currentClicks * 0.35;
    const averageROI = totalCost > 0 ? (finalRevenue - totalCost) / totalCost : 0;

    const prevDateLimit = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString();
    const { data: prevAnalytics } = await supabase
      .from('analytics')
      .select('is_conversion, revenue_estimated')
      .gte('created_at', prevDateLimit)
      .lt('created_at', dateLimit);

    const prevClicks = prevAnalytics ? prevAnalytics.length : 0;
    const prevConversions = prevAnalytics ? prevAnalytics.filter(a => a.is_conversion).length : 0;
    const prevRevenue = prevAnalytics ? prevAnalytics.reduce((sum, a) => sum + (a.revenue_estimated || 0), 0) : 0;
    const finalPrevRevenue = prevRevenue > 0 ? prevRevenue : prevConversions * 45.0;
    
    const prevCost = prevClicks * 0.35;
    const prevROI = prevCost > 0 ? (finalPrevRevenue - prevCost) / prevCost : 0;

    const clicksChange = prevClicks > 0 ? parseFloat(((currentClicks - prevClicks) / prevClicks * 100).toFixed(1)) : 0;
    const conversionsChange = prevConversions > 0 ? parseFloat(((currentConversions - prevConversions) / prevConversions * 100).toFixed(1)) : 0;
    const revenueChange = finalPrevRevenue > 0 ? parseFloat(((finalRevenue - finalPrevRevenue) / finalPrevRevenue * 100).toFixed(1)) : 0;
    const roiChange = prevROI > 0 ? parseFloat(((averageROI - prevROI) / prevROI * 100).toFixed(1)) : 0;

    return {
      totalClicks: currentClicks,
      totalConversions: currentConversions,
      totalRevenue: finalRevenue,
      totalLinks: links.length,
      averageROI: averageROI > 0 ? averageROI : 0,
      clicksChange,
      conversionsChange,
      revenueChange,
      roiChange
    };
  },

  async getDeviceStats(days: number = 7): Promise<DeviceStats[]> {
    const { data, error } = await supabase
      .from('analytics')
      .select('device_type')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching device stats:', error);
      return [];
    }

    const counts: Record<string, number> = {
      'desktop': 0,
      'mobile': 0,
      'tablet': 0
    };

    data.forEach(item => {
      const type = item.device_type || 'desktop';
      if (counts[type] !== undefined) {
        counts[type]++;
      } else {
        counts[type] = (counts[type] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));
  },

  async getCountryStats(days: number = 7): Promise<CountryStats[]> {
    const { data, error } = await supabase
      .from('analytics')
      .select('country_code')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching country stats:', error);
      return [];
    }

    const counts: Record<string, number> = {};
    let total = 0;

    data.forEach(item => {
      const country = item.country_code || 'BR';
      counts[country] = (counts[country] || 0) + 1;
      total++;
    });

    const countryNameMap: Record<string, string> = {
      'BR': 'Brasil',
      'US': 'Estados Unidos',
      'PT': 'Portugal',
      'ES': 'Espanha',
      'FR': 'França',
      'DE': 'Alemanha',
      'GB': 'Reino Unido',
      'IT': 'Itália',
      'AR': 'Argentina',
      'CL': 'Chile',
      'UY': 'Uruguai',
      'MX': 'México'
    };

    return Object.entries(counts)
      .map(([code, clicks]) => {
        const name = countryNameMap[code] || code;
        return {
          country: name,
          clicks,
          percentage: total > 0 ? parseFloat(((clicks / total) * 100).toFixed(1)) : 0
        };
      })
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);
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
      location: item.country_code || 'BR',
      device: item.device_type || 'desktop'
    }));
  }
};
