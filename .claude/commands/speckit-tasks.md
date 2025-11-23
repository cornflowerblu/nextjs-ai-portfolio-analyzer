---
description: Generate actionable, dependency-ordered tasks.md for the feature based on available design artifacts
---

## Instructions

You are executing the Speckit tasks generation workflow for Claude Code.

### Step 1: Setup and Context Loading

Run the setup script to get feature directory and available documents:

```bash
.specify/scripts/bash/check-prerequisites.sh --json
```

Parse the JSON output for:
- `FEATURE_DIR`: Absolute path to the feature directory
- `AVAILABLE_DOCS`: List of available design documents

### Step 2: Load Design Documents

Read from `FEATURE_DIR`:
- **Required**:
  - `plan.md` (tech stack, libraries, structure)
  - `spec.md` (user stories with priorities)
- **Optional**:
  - `data-model.md` (entities)
  - `contracts/` (API endpoints)
  - `research.md` (decisions)
  - `quickstart.md` (test scenarios)

Note: Not all projects have all documents. Generate tasks based on what's available.

### Step 3: Execute Task Generation Workflow

1. Load `plan.md` and extract tech stack, libraries, project structure
2. Load `spec.md` and extract user stories with their priorities (P1, P2, P3, etc.)
3. If `data-model.md` exists: Extract entities and map to user stories
4. If `contracts/` exists: Map endpoints to user stories
5. If `research.md` exists: Extract decisions for setup tasks
6. Generate tasks organized by user story (see Task Generation Rules below)
7. Generate dependency graph showing user story completion order
8. Create parallel execution examples per user story
9. Validate task completeness (each user story has all needed tasks, independently testable)

### Step 4: Generate tasks.md

Use `.specify/templates/tasks-template.md` as structure, fill with:
- Correct feature name from plan.md
- Phase 1: Setup tasks (project initialization)
- Phase 2: Foundational tasks (blocking prerequisites for all user stories)
- Phase 3+: One phase per user story (in priority order from spec.md)
- Each phase includes: story goal, independent test criteria, tests (if requested), implementation tasks
- Final Phase: Polish & cross-cutting concerns
- All tasks must follow the strict checklist format
- Clear file paths for each task
- Dependencies section showing story completion order
- Parallel execution examples per story
- Implementation strategy section (MVP first, incremental delivery)

### Step 5: Report

Output path to generated tasks.md and summary:
- Total task count
- Task count per user story
- Parallel opportunities identified
- Independent test criteria for each story
- Suggested MVP scope (typically just User Story 1)
- Format validation: Confirm ALL tasks follow the checklist format

## Task Generation Rules

**CRITICAL**: Tasks MUST be organized by user story to enable independent implementation and testing.

**Tests are OPTIONAL**: Only generate test tasks if explicitly requested in the feature specification or if user requests TDD approach.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
4. **[Story] label**: REQUIRED for user story phase tasks only
   - Format: [US1], [US2], [US3], etc. (maps to user stories from spec.md)
   - Setup phase: NO story label
   - Foundational phase: NO story label
   - User Story phases: MUST have story label
   - Polish phase: NO story label
5. **Description**: Clear action with exact file path

**Examples**:

- ✅ CORRECT: `- [ ] T001 Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] T014 [US1] Implement UserService in src/services/user_service.py`
- ❌ WRONG: `- [ ] Create User model` (missing ID and Story label)
- ❌ WRONG: `T001 [US1] Create model` (missing checkbox)
- ❌ WRONG: `- [ ] [US1] Create User model` (missing Task ID)
- ❌ WRONG: `- [ ] T001 [US1] Create model` (missing file path)

### Phase Structure

- **Phase 1**: Setup (project initialization)
- **Phase 2**: Foundational (blocking prerequisites - MUST complete before user stories)
- **Phase 3+**: User Stories in priority order (P1, P2, P3...)
  - Within each story: Tests (if requested) → Models → Services → Endpoints → Integration
  - Each phase should be a complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting Concerns

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.
