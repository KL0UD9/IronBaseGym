-- Create a view for posts that exposes author display names instead of raw user_ids
-- This protects user privacy while still allowing the community feed to function

CREATE OR REPLACE VIEW public.posts_with_author
WITH (security_invoker=on) AS
SELECT 
  p.id,
  p.content,
  p.image_url,
  p.created_at,
  pr.full_name as author_name,
  pr.avatar_url as author_avatar
FROM public.posts p
LEFT JOIN public.profiles pr ON p.user_id = pr.id;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.posts_with_author TO authenticated;
GRANT SELECT ON public.posts_with_author TO anon;

-- Update the posts SELECT policy to only allow authenticated users
-- This prevents anonymous enumeration of user_ids
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;

CREATE POLICY "Authenticated users can view posts"
ON public.posts
FOR SELECT
TO authenticated
USING (true);

-- Members can still see their own posts for editing/deleting
-- The existing policies for INSERT, UPDATE, DELETE remain unchanged