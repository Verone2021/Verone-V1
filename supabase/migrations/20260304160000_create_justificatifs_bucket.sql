-- Create private bucket for storing justificatifs (receipts, invoices)
-- Double storage: Qonto + Supabase for 10-year legal retention
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'justificatifs',
  'justificatifs',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for justificatifs bucket
-- Staff back-office can upload, read, delete
CREATE POLICY "staff_upload_justificatifs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'justificatifs'
    AND is_backoffice_user()
  );

CREATE POLICY "staff_read_justificatifs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'justificatifs'
    AND is_backoffice_user()
  );

CREATE POLICY "staff_delete_justificatifs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'justificatifs'
    AND is_back_office_admin()
  );
