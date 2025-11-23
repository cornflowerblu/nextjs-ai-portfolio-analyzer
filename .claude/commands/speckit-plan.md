---
description: Execute implementation planning workflow using the plan template to generate design artifacts
---

## Instructions

You are executing the Speckit planning workflow for Claude Code.

### Step 1: Setup

Run the setup script to get context:

```bash
.specify/scripts/bash/setup-plan.sh --json
```

Parse JSON output for:
- `FEATURE_SPEC`: Path to feature specification
- `IMPL_PLAN`: Path to implementation plan
- `SPECS_DIR`: Specs directory
- `BRANCH`: Current branch

### Step 2: Load Context

Read:
- `FEATURE_SPEC` (the feature specification)
- `.specify/memory/constitution.md` (project constitution)
- `IMPL_PLAN` template (already copied)

### Step 3: Execute Plan Workflow

Follow the structure in `IMPL_PLAN` template to:

1. Fill **Technical Context** (mark unknowns as "NEEDS CLARIFICATION")
2. Fill **Constitution Check** section from constitution
3. Evaluate gates (ERROR if violations unjustified)
4. **Phase 0**: Generate `research.md` (resolve all NEEDS CLARIFICATION)
5. **Phase 1**: Generate `data-model.md`, `contracts/`, `quickstart.md`
6. **Phase 1**: Update agent context by running the agent script
7. Re-evaluate Constitution Check post-design

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context**:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: `research.md` with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Agent context update**:
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file
   - Add only new technology from current plan
   - Preserve manual additions between markers

**Output**: `data-model.md`, `/contracts/*`, `quickstart.md`, agent-specific file

### Step 4: Stop and Report

Command ends after Phase 2 planning. Report:
- Branch
- `IMPL_PLAN` path
- Generated artifacts

## Key Rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
