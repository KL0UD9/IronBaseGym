-- Fix the posts_with_author view to use security_invoker
-- This ensures the view respects RLS policies of the underlying tables

-- Drop the existing view
DROP VIEW IF EXISTS public.posts_with_author;

-- Recreate with security_invoker=on so RLS is enforced
CREATE VIEW public.posts_with_author
WITH (security_invoker=on) AS
SELECT 
  p.id,
  p.content,
  p.image_url,
  p.created_at,
  pr.full_name AS author_name,
  pr.avatar_url AS author_avatar
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id;

-- Grant access to authenticated users only
GRANT SELECT ON public.posts_with_author TO authenticated;