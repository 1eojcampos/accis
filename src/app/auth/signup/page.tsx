"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignUpForm } from '@/components/auth/signup-form';

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const router = useRouter();

  // Handle email/password sign up
  const handleSignUp = async (data: { email: string; password: string; role: 'customer' | 'provider' }) => {
    setLoading(true);
    setError(undefined);

    try {
      // Call the backend API using the api utility
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`;
      console.log('🔗 API URL being used:', apiUrl);
      console.log('🌐 Environment API URL:', process.env.NEXT_PUBLIC_API_URL);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign up failed');
      }

      const result = await response.json();
      
      // Navigate to email verification with user email
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth sign up
  const handleGoogleSignUp = async (role: 'customer' | 'provider') => {
    setLoading(true);
    setError(undefined);

    try {
      // TODO: Replace with your actual Google OAuth flow
      // Pass the role as a parameter to your OAuth endpoint
      window.location.href = `/api/auth/google?type=signup&role=${role}`;
    } catch (err) {
      setError('Google sign up failed');
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