-- =============================================
-- 007 — Increase avatar bucket limit to 3 MB
-- =============================================

DO $$
BEGIN
  UPDATE storage.buckets
  SET file_size_limit = 3145728
  WHERE id = 'avatars';
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN insufficient_privilege THEN NULL;
END $$;