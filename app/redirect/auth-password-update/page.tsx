import 'server-only';
import React from 'react';
import PasswordUpdateForm from './PasswordUpdateForm';
import { createClient } from '@/lib/server/server';
import { redirect } from 'next/navigation';

export default async function PasswordUpdatePage() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect('/signin');
  }
  return <PasswordUpdateForm email={session.user.email} />;
}
