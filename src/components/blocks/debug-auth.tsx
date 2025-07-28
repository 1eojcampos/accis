"use client";

import React, { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  User,
  Settings,
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

export const DebugAuthComponent = () => {
  const { currentUser, userProfile, updateUserType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [firestoreData, setFirestoreData] = useState<any>(null);

  const fetchDirectFromFirestore = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setFirestoreData(userDoc.data());
        console.log('Direct Firestore fetch:', userDoc.data());
      } else {
        setFirestoreData(null);
        console.log('No document found in Firestore');
      }
    } catch (error) {
      console.error('Error fetching from Firestore:', error);
      toast.error('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const forceSetProvider = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Directly set the user as a provider in Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || '',
        userType: 'provider',
        role: 'provider', // Set both fields for compatibility
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: currentUser.emailVerified
      }, { merge: true });
      
      toast.success('User set as provider in Firestore!');
      await fetchDirectFromFirestore();
      
      // Refresh the page to reload auth context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error setting provider:', error);
      toast.error('Failed to set provider role');
    } finally {
      setLoading(false);
    }
  };

  const forceSetCustomer = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || '',
        userType: 'customer',
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: currentUser.emailVerified
      }, { merge: true });
      
      toast.success('User set as customer in Firestore!');
      await fetchDirectFromFirestore();
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error setting customer:', error);
      toast.error('Failed to set customer role');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (currentUser) {
      fetchDirectFromFirestore();
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
            <p className="text-muted-foreground">You need to be signed in to access debug tools.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">🛠️ Debug Auth & User Roles</h1>
          <p className="text-muted-foreground">Debug and fix user authentication and role issues</p>
        </div>

        {/* Current Auth State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Current Auth Context State
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Firebase Auth User</h4>
                <div className="bg-muted p-3 rounded text-sm">
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UID:</span>
                    <span className="font-mono text-xs">{currentUser.uid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email Verified:</span>
                    <Badge variant={currentUser.emailVerified ? 'default' : 'destructive'}>
                      {currentUser.emailVerified ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Auth Context Profile</h4>
                <div className="bg-muted p-3 rounded text-sm">
                  {userProfile ? (
                    <>
                      <div className="flex justify-between">
                        <span>User Type:</span>
                        <Badge variant={userProfile.userType ? 'default' : 'secondary'}>
                          {userProfile.userType || 'NULL'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Display Name:</span>
                        <span>{userProfile.displayName || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="text-xs">{userProfile.createdAt}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-red-400">Profile is NULL</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Direct Firestore Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Direct Firestore Data
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDirectFromFirestore}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Fetching data...</p>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded">
                <pre className="text-xs overflow-x-auto">
                  {firestoreData ? JSON.stringify(firestoreData, null, 2) : 'No data found'}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Fix Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Fix Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                These actions will directly update your Firestore user document and reload the page.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={forceSetProvider}
                disabled={loading}
                className="w-full"
                variant="default"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                🏭 Set as Provider
              </Button>
              
              <Button 
                onClick={forceSetCustomer}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                👤 Set as Customer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Test Pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/provider/requests'}
              className="w-full"
              variant="outline"
            >
              Test Provider Requests Page
            </Button>
            <Button 
              onClick={() => window.location.href = '/customer/dashboard'}
              className="w-full"
              variant="outline"
            >
              Test Customer Dashboard Page
            </Button>
            <Button 
              onClick={() => window.location.href = '/account-setup'}
              className="w-full"
              variant="outline"
            >
              Account Setup Page
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
