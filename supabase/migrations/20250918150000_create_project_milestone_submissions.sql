-- Create project_milestone_submissions table
CREATE TABLE public.project_milestone_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES public.project_milestones(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_content TEXT,
    file_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add updated_at trigger
CREATE TRIGGER update_project_milestone_submissions_updated_at BEFORE UPDATE ON public.project_milestone_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.project_milestone_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Trainees can create submissions for their own milestones"
ON public.project_milestone_submissions FOR INSERT
WITH CHECK (
  auth.uid() = submitted_by AND
  EXISTS (
    SELECT 1
    FROM project_milestones pm
    JOIN projects p ON pm.project_id = p.id
    WHERE pm.id = milestone_id AND p.assigned_to = auth.uid()
  )
);

CREATE POLICY "Users can view their own submissions"
ON public.project_milestone_submissions FOR SELECT
USING (auth.uid() = submitted_by);

CREATE POLICY "Team Leads can view submissions for projects they assigned"
ON public.project_milestone_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM project_milestones pm
    JOIN projects p ON pm.project_id = p.id
    WHERE pm.id = milestone_id AND p.assigned_by = auth.uid()
  )
);

CREATE POLICY "HR and Management can view all submissions"
ON public.project_milestone_submissions FOR SELECT
USING (get_user_role(auth.uid()) IN ('HR', 'Management'));
