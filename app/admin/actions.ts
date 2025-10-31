'use server';

import { createAdminClient } from '@/lib/server/admin';
import { z } from 'zod';
import { getAuthErrorMessage } from '@/lib/utils/auth-errors';
import { logger } from '@/lib/utils/logger';

interface InviteResponse {
  success: boolean;
  message: string;
}

const formDataSchemaInvite = z.object({
  email: z.string().email()
});

export async function inviteUser(
  prevState: InviteResponse,
  formData: FormData
): Promise<InviteResponse> {
  const requestId = crypto.randomUUID();
  const supabase = createAdminClient();
  const email = formData.get('email') ? String(formData.get('email')) : '';

  logger.debug('Invite user request started', { requestId });

  const result = formDataSchemaInvite.safeParse({ email: email });

  if (!result.success) {
    logger.warn('Invite user validation failed', {
      requestId,
      validationErrors: result.error.flatten()
    });
    return {
      success: false,
      message: 'Invalid email address'
    };
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'http://localhost:3001/redirect/auth-password-update'
  });

  if (error) {
    logger.error('Invite user failed', {
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

  logger.info('Invite user successful', {
    requestId,
    userId: data.user?.id,
    email: email.substring(0, 3) + '***'
  });

  return {
    success: true,
    message: 'Invitation sent successfully.'
  };
}
