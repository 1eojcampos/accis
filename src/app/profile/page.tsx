import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Email } from '@/components/ui/email';
import { Phone } from '@/components/ui/phone';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Lock, Bell, Shield, Mail, Phone as PhoneIcon, Settings, Building, CreditCard } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: 'customer' | 'provider';
  createdAt: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  contact?: {
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  security?: {
    twoFactor: boolean;
    lastPasswordChanged: string;
  };
}

interface ProviderProfile extends UserProfile {
  role: 'provider';
  businessDetails: {
    companyName: string;
    taxId?: string;
    website?: string;
  };
  professionalInfo: {
    specialties: string[];
    yearsExperience: number;
    verificationStatus: 'pending' | 'verified' | 'rejected';
  };
  payment: {
    stripeConnected: boolean;
    payoutMethod: 'bank' | 'paypal';
    payoutSchedule: 'daily' | 'weekly' | 'monthly';
  };
}

async function fetchUserProfile(): Promise<UserProfile | ProviderProfile> {
  // In a real app, fetch this your auth provider or API
  const mockUser: ProviderProfile = {
    id: "123",
    email: "sarah.provider@example.com",
    fullName: "Sarah Johnson",
    role: "provider",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616c94",
    createdAt: "2023-01-15",
    preferences: {
      theme: "light",
      notifications: {
        email: true,
        sms: true,
        push: false
      }
    },
    businessDetails: {
      companyName: "Johnson Creative Studio",
      website: "https://johnsoncreative.studio",
      taxId: "12-3456789"
    },
    professionalInfo: {
      specialties: ["Web Development", "UI/UX Design", "Branding"],
      yearsExperience: 8,
      verificationStatus: "verified"
    },
    contact: {
      phone: "+1 (555) 234-5678",
      address: {
        street: "123 Innovation Ave",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "USA"
      }
    },
    payment: {
      stripeConnected: true,
      payoutMethod: "bank",
      payoutSchedule: "weekly"
    },
    security: {
      twoFactor: true,
      lastPasswordChanged: "2024-01-15"
    }
  };

  return mockUser;
}

function ProfileCard({ title, description, children, icon }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function AccountInformation({ profile }: { profile: UserProfile }) {
  return (
    <ProfileCard title="Account Information" icon={<User className="h-5 w-5" />}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {profile.avatar ? (
              <AvatarImage src={profile.avatar} alt={profile.fullName} />
            ) : null}
            <AvatarFallback className="text-2xl">
              {profile.fullName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <Button variant="outline" size="sm">Update Photo</Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input 
              defaultValue={profile.fullName}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email Address</label>
            <div className="mt-1 flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <input 
                type="email"
                defaultValue={profile.email}
                className="flex-1 rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Member Since</label>
            <p className="mt-1 text-sm text-gray-600">
              {new Date(profile.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        
        <Button>Save Changes</Button>
      </div>
    </ProfileCard>
  );
}

function ContactDetails({ profile }: { profile: UserProfile }) {
  return (
    <ProfileCard title="Contact Details" icon={<PhoneIcon className="h-5 w-5" />}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Phone Number</label>
          <div className="mt-1 flex items-center gap-2">
            <PhoneIcon className="h-4 w-4 text-gray-500" />
            <input 
              type="tel"
              defaultValue={profile?.contact?.phone || ''}
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        {profile?.contact?.address && (
          <div>
            <label className="text-sm font-medium">Address</label>
            <div className="mt-2 space-y-2">
              <input 
                defaultValue={profile.contact.address.street}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Street address"
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  defaultValue={profile.contact.address.city}
                  className="rounded-md border px-3 py-2 text-sm"
                  placeholder="City"
                />
                <input 
                  defaultValue={profile.contact.address.state}
                  className="rounded-md border px-3 py-2 text-sm"
                  placeholder="State"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  defaultValue={profile.contact.address.zipCode}
                  className="rounded-md border px-3 py-2 text-sm"
                  placeholder="ZIP code"
                />
                <input 
                  defaultValue={profile.contact.address.country}
                  className="rounded-md border px-3 py-2 text-sm"
                  placeholder="Country"
                />
              </div>
            </div>
          </div>
        )}
        
        <Button>Save Changes</Button>
      </div>
    </ProfileCard>
  );
}

function Preferences({ profile }: { profile: UserProfile }) {
  return (
    <ProfileCard title="Preferences" icon={<Settings className="h-5 w-5" />}>
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium">Theme</label>
          <div className="mt-2 space-y-2">
            {['Light', 'Dark', 'Auto'].map(theme => (
              <label key={theme} className="flex items-center">
                <input 
                  type="radio" 
                  name="theme" 
                  value={theme.toLowerCase()}
                  defaultChecked={profile.preferences.theme === theme.toLowerCase()}
                  className="mr-2"
                />
                <span className="text-sm">{theme}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Notifications</label>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Email Notifications</span>
                <p className="text-xs text-gray-500">Receive updates via email</p>
              </div>
              <input 
                type="checkbox" 
                defaultChecked={profile.preferences.notifications.email}
                className="ml-4"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">SMS Notifications</span>
                <p className="text-xs text-gray-500">Receive updates via SMS</p>
              </div>
              <input 
                type="checkbox" 
                defaultChecked={profile.preferences.notifications.sms}
                className="ml-4"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Push Notifications</span>
                <p className="text-xs text-gray-500">Receive updates in your browser</p>
              </div>
              <input 
                type="checkbox" 
                defaultChecked={profile.preferences.notifications.push}
                className="ml-4"
              />
            </label>
          </div>
        </div>
        
        <Button>Save Preferences</Button>
      </div>
    </ProfileCard>
  );
}

function SecuritySettings({ profile }: { profile: UserProfile }) {
  return (
    <ProfileCard title="Security" icon={<Shield className="h-5 w-5" />}>
      <div className="space-y-6">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">Secure your account with 2FA</p>
            </div>
            <input 
              type="checkbox" 
              defaultChecked={profile.security?.twoFactor}
              className="ml-4"
            />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Password</h4>
          <p className="text-sm text-gray-600 mb-4">
            Last changed: {new Date(profile.security?.lastPasswordChanged || '').toLocaleDateString()}
          </p>
          <Button variant="outline">Change Password</Button>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Active Sessions</h4>
          <p className="text-sm text-gray-600">2 sessions active</p>
          <Button variant="outline" className="mt-2" size="sm">View Sessions</Button>
        </div>
      </div>
    </ProfileCard>
  );
}

function ProviderSettings({ profile }: { profile: ProviderProfile }) {
  return (
    <>
      <ProfileCard 
        title="Business Details" 
        icon={<Building className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Company Name</label>
            <input 
              defaultValue={profile.businessDetails.companyName}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tax ID</label>
            <input 
              defaultValue={profile.businessDetails.taxId || ''}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="12-3456789"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Website</label>
            <input 
              type="url"
              defaultValue={profile.businessDetails.website || ''}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-blue-600"
              placeholder="https://example.com"
            />
          </div>
          <Button>Save Business Details</Button>
        </div>
      </ProfileCard>

      <ProfileCard 
        title="Payment Settings" 
        icon={<CreditCard className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Stripe Account</h4>
              <p className="text-sm text-gray-600">
                {profile.payment.stripeConnected ? 'Connected' : 'Not connected'}
              </p>
            </div>
            <Button 
              variant={profile.payment.stripeConnected ? "outline" : "default"}
              size="sm"
            >
              {profile.payment.stripeConnected ? 'Manage' : 'Connect'}
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium">Payout Schedule</label>
            <select 
              defaultValue={profile.payment.payoutSchedule}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <Button>Save Payment Settings</Button>
        </div>
      </ProfileCard>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function ProfileSettingsPage() {
  const profile = await fetchUserProfile();
  const isProvider = profile.role === 'provider';
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6 pt-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <AccountInformation profile={profile} />
              {isProvider && <ProviderSettings profile={profile as ProviderProfile} />}
            </Suspense>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6 pt-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <ContactDetails profile={profile} />
            </Suspense>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6 pt-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <Preferences profile={profile} />
            </Suspense>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 pt-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <SecuritySettings profile={profile} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}