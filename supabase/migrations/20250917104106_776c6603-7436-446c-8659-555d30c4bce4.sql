-- Create function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  trainee_role_id uuid;
BEGIN
  -- Get the trainee role ID
  SELECT id INTO trainee_role_id 
  FROM public.roles 
  WHERE role_name = 'Trainee';

  -- Insert new profile with trainee role
  INSERT INTO public.profiles (
    id,
    role_id,
    first_name,
    last_name,
    current_status
  ) VALUES (
    NEW.id,
    trainee_role_id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'Pre-Joining'
  );

  RETURN NEW;
END;
$$;

-- Create trigger to fire on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();