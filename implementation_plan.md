Implementation Plan - "Bare Bones" Application
Goal Description
Simplify the existing internal JIRA clone application into a stable "bare bones" foundation for a new project. This involves removing all application-specific logic (Boards, Sprints, Epics, Projects, Issues) while preserving the core SaaS infrastructure (Authentication, Multi-tenancy/Company Context, User Management, Billing, Settings, Admin).

User Review Required
IMPORTANT

Data Loss Warning: This plan involves deleting database tables and code related to Projects, Boards, Issues, Epics, and Sprints. All data in these tables will be lost.

[!QUESTION] CRM Module: I have included the crm schema (Tickets, Feedback, Messages) for removal as it seems to be application-specific logic. Please confirm if this should be kept.

[!QUESTION] Projects: I am removing the Project entity entirely. If "Projects" are intended to be a core organizational unit (like "Departments" or "Teams") generic enough for the new app, please let me know. For now, I assume they are JIRA-style projects.

Proposed Changes
Database (Prisma Schema)
[MODIFY] 
schema.prisma
Remove Models (and related enums/relations):
Project
MomentumBoard
MomentumEpic
MomentumIssue
MomentumSprint
MomentumActivity
MomentumHistory
MomentumComment
MomentumProjectMember
MomentumSprintMember
MomentumBoardMember
CrmTicket
CrmMessage
CrmFeedback
CrmCompanyContact (unless generic CRM is desired)
Leaderboard (if exists)
Backend
[DELETE] Controllers
backend/controllers/board.tenant.controller.js
backend/controllers/epic.tenant.controller.js
backend/controllers/issue.tenant.controller.js
backend/controllers/project.tenant.controller.js
backend/controllers/sprint.tenant.controller.js
backend/controllers/scheduledIssue.controller.js
backend/controllers/comment.tenant.controller.js
 (if specific to issues)
backend/controllers/search.tenant.controller.js
 (likely needs heavy modification or removal if searching issues)
[DELETE] Routes
backend/routes/boardRoutes.js
backend/routes/columnRoutes.js
backend/routes/epicRoutes.js
backend/routes/issueRoutes.js
backend/routes/projectRoutes.js
backend/routes/sprintRoutes.js
backend/routes/scheduledIssueRoutes.js
backend/routes/commentRoutes.js
backend/routes/commentsForIssueRoutes.js
backend/routes/individualCommentActionsRoutes.js
[MODIFY] 
server.js
Remove imports and usage of the deleted routes.
Frontend
[DELETE] Features
frontend/src/features/board
frontend/src/features/epics
frontend/src/features/sprints
frontend/src/features/projects
[MODIFY] 
App.jsx
Remove routes for /projects*, /boards*, /epics*.
Set default dashboard or redirect to a generic home.
[MODIFY] 
Sidebar.jsx
Remove navigation links to Projects, Boards, etc.
[MODIFY] 
DashboardPage.jsx
Remove JIRA-specific widgets (Issue counts, sprint status).
Leave a blank or generic "Welcome" dashboard.
Verification Plan
Automated Tests
Run npm run test (backend) if available, expecting failures in deleted specific tests, then clean them up.
Run npm run build (frontend) to ensure no dangling imports.
Manual Verification
Start App: Ensure Docker containers start without error (backend schema sync).
Login: Verify User Login and Company Context switching still work.
Navigation: Click through Sidebar items. Verify "Settings", "Profile", "Billing", "Users" work.
Absence: Verify explicit URLs for /projects or /boards return 404 (Not Found).