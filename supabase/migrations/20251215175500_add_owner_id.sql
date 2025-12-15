-- Add owner_id column to groups table
ALTER TABLE IF EXISTS "public"."groups" 
ADD COLUMN IF NOT EXISTS "owner_id" uuid REFERENCES auth.users(id);

-- Backfill owner_id from created_by (if exists) or current user (triggers will handle new rows)
UPDATE "public"."groups" 
SET "owner_id" = "created_by" 
WHERE "owner_id" IS NULL AND "created_by" IS NOT NULL;

-- Make owner_id NOT NULL after backfill
ALTER TABLE "public"."groups" ALTER COLUMN "owner_id" SET NOT NULL;

-- Enable RLS (ensure it's on)
ALTER TABLE IF EXISTS "public"."groups" ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid confusion
DROP POLICY IF EXISTS "Users can create groups" ON "public"."groups";
DROP POLICY IF EXISTS "Users can view their own groups" ON "public"."groups";

-- Create INSERT policy using owner_id
CREATE POLICY "Users can create groups"
ON "public"."groups"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Create SELECT policy using owner_id
CREATE POLICY "Users can view their own groups"
ON "public"."groups"
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);


-- Update Trigger Function to use owner_id for initial membership
CREATE OR REPLACE FUNCTION public.handle_group_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use new.owner_id instead of new.created_by
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (new.id, new.owner_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;
