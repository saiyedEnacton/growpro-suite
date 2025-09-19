ALTER TABLE public.project_evaluations
ADD COLUMN submission_id UUID REFERENCES public.project_milestone_submissions(id) ON DELETE SET NULL;
