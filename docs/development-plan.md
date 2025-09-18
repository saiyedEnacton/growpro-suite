# GrowPro LMS - Detailed Frontend Development Plan

This document outlines the complete frontend development plan for the GrowPro LMS application. It is based on a gap analysis between the current implementation and the business requirements detailed in `document.md`.

## 1. Current Project Status (What is Done)

The project has a strong foundation. The following components are considered **complete**:

- **Core Technology Stack:** The project is initialized with React, Vite, TypeScript, Tailwind CSS, and the `shadcn/ui` component library.
- **Database Schema:** A comprehensive database schema has been created and migrated in Supabase, covering all major entities like users, courses, projects, and evaluations. Row Level Security (RLS) is enabled and configured.
- **User Authentication:** A polished and fully functional `LoginForm.tsx` is implemented, including UI, state management, and integration with Supabase Auth.
- **Authenticated State Management:** A `useAuth` hook correctly manages the user's session and profile data application-wide.
- **Core Application Shell:**
  - A role-aware main navigation bar (`MainNav.tsx`) exists, showing different links based on user roles.
  - A role-aware `Dashboard.tsx` page provides different views and data points for Management, HR, Team Leads, and Trainees, although it currently uses static sample data.
- **Routing Foundation:** `react-router-dom` is set up, with a clear distinction between authenticated and public routes.

## 2. Remaining Work (The Gap)

The core of the remaining work is to build out the feature pages linked from the main navigation, connect the UI to the live Supabase backend, and implement the business logic defined in the requirements.

This work is broken down into the following epics and user stories.

---

### **Epic 1: Core Data Integration & Navigation**

**Goal:** Activate the main navigation and replace all sample data with live data from the Supabase backend.

- **Story 1.1: Activate Application Routing**
  - **As a developer,** I need to create placeholder pages for all items in the main navigation and add them to the router in `App.tsx`.
  - **Acceptance Criteria:**
    - Routes for `/courses`, `/employees`, `/projects`, and `/training-sessions` are added.
    - Clicking each link in `MainNav.tsx` navigates to its corresponding page without a "Not Found" error.

- **Story 1.2: Connect Dashboard to Live Data**
  - **As a user,** I want to see real, relevant data on my dashboard, not sample data.
  - **Acceptance Criteria:**
    - The `Dashboard.tsx` component fetches data from Supabase instead of using hardcoded arrays.
    - The "Total Employees" card shows a real count from the `profiles` table.
    - The "Active Courses" card shows a real count from the `course_enrollments` table for the logged-in user.
    - All other dashboard metrics are connected to corresponding backend tables and functions.

---

### **Epic 2: Course Catalog & Consumption**

**Goal:** Allow users to browse, enroll in, consume, and be assessed on training courses.

- **Story 2.1: View Course Catalog**
  - **As a user,** I want to navigate to the "Courses" page to see a list of all available courses.
  - **Acceptance Criteria:**
    - The `/courses` page fetches and displays all records from the `courses` table.
    - Each course is displayed in a `CourseCard` component.
    - A search bar is implemented to filter courses by name.

- **Story 2.2: View Course & Module Details**
  - **As a user,** I want to click on a course to view its details and the modules it contains.
  - **Acceptance Criteria:**
    - Clicking a `CourseCard` navigates to `/courses/{courseId}`.
    - The page fetches and displays the specific course's details.
    - It also fetches and lists all `course_modules` linked to that course.

- **Story 2.3: Trainee Enrollment**
  - **As a Trainee,** I want to be able to enroll in a course.
  - **Acceptance Criteria:**
    - The course details page shows an "Enroll" button if the trainee is not yet enrolled.
    - Clicking the button creates a new record in the `course_enrollments` table.
    - The UI updates to reflect the "Enrolled" status.

- **Story 2.4: View Module Content**
  - **As an enrolled Trainee,** I want to view the content of a specific module.
  - **Acceptance Criteria:**
    - Clicking a module on the course details page navigates to `/courses/{courseId}/modules/{moduleId}`.
    - The page displays the module content based on its `content_type` (e.g., embedded video, text).

- **Story 2.5: Take a Course Assessment**
  - **As a Trainee,** I want to take an assessment after completing a course or module to test my knowledge.
  - **Acceptance Criteria:**
    - A "Take Assessment" button appears after viewing the required modules.
    - This leads to a page that fetches and displays questions from the `course_assessments` related tables.
    - The UI allows for answering questions (multiple choice, etc.) and submitting the assessment.
    - Upon submission, the results are saved to the `course_assessments` table.

- **Story 2.6: Course & Module Management (Admin)**
  - **As a Team Lead or HR user,** I want to be able to create, edit, and delete courses and modules.
  - **Acceptance Criteria:**
    - The UI shows "Create Course" buttons for authorized roles.
    - Forms are available to create/edit course and module details.
    - The forms perform the corresponding `insert` and `update` operations in the Supabase database.

---

### **Epic 3: Employee & Trainee Management (HR Role)**

**Goal:** Enable HR users to manage the employee lifecycle within the application.

- **Story 3.1: View Employee List**
  - **As an HR user,** I want to access an "Employees" page to see a list of all users.
  - **Acceptance Criteria:**
    - The `/employees` page is created and fetches data from the `profiles` table.
    - A data table displays all users with columns for Name, Role, Department, and Status.
    - The table can be searched and filtered.

- **Story 3.2: Create Trainee Profile**
  - **As an HR user,** I want to create new trainee accounts.
  - **Acceptance Criteria:**
    - The "Employees" page has an "Add New Employee" button.
    - This opens a form to create a new user in Supabase Auth and a corresponding `profiles` record.

- **Story 3.3: Assign Team Lead to Employee**
  - **As an HR user,** I want to assign a Team Lead to an employee from their profile page.
  - **Acceptance Criteria:**
    - The employee detail page (`/employees/{employeeId}`) has an editable field for "Manager" or "Team Lead".
    - This field is a dropdown populated with users who have the 'Team Lead' role.
    - Saving the change updates the `manager_id` field in the employee's `profiles` record.

- **Story 3.4: Assign Course to Employee**
  - **As an HR user,** I want to be able to directly enroll a trainee in a specific course.
  - **Acceptance Criteria:**
    - On the employee detail page, there is a section for "Enrolled Courses".
    - An "Enroll in Course" button opens a dialog to select from a list of available courses.
    - Selecting a course creates a new record in the `course_enrollments` table for that employee.

- **Story 3.5: Manage Employee Documents**
  - **As an HR user,** I want to be able to upload and manage personal documents (like contracts, ID scans, etc.).
  - **Acceptance Criteria:**
    - On the employee detail page (`/employees/{employeeId}`), there is a "Documents" tab.
    - The tab lists all documents from the `employee_documents` table for that user.
    - An "Upload Document" button opens a form with fields for `document_name`, `document_type`, and a file input.
    - Uploading a file uses Supabase Storage and creates a corresponding record in the `employee_documents` table.
    - HR users can see a "Verify" button to mark a document as verified.
    - Employees can view their own documents. HR/Management can view/upload documents for any user they have access to.
  

---

### **Epic 4: Project Management & Evaluation**

**Goal:** Implement the workflow for assigning, tracking, and evaluating trainee projects.

- **Story 4.1: View Project List**
  - **As a user,** I want to navigate to the "Projects" page to see projects relevant to me.
  - **Acceptance Criteria:**
    - The `/projects` page is created.
    - Trainees see a list of projects they are assigned to.
    - Team Leads see a list of projects they have assigned.

- **Story 4.2: Submit Project Work**
  - **As a Trainee,** I want to be able to submit my work for a project milestone.
  - **Acceptance Criteria:**
    - On the project detail page, each milestone has a "Submit Work" button.
    - This allows for file uploads (to Supabase Storage) or linking to external resources (e.g., GitHub repo).
    - The submission is recorded and linked to the project milestone.

- **Story 4.3: Evaluate Project (Team Lead)**
  - **As a Team Lead,** I want to evaluate a trainee's submitted project work.
  - **Acceptance Criteria:**
    - After a trainee submits work for a milestone, an "Evaluate" button appears for the Team Lead.
    - This opens a form capturing scores and feedback as defined in the `project_evaluations` table (technical, quality, timeline, etc.).
    - Submitting the form saves the evaluation data to the database.

- **Story 4.4: Peer Evaluation (Trainee)**
  - **As a Trainee,** I want to be able to evaluate a peer's project if assigned to do so.
  - **Acceptance Criteria:**
    - The system has a mechanism to assign peer reviewers for a project.
    - If assigned, I can access a similar evaluation form to the one used by Team Leads.
    - My evaluation is stored in the `project_evaluations` table, with my `evaluator_id`.

---

### **Epic 5: Reporting & Analytics (Manager Role)**

**Goal:** Provide management with high-level insights into trainee performance and readiness.

- **Story 5.1: View Trainee Readiness Report**
  - **As a Manager,** I want to view a "Trainee Readiness Report" to understand a trainee's overall performance.
  - **Acceptance Criteria:**
    - A new page, `/reports/readiness`, is created.
    - The page allows selecting a trainee to view their report.
    - The report aggregates and displays all of the trainee's scores from `course_assessments` and `project_evaluations`.
    - It shows average scores, trends over time, and a summary of strengths and weaknesses identified in feedback.
    - An overall "Readiness Score" is calculated based on a weighted average of their performance, indicating their suitability for deployment on client projects.

---

### **Epic 6: User Profile & Settings**

**Goal:** Allow users to manage their own profile information.

- **Story 6.1: View and Edit Profile**
  - **As a user,** I want to access a "Settings" or "Profile" page from the user menu in the main navigation.
  - **Acceptance Criteria:**
    - A "Settings" menu item navigates to `/settings/profile`.
    - The page displays the user's own information from the `profiles` table.
    - The user can update their own `first_name`, `last_name`, `phone`, etc.

---

### **Epic 7: Advanced HR Features (Completed)**

**Goal:** Provide HR and Management with advanced, in-place editing and management capabilities on the Employee Detail page.

- **Story 7.1: Inline Editing for Employee Details**
  - **As an HR user,** I want to be able to quickly edit an employee's information directly on their detail page.
  - **Functionality:**
    - An "Edit" button is available on the employee detail page for HR and Management roles.
    - Clicking "Edit" transforms the employee's data fields (Name, Department, Designation, etc.) into editable input boxes.
    - A "Save" button commits all changes to the database.
    - A "Cancel" button discards all changes and returns to the read-only view.

- **Story 7.2: Dynamic Team Lead Promotion and Assignment**
  - **As an HR user,** I want a seamless way to assign a Team Lead and promote employees if necessary.
  - **Functionality:**
    - The "Team Lead" field on the employee detail page is a dropdown list of all other employees in the system.
    - When an HR user selects an employee from the dropdown:
      - If the selected employee is not already HR or Management, their role is automatically promoted to "Team Lead". A notification confirms the promotion.
      - The selected employee's ID is then saved as the `manager_id` for the employee being viewed.
    - This combines the act of promotion and assignment into a single, efficient user action.