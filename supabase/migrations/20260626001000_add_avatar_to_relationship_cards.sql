-- Add avatar_url column to relationship_cards
ALTER TABLE public.relationship_cards
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create a private bucket for avatars (only the owner can read/write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('relationship-avatars', 'relationship-avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: users can upload to their own folder (user_id prefix)
CREATE POLICY "Users can upload avatars to their own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'relationship-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: users can update their own avatars
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'relationship-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: users can delete their own avatars
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'relationship-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: users can read their own avatars (signed URLs will be used in app)
CREATE POLICY "Users can read their own avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'relationship-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
