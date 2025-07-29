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
import { orderAPI } from '@/lib/api';
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
    estimatedCompletion?: string;
    actualCompletion?: string;
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
    notes?: string;
    actor?: string;
  }>;
  
  quote?: {
    amount: number;
    deliveryTime: string;
    notes?: string;
    submittedAt: string;
    providerId: string;
    providerName: string;
    breakdown?: Array<{
      item: string;
      cost: number;
    }>;
    validUntil?: string;
    acceptedAt?: string;
  } | null;
  
  payment?: {
    status: 'pending' | 'paid' | 'failed';
    method?: string;
    paidAt?: string;
    amount?: number;
  } | null;
  
  // Legacy fields for backward compatibility
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
  status: 'quote-requested' | 'quote-submitted' | 'quote-accepted' | 'paid' | 'printing' | 'completed' | 'rejected';
  providerId?: string;
  quoteAmount?: number;
  estimatedDeliveryTime?: string;
  quotedAt?: any;
  acceptedAt?: any;
  paidAt?: any;
  createdAt: any;
  updatedAt: any;
}

// RequestCard component for available requests
interface RequestCardProps {
  request: PrintRequest;
  onSubmitQuote: (requestId: string, quoteAmount: string, estimatedDelivery: string, notes: string) => void;
  submittingQuote: boolean;
  formatPrice: (price: number) => string;
  formatDate: (timestamp: any) => string;
  formatFileSize: (bytes: number) => string;
  getStatusColor: (status: string) => string;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onSubmitQuote,
  submittingQuote,
  formatPrice,
  formatDate,
  formatFileSize,
  getStatusColor
}) => {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');

  const handleSubmitQuote = () => {
    if (!quoteAmount.trim()) {
      toast.error('Please enter a quote amount');
      return;
    }
    
    // Check if request is still available (status is quote-requested and no provider assigned)
    if (request.status !== 'quote-requested') {
      toast.error(`This request is no longer available (current status: ${request.status})`);
      setShowQuoteForm(false);
      return;
    }
    
    if (request.providerId) {
      toast.error('This request has already been assigned to another provider');
      setShowQuoteForm(false);
      return;
    }
    
    // Debug: Log request status before submitting
    console.log('Request details before submit:', {
      id: request.id,
      status: request.status,
      providerId: request.providerId,
      customerId: request.customerId
    });
    
    onSubmitQuote(request.id, quoteAmount, estimatedDelivery, quoteNotes);
    // Reset form
    setQuoteAmount('');
    setEstimatedDelivery('');
    setQuoteNotes('');
    setShowQuoteForm(false);
  };

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
            {request.status === 'quote-requested' && !request.providerId ? (
              !showQuoteForm ? (
                <Button 
                  onClick={() => setShowQuoteForm(true)}
                  size="sm"
                  variant="default"
                >
                  Accept & Quote
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowQuoteForm(false)}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              )
            ) : (
              <Badge variant="secondary" className="text-muted-foreground">
                {request.providerId ? 'Assigned' : 'No longer available'}
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

        {/* Quote Form */}
        {showQuoteForm && request.status === 'quote-requested' && !request.providerId && (
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-4">Accept Request & Submit Quote</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`quote-amount-${request.id}`}>Quote Amount ($)</Label>
                <Input
                  id={`quote-amount-${request.id}`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`delivery-time-${request.id}`}>Estimated Delivery</Label>
                <Input
                  id={`delivery-time-${request.id}`}
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor={`quote-notes-${request.id}`}>Additional Notes (Optional)</Label>
              <Textarea
                id={`quote-notes-${request.id}`}
                placeholder="Any additional information for the customer..."
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={handleSubmitQuote}
              disabled={submittingQuote || !quoteAmount}
              className="mt-4"
            >
              {submittingQuote && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Accept & Submit Quote
            </Button>
          </div>
        )}

        {/* Show message if request is no longer available but form was open */}
        {showQuoteForm && (request.status !== 'quote-requested' || request.providerId) && (
          <div className="border-t pt-4 mt-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Request No Longer Available</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This request has been {request.providerId ? 'assigned to another provider' : `marked as ${request.status}`}.
              </p>
              <Button 
                onClick={() => setShowQuoteForm(false)}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Close Form
              </Button>
            </div>
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
  onStartPrint: (orderId: string) => void;
  onCompletePrint: (orderId: string) => void;
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
  onStartPrint,
  onCompletePrint,
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
  const canSubmitQuote = order.status === 'quote-submitted';
  const isPaid = order.status === 'paid';  // Fixed: Changed from quote-accepted to paid
  const isQuoteSubmitted = order.status === 'quote-submitted';
  const isPrinting = order.status === 'printing';
  const isCompleted = order.status === 'completed';

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
               order.status === 'quote-accepted' ? 'Quote Accepted' : 
               order.status === 'paid' ? 'Ready to Print' :
               order.status === 'printing' ? 'Printing' :
               order.status === 'completed' ? 'Completed' :
               order.status}
            </Badge>
            {isPaid && !isPrinting && !isCompleted && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                💰 Paid
              </Badge>
            )}
            {isPrinting && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                🖨️ Printing
              </Badge>
            )}
            {isCompleted && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                ✅ Done
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mark as Complete button */}
        {isPrinting && !isCompleted && (
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onCompletePrint(order.id)}
            disabled={submittingQuote}
          >
            {submittingQuote ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Completing Print Job...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Mark as Complete
              </>
            )}
          </Button>
        )}
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

        {/* Paid order info - Ready to print */}
        {isPaid && !isPrinting && !isCompleted && (
          <div className="border-t pt-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-400" />
                <h4 className="font-medium text-green-400">Order Paid - Ready to Print!</h4>
              </div>
              <div className="space-y-1 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Amount:</span>
                  <span className="font-medium">{formatPrice(order.quoteAmount || order.estimatedCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid At:</span>
                  <span>{formatDate(order.paidAt)}</span>
                </div>
              </div>
              <Button 
                onClick={() => onStartPrint(order.id)}
                disabled={submittingQuote}
                className="w-full"
                size="lg"
              >
                {submittingQuote ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Print...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 mr-2" />
                    Start Print Job
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Printing status */}
        {isPrinting && (
          <div className="border-t pt-4">
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-orange-400" />
                <h4 className="font-medium text-orange-400">Print Job In Progress</h4>
              </div>
              <div className="space-y-1 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started:</span>
                  <span>{formatDate(order.updatedAt)}</span>
                </div>
                {order.timeline?.estimatedCompletion && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Completion:</span>
                    <span>{formatDate(order.timeline.estimatedCompletion)}</span>
                  </div>
                )}
              </div>
              <Button 
                onClick={() => onCompletePrint(order.id)}
                disabled={submittingQuote}
                className="w-full"
                size="lg"
              >
                {submittingQuote ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Completed status */}
        {isCompleted && (
          <div className="border-t pt-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <h4 className="font-medium text-emerald-400">Print Job Completed!</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{formatDate(order.timeline?.actualCompletion || order.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Amount:</span>
                  <span className="font-medium">{formatPrice(order.budget?.final || order.quoteAmount || order.estimatedCost)}</span>
                </div>
              </div>
              <p className="text-sm text-emerald-400 mt-2">
                🎉 Job completed successfully! Customer has been notified.
              </p>
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

export const ManageRequestsComponent = () => {
  const { currentUser, userProfile, updateUserType } = useAuth();
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

  // Debug current user state
  console.log('🔍 Debug Auth State in ManageRequestsComponent:');
  console.log('Current User:', currentUser);
  console.log('User Profile:', userProfile);
  console.log('User Type:', userProfile?.userType);
  console.log('User Type is provider?', userProfile?.userType === 'provider');

  const handleSetProviderType = async () => {
    try {
      console.log('🔄 Setting user type to provider...');
      await updateUserType('provider');
      console.log('✅ User type updated successfully');
      window.location.reload();
    } catch (error) {
      console.error('❌ Error updating user type:', error);
      toast.error('Failed to update account type');
    }
  };

  // Load available requests (quote-requested orders with no provider)
  useEffect(() => {
    if (!currentUser) return;

    const requestsQuery = query(
      collection(db, 'printRequests'),
      where('status', '==', 'quote-requested'),
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
        
        // Filter out requests created by the current user (they can't respond to their own requests)
        const availableRequests = requestsData.filter(request => 
          request.customerId !== currentUser.uid
        );
        
        setRequests(availableRequests);
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

  // Submit quote for available request (replaces accept functionality)
  const handleSubmitQuoteForRequest = async (requestId: string, quoteAmount: string, estimatedDelivery: string, notes: string) => {
    if (!currentUser) return;
    
    setAcceptingOrder(requestId);
    try {
      // Check if user is trying to respond to their own request
      const targetRequest = requests.find(r => r.id === requestId);
      if (targetRequest?.customerId === currentUser.uid) {
        toast.error('You cannot submit a quote for your own request');
        setAcceptingOrder(null);
        return;
      }
      
      // Debug: Log what we're sending
      console.log('Sending quote payload:', {
        action: 'accept',
        notes,
        quotedPrice: parseFloat(quoteAmount),
        quotedTimeline: estimatedDelivery
      });
      console.log('Current user ID:', currentUser?.uid);
      console.log('Request customer ID:', requests.find(r => r.id === requestId)?.customerId);
      
      // Use the legacy API format - accept with quoted price and timeline
      await orderAPI.respondToOrder(requestId, 'accept', {
        notes,
        quotedPrice: parseFloat(quoteAmount),
        quotedTimeline: estimatedDelivery
      });
      
      console.log('Quote submission successful! Payload sent:', {
        action: 'accept',
        notes,
        quotedPrice: parseFloat(quoteAmount),
        quotedTimeline: estimatedDelivery
      });
      
      toast.success('Request accepted and quote submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting quote:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to submit quote';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage);
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
      
      // Enhanced quote structure
      const quoteData = {
        amount: parseFloat(quoteAmount),
        deliveryTime: estimatedDelivery || '3-5 business days',
        notes: quoteNotes || '',
        submittedAt: new Date().toISOString(),
        providerId: currentUser.uid,
        providerName: currentUser.displayName || 'Provider',
        breakdown: [
          { item: 'Material and printing', cost: parseFloat(quoteAmount) * 0.8 },
          { item: 'Labor and setup', cost: parseFloat(quoteAmount) * 0.2 }
        ],
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };

      // Status history entry
      const statusEntry = {
        status: 'quote-submitted',
        timestamp: new Date().toISOString(),
        updatedBy: currentUser.uid,
        actor: currentUser.uid,
        notes: `Quote submitted: ${formatPrice(parseFloat(quoteAmount))}`
      };

      await updateDoc(orderDoc, {
        // Enhanced schema fields
        quote: quoteData,
        'budget.quoted': parseFloat(quoteAmount),
        'timeline.estimated': estimatedDelivery ? parseInt(estimatedDelivery.replace(/\D/g, '')) || 72 : 72,
        statusHistory: [...(requests.find(r => r.id === orderId)?.statusHistory || []), statusEntry],
        
        // Legacy compatibility fields
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

  // Start print job for paid orders
  const handleStartPrint = async (orderId: string) => {
    if (!currentUser) {
      toast.error('Authentication required');
      return;
    }

    setSubmittingQuote(true);
    try {
      const orderDoc = doc(db, 'printRequests', orderId);
      const currentOrder = myOrders.find(o => o.id === orderId);
      
      // Calculate estimated completion date (add estimated timeline to current date)
      const estimatedHours = currentOrder?.timeline?.estimated || currentOrder?.estimatedTimeline || 48;
      const estimatedCompletion = new Date(Date.now() + estimatedHours * 60 * 60 * 1000).toISOString();

      // Status history entry
      const statusEntry = {
        status: 'printing',
        timestamp: new Date().toISOString(),
        updatedBy: currentUser.uid,
        actor: currentUser.uid,
        notes: 'Print job started by provider'
      };

      await updateDoc(orderDoc, {
        // Enhanced schema fields
        'timeline.estimatedCompletion': estimatedCompletion,
        statusHistory: [...(currentOrder?.statusHistory || []), statusEntry],
        
        // Legacy compatibility fields
        status: 'printing',
        updatedAt: serverTimestamp()
      });

      toast.success('Print job started successfully!');
    } catch (error) {
      console.error('Error starting print job:', error);
      toast.error('Failed to start print job');
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Complete print job
  const handleCompletePrint = async (orderId: string) => {
    if (!currentUser) {
      toast.error('Authentication required');
      return;
    }

    setSubmittingQuote(true);
    try {
      const orderDoc = doc(db, 'printRequests', orderId);
      const currentOrder = myOrders.find(o => o.id === orderId);

      // Status history entry
      const statusEntry = {
        status: 'completed',
        timestamp: new Date().toISOString(),
        updatedBy: currentUser.uid,
        actor: currentUser.uid,
        notes: 'Print job completed by provider'
      };

      await updateDoc(orderDoc, {
        // Enhanced schema fields
        'timeline.actualCompletion': new Date().toISOString(),
        'budget.final': currentOrder?.quote?.amount || currentOrder?.quoteAmount || currentOrder?.estimatedCost,
        statusHistory: [...(currentOrder?.statusHistory || []), statusEntry],
        
        // Legacy compatibility fields
        status: 'completed',
        updatedAt: serverTimestamp()
      });

      toast.success('Print job completed successfully!');
    } catch (error) {
      console.error('Error completing print job:', error);
      toast.error('Failed to complete print job');
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
      case 'quote-requested': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'quote-submitted': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'printing': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'in-progress': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'; // Legacy compatibility
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

  // Debug current user state
  console.log('Current User:', currentUser);
  console.log('User Profile:', userProfile);
  console.log('User Type:', userProfile?.userType);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
            <p className="text-muted-foreground">You need to be signed in to access this page.</p>
            <Button onClick={() => window.location.href = '/auth/signin'} className="mt-4">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (userProfile.userType !== 'provider') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              This page is only accessible to providers. 
              {userProfile.userType === null || userProfile.userType === undefined ? 
                ' You need to select your account type.' : 
                ` Current account type: "${userProfile.userType}"`}
            </p>
            
            {/* Debug info */}
            <div className="mb-4 p-3 bg-muted rounded text-left text-xs">
              <div><strong>Debug Info:</strong></div>
              <div>Email: {currentUser?.email}</div>
              <div>UserType: {userProfile.userType || 'null/undefined'}</div>
              <div>Profile exists: {userProfile ? 'Yes' : 'No'}</div>
            </div>
            
            {(userProfile.userType === null || userProfile.userType === undefined) && (
              <div className="space-y-2">
                <Button 
                  onClick={handleSetProviderType}
                  className="w-full"
                >
                  Set as Provider Account
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/customer/dashboard'}
                  className="w-full"
                >
                  Go to Customer Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/debug-auth'}
                  className="w-full"
                  size="sm"
                >
                  🛠️ Debug Auth Issues
                </Button>
              </div>
            )}
            
            {userProfile.userType && userProfile.userType !== 'provider' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You're currently set as a {userProfile.userType}.
                </p>
                <Button 
                  onClick={handleSetProviderType}
                  className="w-full"
                >
                  Switch to Provider Account
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/debug-auth'}
                  className="w-full"
                  size="sm"
                >
                  🛠️ Debug Auth Issues
                </Button>
              </div>
            )}
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

  const requestsCount = requests.length;
  const acceptedCount = myOrders.filter(o => o.status === 'quote-submitted').length;
  const paidCount = myOrders.filter(o => o.status === 'quote-accepted').length;
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
              <p className="text-2xl font-bold text-foreground mt-1">{requestsCount}</p>
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
              Available Requests ({requestsCount})
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
                      : 'There are currently no quote requests available.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((request) => (
                  <RequestCard 
                    key={request.id}
                    request={request}
                    onSubmitQuote={handleSubmitQuoteForRequest}
                    submittingQuote={acceptingOrder === request.id}
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
                    onStartPrint={handleStartPrint}
                    onCompletePrint={handleCompletePrint}
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
