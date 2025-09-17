-- Drop tables that are no longer needed for simplified course structure
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.student_lesson_assessments CASCADE;
DROP TABLE IF EXISTS public.employee_lesson_progress CASCADE;
DROP TABLE IF EXISTS public.employee_course_progress CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;

-- Modify course_assessments table to support new completion rules
ALTER TABLE public.course_assessments 
ADD COLUMN IF NOT EXISTS is_mandatory boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS passing_score numeric DEFAULT 70.00,
ADD COLUMN IF NOT EXISTS completion_date timestamp with time zone;

-- Update course_assessments table structure for simplified flow
ALTER TABLE public.course_assessments 
DROP COLUMN IF EXISTS progress_id,
ALTER COLUMN assessment_type SET DEFAULT 'Module Assessment';

-- Add completion tracking directly to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS completion_rule text DEFAULT 'pass_all_assessments',
ADD COLUMN IF NOT EXISTS minimum_passing_percentage numeric DEFAULT 70.00;

-- Create a simple enrollment table to track who is taking which course
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  course_id uuid NOT NULL,
  enrolled_date timestamp with time zone DEFAULT now(),
  completion_date timestamp with time zone,
  status text DEFAULT 'enrolled',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(employee_id, course_id)
);

-- Enable RLS for course_enrollments
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies for course_enrollments
CREATE POLICY "course_enrollments_select_policy" 
ON public.course_enrollments 
FOR SELECT 
USING (
  (employee_id = auth.uid()) OR 
  (get_user_role(auth.uid()) = ANY (ARRAY['Team Lead'::text, 'HR'::text, 'Management'::text]))
);

CREATE POLICY "course_enrollments_insert_policy" 
ON public.course_enrollments 
FOR INSERT 
WITH CHECK (
  (employee_id = auth.uid()) OR 
  (get_user_role(auth.uid()) = ANY (ARRAY['Team Lead'::text, 'HR'::text, 'Management'::text]))
);

CREATE POLICY "course_enrollments_update_policy" 
ON public.course_enrollments 
FOR UPDATE 
USING (
  (employee_id = auth.uid()) OR 
  (get_user_role(auth.uid()) = ANY (ARRAY['Team Lead'::text, 'HR'::text, 'Management'::text]))
);

-- Add trigger for updated_at
CREATE TRIGGER update_course_enrollments_updated_at
  BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update course_modules to support content directly (since no lessons)
ALTER TABLE public.course_modules 
ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'text',
ADD COLUMN IF NOT EXISTS content_url text,
ADD COLUMN IF NOT EXISTS content_path text,
ADD COLUMN IF NOT EXISTS estimated_duration_minutes integer DEFAULT 60;

-- Create function to check course completion
CREATE OR REPLACE FUNCTION public.check_course_completion(p_employee_id uuid, p_course_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  completion_rule text;
  min_percentage numeric;
  total_assessments integer;
  passed_assessments integer;
  mandatory_assessments integer;
  passed_mandatory integer;
  course_completed boolean := false;
BEGIN
  -- Get course completion rules
  SELECT c.completion_rule, c.minimum_passing_percentage
  INTO completion_rule, min_percentage
  FROM courses c
  WHERE c.id = p_course_id;

  -- Count total and passed assessments
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN ca.percentage >= ca.passing_score THEN 1 END)
  INTO total_assessments, passed_assessments
  FROM course_assessments ca
  WHERE ca.course_id = p_course_id 
    AND ca.employee_id = p_employee_id;

  -- Count mandatory assessments if applicable  
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN ca.percentage >= ca.passing_score THEN 1 END)
  INTO mandatory_assessments, passed_mandatory
  FROM course_assessments ca
  WHERE ca.course_id = p_course_id 
    AND ca.employee_id = p_employee_id
    AND ca.is_mandatory = true;

  -- Check completion based on rule
  IF completion_rule = 'pass_all_assessments' THEN
    course_completed := (total_assessments > 0 AND passed_assessments = total_assessments);
  ELSIF completion_rule = 'pass_minimum_percentage' THEN
    course_completed := (total_assessments > 0 AND (passed_assessments::numeric / total_assessments::numeric * 100) >= min_percentage);
  ELSIF completion_rule = 'pass_mandatory_only' THEN
    course_completed := (mandatory_assessments > 0 AND passed_mandatory = mandatory_assessments);
  END IF;

  RETURN course_completed;
END;
$$;