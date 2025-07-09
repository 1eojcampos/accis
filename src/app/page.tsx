"use client"

import { useState } from "react"
import SplitWithScreenshotOnDark from "@/components/blocks/heros/split-with-screenshot-on-dark"
import OrderCreation from "@/components/blocks/order-creation"
import ProviderDiscovery from "@/components/blocks/provider-discovery"
import OrderTracking from "@/components/blocks/order-tracking"
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
  LogOut
} from "lucide-react"

type AppSection = 'browse' | 'create-order' | 'track-orders' | 'provider-dashboard' | 'home'

export default function HomePage() {
  const [currentSection, setCurrentSection] = useState<AppSection>('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userLoggedIn] = useState(true) // Simulated login state
  const [notifications] = useState(3) // Simulated notification count
  const [cartItems] = useState(2) // Simulated cart items

  const navigationItems = [
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
      key: 'provider-dashboard' as AppSection, 
      label: 'Provider Dashboard', 
      icon: BarChart3,
      description: 'Manage your printing services'
    }
  ]

  const renderNavigation = () => (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setCurrentSection('home')}
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
                  onClick={() => {
                    setCurrentSection(item.key)
                    setMobileMenuOpen(false)
                  }}
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
            {userLoggedIn && (
              <>
                {/* Cart */}
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

                {/* User Menu */}
                <div className="flex items-center space-x-2">
                  <button className="p-1 rounded-full bg-primary text-primary-foreground">
                    <User className="w-4 h-4" />
                  </button>
                </div>
              </>
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
                    onClick={() => {
                      setCurrentSection(item.key)
                      setMobileMenuOpen(false)
                    }}
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
            </div>
          </div>
        )}
      </div>
    </nav>
  )

  const renderQuickActions = () => (
    <div className="bg-background py-8 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Card 
                key={`quick-${item.key}`}
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-card border-border"
                onClick={() => setCurrentSection(item.key)}
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

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'browse':
        return <ProviderDiscovery />
      case 'create-order':
        return <OrderCreation />
      case 'track-orders':
        return <OrderTracking />
      case 'provider-dashboard':
        return (
          <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-7xl mx-auto text-center">
              <div className="text-6xl mb-4">⚙️</div>
              <h1 className="text-3xl font-bold text-foreground mb-4">Provider Dashboard</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Manage your 3D printing services, track orders, and view earnings.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Active Orders</h3>
                  <p className="text-3xl font-bold text-primary">12</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">This Month's Earnings</h3>
                  <p className="text-3xl font-bold text-primary">$1,247</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Rating</h3>
                  <p className="text-3xl font-bold text-primary">4.8★</p>
                </Card>
              </div>
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