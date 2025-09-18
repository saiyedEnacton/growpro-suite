-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-documents', 'employee-documents', false);

-- Create policies for employee documents storage
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

CREATE POLICY "HR and Management can upload employee documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'employee-documents' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role_id IN (
      SELECT id FROM public.roles 
      WHERE role_name IN ('HR', 'Management')
    )
  )
));

CREATE POLICY "Employees can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'employee-documents' AND (storage.foldername(name))[1]::uuid = auth.uid());

CREATE POLICY "HR and Management can update employee documents" 
ON storage.objects 
FOR UPDATE 
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

CREATE POLICY "HR and Management can delete employee documents" 
ON storage.objects 
FOR DELETE 
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
