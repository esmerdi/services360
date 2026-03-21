-- =============================================
-- 008 — Normalize avatar URLs to object paths
-- =============================================

UPDATE public.users
SET avatar_url = regexp_replace(
  regexp_replace(
    avatar_url,
    '^.*?/storage/v1/(?:object/(?:public|sign|authenticated)|render/image/public)/avatars/',
    '',
    'i'
  ),
  '\?.*$',
  ''
)
WHERE avatar_url IS NOT NULL
  AND avatar_url ~* '/storage/v1/(?:object/(?:public|sign|authenticated)|render/image/public)/avatars/';