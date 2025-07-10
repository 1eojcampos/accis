"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PasswordResetForm } from '@/components/auth/reset-password-form';
import { handleApiError } from '@/lib/utils';

function PasswordResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const token = searchParams.get('token') || undefined;

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No reset token provided');
        setTokenValid(false);
        return;
      }

      try {
        // Integration with backend API
        const response = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error('Invalid or expired token');
        }

        setTokenValid(true);
      } catch (err) {
        setError(handleApiError(err));
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (data: { password: string; token?: string }) => {
    setLoading(true);
    setError('');

    try {
      // Integration with backend API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      setSuccess(true);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
          <p className="text-muted-foreground">
            {error || 'This password reset link is invalid or has expired.'}
          </p>
          <button
            onClick={() => router.push('/auth/forgot-password')}
            className="text-primary hover:underline"
          >
            Request a new reset link
          </button>
        </div>
      </div>
    );
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div>Validating reset token...</div>
      </div>
    );
  }

  return (
    <PasswordResetForm
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      success={success}
      token={token}
    />
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div>Loading...</div>
      </div>
    }>
      <PasswordResetContent />
    </Suspense>
  );
}