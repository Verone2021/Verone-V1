-- Add kbis_url column to organisations table
-- Stores the URL to the uploaded Kbis document (PDF or image) in Supabase Storage
ALTER TABLE public.organisations
ADD COLUMN IF NOT EXISTS kbis_url TEXT NULL;

COMMENT ON COLUMN public.organisations.kbis_url IS 'URL of the uploaded Kbis document (PDF/image) stored in Supabase Storage';
