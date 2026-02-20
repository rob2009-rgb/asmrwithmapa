-- Add CSAT columns to tickets table
ALTER TABLE public.tickets
    ADD COLUMN IF NOT EXISTS csat_score int CHECK (csat_score BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS csat_comment text;
