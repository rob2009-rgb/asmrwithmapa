-- Function to increment downloads atomically
CREATE OR REPLACE FUNCTION public.increment_downloads(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.community_presets
  SET downloads_count = downloads_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
