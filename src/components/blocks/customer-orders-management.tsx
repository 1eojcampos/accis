"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { getFileDownloadUrl } from "@/lib/firebase/storage"
import { 
  Package, 
  Clock, 
  MapPin, 
  DollarSign,
  AlertCircle,
  FileText
} from "lucide-react"
import { orderAPI } from "@/lib/api"

interface FileInfo {
  name: string;
  size: number;
  type: string;
  url?: string;
  downloadUrl?: string;
  storagePath?: string;
}

interface Order {
  id: string;
  customerId: string;
  customerEmail?: string;
  customerName?: string;

  files: Array<FileInfo>;

  material: string;
  quality: string;
  quantity: number;
  requirements: string;
  location: string;
  estimatedCost: number;
  estimatedTimeline: number;
  
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'quote-requested' | 'quote-submitted' | 'quote-accepted' | 'paid' | 'printing';
  
  // Enhanced data
  enhancedFiles?: {
    uploaded: Array<FileInfo>;
    totalCount: number;
    totalSize: number;
  };

  timeline?: {
    estimated: number;
    actual?: number;
    estimatedCompletion?: string;
    actualCompletion?: string;
  };

  budget?: {
    estimated: number;
    quoted?: number;
    final?: number;
  };

  createdAt: any;
  updatedAt: any;
  providerId?: string;
  providerName?: string;
  providerNotes?: string;
  actualCost?: number;
  actualTimeline?: number;
}

export default function CustomerOrdersManagement() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await orderAPI.getCustomerOrders()
      const orders = Array.isArray(response.data) ? response.data : []
      
      // Sort by date (most recent first)
      orders.sort((a, b) => {
        const dateA = new Date(a.updatedAt)
        const dateB = new Date(b.updatedAt)
        return dateB.getTime() - dateA.getTime()
      })
      
      setOrders(orders)
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

  const OrderCard = ({ order }: { order: Order }) => {
    if (!order) return null;
    
    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Order #{(order.id || 'unknown').slice(-6)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Created: {formatDate(order.createdAt)}
              </p>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {order.status.replace('_', ' ').replace(/-/g, ' ').split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
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
              <span className="text-sm">
                {order.status === 'completed' 
                  ? `Final Cost: $${order.actualCost || order.estimatedCost || 0}`
                  : `Estimated Cost: $${order.estimatedCost || 0}`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {order.status === 'completed'
                  ? `Completed in: ${order.actualTimeline || order.estimatedTimeline || 0} days`
                  : `Estimated Time: ${order.estimatedTimeline || 0} days`
                }
              </span>
            </div>
          </div>

          {order.providerName && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Provider:</p>
              <p className="text-sm text-muted-foreground">{order.providerName}</p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Files:</p>
            <div className="flex flex-wrap gap-2">
              {order.files && order.files.length > 0 ? (
                order.files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>{file.name || `File ${index + 1}`}</span>
                      {file.size && (
                        <span className="text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                      onClick={async () => {
                        try {
                          let downloadUrl = file.downloadUrl || file.url;
                          
                          // If we have a storagePath but no download URL, get a fresh one
                          if (!downloadUrl && file.storagePath) {
                            downloadUrl = await getFileDownloadUrl(file.storagePath);
                          }
                          
                          if (downloadUrl) {
                            window.open(downloadUrl, '_blank');
                          } else {
                            toast.error('Download URL not available');
                          }
                        } catch (error) {
                          console.error('Error getting download URL:', error);
                          toast.error('Failed to get download URL');
                        }
                      }}
                      disabled={!file.downloadUrl && !file.url && !file.storagePath}
                    >
                      Download
                    </Button>
                  </div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Orders</h2>
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
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No orders found
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
