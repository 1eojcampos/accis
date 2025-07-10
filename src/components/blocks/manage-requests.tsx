"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Building
} from 'lucide-react';

interface PrintRequest {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    avatar: string;
  };
  title: string;
  description: string;
  files: Array<{
    name: string;
    size: string;
    type: string;
  }>;
  specifications: {
    material: string;
    quality: string;
    quantity: number;
    color?: string;
    infill: string;
  };
  delivery: {
    preference: string;
    address?: string;
    deadline?: string;
  };
  pricing: {
    estimated: number;
    currency: string;
  };
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  timestamp: string;
  estimatedCompletion: string;
}

const mockRequests: PrintRequest[] = [
  {
    id: '1',
    customer: {
      name: 'Sarah Chen',
      email: 'sarah@techcorp.com',
      phone: '+1 (555) 123-4567',
      company: 'TechCorp Inc.',
      avatar: 'SC'
    },
    title: 'Prototype Housing Components',
    description: 'Need 5 custom housing prototypes for our new IoT device. Critical for upcoming investor demo.',
    files: [
      { name: 'housing_v3.stl', size: '2.4 MB', type: 'STL' },
      { name: 'lid_component.stl', size: '1.1 MB', type: 'STL' }
    ],
    specifications: {
      material: 'PLA',
      quality: 'High (0.1mm)',
      quantity: 5,
      color: 'Black',
      infill: '20%'
    },
    delivery: {
      preference: 'Express Shipping',
      address: '123 Tech Street, San Francisco, CA 94105',
      deadline: '2024-02-15'
    },
    pricing: {
      estimated: 147.50,
      currency: 'USD'
    },
    urgency: 'high',
    status: 'pending',
    timestamp: '2024-02-10T10:30:00Z',
    estimatedCompletion: '2024-02-14'
  },
  {
    id: '2',
    customer: {
      name: 'Marcus Rodriguez',
      email: 'marcus.r@designstudio.com',
      phone: '+1 (555) 987-6543',
      company: 'Creative Design Studio',
      avatar: 'MR'
    },
    title: 'Architectural Scale Models',
    description: 'Detailed scale models for client presentation. Need precise dimensions and smooth finish.',
    files: [
      { name: 'building_model.stl', size: '5.8 MB', type: 'STL' }
    ],
    specifications: {
      material: 'Resin',
      quality: 'Ultra High (0.05mm)',
      quantity: 3,
      color: 'White',
      infill: 'Solid'
    },
    delivery: {
      preference: 'Standard Shipping',
      address: '456 Design Ave, New York, NY 10001',
      deadline: '2024-02-20'
    },
    pricing: {
      estimated: 89.99,
      currency: 'USD'
    },
    urgency: 'medium',
    status: 'pending',
    timestamp: '2024-02-10T14:15:00Z',
    estimatedCompletion: '2024-02-18'
  },
  {
    id: '3',
    customer: {
      name: 'Dr. Amanda Foster',
      email: 'afoster@medtech.org',
      phone: '+1 (555) 456-7890',
      company: 'MedTech Research',
      avatar: 'AF'
    },
    title: 'Medical Device Prototypes',
    description: 'Biocompatible prototypes for medical research. Requires FDA-approved materials.',
    files: [
      { name: 'device_main.stl', size: '3.2 MB', type: 'STL' },
      { name: 'connector.stl', size: '0.8 MB', type: 'STL' }
    ],
    specifications: {
      material: 'PETG (Medical Grade)',
      quality: 'High (0.1mm)',
      quantity: 2,
      color: 'Clear',
      infill: '100%'
    },
    delivery: {
      preference: 'Express Shipping',
      address: '789 Medical Plaza, Boston, MA 02115',
      deadline: '2024-02-12'
    },
    pricing: {
      estimated: 234.00,
      currency: 'USD'
    },
    urgency: 'urgent',
    status: 'pending',
    timestamp: '2024-02-10T16:45:00Z',
    estimatedCompletion: '2024-02-13'
  },
  {
    id: '4',
    customer: {
      name: 'James Wilson',
      email: 'jwilson@hobbytech.net',
      phone: '+1 (555) 321-0987',
      avatar: 'JW'
    },
    title: 'Custom Drone Parts',
    description: 'Replacement parts for custom racing drone build. Need lightweight and durable materials.',
    files: [
      { name: 'drone_frame.stl', size: '1.9 MB', type: 'STL' }
    ],
    specifications: {
      material: 'Carbon Fiber PLA',
      quality: 'Standard (0.2mm)',
      quantity: 1,
      color: 'Black',
      infill: '30%'
    },
    delivery: {
      preference: 'Local Pickup',
      deadline: '2024-02-18'
    },
    pricing: {
      estimated: 45.75,
      currency: 'USD'
    },
    urgency: 'low',
    status: 'pending',
    timestamp: '2024-02-09T09:20:00Z',
    estimatedCompletion: '2024-02-16'
  },
  {
    id: '5',
    customer: {
      name: 'Emily Zhang',
      email: 'ezhang@startup.io',
      phone: '+1 (555) 654-3210',
      company: 'InnovaStartup',
      avatar: 'EZ'
    },
    title: 'Product Packaging Mockups',
    description: 'Physical mockups of product packaging for market testing and photography.',
    files: [
      { name: 'package_design.stl', size: '4.1 MB', type: 'STL' }
    ],
    specifications: {
      material: 'PLA',
      quality: 'High (0.1mm)',
      quantity: 10,
      color: 'Multi-color',
      infill: '15%'
    },
    delivery: {
      preference: 'Standard Shipping',
      address: '321 Startup Way, Austin, TX 78701',
      deadline: '2024-02-25'
    },
    pricing: {
      estimated: 156.40,
      currency: 'USD'
    },
    urgency: 'medium',
    status: 'accepted',
    timestamp: '2024-02-08T11:30:00Z',
    estimatedCompletion: '2024-02-22'
  },
  {
    id: '6',
    customer: {
      name: 'Robert Kim',
      email: 'rkim@autoparts.com',
      phone: '+1 (555) 789-0123',
      company: 'AutoParts Solutions',
      avatar: 'RK'
    },
    title: 'Automotive Prototype Parts',
    description: 'Functional prototypes for automotive testing. Must withstand high temperatures.',
    files: [
      { name: 'part_assembly.stl', size: '6.7 MB', type: 'STL' }
    ],
    specifications: {
      material: 'ABS',
      quality: 'Standard (0.2mm)',
      quantity: 8,
      color: 'Red',
      infill: '50%'
    },
    delivery: {
      preference: 'Express Shipping',
      address: '654 Industrial Blvd, Detroit, MI 48201',
      deadline: '2024-02-16'
    },
    pricing: {
      estimated: 198.60,
      currency: 'USD'
    },
    urgency: 'high',
    status: 'rejected',
    timestamp: '2024-02-07T15:10:00Z',
    estimatedCompletion: '2024-02-15'
  }
];

export const ManageRequestsComponent = () => {
  const [requests, setRequests] = useState<PrintRequest[]>(mockRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<PrintRequest | null>(null);

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.customer.company?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesUrgency = urgencyFilter === 'all' || request.urgency === urgencyFilter;
      const matchesMaterial = materialFilter === 'all' || request.specifications.material.toLowerCase().includes(materialFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesUrgency && matchesMaterial;
    });
  }, [requests, searchTerm, statusFilter, urgencyFilter, materialFilter]);

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