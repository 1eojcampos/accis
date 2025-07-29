"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy 
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
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
  Bell,
  DollarSign,
  FileText,
  MapPin,
  CreditCard,
  Loader2,
  RefreshCw,
  AlertCircle,
  Calendar,
  User
} from 'lucide-react'

interface PrintRequest {
  id: string;
  customerId: string;
  customerEmail?: string;
  customerName?: string;
  
  // Enhanced nested schema structure
  enhancedFiles?: {
    uploaded: Array<{
      name: string;
      size: number;
      type: string;
      uploadedAt?: string;
      status?: string;
    }>;
    totalCount: number;
    totalSize: number;
  };
  
  enhancedRequirements?: {
    material: string;
    quality: string;
    quantity: number;
    specifications?: string;
    location?: string;
  };
  
  timeline?: {
    requested?: string | null;
    estimated: number;
    actual?: string | null;
    completion?: {
      estimatedDate?: string;
      actualDate?: string;
    };
  };
  
  budget?: {
    customerMax?: number | null;
    estimated: number;
    quoted?: number | null;
    final?: number | null;
  };
  
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    updatedBy: string;
    actor?: string;
    notes?: string;
  }>;
  
  quote?: {
    amount: number;
    deliveryTime: string;
    notes?: string;
    submittedAt: string;
    acceptedAt?: string;
    providerId: string;
    providerName: string;
  } | null;
  
  payment?: {
    status: 'pending' | 'paid' | 'failed';
    method?: string;
    paidAt?: string;
    amount?: number;
  };
  
  // Legacy fields for backward compatibility (will be used if new schema is not available)
  legacyFiles?: Array<{
    name: string;
    size: number;
    type: string;
  }>;
  material?: string;
  quality?: string;
  quantity?: number;
  legacyRequirements?: string;
  location?: string;
  estimatedCost?: number;
  estimatedTimeline?: number;
  status: 'quote-requested' | 'quote-submitted' | 'quote-accepted' | 'printing' | 'in-progress' | 'completed' | 'rejected';
  providerId?: string;
  providerName?: string;
  providerEmail?: string;
  quoteAmount?: number;
  estimatedDeliveryTime?: string;
  providerNotes?: string;
  quotedAt?: any;
  acceptedAt?: any;
  paidAt?: any;
  createdAt: any;
  updatedAt: any;
}

// Order Card component for displaying individual orders
interface OrderCardProps {
  order: PrintRequest;
  onPayNow: (orderId: string) => void;
  paying: boolean;
  formatPrice: (price: number) => string;
  formatDate: (timestamp: any) => string;
  formatFileSize: (bytes: number) => string;
  getStatusColor: (status: string) => string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onPayNow,
  paying,
  formatPrice,
  formatDate,
  formatFileSize,
  getStatusColor
}) => {
  // Helper functions to access data from both new and legacy schema
  const getFiles = () => {
    if (order.enhancedFiles?.uploaded) {
      return order.enhancedFiles.uploaded;
    }
    return order.legacyFiles || [];
  };

  const getMaterial = () => {
    return order.enhancedRequirements?.material || order.material || 'Unknown';
  };

  const getQuality = () => {
    return order.enhancedRequirements?.quality || order.quality || 'Unknown';
  };

  const getQuantity = () => {
    return order.enhancedRequirements?.quantity || order.quantity || 1;
  };

  const getRequirements = () => {
    return order.enhancedRequirements?.specifications || order.legacyRequirements || '';
  };

  const getEstimatedCost = () => {
    return order.budget?.estimated || order.estimatedCost || 0;
  };

  const getQuoteAmount = () => {
    return order.quote?.amount || order.quoteAmount || null;
  };

  const getQuoteNotes = () => {
    return order.quote?.notes || order.providerNotes || '';
  };

  const getQuotedAt = () => {
    return order.quote?.submittedAt || order.quotedAt;
  };

  const getEstimatedDelivery = () => {
    return order.quote?.deliveryTime || order.estimatedDeliveryTime || '';
  };

  const files = getFiles();
  const canPay = order.status === 'quote-submitted' && getQuoteAmount();
  const isPaid = order.status === 'quote-accepted' || order.status === 'printing' || order.status === 'completed';
  const isCompleted = order.status === 'completed';
  const isPrinting = order.status === 'printing';
  const isInProgress = order.status === 'in-progress';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
              <p className="text-sm text-muted-foreground">
                Submitted: {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(order.status)}>
              {order.status === 'quote-submitted' ? 'Quote Received' : 
               order.status === 'quote-accepted' ? 'Payment Confirmed' : 
               order.status === 'printing' ? 'Being Printed' :
               order.status === 'completed' ? 'Ready for Pickup' :
               order.status}
            </Badge>
            {isPaid && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                💳 Paid
              </Badge>
            )}
            {order.status === 'printing' && order.timeline?.completion?.estimatedDate && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                🖨️ Est: {new Date(order.timeline.completion.estimatedDate).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Print Specifications</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Material:</span>
                <span>{getMaterial()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality:</span>
                <span>{getQuality()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span>{getQuantity()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {getQuoteAmount() ? 'Quote Amount:' : 'Estimated Cost:'}
                </span>
                <span className="font-medium">
                  {formatPrice(getQuoteAmount() || getEstimatedCost())}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Files ({files.length})</h4>
            <div className="space-y-1">
              {files.slice(0, 3).map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                </div>
              ))}
              {files.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{files.length - 3} more files
                </p>
              )}
            </div>
          </div>
        </div>

        {getRequirements() && (
          <div>
            <h4 className="font-medium mb-2">Requirements</h4>
            <p className="text-sm text-muted-foreground">{getRequirements()}</p>
          </div>
        )}

        {/* Provider Info */}
        {order.providerId && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Provider</h4>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{order.providerName || order.providerEmail || 'Provider'}</span>
            </div>
            {order.acceptedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="w-4 h-4" />
                <span>Accepted: {formatDate(order.acceptedAt)}</span>
              </div>
            )}
          </div>
        )}

        {/* Quote details */}
        {canPay && (
          <div className="border-t pt-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <h4 className="font-medium text-blue-400">Quote Received</h4>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quote Amount:</span>
                  <span className="font-medium text-lg">{formatPrice(getQuoteAmount()!)}</span>
                </div>
                {getEstimatedDelivery() && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Delivery:</span>
                    <span>{getEstimatedDelivery()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quote Sent:</span>
                  <span>{formatDate(getQuotedAt())}</span>
                </div>
                {getQuoteNotes() && (
                  <div className="mt-2">
                    <span className="text-muted-foreground block">Provider Notes:</span>
                    <span className="text-sm">{getQuoteNotes()}</span>
                  </div>
                )}
              </div>
              <Button 
                onClick={() => onPayNow(order.id)}
                disabled={paying}
                className="w-full"
                size="lg"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Test Pay {formatPrice(getQuoteAmount()!)}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Payment confirmed status - only show when paid but not printing/completed */}
        {isPaid && !isPrinting && !isCompleted && (
          <div className="border-t pt-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="font-medium text-green-400">Payment Confirmed!</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Amount:</span>
                  <span className="font-medium">{formatPrice(order.payment?.amount || getQuoteAmount() || getEstimatedCost())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid At:</span>
                  <span>{formatDate(order.payment?.paidAt || order.paidAt)}</span>
                </div>
              </div>
              <p className="text-sm text-green-400 mt-2">
                🎉 Your order is queued for printing!
              </p>
            </div>
          </div>
        )}

        {/* Printing Status */}
        {isPrinting && (
          <div className="border-t pt-4">
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Printer className="w-5 h-5 text-purple-400" />
                <h4 className="font-medium text-purple-400">Currently Printing</h4>
              </div>
              <div className="space-y-2 text-sm">
                {order.timeline?.completion?.estimatedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Completion:</span>
                    <span>{new Date(order.timeline.completion.estimatedDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-purple-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Your order is being printed...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Status */}
        {isCompleted && (
          <div className="border-t pt-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="font-medium text-green-400">Order Completed</h4>
              </div>
              <div className="space-y-2 text-sm">
                {order.timeline?.completion?.actualDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed On:</span>
                    <span>{new Date(order.timeline.completion.actualDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="text-green-400">
                  ✓ Ready for pickup or delivery
                </div>
              </div>
            </div>
          </div>
        )}

        {/* In Progress status */}
        {isInProgress && (
          <div className="border-t pt-4">
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Printer className="w-5 h-5 text-orange-400" />
                <h4 className="font-medium text-orange-400">Currently Printing</h4>
              </div>
              <p className="text-sm text-orange-400">
                🖨️ Your order is currently being printed by the provider!
              </p>
            </div>
          </div>
        )}

        {/* Completed status */}
        {isCompleted && (
          <div className="border-t pt-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-medium text-emerald-400">Ready for Pickup!</h4>
              </div>
              <p className="text-sm text-emerald-400">
                ✅ Your order has been completed and is ready for pickup or delivery!
              </p>
            </div>
          </div>
        )}

        {order.location && (
          <div className="flex items-center gap-2 text-sm border-t pt-4">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{order.location}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function OrderTracking() {
  const { currentUser, userProfile } = useAuth();
  const [orders, setOrders] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payingOrder, setPayingOrder] = useState<string | null>(null);

  // Load user's orders
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const ordersQuery = query(
      collection(db, 'printRequests'),
      where('customerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PrintRequest[];
        
        setOrders(ordersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        setError('Failed to load your orders');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Handle test payment
  const handlePayNow = async (orderId: string) => {
    if (!currentUser) return;
    
    setPayingOrder(orderId);
    try {
      const orderDoc = doc(db, 'printRequests', orderId);
      const currentOrder = orders.find(o => o.id === orderId);
      
      // Enhanced payment structure
      const paymentData = {
        status: 'paid' as const,
        method: 'test-simulated',
        paidAt: new Date().toISOString(),
        amount: currentOrder?.quote?.amount || currentOrder?.quoteAmount || currentOrder?.estimatedCost || 0
      };

      // Status history entry
      const statusEntry = {
        status: 'paid',
        timestamp: new Date().toISOString(),
        updatedBy: currentUser.uid,
        actor: currentUser.uid,
        notes: `Payment accepted: ${formatPrice(paymentData.amount)}`
      };

      // Update quote with acceptance timestamp
      const updatedQuote = currentOrder?.quote ? {
        ...currentOrder.quote,
        acceptedAt: new Date().toISOString()
      } : null;

      await updateDoc(orderDoc, {
        // Enhanced schema fields
        payment: paymentData,
        quote: updatedQuote,
        'budget.final': paymentData.amount,
        statusHistory: [...(currentOrder?.statusHistory || []), statusEntry],
        
        // Legacy compatibility fields
        status: 'paid',
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      toast.success('Payment processed successfully!');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setPayingOrder(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Helper functions for this order
      const getMaterial = () => order.enhancedRequirements?.material || order.material || '';
      const getRequirements = () => order.enhancedRequirements?.specifications || order.legacyRequirements || '';
      const getLocation = () => order.enhancedRequirements?.location || order.location || '';
      
      const matchesSearch = getMaterial().toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getRequirements().toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getLocation().toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'quote-submitted': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'printing': return 'bg-purple-600/20 text-purple-300 border-purple-600/30';
      case 'in-progress': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground">Please sign in to track your orders.</p>
            <Button 
              onClick={() => window.location.href = '/auth/signin'}
              className="mt-4"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  const requestedCount = orders.filter(o => o.status === 'quote-requested').length;
  const quoteCount = orders.filter(o => o.status === 'quote-submitted').length;
  const acceptedCount = orders.filter(o => o.status === 'quote-accepted' || o.status === 'printing' || o.status === 'in-progress').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Track Your Orders</h1>
                <p className="text-muted-foreground">Monitor the progress of your 3D printing requests</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-muted-foreground">Quote Requested</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{requestedCount}</p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-muted-foreground">Quotes Received</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{quoteCount}</p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-muted-foreground">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{acceptedCount}</p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{completedCount}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by order ID, material, or requirements..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-md border border-input bg-background text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="quote-submitted">Quote Received</option>
              <option value="paid">Paid</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {error && (
          <Card className="border-red-500/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No orders match your current filters.' 
                    : 'You haven\'t submitted any 3D printing requests yet.'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button 
                    onClick={() => window.location.href = '#create-order'}
                    className="mt-4"
                  >
                    Submit Your First Order
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard 
                key={order.id}
                order={order}
                onPayNow={handlePayNow}
                paying={payingOrder === order.id}
                formatPrice={formatPrice}
                formatDate={formatDate}
                formatFileSize={formatFileSize}
                getStatusColor={getStatusColor}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}