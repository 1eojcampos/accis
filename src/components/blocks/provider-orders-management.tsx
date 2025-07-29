"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Package, 
  Clock, 
  MapPin, 
  User, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Search,
  Filter
} from "lucide-react"
import { orderAPI } from "@/lib/api"

interface Order {
  id: string
  customerId: string
  files: any[]
  material: string
  quality: string
  quantity: number
  requirements: string
  location: string
  estimatedCost: number
  estimatedTimeline: number
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'quote-requested' | 'quote-submitted' | 'quote-accepted' | 'paid' | 'printing'
  createdAt: any
  updatedAt: any
  providerId?: string
  providerNotes?: string
  actualCost?: number
  actualTimeline?: number
}

export default function ProviderOrdersManagement() {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'available' | 'my-orders'>('available')
  const [searchTerm, setSearchTerm] = useState('')
  const [quotePrices, setQuotePrices] = useState<{[key: string]: number}>({})
  const [quoteTimelines, setQuoteTimelines] = useState<{[key: string]: number}>({})
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseNotes, setResponseNotes] = useState('')

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [availableResponse, myOrdersResponse] = await Promise.all([
        orderAPI.getAvailableOrders(),
        orderAPI.getProviderOrders()
      ])
      
      // Ensure we have arrays with proper fallbacks
      const availableOrders = Array.isArray(availableResponse.data) ? availableResponse.data : []
      const myOrders = Array.isArray(myOrdersResponse.data) ? myOrdersResponse.data : []
      
      // Ensure each order has required properties
      const sanitizeOrder = (order: any) => ({
        ...order,
        files: order.files || [],
        requirements: order.requirements || '',
        location: order.location || 'Not specified',
        providerNotes: order.providerNotes || '',
        estimatedCost: order.estimatedCost || 0,
        estimatedTimeline: order.estimatedTimeline || 0
      })
      
      setAvailableOrders(availableOrders.map(sanitizeOrder))
      setMyOrders(myOrders.map(sanitizeOrder))
      
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.response?.data?.error || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setError(null)
      await orderAPI.updateStatus(orderId, newStatus)
      fetchOrders()
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to update order status to ${newStatus}`)
    }
  }

  const handleRespond = async (orderId: string, action: 'accept' | 'reject') => {
    try {
      setError(null)
      
      const requestData: any = {
        action,
        notes: responseNotes
      }
      
      if (action === 'accept') {
        if (quotePrices[orderId]) requestData.quotedPrice = quotePrices[orderId]
        if (quoteTimelines[orderId]) requestData.quotedTimeline = quoteTimelines[orderId]
      }
      
      await orderAPI.respondToOrder(orderId, action, {
        notes: responseNotes,
        quotedPrice: quotePrices[orderId],
        quotedTimeline: quoteTimelines[orderId]?.toString() || ''
      })
      
      // Reset form
      setRespondingTo(null)
      setResponseNotes('')
      setQuotePrices(prev => ({ ...prev, [orderId]: 0 }))
      setQuoteTimelines(prev => ({ ...prev, [orderId]: 0 }))
      
      // Refresh orders
      fetchOrders()
      
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${action} order`)
    }
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'quote-requested': return 'bg-purple-100 text-purple-800'
      case 'quote-submitted': return 'bg-indigo-100 text-indigo-800'
      case 'quote-accepted': return 'bg-teal-100 text-teal-800'
      case 'paid': return 'bg-emerald-100 text-emerald-800'
      case 'printing': return 'bg-cyan-100 text-cyan-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredOrders = (orders: Order[]) => {
    if (!searchTerm || !orders) return orders || []
    return orders.filter(order => 
      (order.material || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.requirements || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const OrderCard = ({ order, isAvailable = false }: { order: Order, isAvailable?: boolean }) => {
    // Safety check to ensure order exists
    if (!order) {
      return null
    }
    
    return (
      <Card key={order.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Order #{(order.id || 'unknown').slice(-6)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <Badge className={getStatusColor(order.status || 'pending')}>
              {(order.status || 'pending').replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {order.material || 'N/A'} • {order.quality || 'N/A'} • {order.quantity || 1}x
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{order.location || 'Not specified'}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Est. ${order.estimatedCost || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Est. {order.estimatedTimeline || 0} day(s)</span>
            </div>
          </div>
        
        <div className="mb-4">
          <p className="text-sm font-medium mb-1">Files:</p>
          <div className="flex flex-wrap gap-2">
            {order.files && order.files.length > 0 ? (
              order.files.map((file: any, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  {file.name || `File ${index + 1}`}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No files uploaded</span>
            )}
          </div>
        </div>
        
        {order.requirements && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Requirements:</p>
            <p className="text-sm text-muted-foreground">{order.requirements}</p>
          </div>
        )}
        
        {order.providerNotes && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Provider Notes:</p>
            <p className="text-sm text-muted-foreground">{order.providerNotes}</p>
          </div>
        )}

        {/* Show 'Start Printing' button for paid orders */}
        {!isAvailable && order.status === 'paid' && (
          <div className="mt-4">
            <Button
              onClick={() => handleStatusUpdate(order.id, 'printing')}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              <Package className="w-4 h-4 mr-2" />
              Start Printing
            </Button>
          </div>
        )}
        
        {isAvailable && order.status === 'pending' && (
          <div className="mt-4 space-y-3">
            {respondingTo === order.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Quote Price ($)</label>
                    <Input
                      type="number"
                      placeholder="Enter your quote"
                      value={quotePrices[order.id] || ''}
                      onChange={(e) => setQuotePrices(prev => ({ 
                        ...prev, 
                        [order.id]: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Timeline (days)</label>
                    <Input
                      type="number"
                      placeholder="Estimated days"
                      value={quoteTimelines[order.id] || ''}
                      onChange={(e) => setQuoteTimelines(prev => ({ 
                        ...prev, 
                        [order.id]: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea
                    placeholder="Add any notes for the customer..."
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRespond(order.id, 'accept')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Order
                  </Button>
                  <Button
                    onClick={() => handleRespond(order.id, 'reject')}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Order
                  </Button>
                  <Button
                    onClick={() => setRespondingTo(null)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setRespondingTo(order.id)}
                className="w-full"
              >
                Respond to Order
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Provider Orders Management</h2>
        <Button onClick={fetchOrders} variant="outline">
          Refresh Orders
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'available' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('available')}
          className="flex-1"
        >
          Available Orders ({availableOrders.length})
        </Button>
        <Button
          variant={activeTab === 'my-orders' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('my-orders')}
          className="flex-1"
        >
          My Orders ({myOrders.length})
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search orders by material, location, or requirements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {activeTab === 'available' ? (
          <>
            <h3 className="text-lg font-semibold">Available Orders</h3>
            {filteredOrders(availableOrders).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No available orders found
              </div>
            ) : (
              filteredOrders(availableOrders).map(order => (
                <OrderCard key={order.id} order={order} isAvailable={true} />
              ))
            )}
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold">My Orders</h3>
            {filteredOrders(myOrders).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders found
              </div>
            ) : (
              filteredOrders(myOrders).map(order => (
                <OrderCard key={order.id} order={order} isAvailable={false} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
