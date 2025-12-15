-- Fix RLS policy for group_members to allow viewing other members
-- Drop existing policies if they conflict or are too restrictive
DROP POLICY IF EXISTS "Users can view their own membership" ON public.group_members;
DROP POLICY IF EXISTS "Group members can view other members" ON public.group_members;

-- Create a new policy that allows a user to view ALL rows in group_members 
-- IF they are a member of that group.
CREATE POLICY "Group members can view other members"
ON public.group_members
FOR SELECT
USING (
  group_id IN (
    SELECT group_id 
    FROM public.group_members 
    WHERE user_id = auth.uid()
  )
);
