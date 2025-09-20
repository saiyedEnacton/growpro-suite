-- This script creates a new edge function that can be used to delete a user.
-- The function takes a user_id as a parameter and deletes the user from the auth.users table.
-- This function should only be callable by authenticated users with the 'Management' or 'HR' role.

CREATE OR REPLACE FUNCTION delete_user(user_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT (
    auth.role() = 'authenticated' AND
    (get_user_role(auth.uid()) = 'Management' OR get_user_role(auth.uid()) = 'HR')
  ) THEN
    RETURN 'error: unauthorized';
  END IF;

  DELETE FROM auth.users WHERE id = user_id;
  RETURN 'success';
END;
$$;