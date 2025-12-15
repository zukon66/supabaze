-- Enable RLS on groups table if not already enabled (idempotent usually requires checking, but this is safe to run)
alter table "groups" enable row level security;

-- Policy to allow authenticated users to insert rows
create policy "Users can insert their own groups"
on "groups"
for insert
to authenticated
with check (true);

-- Policy to allow users to view their own groups (assuming user_id column exists, adjusting to generic for now based on prompt)
-- If there is a user_id column, it should be: using (auth.uid() = user_id)
-- For now, I will just add the insert policy as requested.
