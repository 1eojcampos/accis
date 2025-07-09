"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Clock, 
  MessageCircle, 
  Package, 
  CheckCircle, 
  Eye, 
  Printer, 
  Shield, 
  Truck,
  Send,
  Bell
} from 'lucide-react'

interface Message {
  id: string
  sender: 'provider' | 'user'
  content: string
  timestamp: Date
  isRead: boolean
}

interface OrderDetails {
  id: string
  name: string
  provider: {
    name: string
    avatar: string
    rating: number
  }
  status: 'placed' | 'design-review' | 'printing' | 'quality-check' | 'ready'
  estimatedCompletion: Date
  modelPreview: string
  material: string
  quantity: number
  price: number
}

const statusSteps = [
  {
    key: 'placed',
    label: 'Order Placed',
    icon: Package,
    description: 'Order confirmed and queued'
  },
  {
    key: 'design-review',
    label: 'Design Review',
    icon: Eye,
    description: 'Reviewing 3D model for printability'
  },
  {
    key: 'printing',
    label: 'Printing',
    icon: Printer,
    description: 'Your model is being printed'
  },
  {
    key: 'quality-check',
    label: 'Quality Check',
    icon: Shield,
    description: 'Final inspection and finishing'
  },
  {
    key: 'ready',
    label: 'Ready for Pickup',
    icon: Truck,
    description: 'Ready for collection or delivery'
  }
]

const mockOrder: OrderDetails = {
  id: 'ORD-2024-001',
  name: 'Custom iPhone Case',
  provider: {
    name: 'TechPrint Solutions',
    avatar: '/api/placeholder/40/40',
    rating: 4.8
  },
  status: 'printing',
  estimatedCompletion: new Date('2024-01-25T14:30:00'),
  modelPreview: '/api/placeholder/200/200',
  material: 'PLA Plastic',
  quantity: 1,
  price: 25.99
}

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'provider',
    content: 'Your order has been received and we\'ve started the design review. The model looks great!',
    timestamp: new Date('2024-01-22T10:30:00'),
    isRead: true
  },
  {
    id: '2',
    sender: 'provider',
    content: 'Printing has started. Estimated completion time is tomorrow at 2:30 PM.',
    timestamp: new Date('2024-01-23T09:15:00'),
    isRead: true
  },
  {
    id: '3',
    sender: 'user',
    content: 'Thanks for the update! Can you let me know when it\'s ready for pickup?',
    timestamp: new Date('2024-01-23T09:45:00'),
    isRead: true
  },
  {
    id: '4',
    sender: 'provider',
    content: 'Absolutely! I\'ll notify you as soon as it passes quality check.',
    timestamp: new Date('2024-01-23T11:20:00'),
    isRead: false
  }
]

export default function OrderTracking() {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [order] = useState<OrderDetails>(mockOrder)

  const currentStatusIndex = statusSteps.findIndex(step => step.key === order.status)
  const unreadCount = messages.filter(m => m.sender === 'provider' && !m.isRead).length

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date(),
      isRead: true
    }

    setMessages([...messages, message])
    setNewMessage('')
  }

  const getStatusColor = (stepIndex: number) => {
    if (stepIndex < currentStatusIndex) return 'text-primary'
    if (stepIndex === currentStatusIndex) return 'text-primary'
    return 'text-muted-foreground'
  }

  const getStatusBg = (stepIndex: number) => {
    if (stepIndex < currentStatusIndex) return 'bg-primary'
    if (stepIndex === currentStatusIndex) return 'bg-primary'
    return 'bg-muted'
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Order Tracking</h1>
            <p className="text-sm text-muted-foreground">Track your order progress in real-time</p>
          </div>
          <Badge variant="secondary" className="bg-primary text-primary-foreground">
            Order #{order.id}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Order Details & Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon
                    const isCompleted = index < currentStatusIndex
                    const isActive = index === currentStatusIndex
                    
                    return (
                      <div key={step.key} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getStatusBg(index)} transition-colors`}>
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-primary-foreground" />
                            ) : (
                              <Icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                            )}
                          </div>
                          {index < statusSteps.length - 1 && (
                            <div className={`mt-1 h-8 w-px ${index < currentStatusIndex ? 'bg-primary' : 'bg-border'}`} />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <h3 className={`font-medium ${getStatusColor(index)}`}>{step.label}</h3>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          {isActive && (
                            <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-primary/20">
                              Current Status
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Item Name</p>
                      <p className="font-medium text-foreground">{order.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Material</p>
                      <p className="font-medium text-foreground">{order.material}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-medium text-foreground">{order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-medium text-foreground">${order.price}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Completion</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <p className="font-medium text-foreground">
                          {order.estimatedCompletion.toLocaleDateString()} at{' '}
                          {order.estimatedCompletion.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">3D Model Preview</p>
                      <div className="mt-2 h-24 w-24 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Provider Info & Messaging */}
          <div className="space-y-6">
            {/* Provider Info */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={order.provider.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {order.provider.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{order.provider.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">★ {order.provider.rating}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messaging */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">Messages</CardTitle>
                  {unreadCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <Badge variant="secondary" className="bg-primary text-primary-foreground">
                        {unreadCount} new
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-64 space-y-3 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`rounded-lg px-3 py-2 max-w-[80%] ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' 
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="bg-input border-border text-foreground"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}