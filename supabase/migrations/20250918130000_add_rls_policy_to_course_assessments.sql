CREATE POLICY "course_assessments_insert_policy" 
ON public.course_assessments 
FOR INSERT 
WITH CHECK (employee_id = auth.uid());