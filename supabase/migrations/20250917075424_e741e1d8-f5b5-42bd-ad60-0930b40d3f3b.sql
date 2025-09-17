-- Fix security warning: Update function to have immutable search_path
CREATE OR REPLACE FUNCTION public.check_course_completion(p_employee_id uuid, p_course_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
  FROM public.courses c
  WHERE c.id = p_course_id;

  -- Count total and passed assessments
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN ca.percentage >= ca.passing_score THEN 1 END)
  INTO total_assessments, passed_assessments
  FROM public.course_assessments ca
  WHERE ca.course_id = p_course_id 
    AND ca.employee_id = p_employee_id;

  -- Count mandatory assessments if applicable  
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN ca.percentage >= ca.passing_score THEN 1 END)
  INTO mandatory_assessments, passed_mandatory
  FROM public.course_assessments ca
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