-- DEBUGGING: Temporarily disable existing storage read policies and allow any authenticated user to download.

-- Drop existing select policies on storage.objects
DROP POLICY IF EXISTS "HR and Management can view all employee documents" ON storage.objects;
DROP POLICY IF EXISTS "Employees can view their own documents" ON storage.objects;

-- Create a temporary, open policy for debugging
CREATE POLICY "TEMP DEBUG - Allow all authenticated users to select" 
ON storage.objects 
FOR SELECT 
USING ( auth.role() = 'authenticated' );
