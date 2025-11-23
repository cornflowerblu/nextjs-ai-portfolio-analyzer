# Architectural Review Notes

This document contains findings from the code review triage that require human decision-making or architectural discussion.

## Issues Requiring Human Review

### 1. Access Control Exposure via NEXT_PUBLIC_ Environment Variables

**Location**: `lib/firebase/access-control.ts`

**Current Implementation**:
```typescript
const allowedEmails = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '').split(',').filter(Boolean);
const allowedDomains = (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || '').split(',').filter(Boolean);
```

**Issue**: The `NEXT_PUBLIC_` prefix in Next.js means these environment variables are exposed to the client bundle. This reveals the access control allowlist to anyone who inspects the JavaScript bundle.

**Security Impact**: 
- **Low to Medium**: While knowing allowed emails/domains doesn't grant access (authentication still required), it does reveal:
  - Which email addresses/domains have access to the application
  - Potential targets for social engineering or phishing
  - Business relationship information (e.g., partner organizations)

**Current Behavior**:
- The allowlist IS used server-side for actual authorization decisions
- It's ALSO available client-side for early validation (UX improvement to show "access denied" before sign-in attempt)

**Options for Consideration**:

#### Option A: Keep Current Approach (Client + Server)
**Pros**:
- Better UX - users get immediate feedback if their email/domain isn't allowed
- No server round-trip needed for validation
- Simpler implementation

**Cons**:
- Exposes allowlist to public
- Potential privacy/security concern

**Risk**: Low - authentication is still required, only metadata is exposed

#### Option B: Move to Server-Side Only
**Pros**:
- Allowlist remains private
- Standard security practice

**Cons**:
- Users only discover access restrictions after attempting sign-in
- Extra server round-trip for validation
- Slightly worse UX

**Implementation**:
1. Remove `NEXT_PUBLIC_` prefix → make them server-only vars
2. Update client to remove pre-validation
3. Rely on server-side `/api/auth/verify` endpoint for all access control

#### Option C: Hybrid Approach
**Pros**:
- Compromise between security and UX
- Only expose domain list, keep email list private

**Cons**:
- More complex implementation
- Still exposes domain information

**Implementation**:
1. Keep `NEXT_PUBLIC_ALLOWED_DOMAINS` (less sensitive)
2. Move `ALLOWED_EMAILS` server-side only
3. Client shows message: "Access restricted to certain domains" without listing them

**Recommendation Needed**: 
- What is the business sensitivity of the allowlist?
- Is revealing allowed domains acceptable?
- How important is the pre-sign-in validation UX?

---

### 2. Redis Client Singleton Pattern and Connection Lifecycle

**Location**: `lib/storage/kv.ts`

**Current Implementation**:
```typescript
let client: ReturnType<typeof createClient> | null = null;

export async function getKVClient() {
  if (client) {
    if (client.isOpen) {
      return client;
    } else {
      // Attempt to reconnect if client is not open
      try {
        await client.connect();
        return client;
      } catch (err) {
        console.error('Failed to reconnect Redis client:', err);
        client = null;
      }
    }
  }
  // ... create new client
}
```

**Issues**:

#### 2.1 Connection Pool Management
- Singleton pattern shares one connection across all requests
- In serverless environment (Vercel), function instances may be reused
- Connection may become stale between invocations

**Potential Problems**:
- Connection timeouts not explicitly handled
- No connection pool configuration
- Reconnection logic may fail silently

#### 2.2 Error Recovery
- When reconnection fails, client is set to null
- Next call will create a new client, but old client is not explicitly closed
- Potential resource leak

#### 2.3 Graceful Shutdown
- `closeKVConnection()` exists but may not be called reliably
- In serverless, function may be frozen with open connections

**Options for Consideration**:

#### Option A: Keep Current Singleton (Simplest)
**Pros**:
- Works for most cases
- Simple to understand
- Good for serverless cold starts

**Cons**:
- May have connection issues in edge cases
- No connection pooling

**Improvements**:
1. Add explicit timeout handling
2. Improve error logging
3. Add connection health checks

#### Option B: Use Vercel KV SDK Instead
**Pros**:
- Built specifically for Vercel serverless environment
- Handles connection management automatically
- Better serverless integration

**Cons**:
- Migration effort required
- Current implementation using `redis` package works

**Implementation**:
```typescript
import { kv } from '@vercel/kv';

export async function kvSet<T>(key: string, value: T, options?: KVSetOptions) {
  await kv.set(key, value, options);
}
```

#### Option C: Implement Connection Pool
**Pros**:
- More robust for high-traffic scenarios
- Better resource management

**Cons**:
- More complex
- May not be necessary for serverless

**Recommendation Needed**:
- Have there been any Redis connection issues in production?
- Is the current approach causing problems?
- Would migration to `@vercel/kv` SDK be acceptable?

---

### 3. Source Code Viewer - Trusted HTML Rendering

**Location**: `components/lab/source-code-viewer.tsx`

**Current Implementation**:
Uses `dangerouslySetInnerHTML` to render Shiki-highlighted code.

**Note**: While flagged during review, this is **actually secure**:
- Input (`code` prop) is controlled by developers, not users
- Shiki is a well-maintained, trusted syntax highlighter
- Has HTML escaping fallback for errors
- Standard practice for syntax highlighting

**No Action Required**: This is documented for completeness but is not a security concern.

---

## Decision Required

For each issue above, please provide:
1. **Decision**: Which option to pursue (A, B, C, or other)
2. **Priority**: High/Medium/Low
3. **Timeline**: Immediate fix, next sprint, or backlog
4. **Rationale**: Business context for the decision

## Follow-up Actions

Once decisions are made:
- [ ] Create GitHub issues for approved changes
- [ ] Estimate effort for implementation
- [ ] Add to backlog/roadmap
- [ ] Document decisions in this file

---

**Review Date**: 2025-11-23  
**Reviewed By**: GitHub Copilot Code Review Triage Agent  
**Status**: Awaiting human decision
