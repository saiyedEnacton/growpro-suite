-- Drop the old, incorrect policy for trainees viewing sessions.
DROP POLICY IF EXISTS "Trainees can view their own assigned sessions" ON public.training_sessions;

-- Create the new, correct policy.
-- This policy uses the `?` operator, which correctly checks if a string exists as a top-level element in a JSONB array.
CREATE POLICY "Trainees can view their own assigned sessions" 
ON public.training_sessions
FOR SELECT
USING ( attendees ? auth.uid()::text );
