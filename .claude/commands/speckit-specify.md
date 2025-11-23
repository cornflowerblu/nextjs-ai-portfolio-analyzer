---
description: Create a comprehensive feature specification from user requirements
---

## Instructions

You are creating a Speckit feature specification for Claude Code.

### Step 1: Gather Requirements

If the user hasn't provided complete requirements, ask clarifying questions about:
- Feature goals and objectives
- Target users and use cases
- Functional requirements
- Non-functional requirements (performance, security, scalability)
- Constraints and dependencies
- Success criteria

### Step 2: Create Specification Structure

Generate a `spec.md` file with the following sections:

#### 1. Overview
- Feature name
- Brief description (2-3 sentences)
- Business context and motivation
- Target completion date (if applicable)

#### 2. Goals and Non-Goals
- **Goals**: What this feature WILL accomplish
- **Non-Goals**: What this feature explicitly WILL NOT address (to prevent scope creep)

#### 3. User Stories

Format user stories as:
```
**[Priority] As a [user type], I want to [action] so that [benefit]**

Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

Priorities: P1 (Must Have), P2 (Should Have), P3 (Nice to Have)

#### 4. Functional Requirements

List specific functional requirements:
- FR1: [Requirement description]
- FR2: [Requirement description]

Be specific and measurable. Avoid vague terms like "fast" or "easy to use" without defining metrics.

#### 5. Non-Functional Requirements

Cover:
- Performance (response times, throughput, etc.)
- Security (authentication, authorization, data protection)
- Scalability (concurrent users, data volume)
- Reliability (uptime, error rates)
- Usability (accessibility, UX standards)
- Maintainability (code quality, documentation)

#### 6. Technical Constraints

Document:
- Technology stack limitations
- Third-party dependencies
- Integration requirements
- Platform requirements
- Compliance requirements

#### 7. Edge Cases and Error Handling

List edge cases and how they should be handled:
- Invalid inputs
- Network failures
- Rate limiting
- Concurrent operations
- Data consistency issues

#### 8. Open Questions

Track unresolved questions that need stakeholder input.

### Step 3: Validate Specification

Before finalizing:
1. Ensure all user stories have clear acceptance criteria
2. Verify requirements are specific and measurable
3. Check that success criteria are defined
4. Confirm edge cases are addressed
5. Validate against project constitution (if exists)

### Step 4: Save Specification

Save the specification to the appropriate specs directory following the project's naming convention.

### Output

Provide:
- Path to the generated spec.md
- Summary of user stories by priority
- Count of functional and non-functional requirements
- List of open questions that need resolution

**Note**: This specification will be used by `/speckit-plan` to generate the implementation plan and by `/speckit-tasks` to create the task breakdown.
