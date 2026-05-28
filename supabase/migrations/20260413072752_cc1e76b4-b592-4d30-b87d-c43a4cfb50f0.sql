
-- Add recording_url to call_logs
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS recording_url text;

-- Create storage bucket for call recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('call-recordings', 'call-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for call recordings
CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'call-recordings');

CREATE POLICY "Anyone can view recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'call-recordings');

CREATE POLICY "Users can delete own recordings"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'call-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
