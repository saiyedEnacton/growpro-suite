# Project Section Review - 2025-09-18

This document outlines the current status and remaining issues for the "Projects" section as of the end of the day.

## Implemented Features

*   **Project List:** A list of projects is displayed to users based on their roles.
*   **Project Creation:** Team Leads, HR, and Management can create new projects with all the required fields.
*   **Project Evaluation:** Team Leads can evaluate submissions.

## Remaining Issues & Next Steps
### 1. UI/UX Feedback
*   **Issue:** The user has requested to remove the "Due Date" section from the project view.
*   **Next Step:** Remove the "Due Date" from the `Projects.tsx` and `ProjectDetails.tsx` pages tomorrow and DB no need.

### 2. "View Details" Page Errors
*   **Issue:** Cant seee project name description and many details can't click view detail as it say page not found 

### 3. "Submit Work" Button Missing for Trainees
*   **Issue:** The "Submit Work" button is reportedly not visible to trainees on the project details page.
*   **Status:** The code in `ProjectDetails.tsx` seems to correctly handle this, but it needs to be investigated further. This is a high-priority issue to be addressed tomorrow.
```typescript
{profile?.role === 'Trainee' && (
  <SubmitWorkDialog milestoneId={milestone.id} onSubmited={fetchProjectDetails} />
)}
```
*   **Next Step:** Investigate why the button is not rendering for trainees. Check the `profile.role` value for a logged-in trainee.


### 4. Evaluation Section
*   **Status:** The evaluation section is present and functional for Team Leads.
*   **Next Step:** No changes are required for this as per the user's request.

## Plan for Tomorrow

1.  Verify the fix for the "View Details" page crash.
2.  Debug and fix the missing "Submit Work" button for trainees.
3.  Remove the "Due Date" from the UI.
