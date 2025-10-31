'use client';
import React, { useState, type FC, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword } from './action';
import { Lock, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import Message from './messages';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/client/client';

interface InviteUserPasswordUpdateFormProps {
  email?: string;
}

const InviteUserPasswordUpdateForm: FC<InviteUserPasswordUpdateFormProps> = ({ email }) => {
  const router = useRouter();
  const [emailState, setEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  useEffect(() => {
    const allRequirementsMet = Object.values(passwordRequirements).every(
      (req) => req
    );
    const passwordsMatch = newPassword === confirmPassword;
    setIsFormValid(allRequirementsMet && passwordsMatch && newPassword !== '');
  }, [newPassword, confirmPassword, passwordRequirements]);

  useEffect(() => {
    const supabase = createClient();
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');

    if (access_token && refresh_token) {
      supabase.auth
        .setSession({
          access_token,
          refresh_token
        })
        .then(({ data, error }) => {
          if (error) {
            console.error('Error setting session:', error);
            // Optionally, redirect to an error page
            // router.push('/error');
          } else if (data.user) {
            setEmail(data.user.email || '');
          }
        });
    }
  }, [router]);

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
    setPasswordRequirements(requirements);
  };

  const handleSubmit = async (formData: FormData) => {
    // Check if the passwords match
    if (newPassword !== confirmPassword) {
      // Passwords don't match, form shouldn't be submittable if button is disabled.
      // This is a fallback.
      return;
    }
    await resetPassword(formData);
  };

  return (
    <div className="flex justify-center items-center w-full max-w-[800px] mx-auto">
      <Card className="flex flex-col self-center rounded-2xl w-full sm:w-[350px] md:w-[500px] shadow-[0px_5px_15px_0px_rgba(0,0,0,0.05),0px_15px_35px_-5px_rgba(25,28,33,0.05),0px_0px_0px_1px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-2">
          <CardTitle>Update Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={handleSubmit}
            noValidate
            className="flex flex-col w-full gap-y-2 md:gap-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={emailState}
                disabled
                className="pl-4 py-5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    validatePassword(e.target.value);
                  }}
                  autoComplete="new-password"
                  className="pl-10 py-5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pl-10 py-5"
                />
              </div>
            </div>

            <Suspense fallback={null}>
              <Message />
            </Suspense>

            <SubmitButton isFormValid={isFormValid} />
          </form>
        </CardContent>
      </Card>

      <div className="hidden sm:flex justify-center items-center ml-2">
        <PasswordRequirements requirements={passwordRequirements} />
      </div>
    </div>
  );
};

export default InviteUserPasswordUpdateForm;

function SubmitButton({ isFormValid }: { isFormValid: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex justify-center mt-2">
      <Button type="submit" disabled={pending || !isFormValid} className="w-[200px]">
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          'Update Password'
        )}
      </Button>
    </div>
  );
}

interface PasswordRequirementsProps {
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
  };
}

function PasswordRequirements({ requirements }: PasswordRequirementsProps) {
  return (
    <div className="w-[240px] bg-white shadow-md rounded-2xl p-4 ml-2">
      <p className="text-sm font-semibold mb-2">Password Requirements:</p>
      <ul className="pl-5 m-0 space-y-1">
        <li className={requirements.length ? 'text-green-600' : 'text-red-600'}>
          Length (at least 6 characters)
        </li>
        <li
          className={requirements.uppercase ? 'text-green-600' : 'text-red-600'}
        >
          Uppercase letter
        </li>
        <li
          className={requirements.lowercase ? 'text-green-600' : 'text-red-600'}
        >
          Lowercase letter
        </li>
        <li className={requirements.number ? 'text-green-600' : 'text-red-600'}>
          Number
        </li>
      </ul>
    </div>
  );
}
