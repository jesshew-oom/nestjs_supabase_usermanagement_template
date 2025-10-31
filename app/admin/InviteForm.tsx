'use client';

import { inviteUser } from '@/app/admin/actions';
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
      {pending ? 'Sending...' : 'Invite User'}
    </Button>
  );
}

export default function InviteForm() {
  const [state, formAction] = useFormState(inviteUser, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Invite User</CardTitle>
        <CardDescription>
          Enter an email address to send an invitation.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            name="email"
            placeholder="user@example.com"
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
  );
}
