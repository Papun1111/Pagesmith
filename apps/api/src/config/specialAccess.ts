/**
 * Special access emails that receive the Hashira plan for free.
 * Add emails here to grant full access to all features and bypass rate limits.
 * 
 * This is the SINGLE SOURCE OF TRUTH for special access.
 * Used by: userService (plan assignment), rateLimiter (bypass).
 */
export const SPECIAL_ACCESS_EMAILS: readonly string[] = [
  'gohanmohapatra@gmail.com',
  'papunmohapatra1111@gmail.com',
  
];

/**
 * Checks if an email is in the special access list.
 */
export function isSpecialAccessEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return SPECIAL_ACCESS_EMAILS.includes(email.toLowerCase());
}
