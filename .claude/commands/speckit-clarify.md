---
description: Clarify ambiguous requirements and resolve specification questions
---

## Instructions

You are helping clarify ambiguous or incomplete requirements in a Speckit specification.

### Step 1: Load Current Specification

Read the current specification from the specs directory to understand:
- Existing requirements
- Open questions
- Edge cases
- User stories
- Technical constraints

### Step 2: Identify Ambiguities

Scan for:
- **Vague terms** without measurable criteria:
  - "fast", "slow", "quick", "easy", "simple", "robust", "scalable", "secure"
  - Ask: "What specific metric defines this? (e.g., <100ms response time, 10k concurrent users)"

- **Incomplete requirements**:
  - User stories missing acceptance criteria
  - Requirements without success criteria
  - Edge cases without handling strategy

- **Placeholder content**:
  - TODO, TKTK, ???, `<placeholder>`, "TBD"
  - Ask for specific values or decisions

- **Conflicting requirements**:
  - Requirements that contradict each other
  - Technical constraints that conflict with functional requirements

- **Missing information**:
  - Undefined user roles
  - Unclear data models
  - Unspecified integrations
  - Missing error handling strategies

### Step 3: Generate Clarifying Questions

For each ambiguity found, create structured questions:

**Format**:
```
## Question [N]: [Short title]

**Context**: [Where this appears in the spec]
**Issue**: [What's unclear or missing]
**Question**: [Specific question to resolve the ambiguity]
**Options** (if applicable):
- Option A: [Description]
- Option B: [Description]
**Impact**: [Why this matters for implementation]
```

### Step 4: Prioritize Questions

Group questions by priority:
- **CRITICAL**: Blocks implementation, requires immediate answer
- **HIGH**: Affects multiple components or user stories
- **MEDIUM**: Affects single component or story
- **LOW**: Nice to have, doesn't block implementation

### Step 5: Interactive Clarification

For each question:
1. Present the question to the user
2. Wait for their response
3. Update the specification with the clarification
4. Mark the question as resolved

### Step 6: Update Specification

Once all questions are answered:
1. Remove placeholder content
2. Add specific, measurable criteria
3. Resolve conflicting requirements
4. Add missing information
5. Update open questions section
6. Add clarification notes where needed

### Step 7: Validate Changes

Ensure:
- All vague terms are now measurable
- All placeholders are replaced with specific values
- Conflicts are resolved
- No new ambiguities were introduced

### Output

Provide:
- Summary of clarifications made
- Updated specification path
- Remaining open questions (if any)
- Recommendation to run `/speckit-analyze` to verify consistency

**Note**: This command should be run iteratively until all CRITICAL and HIGH priority ambiguities are resolved before proceeding to `/speckit-plan`.
