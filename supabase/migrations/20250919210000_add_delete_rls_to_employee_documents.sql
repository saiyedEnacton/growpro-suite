-- Add RLS policy to allow HR and Management to delete employee documents

CREATE POLICY "HR and Management can delete documents"
ON public.employee_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role_id IN (
      SELECT id FROM public.roles
      WHERE role_name IN ('HR', 'Management')
    )
  )
);
