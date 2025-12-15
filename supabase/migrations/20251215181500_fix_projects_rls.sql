-- Add created_by to projects
ALTER TABLE IF EXISTS "public"."projects" 
ADD COLUMN IF NOT EXISTS "created_by" uuid REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE IF EXISTS "public"."projects" ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can create projects" ON "public"."projects";
DROP POLICY IF EXISTS "Users can view projects" ON "public"."projects";

-- INSERT: Authenticated users can insert if they claim to be creator
CREATE POLICY "Users can create projects"
ON "public"."projects"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- SELECT: Authenticated users can view projects if they are members of the group
CREATE POLICY "Users can view projects"
ON "public"."projects"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = projects.group_id
    AND gm.user_id = auth.uid()
  )
);
