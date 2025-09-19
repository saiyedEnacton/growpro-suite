
-- Step 1: Drop old policies that depend on the columns we are changing.
DROP POLICY IF EXISTS "Users can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects they created" ON public.projects;
DROP POLICY IF EXISTS "Trainees can create submissions for their own milestones" ON public.project_milestone_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.project_milestone_submissions;
DROP POLICY IF EXISTS "Team Leads can view submissions for projects they assigned" ON public.project_milestone_submissions;

-- Step 2: Remove the old direct assignment column from the projects table.
-- The CASCADE option automatically removes dependent objects like indexes and foreign key constraints.
ALTER TABLE public.projects DROP COLUMN IF EXISTS assigned_to CASCADE;

-- Step 3: Drop the now-unused project_milestones table.
-- The CASCADE option will remove dependent objects like foreign keys in project_evaluations.
-- We will add the submission_id link back to project_evaluations later if needed.
DROP TABLE IF EXISTS public.project_milestones CASCADE;

-- Step 4: Create the new project_assignments table for many-to-many relationships.
CREATE TABLE public.project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    assignee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Not_Started' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT project_assignee_unique UNIQUE (project_id, assignee_id)
);

-- Add comments for clarity
COMMENT ON TABLE public.project_assignments IS 'Links projects to the trainees assigned to them.';
COMMENT ON COLUMN public.project_assignments.status IS 'Tracks the individual trainees progress on the project.';

-- Reuse the existing trigger for updating the updated_at timestamp.
CREATE TRIGGER update_project_assignments_updated_at
BEFORE UPDATE ON public.project_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_project_assignments_project_id ON public.project_assignments(project_id);
CREATE INDEX idx_project_assignments_assignee_id ON public.project_assignments(assignee_id);

-- Step 5: Modify the submissions table to link to assignments instead of milestones.
-- Drop the old column, which might still exist if the previous migration partially failed.
ALTER TABLE public.project_milestone_submissions DROP COLUMN IF EXISTS milestone_id CASCADE;

-- Add the new column to link to project_assignments
ALTER TABLE public.project_milestone_submissions ADD COLUMN assignment_id UUID REFERENCES public.project_assignments(id) ON DELETE CASCADE;

-- Add an index on the new column
CREATE INDEX idx_submissions_assignment_id ON public.project_milestone_submissions(assignment_id);
COMMENT ON COLUMN public.project_milestone_submissions.assignment_id IS 'Links the submission to a specific project assignment for a user.';


-- Step 6: Define the new Row Level Security (RLS) policies.

-- Enable RLS on the new table
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

-- New policies for project_assignments
CREATE POLICY "Trainees can see their own assignments"
ON public.project_assignments FOR SELECT
USING (auth.uid() = assignee_id);

CREATE POLICY "Leads, HR, and Mgmt can see all assignments"
ON public.project_assignments FOR SELECT
USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

CREATE POLICY "Leads, HR, and Mgmt can create assignments"
ON public.project_assignments FOR INSERT
WITH CHECK (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

CREATE POLICY "Leads can update assignments they created"
ON public.project_assignments FOR UPDATE
USING (auth.uid() = assigned_by)
WITH CHECK (get_user_role(auth.uid()) = 'Team Lead');


-- New policies for projects (now that they are templates)
CREATE POLICY "Authenticated users can view all projects"
ON public.projects FOR SELECT
USING (auth.role() = 'authenticated');


-- New policies for project_milestone_submissions
CREATE POLICY "Trainees can create submissions for their assignments"
ON public.project_milestone_submissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.project_assignments pa
    WHERE pa.id = assignment_id AND pa.assignee_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own submissions"
ON public.project_milestone_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.project_assignments pa
    WHERE pa.id = assignment_id AND pa.assignee_id = auth.uid()
  )
);

CREATE POLICY "Leads, HR, and Mgmt can view submissions for their teams"
ON public.project_milestone_submissions FOR SELECT
USING (get_user_role(auth.uid()) IN ('Team Lead', 'HR', 'Management'));

