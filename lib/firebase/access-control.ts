/**
 * Access Control Utilities
 * Shared logic for validating user access based on email allowlist and domain restriction
 */

/**
 * Check if user has access based on email allowlist and domain restriction
 * @param email - User's email address
 * @returns true if user is allowed, false otherwise
 */
export function isUserAllowed(email: string | null | undefined): boolean {
  if (!email) return false;

  const allowedEmails = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '').split(',').filter(Boolean);
  const allowedDomains = (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || '').split(',').filter(Boolean);
  
  const emailLower = email.toLowerCase();
  
  // Check exact email match
  if (allowedEmails.some(allowed => allowed.toLowerCase() === emailLower)) {
    return true;
  }

  // Check domain match
  const emailDomain = emailLower.split('@')[1];
  if (emailDomain && allowedDomains.some(domain => domain.toLowerCase() === emailDomain)) {
    return true;
  }

  return false;
}
