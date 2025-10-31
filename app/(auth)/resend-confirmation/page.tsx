'use client';

import { resendConfirmationEmail } from '@/app/(auth)/action';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormState, useFormStatus } from 'react-dom';

const initialState = {
  message: '',
  success: false
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Sending...' : 'Resend Email'}
    </Button>
  );
}

export default function ResendConfirmationPage() {
  const [state, formAction] = useFormState(
    resendConfirmationEmail,
    initialState
  );

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Resend Confirmation Email</CardTitle>
          <CardDescription>
            Enter your email to resend the confirmation link.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
            />
            {state?.message && (
              <p
                className={`mt-2 text-sm ${
                  state.success ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {state.message}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
