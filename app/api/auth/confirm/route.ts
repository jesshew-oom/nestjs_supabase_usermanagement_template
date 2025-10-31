import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server/server';
import { logger } from '@/lib/utils/logger';
import { getAuthErrorMessage } from '@/lib/utils/auth-errors';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/signin';
  const requestId = crypto.randomUUID();

  logger.info('Email confirmation request received', {
    requestId,
    hasCode: !!code,
    nextUrl: next,
    origin
  });

  if (!code) {
    logger.warn('Email confirmation request missing code parameter', {
      requestId,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    const redirectTo = new URL('/signin', origin);
    redirectTo.searchParams.set(
      'error',
      encodeURIComponent('Invalid verification link. Please request a new verification email.')
    );
    return NextResponse.redirect(redirectTo);
  }

  try {
    const supabase = await createServerSupabaseClient();

    logger.debug('Attempting to exchange code for session', {
      requestId,
      codeLength: code.length
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error('Failed to exchange code for session', {
        requestId,
        errorCode: error.code || 'unknown',
        errorStatus: error.status || 'unknown',
        errorMessage: error.message
      }, error);

      const userMessage = getAuthErrorMessage(error);
      const redirectTo = new URL('/signin', origin);
      redirectTo.searchParams.set(
        'error',
        encodeURIComponent(userMessage)
      );
      return NextResponse.redirect(redirectTo);
    }

    if (!data.session) {
      logger.warn('Code exchange succeeded but no session returned', {
        requestId
      });

      const redirectTo = new URL('/signin', origin);
      redirectTo.searchParams.set(
        'error',
        encodeURIComponent('Verification failed. Please try again.')
      );
      return NextResponse.redirect(redirectTo);
    }

    logger.info('Email confirmation successful', {
      requestId,
      userId: data.user?.id,
      userEmail: data.user?.email,
      redirectTo: next
    });

    const redirectTo = new URL(next, origin);
    redirectTo.searchParams.set(
      'message',
      encodeURIComponent('You are now signed in')
    );
    return NextResponse.redirect(redirectTo);
  } catch (unexpectedError) {
    logger.error('Unexpected error during email confirmation', {
      requestId
    }, unexpectedError);

    const redirectTo = new URL('/signin', origin);
    redirectTo.searchParams.set(
      'error',
      encodeURIComponent('An unexpected error occurred. Please try again.')
    );
    return NextResponse.redirect(redirectTo);
  }
}
