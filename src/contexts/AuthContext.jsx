import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  const signup = async (email, password, displayName, userType) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: displayName || '',
      userType: userType,
      createdAt: new Date().toISOString(),
      emailVerified: false
    });
    
    // Send email verification
    await sendEmailVerification(userCredential.user);
    return userCredential;
  };

  // Log in with email and password
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Log in with Google
  const loginWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    
    // Check if user profile exists, if not create one
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      // New Google user - will need to select user type
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || '',
        userType: null, // Will be set later
        createdAt: new Date().toISOString(),
        emailVerified: userCredential.user.emailVerified
      });
    }
    
    return userCredential;
  };

  // Log out
  const logout = () => {
    return signOut(auth);
  };

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Send email verification
  const sendVerificationEmail = (user = null) => {
    const targetUser = user || currentUser;
    if (targetUser) {
      return sendEmailVerification(targetUser);
    }
    throw new Error('No user is currently signed in');
  };

  // Update user type
  const updateUserType = async (userType) => {
    if (!currentUser) throw new Error('No user is currently signed in');
    
    await setDoc(doc(db, 'users', currentUser.uid), {
      userType: userType,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    // Update local state
    setUserProfile(prev => ({ ...prev, userType }));
  };

  // Get user profile
  const getUserProfile = async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() : null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Try to fetch user profile from Firestore
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
          } else {
            // Profile doesn't exist, create one for existing users
            const newProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || '',
              userType: null, // Will be set by user
              createdAt: new Date().toISOString(),
              emailVerified: user.emailVerified
            };
            
            try {
              await setDoc(doc(db, 'users', user.uid), newProfile);
              setUserProfile(newProfile);
            } catch (firestoreError) {
              console.error('Failed to create user profile in Firestore:', firestoreError);
              // Use local profile as fallback
              setUserProfile(newProfile);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Create a fallback profile if Firestore is unavailable
          const fallbackProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            userType: null,
            createdAt: new Date().toISOString(),
            emailVerified: user.emailVerified
          };
          setUserProfile(fallbackProfile);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
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
