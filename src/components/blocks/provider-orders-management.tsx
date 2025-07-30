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
  FileText
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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [completedOrders, setCompletedOrders] = useState<Order[]>([])

  // Fetch only completed orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await orderAPI.getProviderOrders()
      const orders = Array.isArray(response.data) ? response.data : []
      
      // Filter for completed orders
      const completedOrders = orders.filter(order => order.status === 'completed')
      
      // Sort by completion date (most recent first)
      completedOrders.sort((a, b) => {
        const dateA = new Date(a.updatedAt)
        const dateB = new Date(b.updatedAt)
        return dateB.getTime() - dateA.getTime()
      })
      
      setCompletedOrders(completedOrders)
    } catch (err: any) {
      console.error('Error fetching completed orders:', err)
      setError(err.response?.data?.error || 'Failed to fetch completed orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Removed unused order management functions as this component now only shows completed orders

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
    return orders || []
  }

  const OrderCard = ({ order }: { order: Order }) => {
    if (!order) return null;
    
    return (
      <Card key={order.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Order #{(order.id || 'unknown').slice(-6)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Completed: {formatDate(order.updatedAt)}
              </p>
            </div>
            <Badge className={getStatusColor('completed')}>
              Completed
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
              <span className="text-sm">Final Cost: ${order.actualCost || order.estimatedCost || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Timeline: {order.actualTimeline || order.estimatedTimeline || 0} days</span>
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
        </CardContent>
      </Card>
    )
  }

  // Loading state removed as we're not fetching orders anymore

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order History</h2>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          Refresh
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

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading completed orders...
        </div>
      ) : completedOrders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No completed orders found
        </div>
      ) : (
        <div className="space-y-4">
          {completedOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
