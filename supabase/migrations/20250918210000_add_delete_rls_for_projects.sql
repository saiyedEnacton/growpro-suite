-- This policy allows users with the role of Management, HR, or Team Lead to delete projects.
CREATE POLICY "Admins can delete projects" 
ON public.projects
FOR DELETE
USING ( get_user_role(auth.uid()) IN ('Management', 'HR', 'Team Lead') );
