-- Create roles table
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT UNIQUE NOT NULL,
  role_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create profiles table (links to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_code TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role_id UUID REFERENCES public.roles(id),
  department TEXT,
  designation TEXT,
  manager_id UUID REFERENCES public.profiles(id),
  date_of_joining DATE,
  current_status TEXT DEFAULT 'Pre-Joining' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_status CHECK (current_status IN ('Pre-Joining', 'Active', 'On-Leave', 'Terminated', 'Resigned'))
);

-- Create employee_documents table
CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name TEXT NOT NULL,
  course_description TEXT,
  course_type TEXT,
  target_role TEXT,
  difficulty_level TEXT DEFAULT 'Beginner',
  learning_objectives TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create course_modules table
CREATE TABLE public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  module_description TEXT,
  module_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(course_id, module_order)
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  lesson_name TEXT NOT NULL,
  lesson_order INTEGER NOT NULL,
  lesson_type TEXT NOT NULL,
  content_url TEXT,
  content_path TEXT,
  login_details JSONB,
  estimated_duration_minutes INTEGER,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(module_id, lesson_order)
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options JSONB,
  correct_answers JSONB,
  points NUMERIC(5,2) DEFAULT 1.00,
  difficulty_level TEXT DEFAULT 'Medium',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create employee_course_progress table
CREATE TABLE public.employee_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMPTZ DEFAULT now(),
  target_completion_date DATE,
  actual_completion_date TIMESTAMPTZ,
  progress_percentage NUMERIC(5,2) DEFAULT 0.00,
  status TEXT DEFAULT 'Not_Started',
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(employee_id, course_id)
);

-- Create employee_lesson_progress table
CREATE TABLE public.employee_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id UUID NOT NULL REFERENCES public.employee_course_progress(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Not_Started',
  start_time TIMESTAMPTZ,
  completion_time TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(employee_id, lesson_id)
);

-- Create student_lesson_assessments table
CREATE TABLE public.student_lesson_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  lesson_progress_id UUID REFERENCES public.employee_lesson_progress(id) ON DELETE CASCADE,
  answer_text TEXT,
  selected_options JSONB,
  score NUMERIC(5,2) DEFAULT 0.00,
  is_correct BOOLEAN DEFAULT false,
  attempt_number INTEGER DEFAULT 1,
  graded_by UUID REFERENCES public.profiles(id),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create course_assessments table
CREATE TABLE public.course_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id UUID NOT NULL REFERENCES public.employee_course_progress(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,
  total_score NUMERIC(5,2) DEFAULT 0.00,
  percentage NUMERIC(5,2) DEFAULT 0.00,
  grade TEXT,
  status TEXT DEFAULT 'Pending',
  assessor_id UUID REFERENCES public.profiles(id),
  feedback TEXT,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  project_description TEXT,
  project_type TEXT,
  assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id),
  duration_days INTEGER,
  status TEXT DEFAULT 'Not_Started',
  instructions TEXT,
  deliverables TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create project_milestones table
CREATE TABLE public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  milestone_description TEXT,
  milestone_order INTEGER NOT NULL,
  due_date DATE,
  completion_date DATE,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(project_id, milestone_order)
);

-- Create project_evaluations table
CREATE TABLE public.project_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id),
  technical_score NUMERIC(3,2),
  quality_score NUMERIC(3,2),
  timeline_score NUMERIC(3,2),
  communication_score NUMERIC(3,2),
  innovation_score NUMERIC(3,2),
  overall_score NUMERIC(3,2),
  strengths TEXT,
  areas_for_improvement TEXT,
  evaluation_date TIMESTAMPTZ DEFAULT now()
);

-- Create training_sessions table
CREATE TABLE public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT NOT NULL,
  session_type TEXT,
  course_id UUID REFERENCES public.courses(id),
  trainer_id UUID REFERENCES public.profiles(id),
  attendees JSONB,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  meeting_platform TEXT,
  meeting_link TEXT,
  status TEXT DEFAULT 'Scheduled',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  target_role_id UUID REFERENCES public.roles(id),
  link_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Insert default roles
INSERT INTO public.roles (role_name, role_description) VALUES 
('Management', 'Executive and senior management with system-wide access and oversight'),
('HR', 'Human Resources with employee lifecycle and administrative access'),
('Team Lead', 'Team leaders with training design and evaluation capabilities'),
('Trainee', 'Employees participating in training programs');

-- Create indexes for performance
CREATE INDEX idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX idx_profiles_current_status ON public.profiles(current_status);
CREATE INDEX idx_profiles_manager_id ON public.profiles(manager_id);
CREATE INDEX idx_employee_course_progress_employee_id ON public.employee_course_progress(employee_id);
CREATE INDEX idx_employee_course_progress_status ON public.employee_course_progress(status);
CREATE INDEX idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX idx_lessons_lesson_type ON public.lessons(lesson_type);
CREATE INDEX idx_questions_lesson_id ON public.questions(lesson_id);
CREATE INDEX idx_questions_course_id ON public.questions(course_id);
CREATE INDEX idx_projects_assigned_to ON public.projects(assigned_to);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_training_sessions_trainer_id ON public.training_sessions(trainer_id);
CREATE INDEX idx_training_sessions_start_datetime ON public.training_sessions(start_datetime);

-- Create function for updating updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON public.employee_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON public.course_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_course_progress_updated_at BEFORE UPDATE ON public.employee_course_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_lesson_progress_updated_at BEFORE UPDATE ON public.employee_lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_lesson_assessments_updated_at BEFORE UPDATE ON public.student_lesson_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_course_assessments_updated_at BEFORE UPDATE ON public.course_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON public.project_milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON public.training_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Basic RLS policies (will be expanded based on role requirements)

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Roles policies  
CREATE POLICY "Everyone can view roles" ON public.roles FOR SELECT USING (true);

-- Course policies
CREATE POLICY "Everyone can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Progress policies
CREATE POLICY "Users can view own progress" ON public.employee_course_progress FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Users can update own progress" ON public.employee_course_progress FOR UPDATE USING (employee_id = auth.uid());

-- Project policies
CREATE POLICY "Users can view assigned projects" ON public.projects FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "Users can view projects they created" ON public.projects FOR SELECT USING (assigned_by = auth.uid());

-- Announcements policies
CREATE POLICY "Everyone can view announcements" ON public.announcements FOR SELECT USING (true);