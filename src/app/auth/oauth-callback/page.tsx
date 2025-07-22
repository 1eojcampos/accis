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
      // Decode the token to get user email
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload.email;
        
        // Store the token with Bearer prefix (consistent with Firebase auth)
        localStorage.setItem('authToken', `Bearer ${token}`);
        
        // Store user data as JSON object (consistent with Firebase auth)
        localStorage.setItem('user', JSON.stringify({
          email: email,
          role: role || 'customer'
        }));
        
        // For now, redirect to home page since dashboard routes don't exist yet
        // TODO: Create /customer/dashboard and /provider/dashboard routes
        router.push('/?signup=success&role=' + (role || 'customer'));
      } catch (error) {
        console.error('Error processing OAuth token:', error);
        router.push('/auth/signin?error=invalid_token');
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
