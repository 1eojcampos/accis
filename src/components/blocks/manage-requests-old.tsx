"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ClipboardList,
  User,
  FileText,
  Check,
  X,
  Search,
  Filter,
  Clock,
  AlertCircle,
  Download,
  Mail,
  Calendar,
  Package,
  Layers,
  DollarSign,
  MapPin,
  Phone,
  Building,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface PrintRequest {
  id: string;
  customerId: string;
  customerEmail?: string;
  customerName?: string;
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
  estimatedTimeline: number;
  status: 'pending' | 'accepted' | 'quote-submitted' | 'paid' | 'in-progress' | 'completed' | 'rejected';
  providerId?: string;
  quoteAmount?: number;
  estimatedDeliveryTime?: string;
  quotedAt?: any;
  acceptedAt?: any;
  paidAt?: any;
  createdAt: any;
  updatedAt: any;
}

export const ManageRequestsComponent = () => {
  const { currentUser, userProfile } = useAuth();
  const [requests, setRequests] = useState<PrintRequest[]>([]);
  const [myOrders, setMyOrders] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<PrintRequest | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);

  // Load available requests (pending orders with no provider)
  useEffect(() => {
    if (!currentUser) return;

    const requestsQuery = query(
      collection(db, 'printRequests'),
      where('status', '==', 'pending'),
      where('providerId', '==', null),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PrintRequest[];
        
        setRequests(requestsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching requests:', err);
        setError('Failed to load print requests');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Load my accepted orders
  useEffect(() => {
    if (!currentUser) return;

    const myOrdersQuery = query(
      collection(db, 'printRequests'),
      where('providerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      myOrdersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PrintRequest[];
        
        setMyOrders(ordersData);
      },
      (err) => {
        console.error('Error fetching my orders:', err);
        toast.error('Failed to load your orders');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Accept a print request
  const handleAcceptRequest = async (requestId: string) => {
    if (!currentUser) return;
    
    setAcceptingOrder(requestId);
    try {
      const requestDoc = doc(db, 'printRequests', requestId);
      await updateDoc(requestDoc, {
        status: 'accepted',
        providerId: currentUser.uid,
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      toast.success('Request accepted successfully!');
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setAcceptingOrder(null);
    }
  };

  // Submit quote for accepted order
  const handleSubmitQuote = async (orderId: string) => {
    if (!currentUser || !quoteAmount) {
      toast.error('Please enter a quote amount');
      return;
    }

    setSubmittingQuote(true);
    try {
      const orderDoc = doc(db, 'printRequests', orderId);
      await updateDoc(orderDoc, {
        status: 'quote-submitted',
        quoteAmount: parseFloat(quoteAmount),
        estimatedDeliveryTime: estimatedDelivery,
        quotedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        providerNotes: quoteNotes
      });

      toast.success('Quote submitted successfully!');
      setQuoteAmount('');
      setEstimatedDelivery('');
      setQuoteNotes('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Failed to submit quote');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = request.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.requirements?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesMaterial = materialFilter === 'all' || request.material.toLowerCase().includes(materialFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesMaterial;
    });
  }, [requests, searchTerm, statusFilter, materialFilter]);

  const filteredMyOrders = useMemo(() => {
    return myOrders.filter(order => {
      const matchesSearch = order.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.requirements?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [myOrders, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'quote-submitted': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
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

  if (!currentUser || userProfile?.userType !== 'provider') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">This page is only accessible to providers.</p>
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
          <p className="text-muted-foreground">Loading print requests...</p>
        </div>
      </div>
    );
  }

  const pendingCount = requests.length;
  const acceptedCount = myOrders.filter(o => o.status === 'accepted').length;
  const paidCount = myOrders.filter(o => o.status === 'paid').length;
  const totalRevenue = myOrders.reduce((sum, order) => sum + (order.quoteAmount || order.estimatedCost || 0), 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Manage Print Requests</h1>
                <p className="text-muted-foreground">Review and process incoming 3D printing orders</p>
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
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-muted-foreground">Available Requests</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{pendingCount}</p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-sm text-muted-foreground">My Accepted</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{acceptedCount}</p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-muted-foreground">Ready to Print</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{paidCount}</p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{formatPrice(totalRevenue)}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by material, requirements, or location..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                <SelectItem value="pla">PLA</SelectItem>
                <SelectItem value="abs">ABS</SelectItem>
                <SelectItem value="petg">PETG</SelectItem>
                <SelectItem value="resin">Resin</SelectItem>
              </SelectContent>
            </Select>
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

        {/* Tabs for Available Requests and My Orders */}
        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">
              Available Requests ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="my-orders">
              My Orders ({myOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Available Requests Tab */}
          <TabsContent value="available" className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Available Requests</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || materialFilter !== 'all' 
                      ? 'No requests match your current filters.' 
                      : 'There are currently no pending print requests available.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((request) => (
                  <RequestCard 
                    key={request.id}
                    request={request}
                    onAccept={() => handleAcceptRequest(request.id)}
                    accepting={acceptingOrder === request.id}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                    formatFileSize={formatFileSize}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Orders Tab */}
          <TabsContent value="my-orders" className="space-y-4">
            {filteredMyOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                  <p className="text-muted-foreground">
                    You haven't accepted any print requests yet. Check the Available Requests tab to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredMyOrders.map((order) => (
                  <MyOrderCard 
                    key={order.id}
                    order={order}
                    onSubmitQuote={handleSubmitQuote}
                    quoteAmount={quoteAmount}
                    setQuoteAmount={setQuoteAmount}
                    estimatedDelivery={estimatedDelivery}
                    setEstimatedDelivery={setEstimatedDelivery}
                    quoteNotes={quoteNotes}
                    setQuoteNotes={setQuoteNotes}
                    submittingQuote={submittingQuote}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                    formatFileSize={formatFileSize}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// RequestCard component for available requests
interface RequestCardProps {
  request: PrintRequest;
  onAccept: () => void;
  accepting: boolean;
  formatPrice: (price: number) => string;
  formatDate: (timestamp: any) => string;
  formatFileSize: (bytes: number) => string;
  getStatusColor: (status: string) => string;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  accepting,
  formatPrice,
  formatDate,
  formatFileSize,
  getStatusColor
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>
                {request.customerEmail ? request.customerEmail.slice(0, 2).toUpperCase() : 'CU'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{request.customerName || request.customerEmail || 'Anonymous Customer'}</h3>
              <p className="text-sm text-muted-foreground">{formatDate(request.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(request.status)}>
              {request.status}
            </Badge>
            <Button 
              onClick={onAccept}
              disabled={accepting}
              size="sm"
            >
              {accepting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Accept Request
            </Button>
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
                <span>{request.material}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality:</span>
                <span>{request.quality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span>{request.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Cost:</span>
                <span className="font-medium">{formatPrice(request.estimatedCost)}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Files ({request.files.length})</h4>
            <div className="space-y-1">
              {request.files.slice(0, 3).map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                </div>
              ))}
              {request.files.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{request.files.length - 3} more files
                </p>
              )}
            </div>
          </div>
        </div>
        
        {request.requirements && (
          <div>
            <h4 className="font-medium mb-2">Requirements</h4>
            <p className="text-sm text-muted-foreground">{request.requirements}</p>
          </div>
        )}
        
        {request.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{request.location}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// MyOrderCard component for provider's accepted orders
interface MyOrderCardProps {
  order: PrintRequest;
  onSubmitQuote: (orderId: string) => void;
  quoteAmount: string;
  setQuoteAmount: (amount: string) => void;
  estimatedDelivery: string;
  setEstimatedDelivery: (delivery: string) => void;
  quoteNotes: string;
  setQuoteNotes: (notes: string) => void;
  submittingQuote: boolean;
  formatPrice: (price: number) => string;
  formatDate: (timestamp: any) => string;
  formatFileSize: (bytes: number) => string;
  getStatusColor: (status: string) => string;
}

const MyOrderCard: React.FC<MyOrderCardProps> = ({
  order,
  onSubmitQuote,
  quoteAmount,
  setQuoteAmount,
  estimatedDelivery,
  setEstimatedDelivery,
  quoteNotes,
  setQuoteNotes,
  submittingQuote,
  formatPrice,
  formatDate,
  formatFileSize,
  getStatusColor
}) => {
  const canSubmitQuote = order.status === 'accepted';
  const isPaid = order.status === 'paid';
  const isQuoteSubmitted = order.status === 'quote-submitted';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>
                {order.customerEmail ? order.customerEmail.slice(0, 2).toUpperCase() : 'CU'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{order.customerName || order.customerEmail || 'Anonymous Customer'}</h3>
              <p className="text-sm text-muted-foreground">
                Accepted: {formatDate(order.acceptedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(order.status)}>
              {order.status === 'quote-submitted' ? 'Quote Sent' : 
               order.status === 'paid' ? 'Ready to Print' : 
               order.status}
            </Badge>
            {isPaid && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                💰 Paid
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
                  {order.quoteAmount ? 'Quote Amount:' : 'Estimated Cost:'}
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

        {/* Quote submission form */}
        {canSubmitQuote && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Submit Quote</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quote-amount">Quote Amount ($)</Label>
                <Input
                  id="quote-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="delivery-time">Estimated Delivery</Label>
                <Input
                  id="delivery-time"
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="quote-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="quote-notes"
                placeholder="Any additional information for the customer..."
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={() => onSubmitQuote(order.id)}
              disabled={submittingQuote || !quoteAmount}
              className="mt-4"
            >
              {submittingQuote && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Quote
            </Button>
          </div>
        )}

        {/* Quote submitted info */}
        {isQuoteSubmitted && order.quoteAmount && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Quote Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quote Amount:</span>
                <span className="font-medium">{formatPrice(order.quoteAmount)}</span>
              </div>
              {order.estimatedDeliveryTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Delivery:</span>
                  <span>{order.estimatedDeliveryTime}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quote Sent:</span>
                <span>{formatDate(order.quotedAt)}</span>
              </div>
            </div>
            <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-400">
                ⏳ Waiting for customer payment approval
              </p>
            </div>
          </div>
        )}

        {/* Paid order info */}
        {isPaid && (
          <div className="border-t pt-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-400" />
                <h4 className="font-medium text-green-400">Order Paid - Ready to Print!</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Amount:</span>
                  <span className="font-medium">{formatPrice(order.quoteAmount || order.estimatedCost)}</span>
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
  );
};

// RequestCard component for available requests
interface RequestCardProps {
  request: PrintRequest;
  onAccept: () => void;
  accepting: boolean;
  formatPrice: (price: number) => string;
  formatDate: (timestamp: any) => string;
  formatFileSize: (bytes: number) => string;
  getStatusColor: (status: string) => string;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  accepting,
  formatPrice,
  formatDate,
  formatFileSize,
  getStatusColor
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>
                {request.customerEmail ? request.customerEmail.slice(0, 2).toUpperCase() : 'CU'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{request.customerName || request.customerEmail || 'Anonymous Customer'}</h3>
              <p className="text-sm text-muted-foreground">{formatDate(request.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(request.status)}>
              {request.status}
            </Badge>
            <Button 
              onClick={onAccept}
              disabled={accepting}
              size="sm"
            >
              {accepting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Accept Request
            </Button>
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
                <span>{request.material}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality:</span>
                <span>{request.quality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span>{request.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Cost:</span>
                <span className="font-medium">{formatPrice(request.estimatedCost)}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Files ({request.files.length})</h4>
            <div className="space-y-1">
              {request.files.slice(0, 3).map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                </div>
              ))}
              {request.files.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{request.files.length - 3} more files
                </p>
              )}
            </div>
          </div>
        </div>
        
        {request.requirements && (
          <div>
            <h4 className="font-medium mb-2">Requirements</h4>
            <p className="text-sm text-muted-foreground">{request.requirements}</p>
          </div>
        )}
        
        {request.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{request.location}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// MyOrderCard component for provider's accepted orders
interface MyOrderCardProps {
  order: PrintRequest;
  onSubmitQuote: (orderId: string) => void;
  quoteAmount: string;
  setQuoteAmount: (amount: string) => void;
  estimatedDelivery: string;
  setEstimatedDelivery: (delivery: string) => void;
  quoteNotes: string;
  setQuoteNotes: (notes: string) => void;
  submittingQuote: boolean;
  formatPrice: (price: number) => string;
  formatDate: (timestamp: any) => string;
  formatFileSize: (bytes: number) => string;
  getStatusColor: (status: string) => string;
}

const MyOrderCard: React.FC<MyOrderCardProps> = ({
  order,
  onSubmitQuote,
  quoteAmount,
  setQuoteAmount,
  estimatedDelivery,
  setEstimatedDelivery,
  quoteNotes,
  setQuoteNotes,
  submittingQuote,
  formatPrice,
  formatDate,
  formatFileSize,
  getStatusColor
}) => {
  const canSubmitQuote = order.status === 'accepted';
  const isPaid = order.status === 'paid';
  const isQuoteSubmitted = order.status === 'quote-submitted';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>
                {order.customerEmail ? order.customerEmail.slice(0, 2).toUpperCase() : 'CU'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{order.customerName || order.customerEmail || 'Anonymous Customer'}</h3>
              <p className="text-sm text-muted-foreground">
                Accepted: {formatDate(order.acceptedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(order.status)}>
              {order.status === 'quote-submitted' ? 'Quote Sent' : 
               order.status === 'paid' ? 'Ready to Print' : 
               order.status}
            </Badge>
            {isPaid && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                💰 Paid
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
                  {order.quoteAmount ? 'Quote Amount:' : 'Estimated Cost:'}
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

        {/* Quote submission form */}
        {canSubmitQuote && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Submit Quote</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quote-amount">Quote Amount ($)</Label>
                <Input
                  id="quote-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="delivery-time">Estimated Delivery</Label>
                <Input
                  id="delivery-time"
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="quote-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="quote-notes"
                placeholder="Any additional information for the customer..."
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={() => onSubmitQuote(order.id)}
              disabled={submittingQuote || !quoteAmount}
              className="mt-4"
            >
              {submittingQuote && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Quote
            </Button>
          </div>
        )}

        {/* Quote submitted info */}
        {isQuoteSubmitted && order.quoteAmount && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Quote Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quote Amount:</span>
                <span className="font-medium">{formatPrice(order.quoteAmount)}</span>
              </div>
              {order.estimatedDeliveryTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Delivery:</span>
                  <span>{order.estimatedDeliveryTime}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quote Sent:</span>
                <span>{formatDate(order.quotedAt)}</span>
              </div>
            </div>
            <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-400">
                ⏳ Waiting for customer payment approval
              </p>
            </div>
          </div>
        )}

        {/* Paid order info */}
        {isPaid && (
          <div className="border-t pt-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-400" />
                <h4 className="font-medium text-green-400">Order Paid - Ready to Print!</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Amount:</span>
                  <span className="font-medium">{formatPrice(order.quoteAmount || order.estimatedCost)}</span>
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
  );
};

  const handleAcceptRequest = (requestId: string) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'accepted' }
          : req
      )
    );
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected' }
          : req
      )
    );
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'expired': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const acceptedCount = requests.filter(r => r.status === 'accepted').length;
  const urgentCount = requests.filter(r => r.urgency === 'urgent').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Manage Print Requests</h1>
                <p className="text-muted-foreground">Review and process incoming 3D printing orders</p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-muted-foreground">Pending Requests</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{pendingCount}</p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-sm text-muted-foreground">Accepted Today</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{acceptedCount}</p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-muted-foreground">Urgent Requests</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{urgentCount}</p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Potential Revenue</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${requests.reduce((sum, req) => sum + req.pricing.estimated, 0).toFixed(0)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search requests by title, customer, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={materialFilter} onValueChange={setMaterialFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  <SelectItem value="pla">PLA</SelectItem>
                  <SelectItem value="abs">ABS</SelectItem>
                  <SelectItem value="petg">PETG</SelectItem>
                  <SelectItem value="resin">Resin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Requests Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {request.customer.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-1">{request.title}</h3>
                      <p className="text-sm text-muted-foreground">{request.customer.name}</p>
                      {request.customer.company && (
                        <p className="text-xs text-muted-foreground">{request.customer.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={`text-xs ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Material:</span>
                      <span className="text-foreground font-medium">{request.specifications.material}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="text-foreground font-medium">{request.specifications.quantity}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Estimated:</span>
                      <span className="text-foreground font-medium">${request.pricing.estimated}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Deadline:</span>
                      <span className="text-foreground font-medium">
                        {request.delivery.deadline ? new Date(request.delivery.deadline).toLocaleDateString() : 'Flexible'}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedRequest(request)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        {selectedRequest && (
                          <>
                            <DialogHeader>
                              <DialogTitle className="text-xl">{selectedRequest.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              {/* Customer Info */}
                              <div className="bg-background rounded-lg p-4 border">
                                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  Customer Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <p><span className="text-muted-foreground">Name:</span> {selectedRequest.customer.name}</p>
                                    <p><span className="text-muted-foreground">Email:</span> {selectedRequest.customer.email}</p>
                                    {selectedRequest.customer.company && (
                                      <p><span className="text-muted-foreground">Company:</span> {selectedRequest.customer.company}</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <p><span className="text-muted-foreground">Phone:</span> {selectedRequest.customer.phone}</p>
                                    <p><span className="text-muted-foreground">Requested:</span> {new Date(selectedRequest.timestamp).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Project Details */}
                              <div className="bg-background rounded-lg p-4 border">
                                <h3 className="font-semibold text-foreground mb-3">Project Details</h3>
                                <p className="text-muted-foreground mb-4">{selectedRequest.description}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="font-medium text-foreground mb-2">Print Specifications</h4>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="text-muted-foreground">Material:</span> {selectedRequest.specifications.material}</p>
                                      <p><span className="text-muted-foreground">Quality:</span> {selectedRequest.specifications.quality}</p>
                                      <p><span className="text-muted-foreground">Quantity:</span> {selectedRequest.specifications.quantity}</p>
                                      <p><span className="text-muted-foreground">Infill:</span> {selectedRequest.specifications.infill}</p>
                                      {selectedRequest.specifications.color && (
                                        <p><span className="text-muted-foreground">Color:</span> {selectedRequest.specifications.color}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground mb-2">Delivery Information</h4>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="text-muted-foreground">Preference:</span> {selectedRequest.delivery.preference}</p>
                                      {selectedRequest.delivery.address && (
                                        <p><span className="text-muted-foreground">Address:</span> {selectedRequest.delivery.address}</p>
                                      )}
                                      {selectedRequest.delivery.deadline && (
                                        <p><span className="text-muted-foreground">Deadline:</span> {new Date(selectedRequest.delivery.deadline).toLocaleDateString()}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Files */}
                              <div className="bg-background rounded-lg p-4 border">
                                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Project Files
                                </h3>
                                <div className="space-y-2">
                                  {selectedRequest.files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-card rounded border">
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{file.name}</span>
                                        <Badge variant="outline" className="text-xs">{file.type}</Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{file.size}</span>
                                        <Button variant="ghost" size="sm">
                                          <Download className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Pricing */}
                              <div className="bg-background rounded-lg p-4 border">
                                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  Pricing Information
                                </h3>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Estimated Total:</span>
                                  <span className="text-xl font-bold text-primary">${selectedRequest.pricing.estimated}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Completion by: {new Date(selectedRequest.estimatedCompletion).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="ghost" size="sm">
                      <Mail className="w-4 h-4 mr-1" />
                      Contact
                    </Button>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectRequest(request.id)}
                        className="text-red-400 border-red-400 hover:bg-red-400/10"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No requests found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to see more results</p>
          </div>
        )}
      </div>
    </div>
  );
};