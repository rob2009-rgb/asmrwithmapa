-- Create help_articles table
CREATE TABLE IF NOT EXISTS public.help_articles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    slug text UNIQUE NOT NULL,
    content text NOT NULL, -- Markdown content
    category text NOT NULL,
    is_published boolean DEFAULT false,
    tags text[] DEFAULT '{}',
    view_count int DEFAULT 0,
    helpful_count int DEFAULT 0,
    not_helpful_count int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access (Published only) or All for Admins?
-- Let's allow public read for published articles
CREATE POLICY "Public read access for published articles"
ON public.help_articles FOR SELECT TO public
USING (is_published = true);

-- 2. Admin Full Access
-- Assuming admins have a specific role or we check auth.uid() against a generic admin policy
-- For now, let's allow authenticated users with 'admin' role (if utilizing custom claims) or just keep it simple given previous patterns.
-- Based on previous files, we often use `auth.uid()` checks or `profiles` table lookups.
-- Let's use a policy that allows insert/update/delete for users who are admins in the profiles table.

CREATE POLICY "Admins can manage help articles"
ON public.help_articles FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Index for searching
CREATE INDEX IF NOT EXISTS help_articles_title_idx ON public.help_articles USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS help_articles_content_idx ON public.help_articles USING gin(to_tsvector('english', content));
