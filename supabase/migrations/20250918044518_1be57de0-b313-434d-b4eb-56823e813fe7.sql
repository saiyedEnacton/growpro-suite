-- Create assessment_templates table
CREATE TABLE public.assessment_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL DEFAULT 'quiz', -- 'quiz', 'project', 'practical'
  passing_score NUMERIC NOT NULL DEFAULT 70.00,
  time_limit_minutes INTEGER DEFAULT 60,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  instructions TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assessment_questions table
CREATE TABLE public.assessment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_template_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false', 'essay', 'practical'
  points NUMERIC NOT NULL DEFAULT 1.00,
  question_order INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create question_options table (for MCQ and True/False)
CREATE TABLE public.question_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  option_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add assessment_template_id to course_assessments
ALTER TABLE public.course_assessments 
ADD COLUMN assessment_template_id UUID;

-- Enable RLS on new tables
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

-- RLS policies for assessment_templates
CREATE POLICY "assessment_templates_select_policy" 
ON public.assessment_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "assessment_templates_manage_policy" 
ON public.assessment_templates 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['Team Lead'::text, 'HR'::text, 'Management'::text]));

-- RLS policies for assessment_questions
CREATE POLICY "assessment_questions_select_policy" 
ON public.assessment_questions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "assessment_questions_manage_policy" 
ON public.assessment_questions 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['Team Lead'::text, 'HR'::text, 'Management'::text]));

-- RLS policies for question_options
CREATE POLICY "question_options_select_policy" 
ON public.question_options 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "question_options_manage_policy" 
ON public.question_options 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['Team Lead'::text, 'HR'::text, 'Management'::text]));

-- Create foreign key constraints
ALTER TABLE public.assessment_templates 
ADD CONSTRAINT fk_assessment_templates_course 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.assessment_questions 
ADD CONSTRAINT fk_assessment_questions_template 
FOREIGN KEY (assessment_template_id) REFERENCES public.assessment_templates(id) ON DELETE CASCADE;

ALTER TABLE public.question_options 
ADD CONSTRAINT fk_question_options_question 
FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id) ON DELETE CASCADE;

-- Update triggers for timestamps
CREATE TRIGGER update_assessment_templates_updated_at
BEFORE UPDATE ON public.assessment_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_questions_updated_at
BEFORE UPDATE ON public.assessment_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();