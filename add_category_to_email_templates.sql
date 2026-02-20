-- Migration: Add category column and classify templates

-- 1. Add 'category' column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'category') THEN 
        ALTER TABLE public.email_templates ADD COLUMN category text DEFAULT 'standard'; 
    END IF; 
END $$;

-- 2. Classify Automation Templates
UPDATE public.email_templates 
SET category = 'automation' 
WHERE name IN (
    'Welcome Email', 
    'Streak Achievement', 
    'Upgrade Confirmation', 
    'Cancellation Feedback', 
    'Inactivity Reminder'
);

-- 3. Classify Standard Templates (everything else defaults to 'standard', but force update just in case)
UPDATE public.email_templates 
SET category = 'standard' 
WHERE category IS NULL;

-- 4. Create index for performance (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates (category);

-- 5. Force specific standard ones if needed
UPDATE public.email_templates 
SET category = 'standard' 
WHERE name IN (
    'Newsletter', 
    'Feature Announcement'
);
