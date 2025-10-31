/**
 * Authentication error message mapping utility
 * 
 * Maps Supabase Auth error codes to user-friendly, actionable error messages
 * while maintaining security best practices.
 */

interface SupabaseError {
  message?: string;
  status?: number;
  code?: string;
}

/**
 * Maps Supabase Auth error codes to user-friendly messages
 */
export function getAuthErrorMessage(error: SupabaseError | null | undefined): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  const errorCode = error.code || '';
  const errorMessage = error.message || '';

  // Map known Supabase Auth error codes to user-friendly messages
  const errorCodeMap: Record<string, string> = {
    // Email confirmation errors
    'email_not_confirmed': 'Please verify your email address before signing in.',
    'email_link_invalid': 'This verification link is invalid or has expired. Please request a new verification email.',
    'email_link_expired': 'This verification link has expired. Please request a new verification email.',
    'token_not_found': 'Verification token not found. Please request a new verification email.',
    'invalid_token': 'Invalid verification token. Please request a new verification email.',
    
    // Authentication errors
    'invalid_credentials': 'Invalid email or password. Please check your credentials and try again.',
    'invalid_email': 'Invalid email address. Please check your email and try again.',
    'invalid_password': 'Password must be at least 6 characters long.',
    'user_not_found': 'No account found with this email address.',
    'user_already_registered': 'An account with this email already exists. Please sign in instead.',
    'signup_disabled': 'New account registration is currently disabled. Please contact support.',
    
    // Session errors
    'session_not_found': 'Your session has expired. Please sign in again.',
    'session_expired': 'Your session has expired. Please sign in again.',
    'invalid_session': 'Invalid session. Please sign in again.',
    
    // Rate limiting
    'too_many_requests': 'Too many requests. Please wait a moment and try again.',
    
    // Network/Server errors
    'network_error': 'Network error. Please check your connection and try again.',
    'server_error': 'A server error occurred. Please try again later.',
  };

  // Check for specific error codes first
  if (errorCode && errorCodeMap[errorCode]) {
    return errorCodeMap[errorCode];
  }

  // Check error message for common patterns
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes('email') && lowerMessage.includes('already')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  
  if (lowerMessage.includes('password') && lowerMessage.includes('weak')) {
    return 'Password is too weak. Please choose a stronger password.';
  }
  
  if (lowerMessage.includes('expired') || lowerMessage.includes('expiry')) {
    return 'This verification link has expired. Please request a new verification email.';
  }
  
  if (lowerMessage.includes('invalid') || lowerMessage.includes('malformed')) {
    return 'Invalid verification link. Please request a new verification email.';
  }
  
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Check HTTP status codes
  if (error.status === 400) {
    return 'Invalid request. Please check your information and try again.';
  }
  
  if (error.status === 401) {
    return 'Authentication failed. Please verify your credentials and try again.';
  }
  
  if (error.status === 403) {
    return 'Access denied. Please verify your email address or contact support.';
  }
  
  if (error.status === 404) {
    return 'Resource not found. Please check your verification link and try again.';
  }
  
  if (error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (error.status === 500 || error.status === 502 || error.status === 503) {
    return 'A server error occurred. Please try again later.';
  }

  // Generic fallback - sanitize original message
  if (errorMessage) {
    // Don't expose internal error details, but provide a helpful generic message
    return 'Authentication failed. Please check your information and try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Checks if an error is a user-facing error (vs. system error)
 */
export function isUserError(error: SupabaseError | null | undefined): boolean {
  if (!error) return false;
  
  const userErrorCodes = [
    'email_not_confirmed',
    'email_link_invalid',
    'email_link_expired',
    'invalid_credentials',
    'invalid_email',
    'invalid_password',
    'user_not_found',
    'user_already_registered',
    'session_expired',
    'too_many_requests'
  ];
  
  return error.code ? userErrorCodes.includes(error.code) : false;
}

