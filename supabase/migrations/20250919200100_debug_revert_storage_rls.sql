-- DEBUGGING: Restore original storage read policies.

-- Drop the temporary debugging policy
DROP POLICY IF EXISTS "TEMP DEBUG - Allow all authenticated users to select" ON storage.objects;

-- Re-create the original, correct policies
CREATE POLICY "HR and Management can view all employee documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'employee-documents' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role_id IN (
      SELECT id FROM public.roles 
      WHERE role_name IN ('HR', 'Management')
    )
  )
));

CREATE POLICY "Employees can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'employee-documents' AND (storage.foldername(name))[1]::uuid = auth.uid());
