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
import { CenteredWithLogo } from "@/components/blocks/footers/centered-with-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  ShoppingCart,
  Settings,
  LogOut,
  Users,
  Printer,
  ClipboardList,
  Truck
} from "lucide-react"

type AppSection = 'browse' | 'create-order' | 'track-orders' | 'customer-dashboard' | 'provider-dashboard' | 'manage-printers' | 'manage-requests' | 'home'
type UserRole = 'customer' | 'provider' | null

export default function HomePage() {
  const [currentSection, setCurrentSection] = useState<AppSection>('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userLoggedIn, setUserLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [notifications] = useState(3)
  const [cartItems] = useState(2)
  const [isLoading, setIsLoading] = useState(true)

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
            localStorage.setItem('authToken', `Bearer ${idToken}`);
            localStorage.setItem('user', JSON.stringify({
              email: user.email,
              role: userData.role
            }));
          } else {
            throw new Error('User data not found');
          }
        } else {
          // User is signed out
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUserLoggedIn(false);
          setUserRole(null);
          setCurrentSection('home');
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

  // Restricted navigation for logged-out users
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
      description: 'Find local 3D printing providers'
    },
    { 
      key: 'create-order' as AppSection, 
      label: 'Create Order', 
      icon: Upload,
      description: 'Upload your 3D models and get quotes'
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
      key: 'track-orders' as AppSection, 
      label: 'Track Orders', 
      icon: Package2,
      description: 'Update order status and progress'
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
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
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
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
            <span className="font-semibold text-foreground text-xl">PrintHub</span>
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
                {/* Cart - Only show for customers */}
                {userRole === 'customer' && (
                  <button className="relative p-2 text-muted-foreground hover:text-foreground">
                    <ShoppingCart className="w-5 h-5" />
                    {cartItems > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-primary text-primary-foreground"
                      >
                        {cartItems}
                      </Badge>
                    )}
                  </button>
                )}

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
                  <button className="p-1 rounded-full bg-primary text-primary-foreground">
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
        return <ProviderDiscovery />
      case 'create-order':
        // Protect this section - redirect if not logged in
        if (!userLoggedIn) {
          window.location.href = '/auth/signin'
          return null
        }
        return <OrderCreation />
      case 'track-orders':
        // Protect this section - redirect if not logged in
        if (!userLoggedIn) {
          window.location.href = '/auth/signin'
          return null
        }
        return <OrderTracking userRole={userRole} />
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

              {/* Order History */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Order History</h3>
                <div className="space-y-4">
                  {[
                    { id: '#3045', item: 'Phone Case', status: 'Completed', date: '2024-01-15', amount: '$45' },
                    { id: '#3044', item: 'Miniature Figure', status: 'In Progress', date: '2024-01-14', amount: '$67' },
                    { id: '#3043', item: 'Prototype Parts', status: 'Accepted', date: '2024-01-13', amount: '$125' },
                    { id: '#3042', item: 'Custom Bracket', status: 'Completed', date: '2024-01-12', amount: '$32' },
                    { id: '#3041', item: 'Jewelry Design', status: 'Completed', date: '2024-01-10', amount: '$89' }
                  ].map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="font-mono text-sm text-muted-foreground">{order.id}</div>
                        <div>
                          <div className="font-medium text-foreground">{order.item}</div>
                          <div className="text-sm text-muted-foreground">{order.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge 
                          className={`${
                            order.status === 'Completed' 
                              ? 'bg-green-100 text-green-800' 
                              : order.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.status}
                        </Badge>
                        <div className="font-semibold text-foreground">{order.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
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

              {/* Order History */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Order History</h3>
                <div className="space-y-4">
                  {[
                    { id: '#3045', item: 'Phone Case', status: 'Completed', date: '2024-01-15', amount: '$45', customer: 'John D.' },
                    { id: '#3044', item: 'Miniature Figure', status: 'In Progress', date: '2024-01-14', amount: '$67', customer: 'Sarah M.' },
                    { id: '#3043', item: 'Prototype Parts', status: 'Started', date: '2024-01-13', amount: '$125', customer: 'TechCorp' },
                    { id: '#3042', item: 'Custom Bracket', status: 'Completed', date: '2024-01-12', amount: '$32', customer: 'Mike R.' },
                    { id: '#3041', item: 'Jewelry Design', status: 'Completed', date: '2024-01-10', amount: '$89', customer: 'Emma L.' }
                  ].map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="font-mono text-sm text-muted-foreground">{order.id}</div>
                        <div>
                          <div className="font-medium text-foreground">{order.item}</div>
                          <div className="text-sm text-muted-foreground">Customer: {order.customer} • {order.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge 
                          className={`${
                            order.status === 'Completed' 
                              ? 'bg-green-100 text-green-800' 
                              : order.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'Started'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.status}
                        </Badge>
                        <div className="font-semibold text-foreground">{order.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
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
      <main>
        {renderCurrentSection()}
      </main>
      <CenteredWithLogo />
    </div>
  )
}