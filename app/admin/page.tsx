import React from 'react';
import { type Metadata } from 'next';
import InviteForm from './InviteForm';
import { getSession } from '@/lib/server/supabase';
import { redirect } from 'next/navigation';

// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import {
//   AlertTriangle,
//   AlertCircle,
//   ShieldAlert,
//   ShieldX,
//   AlertOctagon,
//   Lock,
//   Loader2
// } from 'lucide-react';
// import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Invite new users to the platform.'
};

export default async function AdminPage() {
  const session = await getSession();

  console.log(session);
  // if (session?.user_role !== 'admin') {
  //   // redirect('/');
  //   return <div>You are not authorized to access this page.</div>;
  // }

  return (
    <div className="min-h-[calc(100vh-44px)] flex items-center justify-center">
      <InviteForm />
    </div>
  );
}
