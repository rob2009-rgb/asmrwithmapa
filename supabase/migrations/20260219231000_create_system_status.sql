-- System Status table (single-row global banner)
CREATE TABLE IF NOT EXISTS public.system_status (
    id int PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- enforce single row
    is_active boolean DEFAULT false,
    severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    message text DEFAULT '',
    updated_at timestamptz DEFAULT now()
);

-- Seed the single row on creation
INSERT INTO public.system_status (id, is_active, severity, message)
VALUES (1, false, 'info', '')
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public can read system status"
ON public.system_status FOR SELECT TO public USING (true);

-- Admin write
CREATE POLICY "Admins can update system status"
ON public.system_status FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
