-- Add category column to email_templates
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'standard';

-- Update existing templates to be 'standard' by default, or specific ones if known
UPDATE public.email_templates SET category = 'standard' WHERE category IS NULL;

-- Optional: Add check constraint if we want to restrict values, but flexible is better for now
-- ALTER TABLE public.email_templates ADD CONSTRAINT check_category CHECK (category IN ('standard', 'automation'));
