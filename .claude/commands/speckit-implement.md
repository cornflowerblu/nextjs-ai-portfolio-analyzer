---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---

## Instructions

You are executing the Speckit implementation workflow for Claude Code.

**IMPORTANT**: Use the TodoWrite tool to track implementation progress through the task list.

### Step 1: Prerequisites Check

Run the prerequisites script:

```bash
.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

Parse JSON output for:
- `FEATURE_DIR`: Feature directory path
- `AVAILABLE_DOCS`: List of available documents

### Step 2: Check Checklists Status

If `FEATURE_DIR/checklists/` exists:

1. Scan all checklist files in the checklists/ directory
2. For each checklist, count:
   - Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
   - Completed items: Lines matching `- [X]` or `- [x]`
   - Incomplete items: Lines matching `- [ ]`
3. Create a status table:

   ```
   | Checklist    | Total | Completed | Incomplete | Status |
   |--------------|-------|-----------|------------|--------|
   | ux.md        | 12    | 12        | 0          | ✓ PASS |
   | test.md      | 8     | 5         | 3          | ✗ FAIL |
   | security.md  | 6     | 6         | 0          | ✓ PASS |
   ```

4. Calculate overall status:
   - **PASS**: All checklists have 0 incomplete items
   - **FAIL**: One or more checklists have incomplete items

5. **If any checklist is incomplete**:
   - Display the table with incomplete item counts
   - **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
   - Wait for user response before continuing
   - If user says "no" or "wait" or "stop", halt execution
   - If user says "yes" or "proceed" or "continue", proceed to step 3

6. **If all checklists are complete**:
   - Display the table showing all checklists passed
   - Automatically proceed to step 3

### Step 3: Load Implementation Context

Read the following files:
- **REQUIRED**:
  - `tasks.md` (complete task list and execution plan)
  - `plan.md` (tech stack, architecture, file structure)
- **IF EXISTS**:
  - `data-model.md` (entities and relationships)
  - `contracts/` (API specifications and test requirements)
  - `research.md` (technical decisions and constraints)
  - `quickstart.md` (integration scenarios)

### Step 4: Project Setup Verification

**REQUIRED**: Create/verify ignore files based on actual project setup

**Detection & Creation Logic**:
- Check if git repo (run `git rev-parse --git-dir 2>/dev/null`) → create/verify `.gitignore`
- Check if Dockerfile* exists or Docker in plan.md → create/verify `.dockerignore`
- Check if `.eslintrc*` exists → create/verify `.eslintignore`
- Check if `eslint.config.*` exists → ensure config's `ignores` entries cover required patterns
- Check if `.prettierrc*` exists → create/verify `.prettierignore`
- Check if `.npmrc` or `package.json` exists → create/verify `.npmignore` (if publishing)
- Check if terraform files (`*.tf`) exist → create/verify `.terraformignore`
- Check if helm charts present → create/verify `.helmignore`

**If ignore file already exists**: Verify it contains essential patterns, append missing critical patterns only
**If ignore file missing**: Create with full pattern set for detected technology

**Common Patterns by Technology** (from plan.md tech stack):
- **Node.js/JavaScript/TypeScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
- **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
- **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
- **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
- **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
- **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`

**Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

### Step 5: Parse tasks.md Structure

Extract:
- **Task phases**: Setup, Tests, Core, Integration, Polish
- **Task dependencies**: Sequential vs parallel execution rules
- **Task details**: ID, description, file paths, parallel markers [P]
- **Execution flow**: Order and dependency requirements

**Create a TodoWrite list** with all tasks organized by phase.

### Step 6: Execute Implementation

**Phase-by-phase execution** following the task plan:
- Complete each phase before moving to the next
- Respect dependencies: Run sequential tasks in order, parallel tasks [P] can run together
- Follow TDD approach: Execute test tasks before their corresponding implementation tasks
- File-based coordination: Tasks affecting the same files must run sequentially
- Validation checkpoints: Verify each phase completion before proceeding

### Step 7: Implementation Execution Rules

1. **Setup first**: Initialize project structure, dependencies, configuration
2. **Tests before code**: If you need to write tests for contracts, entities, and integration scenarios
3. **Core development**: Implement models, services, CLI commands, endpoints
4. **Integration work**: Database connections, middleware, logging, external services
5. **Polish and validation**: Unit tests, performance optimization, documentation

### Step 8: Progress Tracking and Error Handling

- **Use TodoWrite tool** to track progress after each completed task
- Report progress after each completed task
- Halt execution if any non-parallel task fails
- For parallel tasks [P], continue with successful tasks, report failed ones
- Provide clear error messages with context for debugging
- Suggest next steps if implementation cannot proceed
- **IMPORTANT**: For completed tasks, mark the task off as [X] in the tasks.md file

### Step 9: Completion Validation

- Verify all required tasks are completed
- Check that implemented features match the original specification
- Validate that tests pass and coverage meets requirements
- Confirm the implementation follows the technical plan
- Report final status with summary of completed work

**Note**: This command assumes a complete task breakdown exists in `tasks.md`. If tasks are incomplete or missing, suggest running `/speckit-tasks` first to regenerate the task list.
