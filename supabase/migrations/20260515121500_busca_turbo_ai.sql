-- Busca Turbo AI - Tables
-- 1. SEARCHES (History)
CREATE TABLE IF NOT EXISTS public.searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    platforms TEXT[], -- ['google', 'github', ...]
    filters JSONB, -- { "filetype": "pdf", "site": "github.com" }
    results_summary TEXT, -- AI generated summary
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SEARCH_FAVORITES
CREATE TABLE IF NOT EXISTS public.search_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    search_id UUID REFERENCES public.searches ON DELETE CASCADE,
    title TEXT,
    query TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. AI_SEARCH_HISTORY (Detailed interactions)
CREATE TABLE IF NOT EXISTS public.ai_search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    refined_query TEXT,
    ai_suggestions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SEARCH_LOGS (For performance and audit)
CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    query TEXT,
    execution_time_ms INTEGER,
    platform_hits JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can manage their searches" ON public.searches 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their favorite searches" ON public.search_favorites 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their AI history" ON public.ai_search_history 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own search logs" ON public.search_logs 
    FOR SELECT USING (auth.uid() = user_id);
