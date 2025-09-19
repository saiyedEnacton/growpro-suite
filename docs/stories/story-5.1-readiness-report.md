---
story_id: 5.1
epic: 5
status: Ready for Review
title: View Trainee Readiness Report
---

### Story
As a Manager, I want to view a "Trainee Readiness Report" to understand a trainee's overall performance.

### Acceptance Criteria
- A new page is created at `/reports/readiness`.
- The page is accessible to users with the 'Management' role.
- The page allows selecting a trainee from a dropdown list to view their report.
- The report aggregates and displays all of the trainee's scores from `course_assessments` and `project_evaluations`.
- It shows average scores, trends over time, and a summary of strengths and weaknesses identified in feedback.
- An overall "Readiness Score" is calculated based on a weighted average of their performance.

### Dev Notes
- The UI should be built using existing `shadcn/ui` components where possible.
- Data fetching will require complex joins across multiple Supabase tables.
- The "Readiness Score" calculation logic needs to be clearly defined and implemented.

### Tasks
- [x] **Task 1: Scaffolding & Routing**
  - [x] Create new page component `src/pages/TraineeReadinessReport.tsx`.
  - [x] Add a new route for `/reports/readiness` in `src/App.tsx`, protected for the 'Management' role.
  - [x] Add a link to the new page in the main navigation (`src/components/navigation/MainNav.tsx`) visible only to managers.
- [x] **Task 2: Data Fetching Logic**
  - [x] Create a Supabase RPC function `get_trainee_readiness_data(p_user_id UUID)` to aggregate data.
  - [x] The function should join `profiles`, `course_assessments`, and `project_evaluations`.
  - [x] The function should return a structured JSON object with all necessary scores, feedback, and details.
- [x] **Task 3: UI - Trainee Selection**
  - [x] Implement a dropdown/combobox on the page to select a trainee.
  - [x] The dropdown should be populated with all users who are not managers/HR.
  - [x] Selecting a trainee should trigger the data fetch for their report.
- [x] **Task 4: UI - Display Report Data**
  - [x] Create components to display the aggregated data returned from the Supabase function.
  - [x] Display average scores for courses and projects.
  - [x] Display a chart showing score trends over time (e.g., using `recharts`).
  - [x] Display a summary of qualitative feedback.
- [x] **Task 5: UI - Readiness Score**
  - [x] Implement the "Readiness Score" calculation on the frontend based on the fetched data.
  - [x] Display the score prominently, perhaps with a gauge or a summary card.
- [x] **Task 6: Testing**
  - [x] Write a basic render test for the `TraineeReadinessReport` page. (Skipped, user will handle testing).
  - [x] Write tests for the "Readiness Score" calculation logic. (Skipped, user will handle testing).

---
### Dev Agent Record
- **Agent Model Used:**
- **Debug Log References:**
- **Completion Notes:**
  - Route for `/reports/readiness` was added without role-based protection per user request. The navigation link is correctly configured to only show for the Management role.
- **File List:**
  - `docs/stories/story-5.1-readiness-report.md`
  - `src/pages/TraineeReadinessReport.tsx`
  - `src/App.tsx`
  - `src/components/navigation/MainNav.tsx`
  - `src/components/auth/ProtectedRoute.tsx`
  - `supabase/migrations/20250919120000_create_trainee_readiness_function.sql`
- **Change Log:**
