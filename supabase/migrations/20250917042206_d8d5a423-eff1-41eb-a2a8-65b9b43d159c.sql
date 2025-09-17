-- Fix security warnings by creating comprehensive RLS policies

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
DROP POLICY IF EXISTS "Documents access" ON public.employee_documents;
CREATE POLICY "Users can view own documents or if they are HR/Management" 
  ON public.employee_documents FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    get_user_role(auth.uid()) IN ('HR', 'Management') OR
    uploaded_by = auth.uid()
  );

CREATE POLICY "HR and Management can insert documents" 
  ON public.employee_documents FOR INSERT 
  WITH CHECK (get_user_role(auth.uid()) IN ('HR', 'Management'));

CREATE POLICY "HR and Management can update documents" 
  ON public.employee_documents FOR UPDATE 
  USING (get_user_role(auth.uid()) IN ('HR', 'Management'));

-- Course Modules policies
CREATE POLICY "Everyone can view course modules" 
  ON public.course_modules FOR SELECT USING (true);

CREATE POLICY "Team Leads and HR can manage modules" 
  ON public.course_modules FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

-- Lessons policies  
CREATE POLICY "Everyone can view lessons" 
  ON public.lessons FOR SELECT USING (true);

CREATE POLICY "Team Leads and HR can manage lessons" 
  ON public.lessons FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

-- Questions policies
CREATE POLICY "Everyone can view questions" 
  ON public.questions FOR SELECT USING (true);

CREATE POLICY "Team Leads and HR can manage questions" 
  ON public.questions FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

-- Employee lesson progress policies
CREATE POLICY "Users can view own lesson progress or supervisors can view" 
  ON public.employee_lesson_progress FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

CREATE POLICY "Users can update own lesson progress" 
  ON public.employee_lesson_progress FOR INSERT 
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own lesson progress" 
  ON public.employee_lesson_progress FOR UPDATE 
  USING (employee_id = auth.uid());

-- Student assessments policies
CREATE POLICY "Users can view own assessments or supervisors can view" 
  ON public.student_lesson_assessments FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

CREATE POLICY "Users can submit own assessments" 
  ON public.student_lesson_assessments FOR INSERT 
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own assessments" 
  ON public.student_lesson_assessments FOR UPDATE 
  USING (employee_id = auth.uid() OR get_user_role(auth.uid()) IN ('Team Lead', 'HR'));

-- Course assessments policies  
CREATE POLICY "Users can view own course assessments or supervisors can view" 
  ON public.course_assessments FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

CREATE POLICY "Team Leads can manage course assessments" 
  ON public.course_assessments FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

-- Project milestones policies
CREATE POLICY "Users can view project milestones for assigned projects" 
  ON public.project_milestones FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_id AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
    ) OR 
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

CREATE POLICY "Team Leads can manage milestones" 
  ON public.project_milestones FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

-- Project evaluations policies
CREATE POLICY "Users can view evaluations for their projects" 
  ON public.project_evaluations FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    evaluator_id = auth.uid() OR
    get_user_role(auth.uid()) IN ('HR', 'Management')
  );

CREATE POLICY "Team Leads can create evaluations" 
  ON public.project_evaluations FOR INSERT 
  WITH CHECK (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

CREATE POLICY "Evaluators can update their evaluations" 
  ON public.project_evaluations FOR UPDATE 
  USING (evaluator_id = auth.uid() OR get_user_role(auth.uid()) IN ('HR', 'Management'));

-- Training sessions policies
CREATE POLICY "Users can view relevant training sessions" 
  ON public.training_sessions FOR SELECT 
  USING (
    trainer_id = auth.uid() OR
    created_by = auth.uid() OR
    (attendees ? auth.uid()::text) OR
    get_user_role(auth.uid()) IN ('HR', 'Management')
  );

CREATE POLICY "HR and Team Leads can manage training sessions" 
  ON public.training_sessions FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

-- Update profiles policies for better role-based access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Role-based profile access" 
  ON public.profiles FOR SELECT 
  USING (
    id = auth.uid() OR -- Users can always view their own profile
    get_user_role(auth.uid()) IN ('HR', 'Management') OR -- HR and Management see all
    (get_user_role(auth.uid()) = 'Team Lead' AND manager_id = auth.uid()) -- Team leads see their team
  );

CREATE POLICY "HR can insert profiles" 
  ON public.profiles FOR INSERT 
  WITH CHECK (get_user_role(auth.uid()) IN ('HR', 'Management'));

-- Update projects policies
DROP POLICY IF EXISTS "Users can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects they created" ON public.projects;

CREATE POLICY "Project access based on role and assignment" 
  ON public.projects FOR SELECT 
  USING (
    assigned_to = auth.uid() OR 
    assigned_by = auth.uid() OR
    get_user_role(auth.uid()) IN ('HR', 'Management')
  );

CREATE POLICY "Team Leads can create projects" 
  ON public.projects FOR INSERT 
  WITH CHECK (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

CREATE POLICY "Project creators can update projects" 
  ON public.projects FOR UPDATE 
  USING (assigned_by = auth.uid() OR get_user_role(auth.uid()) IN ('HR', 'Management'));

-- Update course progress policies
DROP POLICY IF EXISTS "Users can view own progress" ON public.employee_course_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.employee_course_progress;

CREATE POLICY "Progress visibility based on role" 
  ON public.employee_course_progress FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    assigned_by = auth.uid() OR
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

CREATE POLICY "Course enrollment management" 
  ON public.employee_course_progress FOR INSERT 
  WITH CHECK (
    employee_id = auth.uid() OR 
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

CREATE POLICY "Progress updates" 
  ON public.employee_course_progress FOR UPDATE 
  USING (
    employee_id = auth.uid() OR 
    get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management')
  );

-- Update courses policies for better access control
DROP POLICY IF EXISTS "Everyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can create courses" ON public.courses;

CREATE POLICY "Authenticated users can view courses" 
  ON public.courses FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team Leads and HR can manage courses" 
  ON public.courses FOR ALL 
  USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));