-- Enable RLS for groups
ALTER TABLE IF EXISTS "public"."groups" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (clean slate for these tables)
DROP POLICY IF EXISTS "Users can create groups" ON "public"."groups";
DROP POLICY IF EXISTS "Users can view their own groups" ON "public"."groups";

-- Create INSERT policy for groups
-- Allows authenticated users to create a group if they claim to be the creator
CREATE POLICY "Users can create groups"
ON "public"."groups"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Create SELECT policy for groups
-- For now, allow users to see groups they created. 
-- (Note: In a real app, you'd also want them to see groups they are members of, 
-- but that requires a join or a more complex policy. Keeping it simple for 'create' flow verification)
CREATE POLICY "Users can view their own groups"
ON "public"."groups"
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);


-- Enable RLS for group_members
ALTER TABLE IF EXISTS "public"."group_members" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for group_members
DROP POLICY IF EXISTS "Users can insert membership for themselves" ON "public"."group_members";
DROP POLICY IF EXISTS "Users can view their own memberships" ON "public"."group_members";

-- Create INSERT policy for group_members
-- Necessary because the trigger on groups inserts into group_members
-- The trigger sets user_id = created_by (which is auth.uid())
CREATE POLICY "Users can insert membership for themselves"
ON "public"."group_members"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create SELECT policy for group_members
CREATE POLICY "Users can view their own memberships"
ON "public"."group_members"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
