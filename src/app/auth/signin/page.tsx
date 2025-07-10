"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignInForm } from '@/components/auth/signin-form';
import { handleApiError } from '@/lib/utils';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const router = useRouter();

  // Handle email/password sign in
  const handleSignIn = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(undefined);

    try {
      // Integration with backend API
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign in failed');
      }

      const result = await response.json();
      
      // Store auth token or user data as needed
      localStorage.setItem('authToken', result.token);
      
      // Navigate based on user role
      if (result.user.role === 'provider') {
        router.push('/provider/dashboard');
      } else {
        router.push('/customer/dashboard');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth sign in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(undefined);

    try {
      // Integration with Google OAuth
      window.location.href = '/api/auth/google?type=signin';
    } catch (err) {
      setError(handleApiError(err));
      setLoading(false);
    }
  };

  // Handle forgot password navigation
  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <SignInForm 
      onSubmit={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onForgotPassword={handleForgotPassword}
      loading={loading}
      error={error}
    />
  );
}