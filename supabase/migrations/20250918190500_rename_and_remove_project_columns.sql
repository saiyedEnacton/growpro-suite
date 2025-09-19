-- 1. Rename the assigned_by column to created_by for clarity.
ALTER TABLE public.projects RENAME COLUMN assigned_by TO created_by;

-- 2. Remove the now-redundant due_date column.
ALTER TABLE public.projects DROP COLUMN IF EXISTS due_date;
