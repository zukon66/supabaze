-- Allow users to delete groups they own
CREATE POLICY "Users can delete their own groups"
ON "public"."groups"
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);
