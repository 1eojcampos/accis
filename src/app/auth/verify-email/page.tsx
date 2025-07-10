"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { EmailVerification } from '@/components/auth/email-verification';
import { handleApiError } from '@/lib/utils';

type VerificationStatus = 'pending' | 'verified' | 'expired' | 'error';

function EmailVerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    const expiredParam = searchParams.get('expired');
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    // Handle different URL states
    if (expiredParam === 'true') {
      setStatus('expired');
      setError('Your verification link has expired. Please request a new one.');
    } else if (tokenParam) {
      // Auto-verify if token is present
      verifyEmailWithToken(tokenParam);
    }
  }, [searchParams]);

  const verifyEmailWithToken = async (token: string) => {
    setLoading(true);
    
    try {
      // Integration with backend API
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed');
      }

      setStatus('verified');
      
      // Redirect to dashboard after successful verification
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      setStatus('error');
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email || resendCooldown > 0) return;

    setLoading(true);
    setError('');

    try {
      // Integration with backend API
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend verification email');
      }

      setResendCooldown(60); // 60 second cooldown
      setStatus('pending');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    router.push('/auth/signup');
  };

  const handleBackToSignIn = () => {
    router.push('/auth/signin');
  };

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  return (
    <EmailVerification
      email={email}
      status={status}
      onResendEmail={handleResendEmail}
      onChangeEmail={handleChangeEmail}
      onBackToSignIn={handleBackToSignIn}
      loading={loading}
      error={error}
      resendCooldown={resendCooldown}
    />
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <EmailVerificationContent />
    </Suspense>
  );
}