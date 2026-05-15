-- AffiliateFlow AI - Database Schema
-- Optimized for Supabase

-- 1. PROFILES (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    plan_type TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    subscription_status TEXT DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. LINKS
CREATE TABLE IF NOT EXISTS public.links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories ON DELETE SET NULL,
    title TEXT NOT NULL,
    original_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    qr_code_url TEXT,
    clicks_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'active', 'paused', 'completed'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    auto_repost_interval INTEGER DEFAULT 0, -- in minutes
    platforms TEXT[], -- ['whatsapp', 'telegram', 'facebook', 'twitter']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. LINK_CAMPAIGNS (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.link_campaigns (
    link_id UUID REFERENCES public.links ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns ON DELETE CASCADE,
    PRIMARY KEY (link_id, campaign_id)
);

-- 6. ANALYTICS
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    link_id UUID REFERENCES public.links ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    referer TEXT,
    country_code TEXT,
    device_type TEXT,
    is_conversion BOOLEAN DEFAULT FALSE,
    revenue_estimated DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CONQUESTS & GAMIFICATION
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    xp_reward INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage their categories" ON public.categories 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their links" ON public.links 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their campaigns" ON public.campaigns 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their analytics" ON public.analytics 
    FOR SELECT USING (auth.uid() = user_id);

-- 9. FUNCTIONS & TRIGGERS
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON public.links FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to increment link clicks safely
CREATE OR REPLACE FUNCTION public.increment_clicks(link_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.links
    SET clicks_count = clicks_count + 1
    WHERE id = link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
