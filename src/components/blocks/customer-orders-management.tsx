"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { getFileDownloadUrl } from "@/lib/firebase/storage"
import { 
  Package, 
  Clock, 
  MapPin, 
  DollarSign,
  AlertCircle,
  FileText,
  Filter
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
  const [statusFilter, setStatusFilter] = useState<string>('all')

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
    
    try {
      let d: Date
      
      // Handle Firestore timestamp
      if (date.toDate && typeof date.toDate === 'function') {
        d = date.toDate()
      }
      // Handle Firebase timestamp object
      else if (date.seconds) {
        d = new Date(date.seconds * 1000)
      }
      // Handle ISO string or other date formats
      else {
        d = new Date(date)
      }
      
      // Check if date is valid
      if (isNaN(d.getTime())) {
        return 'Invalid Date'
      }
      
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
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

  // Filter orders based on status
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter(order => order.status === statusFilter)
  }, [orders, statusFilter])

  const OrderCard = ({ order }: { order: Order }) => {
    if (!order) return null;
    
    return (
      <AccordionItem value={order.id} className="border rounded-lg bg-slate-800/50 backdrop-blur-sm">
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-700/30">
          <div className="flex justify-between items-center w-full">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-white">Order #{(order.id || 'unknown').slice(-6)}</h3>
              <p className="text-sm text-slate-300">
                Created: {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace('_', ' ').replace(/-/g, ' ').split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </Badge>
              <span className="text-sm font-medium text-white">
                {order.status === 'completed' 
                  ? `$${order.actualCost || order.estimatedCost || 0}`
                  : `~$${order.estimatedCost || 0}`
                }
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 bg-slate-700/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-200">
                {order.material || 'N/A'} • {order.quality || 'N/A'} • {order.quantity || 1}x
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-200">{order.location || 'Not specified'}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-200">
                {order.status === 'completed' 
                  ? `Final Cost: $${order.actualCost || order.estimatedCost || 0}`
                  : `Estimated Cost: $${order.estimatedCost || 0}`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-200">
                {order.status === 'completed'
                  ? `Completed in: ${order.actualTimeline || order.estimatedTimeline || 0} days`
                  : `Estimated Time: ${order.estimatedTimeline || 0} days`
                }
              </span>
            </div>
          </div>

          {order.providerName && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1 text-slate-200">Provider:</p>
              <p className="text-sm text-slate-300">{order.providerName}</p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm font-medium mb-1 text-slate-200">Files:</p>
            <div className="flex flex-wrap gap-2">
              {order.files && order.files.length > 0 ? (
                order.files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs flex items-center gap-1 border-slate-500 text-slate-200">
                      <FileText className="w-3 h-3" />
                      <span>{file.name || `File ${index + 1}`}</span>
                      {file.size && (
                        <span className="text-slate-400">
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
                <span className="text-sm text-slate-300">No files uploaded</span>
              )}
            </div>
          </div>

          {order.requirements && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1 text-slate-200">Requirements:</p>
              <p className="text-sm text-slate-300">{order.requirements}</p>
            </div>
          )}

          {order.providerNotes && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1 text-slate-200">Provider Notes:</p>
              <p className="text-sm text-slate-300">{order.providerNotes}</p>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Orders</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="quote-requested">Quote Requested</SelectItem>
                <SelectItem value="quote-submitted">Quote Submitted</SelectItem>
                <SelectItem value="quote-accepted">Quote Accepted</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="printing">Printing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
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
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {statusFilter === 'all' ? 'No orders found' : `No orders with status "${statusFilter}" found`}
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          <div className="text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
          <Accordion type="multiple" className="space-y-2">
            {filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </Accordion>
        </div>
      )}
    </div>
  )
}
