-- Fix security warnings by creating comprehensive RLS policies with unique names

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.role_name
  FROM public.profiles p
  JOIN public.roles r ON p.role_id = r.id
  WHERE p.id = user_id
$$;

-- Employee Documents policies
CREATE POLICY "employee_documents_select_policy" 
  ON public.employee_documents FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    get_user_role(auth.uid()) IN ('HR', 'Management') OR
    uploaded_by = auth.uid()
  );

CREATE POLICY "employee_documents_insert_policy" 
  ON public.employee_documents FOR INSERT 
  WITH CHECK (get_user_role(auth.uid()) IN ('HR', 'Management'));

CREATE POLICY "employee_documents_update_policy" 
  ON public.employee_documents FOR UPDATE 
  USING (get_user_role(auth.uid()) IN ('HR', 'Management'));

-- Course Modules policies
CREATE POLICY "course_modules_select_policy" 
  ON public.course_modules FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "course_modules_manage_policy" 
  ON public.course_modules FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

-- Lessons policies  
CREATE POLICY "lessons_select_policy" 
  ON public.lessons FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "lessons_manage_policy" 
  ON public.lessons FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

-- Questions policies
CREATE POLICY "questions_select_policy" 
  ON public.questions FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "questions_manage_policy" 
  ON public.questions FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

-- Employee lesson progress policies
CREATE POLICY "lesson_progress_select_policy" 
  ON public.employee_lesson_progress FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

CREATE POLICY "lesson_progress_insert_policy" 
  ON public.employee_lesson_progress FOR INSERT 
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "lesson_progress_update_policy" 
  ON public.employee_lesson_progress FOR UPDATE 
  USING (employee_id = auth.uid());

-- Student assessments policies
CREATE POLICY "student_assessments_select_policy" 
  ON public.student_lesson_assessments FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

CREATE POLICY "student_assessments_insert_policy" 
  ON public.student_lesson_assessments FOR INSERT 
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "student_assessments_update_policy" 
  ON public.student_lesson_assessments FOR UPDATE 
  USING (employee_id = auth.uid() OR get_user_role(auth.uid()) IN ('Team Lead', 'HR'));

-- Course assessments policies  
CREATE POLICY "course_assessments_select_policy" 
  ON public.course_assessments FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

CREATE POLICY "course_assessments_manage_policy" 
  ON public.course_assessments FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

-- Project milestones policies
CREATE POLICY "project_milestones_select_policy" 
  ON public.project_milestones FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_id AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
    ) OR 
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

CREATE POLICY "project_milestones_manage_policy" 
  ON public.project_milestones FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

-- Project evaluations policies
CREATE POLICY "project_evaluations_select_policy" 
  ON public.project_evaluations FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    evaluator_id = auth.uid() OR
    get_user_role(auth.uid()) IN ('HR', 'Management')
  );

CREATE POLICY "project_evaluations_insert_policy" 
  ON public.project_evaluations FOR INSERT 
  WITH CHECK (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

CREATE POLICY "project_evaluations_update_policy" 
  ON public.project_evaluations FOR UPDATE 
  USING (evaluator_id = auth.uid() OR get_user_role(auth.uid()) IN ('HR', 'Management'));

-- Training sessions policies
CREATE POLICY "training_sessions_select_policy" 
  ON public.training_sessions FOR SELECT 
  USING (
    trainer_id = auth.uid() OR
    created_by = auth.uid() OR
    (attendees ? auth.uid()::text) OR
    get_user_role(auth.uid()) IN ('HR', 'Management')
  );

CREATE POLICY "training_sessions_manage_policy" 
  ON public.training_sessions FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

-- Update profiles policies for better role-based access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "profiles_select_policy" 
  ON public.profiles FOR SELECT 
  USING (
    id = auth.uid() OR -- Users can always view their own profile
    get_user_role(auth.uid()) IN ('HR', 'Management') OR -- HR and Management see all
    (get_user_role(auth.uid()) = 'Team Lead' AND manager_id = auth.uid()) -- Team leads see their team
  );

CREATE POLICY "profiles_insert_policy" 
  ON public.profiles FOR INSERT 
  WITH CHECK (get_user_role(auth.uid()) IN ('HR', 'Management'));

-- Update projects policies
DROP POLICY IF EXISTS "Users can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects they created" ON public.projects;

CREATE POLICY "projects_select_policy" 
  ON public.projects FOR SELECT 
  USING (
    assigned_to = auth.uid() OR 
    assigned_by = auth.uid() OR
    get_user_role(auth.uid()) IN ('HR', 'Management')
  );

CREATE POLICY "projects_insert_policy" 
  ON public.projects FOR INSERT 
  WITH CHECK (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

CREATE POLICY "projects_update_policy" 
  ON public.projects FOR UPDATE 
  USING (assigned_by = auth.uid() OR get_user_role(auth.uid()) IN ('HR', 'Management'));

-- Update course progress policies
DROP POLICY IF EXISTS "Users can view own progress" ON public.employee_course_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.employee_course_progress;

CREATE POLICY "course_progress_select_policy" 
  ON public.employee_course_progress FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    assigned_by = auth.uid() OR
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

CREATE POLICY "course_progress_insert_policy" 
  ON public.employee_course_progress FOR INSERT 
  WITH CHECK (
    employee_id = auth.uid() OR 
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

CREATE POLICY "course_progress_update_policy" 
  ON public.employee_course_progress FOR UPDATE 
  USING (
    employee_id = auth.uid() OR 
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

-- Update courses policies for better access control
DROP POLICY IF EXISTS "Everyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can create courses" ON public.courses;

CREATE POLICY "courses_select_policy" 
  ON public.courses FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "courses_manage_policy" 
  ON public.courses FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));