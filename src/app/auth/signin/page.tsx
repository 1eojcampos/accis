"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignInForm } from '@/components/auth/signin-form';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  // Handle email/password sign in
  const handleSignIn = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Get the user's custom claims (role) from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      
      // Get the ID token
      const idToken = await user.getIdToken();

      // Store auth token and user data
      localStorage.setItem('authToken', `Bearer ${idToken}`);
      localStorage.setItem('user', JSON.stringify({
        email: user.email,
        role: userData.role
      }));

      // Force a fresh mount of HomePage
      router.replace('/');
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth sign in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with your actual Google OAuth flow
      // This could redirect to your OAuth endpoint or use a client-side OAuth library
      window.location.href = '/api/auth/google?type=signin';
    } catch (err) {
      setError('Google sign in failed');
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
      error={error || undefined}
    />
  );
}