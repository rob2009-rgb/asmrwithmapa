-- Add attachments column to ticket_messages if it doesn't exist
ALTER TABLE public.ticket_messages 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Standard Storage Policies for support-attachments

-- 1. Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload support attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'support-attachments');

-- 2. Allow public read access (so admins and users can see images easily)
-- Alternatively, we could restrict this to only the ticket owner and admins, but public read with UUIDs is often sufficient for non-sensitive support images in MVP.
CREATE POLICY "Public read access for support attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'support-attachments');

-- 3. Allow users to delete their own uploads (optional, but good practice)
CREATE POLICY "Users can delete their own support attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'support-attachments' AND owner = auth.uid());
