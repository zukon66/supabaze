-- Update tasks status check constraint
ALTER TABLE "public"."tasks" DROP CONSTRAINT IF EXISTS "tasks_status_check";
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_status_check" CHECK (status IN ('todo', 'in_progress', 'done'));

-- Enable RLS
ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can view tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can update tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can delete tasks" ON "public"."tasks";

-- Policy: Authenticated users can create tasks
CREATE POLICY "Users can create tasks"
ON "public"."tasks"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Policy: Authenticated users can view tasks (Simple permissive for now)
CREATE POLICY "Users can view tasks"
ON "public"."tasks"
FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can update tasks
CREATE POLICY "Users can update tasks"
ON "public"."tasks"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can delete tasks
CREATE POLICY "Users can delete tasks"
ON "public"."tasks"
FOR DELETE
TO authenticated
USING (true);
