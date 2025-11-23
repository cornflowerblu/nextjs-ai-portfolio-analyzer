---
description: Create domain-specific checklists for quality assurance
---

## Instructions

You are creating domain-specific quality assurance checklists for a Speckit feature.

### Step 1: Load Feature Context

Read from the specs directory:
- `spec.md` (requirements and user stories)
- `plan.md` (technical approach)
- `data-model.md` (data entities, if exists)
- `contracts/` (API contracts, if exists)

### Step 2: Determine Checklist Types

Based on the feature requirements, create relevant checklists:

**Common Checklist Types**:
- **requirements.md**: Verify all requirements are addressed
- **security.md**: Security considerations and best practices
- **ux.md**: User experience and accessibility
- **performance.md**: Performance benchmarks and optimization
- **testing.md**: Test coverage and quality
- **accessibility.md**: WCAG compliance and accessibility features
- **documentation.md**: Documentation completeness
- **deployment.md**: Deployment readiness

Select checklist types based on:
- Non-functional requirements in spec.md
- Technical constraints in plan.md
- User stories and acceptance criteria
- Domain-specific needs (e.g., healthcare = HIPAA checklist, fintech = PCI-DSS checklist)

### Step 3: Generate Checklists

For each checklist type, create a markdown file with:

**Structure**:
```markdown
# [Domain] Checklist

## Overview
Brief description of what this checklist validates.

## Checklist Items

### [Category 1]
- [ ] Item 1: Description and success criteria
- [ ] Item 2: Description and success criteria

### [Category 2]
- [ ] Item 1: Description and success criteria
- [ ] Item 2: Description and success criteria

## Notes
Additional context or references.
```

**Requirements Checklist Example**:
```markdown
# Requirements Checklist

## Functional Requirements
- [ ] FR1: User authentication implemented and tested
- [ ] FR2: Data validation on all input fields
- [ ] FR3: Export functionality supports CSV and JSON

## Non-Functional Requirements
- [ ] NFR1: API response time < 200ms for 95th percentile
- [ ] NFR2: System handles 10k concurrent users
- [ ] NFR3: 99.9% uptime SLA maintained
```

**Security Checklist Example**:
```markdown
# Security Checklist

## Authentication & Authorization
- [ ] User authentication required for all protected endpoints
- [ ] JWT tokens expire after configured duration
- [ ] Refresh token rotation implemented
- [ ] Role-based access control (RBAC) enforced

## Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] TLS 1.2+ for data in transit
- [ ] PII properly masked in logs
- [ ] Database credentials stored in secure vault

## Input Validation
- [ ] All user inputs sanitized
- [ ] SQL injection prevention implemented
- [ ] XSS protection enabled
- [ ] CSRF tokens validated
```

### Step 4: Map to User Stories

For each user story in spec.md, ensure checklist items validate:
- Acceptance criteria are met
- Edge cases are handled
- Error scenarios are tested

### Step 5: Add Constitution Validation

If `.specify/memory/constitution.md` exists:
- Extract MUST and SHOULD requirements
- Add checklist items for each principle
- Ensure constitutional compliance is verifiable

### Step 6: Save Checklists

Save all checklists to:
```
[FEATURE_DIR]/checklists/[domain].md
```

Create the `checklists/` directory if it doesn't exist.

### Step 7: Validation

Ensure checklists are:
- **Specific**: Each item has clear success criteria
- **Measurable**: Can be verified as complete/incomplete
- **Actionable**: Clear what needs to be done
- **Relevant**: Tied to requirements or best practices
- **Testable**: Can be validated objectively

### Output

Provide:
- List of generated checklists with paths
- Total checklist items per domain
- Summary of what each checklist validates
- Recommendation to review checklists before running `/speckit-implement`

**Note**: These checklists will be checked by `/speckit-implement` before starting implementation. All items should be reviewed and marked complete before proceeding.
