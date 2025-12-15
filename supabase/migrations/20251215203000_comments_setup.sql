-- Enable RLS
ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;

-- Add Foreign Key to profiles for easier joining (if not exists)
-- This allows: .select('*, profiles(username, full_name)')
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_user_id_fkey_profiles'
    ) THEN
        ALTER TABLE "public"."comments" 
        ADD CONSTRAINT "comments_user_id_fkey_profiles" 
        FOREIGN KEY ("user_id") 
        REFERENCES "public"."profiles"("id");
    END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create comments" ON "public"."comments";
DROP POLICY IF EXISTS "Users can view comments" ON "public"."comments";
DROP POLICY IF EXISTS "Users can delete their own comments" ON "public"."comments";

-- Policy: Users can create comments (must match their auth id)
CREATE POLICY "Users can create comments"
ON "public"."comments"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view comments (permissive for authenticated for now)
CREATE POLICY "Users can view comments"
ON "public"."comments"
FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON "public"."comments"
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
