-- Defines RLS policies for the training_sessions table.

-- 1. Allow admin roles (Management, HR, Team Lead) to perform all actions.
CREATE POLICY "Admins can manage training sessions" 
ON public.training_sessions
FOR ALL
USING ( get_user_role(auth.uid()) IN ('Management', 'HR', 'Team Lead') )
WITH CHECK ( get_user_role(auth.uid()) IN ('Management', 'HR', 'Team Lead') );

-- 2. Allow assigned trainees to see the sessions they are a part of.
-- The existing admin policy already covers SELECT for admins, so this just adds trainees.
CREATE POLICY "Trainees can view their own assigned sessions" 
ON public.training_sessions
FOR SELECT
USING ( attendees @> to_jsonb(auth.uid()::text) );
