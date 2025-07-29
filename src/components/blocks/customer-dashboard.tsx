"use client";

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Package,
  Clock,
  DollarSign,
  FileText,
  Check,
  AlertCircle,
  CreditCard,
  Loader2,
  RefreshCw,
  User,
  MapPin
} from 'lucide-react';

interface PrintOrder {
  id: string;
  customerId: string;
  providerId?: string;
  providerEmail?: string;
  files: Array<{
    name: string;
    size: number;
    type: string;
  }>;
  material: string;
  quality: string;
  quantity: number;
  requirements?: string;
  location?: string;
  estimatedCost: number;
  status: 'quote-requested' | 'quote-submitted' | 'quote-accepted' | 'printing' | 'in-progress' | 'completed' | 'rejected';
  quoteAmount?: number;
  estimatedDeliveryTime?: string;
  providerNotes?: string;
  quotedAt?: any;
  acceptedAt?: any;
  paidAt?: any;
  createdAt: any;
  updatedAt: any;
}

export const CustomerDashboardComponent = () => {
  const { currentUser, userProfile } = useAuth();
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<string | null>(null);

  // Load user's orders
  useEffect(() => {
    if (!currentUser) return;

    const ordersQuery = query(
      collection(db, 'printRequests'),
      where('customerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PrintOrder[];
        
        // Sort by creation date, newest first
        ordersData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        setOrders(ordersData);
        setLoading(false);
        setError(null);
        
        // Debug: Log received orders to see their structure
        console.log('Customer Dashboard - Received orders:', ordersData);
        const quoteSubmittedOrders = ordersData.filter(o => o.status === 'quote-submitted');
        console.log('Orders with quote-submitted status:', quoteSubmittedOrders);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        setError('Failed to load your orders');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Simulate payment for a quote
  const handlePayQuote = async (orderId: string, quoteAmount: number) => {
    if (!currentUser) return;
    
    setPayingOrder(orderId);
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const orderDoc = doc(db, 'printRequests', orderId);
      await updateDoc(orderDoc, {
        status: 'quote-accepted',
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      toast.success(`Payment of ${formatPrice(quoteAmount)} processed successfully!`);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setPayingOrder(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quote-requested': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'quote-submitted': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'quote-accepted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'printing': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'in-progress': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'quote-requested': return 'Waiting for Quote';
      case 'quote-submitted': return 'Quote Received';
      case 'quote-accepted': return 'Quote Accepted';
      case 'printing': return 'Printing in Progress';
      case 'in-progress': return 'Printing in Progress';
      case 'completed': return 'Order Completed';
      case 'rejected': return 'Order Rejected';
      default: return status;
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

  if (!currentUser || userProfile?.userType !== 'customer') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">This page is only accessible to customers.</p>
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

  const requestedOrders = orders.filter(o => o.status === 'quote-requested').length;
  const quotesReceived = orders.filter(o => 
    o.status === 'quote-submitted'
  ).length;
  const paidOrders = orders.filter(o => o.status === 'quote-accepted' || o.status === 'printing' || o.status === 'in-progress' || o.status === 'completed').length;
  const totalSpent = orders
    .filter(o => o.status === 'quote-accepted' || o.status === 'printing' || o.status === 'in-progress' || o.status === 'completed')
    .reduce((sum, order) => sum + (order.quoteAmount || order.estimatedCost || 0), 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Print Orders</h1>
                <p className="text-muted-foreground">Track and manage your 3D printing requests</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-muted-foreground">Requested Quotes</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{requestedOrders}</p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-muted-foreground">Quotes Received</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{quotesReceived}</p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-sm text-muted-foreground">Orders Paid</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{paidOrders}</p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Spent</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{formatPrice(totalSpent)}</p>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="border-red-500/50">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't placed any print requests yet.
                </p>
                <Button onClick={() => window.location.href = '/customer/dashboard'}>
                  Create Your First Order
                </Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          <Package className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created: {formatDate(order.createdAt)}
                        </p>
                        {order.providerEmail && (
                          <p className="text-sm text-muted-foreground">
                            Provider: {order.providerEmail}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
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
                          <span>{order.material}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quality:</span>
                          <span>{order.quality}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quantity:</span>
                          <span>{order.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {order.quoteAmount ? 'Final Price:' : 'Estimated Cost:'}
                          </span>
                          <span className="font-medium">
                            {formatPrice(order.quoteAmount || order.estimatedCost)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Files ({order.files.length})</h4>
                      <div className="space-y-1">
                        {order.files.slice(0, 3).map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                          </div>
                        ))}
                        {order.files.length > 3 && (
                          <p className="text-sm text-muted-foreground">
                            +{order.files.length - 3} more files
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {order.requirements && (
                    <div>
                      <h4 className="font-medium mb-2">Requirements</h4>
                      <p className="text-sm text-muted-foreground">{order.requirements}</p>
                    </div>
                  )}

                  {/* Quote Information - Show for quote-submitted orders */}
                  {order.status === 'quote-submitted' && order.quoteAmount && (
                    <div className="border-t pt-4">
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-purple-400" />
                          <h4 className="font-medium text-purple-400">Quote Received!</h4>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Quote Amount:</span>
                            <span className="font-medium text-lg">{formatPrice(order.quoteAmount)}</span>
                          </div>
                          {order.estimatedDeliveryTime && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Estimated Delivery:</span>
                              <span>{order.estimatedDeliveryTime}</span>
                            </div>
                          )}
                          {order.providerNotes && (
                            <div>
                              <span className="text-muted-foreground">Provider Notes:</span>
                              <p className="mt-1 text-foreground">{order.providerNotes}</p>
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={() => handlePayQuote(order.id, order.quoteAmount!)}
                          disabled={payingOrder === order.id}
                          className="w-full"
                          size="lg"
                        >
                          {payingOrder === order.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pay {formatPrice(order.quoteAmount)}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Payment Success */}
                  {(order.status === 'quote-accepted' || order.status === 'printing' || order.status === 'in-progress' || order.status === 'completed') && order.quoteAmount && (
                    <div className="border-t pt-4">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="w-5 h-5 text-green-400" />
                          <h4 className="font-medium text-green-400">
                            {order.status === 'completed' ? 'Order Completed!' : 
                             order.status === 'in-progress' ? 'Printing in Progress!' : 
                             order.status === 'printing' ? 'Printing in Progress!' : 
                             'Payment Successful!'}
                          </h4>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount Paid:</span>
                            <span className="font-medium">{formatPrice(order.quoteAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Paid At:</span>
                            <span>{formatDate(order.paidAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {order.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{order.location}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
