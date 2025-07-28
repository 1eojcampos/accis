"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  User,
  Building,
  Package,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

export const AccountSetupComponent = () => {
  const { currentUser, userProfile, updateUserType } = useAuth();
  const [updating, setUpdating] = useState(false);

  const handleSetUserType = async (userType: 'customer' | 'provider') => {
    if (!currentUser) {
      toast.error('No user is currently signed in');
      return;
    }

    setUpdating(true);
    try {
      console.log(`🔄 Setting user type to: ${userType}`);
      await updateUserType(userType);
      toast.success(`Account type set to ${userType} successfully!`);
      
      // Redirect to appropriate dashboard
      if (userType === 'provider') {
        window.location.href = '/provider/requests';
      } else {
        window.location.href = '/customer/dashboard';
      }
    } catch (error) {
      console.error('❌ Error updating user type:', error);
      toast.error('Failed to update account type');
    } finally {
      setUpdating(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
            <p className="text-muted-foreground">You need to be signed in to set up your account.</p>
            <Button onClick={() => window.location.href = '/auth/signin'} className="mt-4">
              Sign In
            </Button>
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
          <h1 className="text-3xl font-bold text-foreground">Account Setup</h1>
          <p className="text-muted-foreground">Choose your account type to get started with ACCIS</p>
        </div>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Current Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{currentUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Display Name:</span>
              <span>{currentUser.displayName || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Type:</span>
              <Badge variant={userProfile?.userType ? 'default' : 'secondary'}>
                {userProfile?.userType || 'Not set'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email Verified:</span>
              <Badge variant={currentUser.emailVerified ? 'default' : 'destructive'}>
                {currentUser.emailVerified ? 'Verified' : 'Not verified'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Account Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-blue-400" />
              </div>
              <CardTitle>Customer Account</CardTitle>
              <p className="text-muted-foreground">
                Submit 3D printing requests and track your orders
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Upload 3D models for printing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Get quotes from providers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Track order progress
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Make secure payments
                  </li>
                </ul>
              </div>
              <Button 
                onClick={() => handleSetUserType('customer')}
                disabled={updating}
                className="w-full"
                variant={userProfile?.userType === 'customer' ? 'default' : 'outline'}
              >
                {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {userProfile?.userType === 'customer' ? 'Current Account Type' : 'Choose Customer'}
              </Button>
            </CardContent>
          </Card>

          {/* Provider Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <Building className="w-8 h-8 text-green-400" />
              </div>
              <CardTitle>Provider Account</CardTitle>
              <p className="text-muted-foreground">
                Offer 3D printing services and manage orders
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Accept printing requests
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Submit custom quotes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Manage your printers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Track earnings
                  </li>
                </ul>
              </div>
              <Button 
                onClick={() => handleSetUserType('provider')}
                disabled={updating}
                className="w-full"
                variant={userProfile?.userType === 'provider' ? 'default' : 'outline'}
              >
                {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {userProfile?.userType === 'provider' ? 'Current Account Type' : 'Choose Provider'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Status */}
        {userProfile?.userType && (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              Your account is set up as a <strong>{userProfile.userType}</strong>. 
              You can change this at any time by selecting a different account type above.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Links */}
        {userProfile?.userType && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {userProfile.userType === 'customer' && (
                <div className="space-y-2">
                  <Button 
                    onClick={() => window.location.href = '/customer/dashboard'}
                    className="w-full"
                  >
                    Go to Customer Dashboard
                  </Button>
                </div>
              )}
              {userProfile.userType === 'provider' && (
                <div className="space-y-2">
                  <Button 
                    onClick={() => window.location.href = '/provider/requests'}
                    className="w-full"
                  >
                    Go to Manage Requests
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/provider/printers'}
                    variant="outline"
                    className="w-full"
                  >
                    Manage Printers
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
