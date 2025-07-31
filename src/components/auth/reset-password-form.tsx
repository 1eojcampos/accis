"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Eye, EyeOff, Lock, Key, Shield, Loader2 } from 'lucide-react';

interface PasswordResetFormProps {
  onSubmit: (data: { password: string; token?: string }) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: boolean;
  token?: string;
}

interface PasswordStrength {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

export const PasswordResetForm = ({
  onSubmit,
  loading = false,
  error,
  success = false,
  token
}: PasswordResetFormProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  useEffect(() => {
    const strength: PasswordStrength = {
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword)
    };
    setPasswordStrength(strength);
  }, [newPassword]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!newPassword) {
      errors.push('New password is required');
    } else {
      if (!passwordStrength.minLength) errors.push('Password must be at least 8 characters');
      if (!passwordStrength.hasUppercase) errors.push('Password must contain an uppercase letter');
      if (!passwordStrength.hasLowercase) errors.push('Password must contain a lowercase letter');
      if (!passwordStrength.hasNumber) errors.push('Password must contain a number');
    }

    if (!confirmPassword) {
      errors.push('Password confirmation is required');
    } else if (newPassword !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit({ password: newPassword, token });
    } catch (err) {
      // Error is handled by parent component via error prop
    }
  };

  const isFormValid = Object.values(passwordStrength).every(Boolean) && 
                     newPassword === confirmPassword && 
                     newPassword.length > 0;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been successfully updated. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              onClick={() => window.location.href = '/auth/signin'}
            >
              Continue to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Reset Your Password</CardTitle>
          <CardDescription>
            Create a new secure password for your 3D printing platform account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (!hasStartedTyping) setHasStartedTyping(true);
                  }}
                  placeholder="Enter your new password"
                  className="pr-10"
                  disabled={loading}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-10"
                  disabled={loading}
                />
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {hasStartedTyping && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Password Requirements</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {passwordStrength.minLength ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={`text-xs ${passwordStrength.minLength ? 'text-primary' : 'text-muted-foreground'}`}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {passwordStrength.hasUppercase ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={`text-xs ${passwordStrength.hasUppercase ? 'text-primary' : 'text-muted-foreground'}`}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {passwordStrength.hasLowercase ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={`text-xs ${passwordStrength.hasLowercase ? 'text-primary' : 'text-muted-foreground'}`}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {passwordStrength.hasNumber ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={`text-xs ${passwordStrength.hasNumber ? 'text-primary' : 'text-muted-foreground'}`}>
                      One number
                    </span>
                  </div>
                  {confirmPassword && (
                    <div className="flex items-center space-x-2">
                      {newPassword === confirmPassword ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={`text-xs ${newPassword === confirmPassword ? 'text-primary' : 'text-muted-foreground'}`}>
                        Passwords match
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {formErrors.length > 0 && hasStartedTyping && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index} className="text-xs">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{' '}
              <a href="/auth/signin" className="font-medium text-primary hover:underline">
                Back to Sign In
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};