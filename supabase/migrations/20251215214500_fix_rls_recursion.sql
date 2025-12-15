-- Robust fix for Group Members Visibility (recursion issue)

-- 1. Create a secure function to get current user's group IDs
-- This function runs as the database owner (SECURITY DEFINER) to bypass RLS
CREATE OR REPLACE FUNCTION public.get_my_group_ids()
RETURNS TABLE (group_id uuid) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
STABLE
AS $$
  SELECT group_id 
  FROM public.group_members 
  WHERE user_id = auth.uid();
$$;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own membership" ON public.group_members;
DROP POLICY IF EXISTS "Group members can view other members" ON public.group_members;
DROP POLICY IF EXISTS "view_members" ON public.group_members;

-- 3. Create a clean, non-recursive policy using the function
CREATE POLICY "view_members_policy"
ON public.group_members
FOR SELECT
USING (
  -- I can see the row if...
  user_id = auth.uid() -- It is my own row
  OR
  group_id IN ( SELECT group_id FROM get_my_group_ids() ) -- OR it belongs to a group I am in
);
