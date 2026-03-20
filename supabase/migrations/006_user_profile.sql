-- =============================================
-- 006 — User profile fields: address + avatar storage
-- =============================================

-- Add address column to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;

-- =============================================
-- Storage bucket for user avatars
-- (Wrapped in DO block so it fails silently
--  when storage extension is not enabled locally)
-- =============================================
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'avatars',
    'avatars',
    true,
    2097152,   -- 2 MB
    ARRAY['image/jpeg','image/png','image/webp','image/gif']
  )
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN insufficient_privilege THEN NULL;
END $$;

-- =============================================
-- RLS policies for storage.objects
-- =============================================
DO $$
BEGIN
  -- Public read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Avatars are publicly accessible'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Avatars are publicly accessible"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars')
    $pol$;
  END IF;

  -- Owner insert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users can upload own avatar'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Users can upload own avatar"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
    $pol$;
  END IF;

  -- Owner update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users can update own avatar'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Users can update own avatar"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
    $pol$;
  END IF;

  -- Owner delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users can delete own avatar'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Users can delete own avatar"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
    $pol$;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN insufficient_privilege THEN NULL;
END $$;
