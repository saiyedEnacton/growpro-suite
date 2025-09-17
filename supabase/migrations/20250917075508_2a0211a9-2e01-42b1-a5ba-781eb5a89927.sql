-- Fix all SECURITY DEFINER functions to have proper search_path settings
-- Update the existing get_user_role function to have proper search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.role_name
  FROM public.profiles p
  JOIN public.roles r ON p.role_id = r.id
  WHERE p.id = user_id
$$;

-- Update the update_updated_at_column function to have proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;