'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  userType: string | null;
  createdAt: string;
  emailVerified: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  signup: (email: string, password: string, displayName: string, userType: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: (user?: User | null) => Promise<void>;
  updateUserType: (userType: string) => Promise<void>;
  getUserProfile: (uid: string) => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const signup = async (email: string, password: string, displayName: string, userType: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: displayName || '',
      userType: userType,
      createdAt: new Date().toISOString(),
      emailVerified: false
    });
    
    await sendEmailVerification(userCredential.user);
    return userCredential;
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || '',
        userType: null,
        createdAt: new Date().toISOString(),
        emailVerified: userCredential.user.emailVerified
      });
    }
    
    return userCredential;
  };

  const logout = async () => {
    localStorage.removeItem('token');
    await signOut(auth);
    router.push('/login');
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = (user: User | null = null) => {
    const targetUser = user || currentUser;
    if (targetUser) {
      return sendEmailVerification(targetUser);
    }
    throw new Error('No user is currently signed in');
  };

  const updateUserType = async (userType: string) => {
    if (!currentUser) throw new Error('No user is currently signed in');
    
    await setDoc(doc(db, 'users', currentUser.uid), {
      userType: userType,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    setUserProfile(prev => prev ? { ...prev, userType } : null);
  };

  const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() as UserProfile : null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Get the ID token and store it in localStorage
          const token = await user.getIdToken();
          localStorage.setItem('token', token);
          
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || '',
              userType: null,
              createdAt: new Date().toISOString(),
              emailVerified: user.emailVerified
            };
            
            try {
              await setDoc(doc(db, 'users', user.uid), newProfile);
              setUserProfile(newProfile);
            } catch (error) {
              console.error('Failed to create user profile in Firestore:', error);
              setUserProfile(newProfile);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            userType: null,
            createdAt: new Date().toISOString(),
            emailVerified: user.emailVerified
          });
        }
      } else {
        setUserProfile(null);
        // Remove token when user logs out
        localStorage.removeItem('token');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    sendVerificationEmail,
    updateUserType,
    getUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
