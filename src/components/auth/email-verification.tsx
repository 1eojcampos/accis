"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MailCheck, MailX, Clock, RefreshCw, ArrowLeft, Edit, CheckCircle, AlertCircle, Mail } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  status: 'pending' | 'verified' | 'expired' | 'error';
  onResendEmail: () => Promise<void>;
  onChangeEmail: () => void;
  onBackToSignIn: () => void;
  loading?: boolean;
  error?: string;
  resendCooldown?: number;
}

export const EmailVerification = ({
  email,
  status,
  onResendEmail,
  onChangeEmail,
  onBackToSignIn,
  loading = false,
  error,
  resendCooldown = 60
}: EmailVerificationProps) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRemaining]);

  const handleResend = async () => {
    try {
      setIsResending(true);
      await onResendEmail();
      setTimeRemaining(resendCooldown);
    } catch (err) {
      // Error handling is managed by parent component
    } finally {
      setIsResending(false);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: <CheckCircle className="h-6 w-6 text-primary" />,
          title: 'Email Verified!',
          description: 'Your email has been successfully verified.',
          badgeVariant: 'default' as const,
          badgeText: 'Verified',
          badgeColor: 'bg-primary text-primary-foreground'
        };
      case 'expired':
        return {
          icon: <Clock className="h-6 w-6 text-orange-500" />,
          title: 'Verification Link Expired',
          description: 'The verification link has expired. Please request a new one.',
          badgeVariant: 'secondary' as const,
          badgeText: 'Expired',
          badgeColor: 'bg-orange-500 text-white'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-6 w-6 text-destructive" />,
          title: 'Verification Failed',
          description: 'There was an error verifying your email. Please try again.',
          badgeVariant: 'destructive' as const,
          badgeText: 'Error',
          badgeColor: 'bg-destructive text-destructive-foreground'
        };
      default:
        return {
          icon: <Mail className="h-6 w-6 text-muted-foreground" />,
          title: 'Check Your Email',
          description: 'We\'ve sent a verification link to your email address.',
          badgeVariant: 'secondary' as const,
          badgeText: 'Pending',
          badgeColor: 'bg-secondary text-secondary-foreground'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const canResend = timeRemaining === 0 && !isResending && status !== 'verified';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            {statusConfig.icon}
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">
              {statusConfig.title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {statusConfig.description}
            </CardDescription>
          </div>
          
          <Badge 
            className={`${statusConfig.badgeColor} px-3 py-1`}
          >
            {statusConfig.badgeText}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Email Address</p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <MailCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground break-all">{email}</span>
            </div>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <MailX className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          <Separator />
          
          <div className="space-y-4">
            {status !== 'verified' && (
              <div className="space-y-3">
                <Button
                  onClick={handleResend}
                  disabled={!canResend || loading}
                  className="w-full"
                  variant={canResend ? "default" : "secondary"}
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : timeRemaining > 0 ? (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Resend in {timeRemaining}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive the email? Check your spam folder or try resending.
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <Button
                onClick={onChangeEmail}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                <Edit className="mr-2 h-4 w-4" />
                Change Email Address
              </Button>
              
              <Button
                onClick={onBackToSignIn}
                variant="ghost"
                className="w-full"
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </div>
          </div>
        </CardContent>
        
        {status === 'verified' && (
          <CardFooter>
            <Button 
              onClick={onBackToSignIn}
              className="w-full"
            >
              Continue to Dashboard
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};