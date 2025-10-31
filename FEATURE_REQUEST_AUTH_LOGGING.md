# Feature Request: Enhanced Authentication Logging and Error Handling

## Overview
Implement comprehensive server-side logging and improved error handling for the authentication and provisioning flow. This addresses silent failures, debugging challenges, and provides better visibility into authentication operations.

## Background
Currently, the authentication flow lacks detailed logging in critical API routes (`app/api/auth/confirm/route.ts` and `app/api/auth/callback/route.ts`), making it difficult to debug issues when email confirmation fails. Additionally, the database trigger function (`handle_new_user`) has no error handling, which can lead to silent failures.

## Technical Context

### Current State
- Basic `console.error` logging exists only in `signup` server action
- API routes for email confirmation have no error logging
- Database trigger function has no error handling or logging
- User-facing error messages are generic and not actionable
- No structured logging format exists

### Dependencies
- Next.js 16 App Router
- Supabase Auth (`@supabase/supabase-js`)
- PostgreSQL database (for trigger function)

## Requirements

### 1. Structured Logging Utility
- Create a reusable logging utility that supports structured logging
- Support different log levels (error, warn, info, debug)
- Include contextual information (timestamp, request ID, user ID where applicable)
- Format logs in a way that's easy to parse and search
- Support for future integration with centralized logging services

### 2. Enhanced API Route Logging
**Files to update:**
- `app/api/auth/confirm/route.ts`
- `app/api/auth/callback/route.ts`

**Requirements:**
- Log all critical steps with appropriate log levels
- Log full error objects from Supabase (including error code, message, and status)
- Include request context (URL, query parameters, user agent if available)
- Log successful operations at info level
- Log failures at error level with full error details
- Include correlation IDs for tracing requests

### 3. Database Trigger Error Handling
**File to update:**
- `README.md` (SQL trigger function)

**Requirements:**
- Add explicit error handling using PostgreSQL `RAISE` statements
- Log errors using `RAISE LOG` before raising exceptions
- Include helpful error context (user ID, operation type)
- Prevent silent failures by raising exceptions for critical errors
- Update trigger function to handle edge cases (missing data, constraint violations)

### 4. Enhanced User-Facing Error Messages
**Files to update:**
- `app/api/auth/confirm/route.ts`
- `app/api/auth/callback/route.ts`
- `app/(auth)/action.ts`

**Requirements:**
- Map Supabase error codes to user-friendly messages
- Provide actionable guidance (e.g., "Your verification link has expired. Please request a new one.")
- Maintain security by not exposing sensitive system details
- Differentiate between user errors and system errors
- Include error codes in logs but not in user-facing messages

## Implementation Plan

### Priority 1: Core Logging Infrastructure
1. Create `lib/utils/logger.ts` with structured logging utility
2. Define log levels and structured log format
3. Support both development (console) and production (structured JSON) formats

### Priority 2: API Route Logging
1. Add comprehensive logging to `app/api/auth/confirm/route.ts`
   - Log incoming request details
   - Log code exchange attempts and results
   - Log full error objects with context
   - Log successful redirects
2. Add comprehensive logging to `app/api/auth/callback/route.ts`
   - Log incoming request details
   - Log OTP verification attempts and results
   - Log full error objects with context
   - Log successful authentication

### Priority 3: Server Action Logging Enhancement
1. Enhance existing logging in `app/(auth)/action.ts`
   - Improve error logging format
   - Add more context to error messages
   - Log validation failures with details

### Priority 4: Database Trigger Error Handling
1. Update `handle_new_user` trigger function in `README.md`
   - Add error handling with `RAISE LOG` for warnings
   - Add `RAISE EXCEPTION` for critical failures
   - Include error context in messages
   - Handle edge cases (NULL values, constraint violations)

### Priority 5: User-Facing Error Messages
1. Create error message mapping utility
2. Map Supabase error codes to user-friendly messages
3. Update all auth routes to use mapped error messages
4. Ensure security best practices (no sensitive data exposure)

## Edge Cases

### Authentication Flow Edge Cases
- Expired verification codes/tokens
- Invalid or malformed tokens
- Already verified users attempting verification again
- Network timeouts during Supabase API calls
- Malformed request parameters

### Database Trigger Edge Cases
- Missing `full_name` in metadata (should use default)
- NULL email (should not happen but handle gracefully)
- Duplicate user ID (constraint violation)
- Concurrent insertions (should be handled by database)

### Logging Edge Cases
- Logging failures (should not break authentication flow)
- Large error objects (should truncate or serialize safely)
- Sensitive data in logs (should sanitize PII where necessary)

## Acceptance Criteria

1. ✅ All authentication API routes log detailed error information
2. ✅ Database trigger function includes error handling and logging
3. ✅ User-facing error messages are specific and actionable
4. ✅ Logs are structured and parseable
5. ✅ No sensitive data (passwords, tokens) appears in logs
6. ✅ Error handling doesn't break existing functionality
7. ✅ Logging is performant and doesn't significantly impact response times

## Testing Considerations

- Test with invalid/expired verification codes
- Test with malformed requests
- Test database trigger with edge cases (NULL values, etc.)
- Verify logs are generated correctly in development and production
- Verify user-facing messages are appropriate and secure
- Test error message mapping with various Supabase error codes

## Future Enhancements (Out of Scope)

- Integration with centralized logging service (e.g., Datadog, Sentry)
- Log aggregation and analytics dashboard
- Alerting on authentication failures
- Rate limiting based on failed authentication attempts

## Notes

- Use structured logging format that can be easily parsed by log aggregation tools
- Consider environment-specific log levels (verbose in dev, error/warn in prod)
- Ensure GDPR compliance by not logging sensitive user data
- Maintain backward compatibility with existing error handling

