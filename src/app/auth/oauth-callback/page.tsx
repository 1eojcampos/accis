"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const error = searchParams.get('error');

    if (error) {
      router.push('/auth/signin?error=oauth_failed');
      return;
    }

    if (token) {
      // Store the token
      localStorage.setItem('authToken', token);
      
      // Redirect based on role
      if (role === 'provider') {
        router.push('/provider/dashboard');
      } else {
        router.push('/customer/dashboard');
      }
    } else {
      router.push('/auth/signin');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Processing Sign In</h1>
        <p className="text-muted-foreground">Please wait while we complete your sign in...</p>
      </div>
    </div>
  );
}
