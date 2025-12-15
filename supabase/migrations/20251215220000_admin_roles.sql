-- Ensure role column exists
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'member';

-- Drop the trigger that automatically adds the owner, so we can handle it in application code (actions.ts) with custom roles
DROP TRIGGER IF EXISTS on_group_created ON public.groups;
DROP FUNCTION IF EXISTS public.handle_new_group();

-- Also drop the one named handle_group_owner_membership if it exists from previous migrations
DROP TRIGGER IF EXISTS on_group_created_add_owner ON public.groups;
DROP FUNCTION IF EXISTS public.handle_group_owner_membership();
