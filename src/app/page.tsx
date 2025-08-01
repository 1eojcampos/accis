"use client"

import { useState, useEffect } from "react"
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, getFirestore } from 'firebase/firestore'
import SplitWithScreenshotOnDark from "@/components/blocks/heros/split-with-screenshot-on-dark"
import OrderCreation from "@/components/blocks/order-creation"
import ProviderDiscovery from "@/components/blocks/provider-discovery"
import OrderTracking from "@/components/blocks/order-tracking"
import { ManagePrinters } from "@/components/blocks/manage-printers"
import { ManageRequestsComponent } from "@/components/blocks/manage-requests"
import ProviderOrdersManagement from "@/components/blocks/provider-orders-management"
import CustomerOrdersManagement from "@/components/blocks/customer-orders-management"
import { CenteredWithLogo } from "@/components/blocks/footers/centered-with-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search,
  Upload,
  Package2,
  BarChart3,
  Menu,
  X,
  User,
  Bell,
  Settings,
  LogOut,
  Users,
  Printer,
  ClipboardList,
  Truck,
  Lock,
  Shield,
  Mail,
  Phone as PhoneIcon,
  Building,
  CreditCard
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

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

interface CustomerProfile extends UserProfile {
  role: 'customer';
  orderPreferences?: {
    defaultMaterial?: string;
    defaultColor?: string;
    defaultQuality?: 'draft' | 'standard' | 'high';
  };
  shippingAddresses?: {
    id: string;
    name: string;
    isDefault: boolean;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  }[];
  paymentMethods?: {
    id: string;
    type: 'card' | 'paypal';
    isDefault: boolean;
    last4?: string;
    brand?: string;
  }[];
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

type AppSection = 'browse' | 'create-order' | 'track-orders' | 'customer-dashboard' | 'provider-dashboard' | 'manage-printers' | 'manage-requests' | 'home' | 'profile'
type UserRole = 'customer' | 'provider' | null

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

function CustomerSettings({ profile }: { profile: CustomerProfile }) {
  return (
    <>
      <ProfileCard
        title="Order Preferences"
        icon={<Package2 className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Default Material</label>
            <input
              defaultValue={profile.orderPreferences?.defaultMaterial}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g., PLA, ABS"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Default Color</label>
            <input
              defaultValue={profile.orderPreferences?.defaultColor}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g., Black, White"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Print Quality</label>
            <select
              defaultValue={profile.orderPreferences?.defaultQuality}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="draft">Draft - Faster, visible layers</option>
              <option value="standard">Standard - Balanced quality</option>
              <option value="high">High - Best quality, slower</option>
            </select>
          </div>
          <Button>Save Preferences</Button>
        </div>
      </ProfileCard>

      <ProfileCard
        title="Shipping Addresses"
        icon={<Truck className="h-5 w-5" />}
      >
        <div className="space-y-4">
          {profile.shippingAddresses?.map((address) => (
            <div key={address.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium">{address.name}</h4>
                  {address.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
              <p className="text-sm text-gray-600">
                {address.address.street}<br />
                {address.address.city}, {address.address.state} {address.address.zipCode}<br />
                {address.address.country}
              </p>
            </div>
          ))}
          <Button className="w-full">Add New Address</Button>
        </div>
      </ProfileCard>

      <ProfileCard
        title="Payment Methods"
        icon={<CreditCard className="h-5 w-5" />}
      >
        <div className="space-y-4">
          {profile.paymentMethods?.map((method) => (
            <div key={method.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">
                    {method.brand?.toUpperCase()} •••• {method.last4}
                  </h4>
                  {method.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm">Remove</Button>
              </div>
            </div>
          ))}
          <Button className="w-full">Add Payment Method</Button>
        </div>
      </ProfileCard>
    </>
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

export default function HomePage() {
  const [currentSection, setCurrentSection] = useState<AppSection>('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userLoggedIn, setUserLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [notifications] = useState(3)
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)

  // Check authentication and set initial section
  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserLoggedIn(true);
            setUserRole(userData.role);
            
            // Set initial section based on user role
            if (userData.role === 'customer') {
              setCurrentSection('customer-dashboard');
            } else if (userData.role === 'provider') {
              setCurrentSection('provider-dashboard');
            }

            // Update stored data
            const idToken = await user.getIdToken();
            // Store in localStorage for client-side access
            localStorage.setItem('authToken', `Bearer ${idToken}`);
            localStorage.setItem('user', JSON.stringify({
              email: user.email,
              role: userData.role
            }));
            // Store in cookie for middleware
            document.cookie = `firebaseToken=${idToken}; path=/; secure; samesite=strict`;
          } else {
            throw new Error('User data not found');
          }
        } else {
          // Check for demo authentication data
          const demoUser = localStorage.getItem('user');
          if (demoUser) {
            try {
              const userData = JSON.parse(demoUser);
              setUserLoggedIn(true);
              setUserRole(userData.role);
              
              // Set initial section based on user role
              if (userData.role === 'customer') {
                setCurrentSection('customer-dashboard');
              } else if (userData.role === 'provider') {
                setCurrentSection('provider-dashboard');
              }
            } catch (error) {
              console.error('Error parsing demo user data:', error);
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              setUserLoggedIn(false);
              setUserRole(null);
              setCurrentSection('home');
            }
          } else {
            // User is signed out
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setUserLoggedIn(false);
            setUserRole(null);
            setCurrentSection('home');
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUserLoggedIn(false);
        setUserRole(null);
        setCurrentSection('home');
      } finally {
        setIsLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [])

  // Handle URL parameters for success messages (client-side only)
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const signup = urlParams.get('signup');
      const role = urlParams.get('role');
      
      if (signup === 'success' && role) {
        setShowSuccessMessage(true);
        // Hide the message after 5 seconds
        const timer = setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [])

  // Handle provider selection and navigation to order creation
  const handleProviderSelection = (provider: any) => {
    if (!userLoggedIn) {
      window.location.href = '/auth/signin'
      return
    }
    setSelectedProvider(provider)
    setCurrentSection('create-order')
  }

  // Navigate back to browse from order creation
  const handleBackToBrowse = () => {
    setSelectedProvider(null)
    setCurrentSection('browse')
  }

  const publicNavigationItems = [
    { 
      key: 'browse' as AppSection, 
      label: 'Browse Printers', 
      icon: Search,
      description: 'Find local 3D printing providers'
    }
  ]

  // Navigation for customer role
  const customerNavigationItems = [
    { 
      key: 'browse' as AppSection, 
      label: 'Browse Printers', 
      icon: Search,
      description: 'Find local 3D printing providers and request quotes'
    },
    { 
      key: 'track-orders' as AppSection, 
      label: 'Track Orders', 
      icon: Package2,
      description: 'Monitor your order progress'
    },
    { 
      key: 'customer-dashboard' as AppSection, 
      label: 'Customer Dashboard', 
      icon: Users,
      description: 'View your order history and profile'
    }
  ]

  // Navigation for provider role
  const providerNavigationItems = [
    { 
      key: 'manage-printers' as AppSection, 
      label: 'Manage Printers', 
      icon: Printer,
      description: 'Add, edit, and remove your 3D printers'
    },
    { 
      key: 'manage-requests' as AppSection, 
      label: 'Manage Requests', 
      icon: ClipboardList,
      description: 'View and respond to print requests'
    },
    { 
      key: 'provider-dashboard' as AppSection, 
      label: 'Provider Dashboard', 
      icon: BarChart3,
      description: 'View your order history and earnings'
    }
  ]

  // Get navigation items based on user role and auth state
  const getNavigationItems = () => {
    if (!userLoggedIn) return publicNavigationItems
    if (userRole === 'customer') return customerNavigationItems
    if (userRole === 'provider') return providerNavigationItems
    return publicNavigationItems
  }

  const navigationItems = getNavigationItems()

  // Handle section changes with access control
  const handleSectionChange = (section: AppSection) => {
    // Allow access to home and browse for everyone
    if (section === 'home' || section === 'browse') {
      setCurrentSection(section)
      setMobileMenuOpen(false)
      return
    }
    
    // Redirect to auth if not logged in and trying to access protected sections
    if (!userLoggedIn) {
      window.location.href = '/auth/signin'
      return
    }
    
    // Role-based access control
    if ((section === 'customer-dashboard' || section === 'create-order') && userRole !== 'customer') {
      return // Don't allow navigation if not customer
    }
    
    if ((section === 'provider-dashboard' || section === 'manage-printers' || section === 'manage-requests') && userRole !== 'provider') {
      return // Don't allow navigation if not provider
    }
    
    setCurrentSection(section)
    setMobileMenuOpen(false)
  }

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Clear the auth cookie
      document.cookie = 'firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      setUserLoggedIn(false);
      setUserRole(null);
      setCurrentSection('home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  const renderNavigation = () => (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => handleSectionChange('home')}
          >
            <img 
              src="/accis-logo.svg" 
              alt="Accis Logo" 
              className="w-14 h-14 object-contain"
            />
            <span className="font-semibold text-foreground text-xl">Accis</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onClick={() => handleSectionChange(item.key)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentSection === item.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {userLoggedIn ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-muted-foreground hover:text-foreground">
                  <Bell className="w-5 h-5" />
                  {notifications > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-destructive text-destructive-foreground"
                    >
                      {notifications}
                    </Badge>
                  )}
                </button>

                {/* Profile Menu */}
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleSectionChange('profile')}
                    className={`p-1 rounded-full ${
                      currentSection === 'profile'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </button>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* Log In / Sign Up Button for logged-out users */
              <Button 
                onClick={() => window.location.href = '/auth/signin'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Log In / Sign Up
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSectionChange(item.key)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                      currentSection === item.key
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs opacity-75">{item.description}</div>
                    </div>
                  </button>
                )
              })}
              
              {/* Mobile Log In / Sign Up Button for logged-out users */}
              {!userLoggedIn && (
                <Button 
                  onClick={() => window.location.href = '/auth/signin'}
                  className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Log In / Sign Up
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )

  const renderQuickActions = () => {
    // Only show quick actions for logged-in users
    if (!userLoggedIn) return null

    return (
      <div className="bg-background py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Card 
                  key={`quick-${item.key}`}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-card border-border"
                  onClick={() => handleSectionChange(item.key)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'browse':
        return <ProviderDiscovery onProviderSelect={handleProviderSelection} />
      case 'create-order':
        // Protect this section - redirect if not logged in
        if (!userLoggedIn) {
          window.location.href = '/auth/signin'
          return null
        }
        return <OrderCreation selectedProvider={selectedProvider} onBack={handleBackToBrowse} />
      case 'track-orders':
        // Protect this section - redirect if not logged in, only available for customers
        if (!userLoggedIn) {
          window.location.href = '/auth/signin'
          return null
        }
        // Only allow customers to access track orders
        if (userRole !== 'customer') {
          // Redirect providers to their dashboard since they don't have track orders
          setCurrentSection('provider-dashboard')
          return null
        }
        return <OrderTracking />
      case 'customer-dashboard':
        // Protect this section - only customers can access
        if (!userLoggedIn || userRole !== 'customer') {
          window.location.href = '/auth/signin'
          return null
        }
        
        return (
          <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">👤</div>
                <h1 className="text-3xl font-bold text-foreground mb-4">Customer Dashboard</h1>
                <p className="text-lg text-muted-foreground">
                  Manage your orders, view history, and track your 3D printing projects.
                </p>
              </div>
              
              {/* Customer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Active Orders</h3>
                  <p className="text-3xl font-bold text-primary">5</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Total Orders</h3>
                  <p className="text-3xl font-bold text-primary">23</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Amount Spent</h3>
                  <p className="text-3xl font-bold text-primary">$1,247</p>
                </Card>
              </div>

              {/* Order History - Using the new component */}
              <div className="mb-8">
                <CustomerOrdersManagement />
              </div>
            </div>
          </div>
        )
      case 'manage-printers':
        // Protect this section - only providers can access
        if (!userLoggedIn || userRole !== 'provider') {
          window.location.href = '/auth/signin'
          return null
        }
        return (
          <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-7xl mx-auto">
              <ManagePrinters />
            </div>
          </div>
        )
      case 'manage-requests':
        // Protect this section - only providers can access
        if (!userLoggedIn || userRole !== 'provider') {
          window.location.href = '/auth/signin'
          return null
        }
        return <ManageRequestsComponent />
      case 'provider-dashboard':
        // Protect this section - only providers can access
        if (!userLoggedIn || userRole !== 'provider') {
          window.location.href = '/auth/signin'
          return null
        }
        return (
          <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">⚙️</div>
                <h1 className="text-3xl font-bold text-foreground mb-4">Provider Dashboard</h1>
                <p className="text-lg text-muted-foreground">
                  Manage your 3D printing services, track orders, and view earnings.
                </p>
              </div>
              
              {/* Provider Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Active Orders</h3>
                  <p className="text-3xl font-bold text-primary">12</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">This Month's Earnings</h3>
                  <p className="text-3xl font-bold text-primary">$1,247</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Total Orders</h3>
                  <p className="text-3xl font-bold text-primary">87</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Rating</h3>
                  <p className="text-3xl font-bold text-primary">4.8★</p>
                </Card>
              </div>

              {/* Order History - Using the real component */}
              <div className="mb-8">
                <ProviderOrdersManagement />
              </div>
            </div>
          </div>
        )
      case 'profile':
        // Protect this section - only logged in users can access
        if (!userLoggedIn) {
          window.location.href = '/auth/signin'
          return null
        }

        // Mock user profile data based on role
        const mockProfile = userRole === 'provider' ? {
          id: "123",
          email: JSON.parse(localStorage.getItem('user') || '{}').email || '',
          fullName: "Sarah Johnson",
          role: 'provider' as const,
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
        } : {
          id: "124",
          email: JSON.parse(localStorage.getItem('user') || '{}').email || '',
          fullName: "John Customer",
          role: 'customer' as const,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
          createdAt: "2023-02-20",
          preferences: {
            theme: "light",
            notifications: {
              email: true,
              sms: false,
              push: true
            }
          },
          contact: {
            phone: "+1 (555) 987-6543",
            address: {
              street: "456 Customer Lane",
              city: "Los Angeles",
              state: "CA",
              zipCode: "90001",
              country: "USA"
            }
          },
          security: {
            twoFactor: false,
            lastPasswordChanged: "2024-02-15"
          },
          orderPreferences: {
            defaultMaterial: "PLA",
            defaultColor: "black",
            defaultQuality: "standard"
          },
          shippingAddresses: [
            {
              id: "addr1",
              name: "Home",
              isDefault: true,
              address: {
                street: "456 Customer Lane",
                city: "Los Angeles",
                state: "CA",
                zipCode: "90001",
                country: "USA"
              }
            }
          ],
          paymentMethods: [
            {
              id: "pm1",
              type: "card",
              isDefault: true,
              last4: "4242",
              brand: "visa"
            }
          ]
        };

        const isProvider = userRole === 'provider';
        
        return (
          <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
              </div>

              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-6 pt-6">
                  <AccountInformation profile={mockProfile} />
                  {isProvider ? 
                    <ProviderSettings profile={mockProfile as ProviderProfile} /> :
                    <CustomerSettings profile={mockProfile as CustomerProfile} />
                  }
                </TabsContent>

                <TabsContent value="contact" className="space-y-6 pt-6">
                  <ContactDetails profile={mockProfile} />
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6 pt-6">
                  <Preferences profile={mockProfile} />
                </TabsContent>

                <TabsContent value="security" className="space-y-6 pt-6">
                  <SecuritySettings profile={mockProfile} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )

      case 'home':
      default:
        return (
          <>
            <SplitWithScreenshotOnDark />
            {renderQuickActions()}
          </>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {renderNavigation()}
      
      {/* Success message for OAuth signup */}
      {showSuccessMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                🎉 Welcome to ACCIS! Your account has been successfully created. You're now signed in{typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('role') ? ` as a ${new URLSearchParams(window.location.search).get('role')}` : ''}.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main>
        {renderCurrentSection()}
      </main>
      <CenteredWithLogo />
    </div>
  )
}