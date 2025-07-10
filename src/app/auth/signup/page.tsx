"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignUpForm } from '@/components/auth/signup-form';
import { handleApiError } from '@/lib/utils';

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const router = useRouter();

  // Handle email/password sign up
  const handleSignUp = async (data: { email: string; password: string; role: 'customer' | 'provider' }) => {
    setLoading(true);
    setError(undefined);

    try {
      // Integration with backend API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign up failed');
      }

      const result = await response.json();
      
      // Navigate to email verification with user email
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth sign up
  const handleGoogleSignUp = async (role: 'customer' | 'provider') => {
    setLoading(true);
    setError(undefined);

    try {
      // Integration with Google OAuth
      window.location.href = `/api/auth/google?type=signup&role=${role}`;
    } catch (err) {
      setError(handleApiError(err));
      setLoading(false);
    }
  };

  return (
    <SignUpForm 
      onSubmit={handleSignUp}
      onGoogleSignUp={handleGoogleSignUp}
      loading={loading}
      error={error}
    />
  );
}