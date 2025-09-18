-- Drop the old, restrictive policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a new, more permissive policy for updates
CREATE POLICY "Allow profile updates for self, HR, and Management" 
ON public.profiles
FOR UPDATE
USING (
  (auth.uid() = id) OR
  (
    (get_user_role(auth.uid()) = 'HR'::text) OR 
    (get_user_role(auth.uid()) = 'Management'::text)
  )
)
WITH CHECK (
  (auth.uid() = id) OR
  (
    (get_user_role(auth.uid()) = 'HR'::text) OR 
    (get_user_role(auth.uid()) = 'Management'::text)
  )
);
