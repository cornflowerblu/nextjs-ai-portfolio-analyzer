# Security Policy

## Supported Versions

This project is currently in active development (v0.1.0). Security updates will be provided for the latest version.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Known Security Considerations

### Dependency Vulnerabilities (Development Only)

As of the last review, npm audit reports 3 vulnerabilities in the `hono` package:

```
hono <=4.10.2
- Severity: high
- Issues:
  1. Body Limit Middleware Bypass (moderate, GHSA-92vj-g62v-jqhh)
  2. Improper Authorization vulnerability (high, GHSA-m732-5p4w-x69g)
  3. Vary Header Injection leading to potential CORS Bypass (moderate, GHSA-q7jf-gf43-6x6p)
```

**Risk Assessment**: These vulnerabilities are **development-only** and do **NOT** affect production:
- `hono` is not a direct dependency in our `package.json`
- It's a transitive dependency: `prisma@7.0.0` → `@prisma/dev@0.13.0` → `hono@4.7.10`
- `@prisma/dev` is only used by Prisma's development tooling, not in production runtime
- Our production code does not execute any code from `@prisma/dev` or `hono`

**Action Taken**: Documented as accepted risk for development environment. Will be resolved when Prisma updates `@prisma/dev` dependency.

**Mitigation**: If needed, the fix requires a breaking change to Prisma (`npm audit fix --force` suggests downgrading to `prisma@6.19.0`), which would require testing all database operations. The security benefit does not outweigh the testing burden since this is dev-only.

### XSS Prevention Measures

The codebase includes several XSS prevention measures:

1. **Google Analytics**: Measurement ID is validated with regex and sanitized before script injection
2. **Code Viewer**: Uses trusted Shiki library for syntax highlighting with HTML escaping fallback
3. **API Input Validation**: All API endpoints use Zod schemas for input validation
4. **URL Analysis**: URLs are validated before being passed to Lighthouse

### Authentication & Authorization

- Firebase Authentication is used for user identity
- Server-side token verification with Firebase Admin SDK
- Email/domain allowlist for access control
- Session cookies with `httpOnly` and `secure` flags in production

### Data Storage

- Redis (Vercel KV) for caching with TTL
- Postgres (via Prisma) for persistent data
- All database queries use parameterized queries via Prisma ORM (SQL injection protected)

## Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. Email the maintainer directly (see repository owner)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Best Practices in This Project

1. **Environment Variables**: Sensitive data stored in environment variables, never committed
2. **Input Validation**: All user input validated with Zod schemas
3. **Output Encoding**: Proper escaping of dynamic content in UI
4. **Authentication**: Server-side token verification for protected routes
5. **HTTPS**: Enforced in production via Vercel platform
6. **Dependencies**: Regular updates and security audits
7. **CSP**: Content Security Policy headers configured in Next.js config
8. **Rate Limiting**: Lighthouse API calls are cached to prevent abuse

## Automated Security Checks

- Pre-commit hooks run linting and tests
- Pre-push hooks verify build success
- GitHub Dependabot alerts for vulnerable dependencies
- npm audit run as part of CI/CD pipeline
