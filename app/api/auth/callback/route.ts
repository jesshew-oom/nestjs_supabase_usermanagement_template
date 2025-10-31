import { type EmailOtpType } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server/server';
import { logger } from '@/lib/utils/logger';
import { getAuthErrorMessage } from '@/lib/utils/auth-errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash_searchParam = searchParams.get('token_hash');
  const code = searchParams.get('code');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';
  const redirectTo = request.nextUrl.clone();
  const requestId = crypto.randomUUID();

  const token_hash = code ?? token_hash_searchParam;

  logger.info('Auth callback request received', {
    requestId,
    hasTokenHash: !!token_hash,
    hasCode: !!code,
    type,
    nextUrl: next,
    userAgent: request.headers.get('user-agent') || 'unknown'
  });

  if (!token_hash || !type) {
    logger.warn('Auth callback request missing required parameters', {
      requestId,
      hasTokenHash: !!token_hash,
      hasType: !!type,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    redirectTo.pathname = '/';
    redirectTo.searchParams.set(
      'error',
      encodeURIComponent('Invalid authentication attempt. Please try again.')
    );

    // Clean up unnecessary parameters
    redirectTo.searchParams.delete('token_hash');
    redirectTo.searchParams.delete('code');
    redirectTo.searchParams.delete('type');
    redirectTo.searchParams.delete('next');

    return NextResponse.redirect(redirectTo);
  }

  try {
    const supabase = await createServerSupabaseClient();

    logger.debug('Attempting to verify OTP', {
      requestId,
      type,
      tokenLength: token_hash.length
    });

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash
    });

    if (error) {
      logger.error('OTP verification failed', {
        requestId,
        type,
        errorCode: error.code || 'unknown',
        errorStatus: error.status || 'unknown',
        errorMessage: error.message
      }, error);

      const userMessage = getAuthErrorMessage(error);
      redirectTo.pathname = '/';
      redirectTo.searchParams.set(
        'error',
        encodeURIComponent(userMessage)
      );
    } else if (data?.session) {
      logger.info('OTP verification successful', {
        requestId,
        type,
        userId: data.user?.id,
        userEmail: data.user?.email,
        redirectTo: next
      });

      redirectTo.pathname = next;
      redirectTo.searchParams.set(
        'message',
        encodeURIComponent('You can now sign in.')
      );
    } else {
      logger.warn('OTP verification succeeded but no session returned', {
        requestId,
        type
      });

      redirectTo.pathname = '/';
      redirectTo.searchParams.set(
        'error',
        encodeURIComponent('Authentication failed. Please try again.')
      );
    }
  } catch (unexpectedError) {
    logger.error('Unexpected error during OTP verification', {
      requestId,
      type
    }, unexpectedError);

    redirectTo.pathname = '/';
    redirectTo.searchParams.set(
      'error',
      encodeURIComponent('An unexpected error occurred. Please try again.')
    );
  }

  // Clean up unnecessary parameters
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('code');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');

  return NextResponse.redirect(redirectTo);
}
