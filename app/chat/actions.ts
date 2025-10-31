'use server';

import { getSession } from '@/lib/server/supabase';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/server/server';
import { createAdminClient } from '@/lib/server/admin';
import { refresh } from 'next/cache';
import { cookies } from 'next/headers';

export interface ChatPreview {
  id: string;
  firstMessage: string;
  created_at: string;
}

export async function fetchMoreChatPreviews(offset: number) {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const supabase = await createServerSupabaseClient();
  const limit = 30;

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(
        `
          id,
          created_at,
          chat_title,
          message_parts:message_parts!chat_session_id (
            text_text,
            type,
            role,
            order
          )
        `
      )
      .order('created_at', { ascending: false })
      .order('created_at', {
        ascending: true,
        referencedTable: 'message_parts'
      })
      .order('order', {
        ascending: true,
        referencedTable: 'message_parts'
      })
      .limit(1, { foreignTable: 'message_parts' })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const chatPreviews: ChatPreview[] = data.map((session) => {
      // Get the first text part from the first user message
      const firstTextPart = session.message_parts?.find(
        (part) => part.type === 'text' && part.role === 'user'
      );

      return {
        id: session.id,
        firstMessage:
          session.chat_title || firstTextPart?.text_text || 'No messages yet',
        created_at: session.created_at
      };
    });

    return chatPreviews;
  } catch (error) {
    console.error('Error fetching chat previews:', error);
    return [];
  }
}
export async function deleteChatData(chatId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }
  const supabase = await createServerSupabaseClient();
  try {
    // Delete chat session (message_parts will be deleted via CASCADE)
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', chatId);

    if (sessionError) throw sessionError;
    refresh()
    return { message: 'Chat data and references deleted successfully' };
  } catch (error) {
    console.error('Error during deletion:', error);
    return { message: 'Error deleting chat data' };
  }
}

const deleteFileSchema = z.object({
  file_name: z.string(),
  file_id: z.string()
});

export async function deleteFilterTagAndDocumentChunks(formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }
  try {
    const result = deleteFileSchema.safeParse({
      file_name: formData.get('file_name'),
      file_id: formData.get('file_id')
    });

    if (!result.success) {
      console.error('Validation failed:', result.error.issues);
      return {
        success: false,
        message: result.error.issues.map((issue) => issue.message).join(', ')
      };
    }

    const { file_name, file_id } = result.data;
    const userId = session.sub;

    // Delete the file from storage
    const supabase = await createServerSupabaseClient();
    const fileToDelete = userId + '/' + file_name;

    const { error: deleteError } = await supabase.storage
      .from('userfiles')
      .remove([fileToDelete]);

    if (deleteError) {
      console.error('Error deleting file from Supabase storage:', deleteError);
      return {
        success: false,
        message: 'Error deleting file from storage'
      };
    }

    // Find and delete document records with the matching filter tag
    // Vector records will be deleted automatically via ON DELETE CASCADE
    const { data: deletedData, error: docDeleteError } = await supabase
      .from('user_documents')
      .delete()
      .eq('user_id', userId)
      .eq('id', file_id)
      .select('id, title');

    if (docDeleteError) {
      console.error('Error deleting document records:', docDeleteError);
      return {
        success: false,
        message: 'Error deleting document metadata'
      };
    }

    const deletedCount = deletedData?.length || 0;
    
    refresh()

    return {
      success: true,
      message: `Successfully deleted file and ${deletedCount} associated documents`
    };
  } catch (error) {
    console.error('Error during deletion process:', error);
    return {
      success: false,
      message: 'Error deleting file and document chunks',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

const updateChatTitleSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  chatId: z.uuid('Invalid chat ID format')
});

export async function updateChatTitle(formData: FormData) {
  // Create an object from FormData
  const data = {
    title: formData.get('title'),
    chatId: formData.get('chatId')
  };

  // Validate the input
  const result = updateChatTitleSchema.safeParse(data);
  if (!result.success) {
    console.error('Invalid input:', result.error);
    throw new Error(`Invalid input: ${result.error.message}`);
  }

  // Continue with the validated data
  const { title, chatId } = result.data;

  const userId = await getSession();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const supabaseAdmin = createAdminClient();
  const { error: updateError } = await supabaseAdmin
    .from('chat_sessions')
    .update({ chat_title: title })
    .eq('id', chatId)
    .eq('user_id', userId.sub);

  if (updateError) {
    throw new Error(`Failed to update chat title: ${updateError.message}`);
  }

   refresh()

  return { success: true };
}

export async function setModelSettings(selectedOption: string) {
  const cookie = await cookies();

  cookie.set('selectedOption', selectedOption, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
}
