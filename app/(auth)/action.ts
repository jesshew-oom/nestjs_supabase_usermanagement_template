'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient as createClient } from '@/lib/server/server';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/utils/logger';
import { getAuthErrorMessage } from '@/lib/utils/auth-errors';

interface AuthResponse {
  success: boolean;
  message: string;
}

const formDataSchemaSignin = z.object({
  email: z.email(),
  password: z.string().min(6)
});

export async function login(formData: FormData): Promise<AuthResponse> {
  const requestId = crypto.randomUUID();
  const supabase = await createClient();

  logger.debug('Login attempt started', { requestId });

  const result = formDataSchemaSignin.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  if (!result.success) {
    logger.warn('Login validation failed', {
      requestId,
      validationErrors: result.error.flatten()
    });
    return {
      success: false,
      message: 'Invalid input credentials'
    };
  }

  const { email, password } = result.data;

  logger.debug('Attempting to sign in user', {
    requestId,
    email: email.substring(0, 3) + '***' // Partial email for logging
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    logger.error('Login failed', {
      requestId,
      email: email.substring(0, 3) + '***',
      errorCode: error.code || 'unknown',
      errorStatus: error.status || 'unknown',
      errorMessage: error.message
    }, error);

    return {
      success: false,
      message: getAuthErrorMessage(error)
    };
  }

  logger.info('Login successful', {
    requestId,
    userId: data.user?.id,
    email: email.substring(0, 3) + '***'
  });

  revalidatePath('/', 'layout');
  return {
    success: true,
    message: 'Successfully logged in'
  };
}

const formDataSchemaSignup = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional()
});

export async function signup(formData: FormData): Promise<AuthResponse> {
  const requestId = crypto.randomUUID();
  const supabase = await createClient();

  logger.debug('Signup attempt started', { requestId });

  const result = formDataSchemaSignup.safeParse({
    email: formData.get('email') ? String(formData.get('email')) : '',
    password: formData.get('password') ? String(formData.get('password')) : '',
    fullName: formData.get('fullName')
      ? String(formData.get('fullName'))
      : undefined
  });

  if (!result.success) {
    logger.warn('Signup validation failed', {
      requestId,
      validationErrors: result.error.flatten()
    });
    return {
      success: false,
      message: 'Invalid input data. Please check your email and password.'
    };
  }

  const { email, password, fullName } = result.data;

  logger.debug('Attempting to create user account', {
    requestId,
    email: email.substring(0, 3) + '***',
    hasFullName: !!fullName
  });

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { full_name: fullName ?? 'default_user' }
    }
  });

  if (error) {
    logger.error('Signup failed', {
      requestId,
      email: email.substring(0, 3) + '***',
      errorCode: error.code || 'unknown',
      errorStatus: error.status || 'unknown',
      errorMessage: error.message
    }, error);

    return {
      success: false,
      message: getAuthErrorMessage(error)
    };
  }

  logger.info('Signup successful', {
    requestId,
    userId: data.user?.id,
    email: email.substring(0, 3) + '***',
    emailConfirmed: data.user?.email_confirmed_at ? true : false
  });

  return {
    success: true,
    message: 'Check your email to confirm your account'
  };
}

const formDataSchemaReset = z.object({
  email: z.string().email()
});

export async function resetPasswordForEmail(
  formData: FormData
): Promise<AuthResponse> {
  const requestId = crypto.randomUUID();
  const supabase = await createClient();
  const email = formData.get('email') ? String(formData.get('email')) : '';

  logger.debug('Password reset request started', { requestId });

  const result = formDataSchemaReset.safeParse({ email: email });

  if (!result.success) {
    logger.warn('Password reset validation failed', {
      requestId,
      validationErrors: result.error.flatten()
    });
    return {
      success: false,
      message: 'Invalid email address'
    };
  }

  logger.debug('Attempting to send password reset email', {
    requestId,
    email: email.substring(0, 3) + '***'
  });

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    logger.error('Password reset email failed', {
      requestId,
      email: email.substring(0, 3) + '***',
      errorCode: error.code || 'unknown',
      errorStatus: error.status || 'unknown',
      errorMessage: error.message
    }, error);

    return {
      success: false,
      message: getAuthErrorMessage(error)
    };
  }

  logger.info('Password reset email sent successfully', {
    requestId,
    email: email.substring(0, 3) + '***'
  });

  return {
    success: true,
    message: 'Check your email to continue the password reset process'
  };
}

const formDataSchemaResend = z.object({
  email: z.string().email()
});

export async function resendConfirmationEmail(
  prevState: AuthResponse,
  formData: FormData
): Promise<AuthResponse> {
  const requestId = crypto.randomUUID();
  const supabase = await createClient();
  const email = formData.get('email') ? String(formData.get('email')) : '';

  logger.debug('Resend confirmation email request started', { requestId });

  const result = formDataSchemaResend.safeParse({ email: email });

  if (!result.success) {
    logger.warn('Resend confirmation email validation failed', {
      requestId,
      validationErrors: result.error.flatten()
    });
    return {
      success: false,
      message: 'Invalid email address'
    };
  }

  logger.debug('Attempting to resend confirmation email', {
    requestId,
    email: email.substring(0, 3) + '***'
  });

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email
  });

  if (error) {
    logger.error('Resend confirmation email failed', {
      requestId,
      email: email.substring(0, 3) + '***',
      errorCode: error.code || 'unknown',
      errorStatus: error.status || 'unknown',
      errorMessage: error.message
    });

    return {
      success: false,
      message: getAuthErrorMessage(error)
    };
  }

  logger.info('Resend confirmation email sent successfully', {
    requestId,
    email: email.substring(0, 3) + '***'
  });

  return {
    success: true,
    message: 'Check your email to confirm your account'
  };
}

export async function signout() {
  const requestId = crypto.randomUUID();
  const supabase = await createClient();

  logger.debug('Signout attempt started', { requestId });

  const signOutResult = await supabase.auth.signOut();

  if (signOutResult.error) {
    logger.error('Signout failed', {
      requestId,
      errorCode: signOutResult.error.code || 'unknown',
      errorMessage: signOutResult.error.message
    }, signOutResult.error);

    redirect('/?error=' + encodeURIComponent('Logout error'));
  } else {
    logger.info('Signout successful', { requestId });
    redirect('/');
  }
}
