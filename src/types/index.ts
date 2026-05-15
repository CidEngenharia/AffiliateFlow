export type Profile = {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  last_activity_at: string;
  plan_type: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'trialing' | 'past_due';
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
};

export type Link = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  original_url: string;
  short_code: string;
  thumbnail_url: string | null;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  tags: string[];
  qr_code_url: string | null;
  platform: string | null;
  original_price: number | null;
  sale_price: number | null;
  is_featured: boolean;
  is_nofollow: boolean;
  is_sponsored: boolean;
  rating: number;
  redirect_type: '301' | '307';
  clicks_count: number;
  conversions_count: number;
  created_at: string;
  updated_at: string;
};

export type Campaign = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  scheduled_at: string | null;
  auto_repost_interval: number;
  platforms: string[];
  created_at: string;
};

export type Analytics = {
  id: string;
  link_id: string;
  user_id: string;
  campaign_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referer: string | null;
  country_code: string | null;
  device_type: string | null;
  is_conversion: boolean;
  revenue_estimated: number;
  created_at: string;
};


export type Search = {
  id: string;
  user_id: string;
  query: string;
  refined_query: string | null;
  platforms: string[];
  ai_summary: string | null;
  is_favorite: boolean;
  created_at: string;
};
