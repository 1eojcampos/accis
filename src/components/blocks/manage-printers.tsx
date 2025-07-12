"use client";

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Printer, Plus, Edit, Trash2, Search, Settings, MapPin, Zap, ZapOff, Filter, Box, DollarSign } from 'lucide-react';

interface Printer {
  id: string;
  userId: string;  // ID of the provider who owns this printer
  name: string;
  model: string;
  technology: 'FDM' | 'SLA' | 'SLS';
  buildVolume: {
    x: number;
    y: number;
    z: number;
  };
  supportedMaterials: string[];
  hourlyRate: number;
  available: boolean;
  location: string;
  description: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Needs Maintenance';
  createdAt: string;  // ISO string of when the printer was added
  updatedAt?: string; // ISO string of last update
}

const initialPrinters: Printer[] = [
  {
    id: '1',
    name: 'Ultimaker S5 Pro',
    model: 'Ultimaker S5 Pro Bundle',
    technology: 'FDM',
    buildVolume: { x: 330, y: 240, z: 300 },
    supportedMaterials: ['PLA', 'ABS', 'PETG', 'TPU', 'PVA', 'HIPS'],
    hourlyRate: 12.50,
    available: true,
    location: 'Workshop A - Station 1',
    description: 'Professional-grade FDM printer with dual extrusion capability, enclosed chamber, and automatic material handling.',
    condition: 'Excellent'
  },
  {
    id: '2',
    name: 'Formlabs Form 3+',
    model: 'Form 3+',
    technology: 'SLA',
    buildVolume: { x: 145, y: 145, z: 185 },
    supportedMaterials: ['Clear Resin', 'Grey Resin', 'Tough Resin', 'Flexible Resin', 'Castable Resin'],
    hourlyRate: 18.00,
    available: false,
    location: 'Clean Room B',
    description: 'High-precision stereolithography printer ideal for detailed prototypes and small parts with smooth surface finish.',
    condition: 'Good'
  },
  {
    id: '3',
    name: 'EOS P 396',
    model: 'EOS P 396',
    technology: 'SLS',
    buildVolume: { x: 340, y: 340, z: 600 },
    supportedMaterials: ['PA12', 'PA11', 'Alumide', 'Glass-filled PA'],
    hourlyRate: 35.00,
    available: true,
    location: 'Industrial Bay C',
    description: 'Industrial selective laser sintering system for functional parts and end-use components without support structures.',
    condition: 'Excellent'
  },
  {
    id: '4',
    name: 'Prusa i3 MK3S+',
    model: 'Original Prusa i3 MK3S+',
    technology: 'FDM',
    buildVolume: { x: 250, y: 210, z: 200 },
    supportedMaterials: ['PLA', 'ABS', 'PETG', 'ASA', 'PC', 'TPU'],
    hourlyRate: 8.00,
    available: true,
    location: 'Workshop A - Station 3',
    description: 'Reliable open-frame FDM printer, perfect for prototyping and educational projects with excellent community support.',
    condition: 'Good'
  },
  {
    id: '5',
    name: 'Markforged Mark Two',
    model: 'Mark Two',
    technology: 'FDM',
    buildVolume: { x: 320, y: 132, z: 154 },
    supportedMaterials: ['Onyx', 'Carbon Fiber', 'Kevlar', 'Fiberglass', 'HSHT Fiberglass'],
    hourlyRate: 45.00,
    available: false,
    location: 'Composite Lab D',
    description: 'Advanced composite 3D printer capable of reinforcing parts with continuous carbon fiber for exceptional strength.',
    condition: 'Needs Maintenance'
  }
];

const technologyTypes = ['FDM', 'SLA', 'SLS'];
const conditionOptions = ['Excellent', 'Good', 'Fair', 'Needs Maintenance'];
const availableMaterials = [
  'PLA', 'ABS', 'PETG', 'TPU', 'PVA', 'HIPS', 'ASA', 'PC',
  'Clear Resin', 'Grey Resin', 'Tough Resin', 'Flexible Resin', 'Castable Resin',
  'PA12', 'PA11', 'Alumide', 'Glass-filled PA',
  'Onyx', 'Carbon Fiber', 'Kevlar', 'Fiberglass', 'HSHT Fiberglass'
];

export const ManagePrinters = () => {
  const [printers, setPrinters] = useState<Printer[]>(initialPrinters);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTechnology, setFilterTechnology] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const auth = getAuth();
  const db = getFirestore();
  
  const defaultFormData: Partial<Printer> = {
    name: '',
    model: '',
    technology: 'FDM',
    buildVolume: { x: 0, y: 0, z: 0 },
    supportedMaterials: [],
    hourlyRate: 0,
    available: true,
    location: '',
    description: '',
    condition: 'Excellent'
  };

  const [formData, setFormData] = useState<Partial<Printer>>(defaultFormData);

  const filteredPrinters = printers.filter(printer => {
    const matchesSearch = searchTerm === '' || (
      (printer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (printer.model?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (printer.location?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
    
    const matchesTechnology = filterTechnology === 'all' || printer.technology === filterTechnology;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'available' && printer.available) ||
                         (filterStatus === 'unavailable' && !printer.available);

    return matchesSearch && matchesTechnology && matchesStatus;
  });

  // Fetch printers from Firebase on component mount
  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'printers'));
        const printersData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            buildVolume: data.buildVolume || { x: 0, y: 0, z: 0 },
            supportedMaterials: data.supportedMaterials || [],
            hourlyRate: data.hourlyRate || 0,
            available: data.available ?? true,
            condition: data.condition || 'Excellent',
          } as Printer;
        });
        setPrinters(printersData);
      } catch (error) {
        console.error('Error fetching printers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrinters();
  }, [db]);

  const handleAdd = () => {
    setFormData(defaultFormData);
    setIsAddModalOpen(true);
  };

  const handleEdit = (printer: Printer) => {
    setEditingPrinter(printer);
    setFormData({ ...printer });
    setIsEditModalOpen(true);
  };

  // Modified handleSaveAdd to store in Firebase
  const handleSaveAdd = async (data: Partial<Printer>) => {
    if (data.name && data.model) {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          throw new Error('User not authenticated');
        }

        const printerData = {
          ...defaultFormData,
          ...data,
          userId, // Store the ID of the provider who added the printer
          createdAt: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, 'printers'), printerData);
        const newPrinter = {
          ...printerData,
          id: docRef.id,
        } as Printer;
        
        setPrinters([...printers, newPrinter]);
        setIsAddModalOpen(false);
      } catch (error) {
        console.error('Error adding printer:', error);
        // You might want to show an error message to the user here
      }
    }
  };

  // Modified handleSaveEdit to update in Firebase
  const handleSaveEdit = async (data: Partial<Printer>) => {
    if (editingPrinter && data.name && data.model) {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Verify the user owns this printer
        if (editingPrinter.userId !== userId) {
          throw new Error('Unauthorized to edit this printer');
        }

        const printerRef = doc(db, 'printers', editingPrinter.id);
        await updateDoc(printerRef, {
          ...data,
          updatedAt: new Date().toISOString(),
        });

        setPrinters(printers.map(p => 
          p.id === editingPrinter.id ? { ...p, ...data } as Printer : p
        ));
        setIsEditModalOpen(false);
        setEditingPrinter(null);
      } catch (error) {
        console.error('Error updating printer:', error);
        // You might want to show an error message to the user here
      }
    }
  };

  // Modified handleRemove to delete from Firebase
  const handleRemove = async (id: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Verify the user owns this printer
      const printer = printers.find(p => p.id === id);
      if (printer?.userId !== userId) {
        throw new Error('Unauthorized to delete this printer');
      }

      await deleteDoc(doc(db, 'printers', id));
      setPrinters(printers.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error removing printer:', error);
      // You might want to show an error message to the user here
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      const printer = printers.find(p => p.id === id);
      if (!printer) return;

      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Verify the user owns this printer
      if (printer.userId !== userId) {
        throw new Error('Unauthorized to update this printer');
      }

      const printerRef = doc(db, 'printers', id);
      await updateDoc(printerRef, {
        available: !printer.available,
        updatedAt: new Date().toISOString()
      });

      // Only update local state after successful Firebase update
      setPrinters(printers.map(p => 
        p.id === id ? { ...p, available: !p.available } : p
      ));
    } catch (error) {
      console.error('Error toggling printer availability:', error);
      // You might want to show an error message to the user here
    }
  };

  const getTechnologyColor = (technology: string) => {
    switch (technology) {
      case 'FDM': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SLA': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SLS': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Needs Maintenance': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  interface PrinterModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    onSave: (data: Partial<Printer>) => void;
    initialData: Partial<Printer>;
  }

  const PrinterModal = ({ isOpen, onOpenChange, title, onSave, initialData }: PrinterModalProps) => {
    const [localFormData, setLocalFormData] = useState<Partial<Printer>>(initialData);

    // Reset form when modal opens with new initialData
    useEffect(() => {
      setLocalFormData(initialData);
    }, [initialData]);

    const handleSave = () => {
      onSave(localFormData);
      onOpenChange(false);
    };

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              {title}
            </DialogTitle>
            <DialogDescription>
              Configure printer specifications and settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Printer Name *</Label>
                  <Input
                    id="name"
                    value={localFormData.name || ''}
                    onChange={(e) => setLocalFormData({ ...localFormData, name: e.target.value })}
                    placeholder="e.g., Ultimaker S5 Pro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={localFormData.model || ''}
                    onChange={(e) => setLocalFormData({ ...localFormData, model: e.target.value })}
                    placeholder="e.g., Ultimaker S5 Pro Bundle"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="technology">Technology Type</Label>
                  <Select value={localFormData.technology} onValueChange={(value) => setLocalFormData({ ...localFormData, technology: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {technologyTypes.map(tech => (
                        <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={localFormData.condition} onValueChange={(value) => setLocalFormData({ ...localFormData, condition: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map(condition => (
                        <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Build Volume */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Box className="w-5 h-5" />
                Build Volume (mm)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buildX">X-axis</Label>
                  <Input
                    id="buildX"
                    type="number"
                    value={localFormData.buildVolume?.x || ''}
                    onChange={(e) => setLocalFormData({ 
                      ...localFormData, 
                      buildVolume: { ...localFormData.buildVolume!, x: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buildY">Y-axis</Label>
                  <Input
                    id="buildY"
                    type="number"
                    value={localFormData.buildVolume?.y || ''}
                    onChange={(e) => setLocalFormData({ 
                      ...localFormData, 
                      buildVolume: { ...localFormData.buildVolume!, y: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buildZ">Z-axis</Label>
                  <Input
                    id="buildZ"
                    type="number"
                    value={localFormData.buildVolume?.z || ''}
                    onChange={(e) => setLocalFormData({ 
                      ...localFormData, 
                      buildVolume: { ...localFormData.buildVolume!, z: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Materials & Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Materials & Pricing</h3>
              <div className="space-y-2">
                <Label>Supported Materials</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                  {availableMaterials.map(material => (
                    <label key={material} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={localFormData.supportedMaterials?.includes(material) || false}
                        onChange={(e) => {
                          const materials = localFormData.supportedMaterials || [];
                          if (e.target.checked) {
                            setLocalFormData({ ...localFormData, supportedMaterials: [...materials, material] });
                          } else {
                            setLocalFormData({ ...localFormData, supportedMaterials: materials.filter(m => m !== material) });
                          }
                        }}
                        className="accent-emerald-600"
                      />
                      {material}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={localFormData.hourlyRate || ''}
                  onChange={(e) => setLocalFormData({ ...localFormData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  placeholder="12.50"
                />
              </div>
            </div>

            <Separator />

            {/* Location & Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location & Details</h3>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={localFormData.location || ''}
                  onChange={(e) => setLocalFormData({ ...localFormData, location: e.target.value })}
                  placeholder="Workshop A - Station 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={localFormData.description || ''}
                  onChange={(e) => setLocalFormData({ ...localFormData, description: e.target.value })}
                  placeholder="Describe the printer's capabilities and features..."
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <Label className="text-base font-medium">Available for Jobs</Label>
                  <p className="text-sm text-muted-foreground">Enable this printer to accept new print jobs</p>
                </div>
                <Switch
                  checked={localFormData.available || false}
                  onCheckedChange={(checked) => setLocalFormData({ ...localFormData, available: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              {title.includes('Add') ? 'Add Printer' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Printers</h1>
          <p className="text-muted-foreground">Configure and maintain your 3D printing fleet</p>
        </div>
        <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Printer
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search printers by name, model, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterTechnology} onValueChange={setFilterTechnology}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Technology" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technologies</SelectItem>
                  {technologyTypes.map(tech => (
                    <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printers List */}
      <div className="grid gap-6">
        {filteredPrinters.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Printer className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No printers found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or add a new printer.</p>
            </CardContent>
          </Card>
        ) : (
          filteredPrinters.map((printer) => (
            <Card key={printer.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <Printer className="w-5 h-5" />
                      {printer.name}
                    </CardTitle>
                    <CardDescription className="text-base">{printer.model}</CardDescription>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={getTechnologyColor(printer.technology)}>
                        {printer.technology}
                      </Badge>
                      <Badge variant={printer.available ? "default" : "secondary"} className="flex items-center gap-1">
                        {printer.available ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
                        {printer.available ? 'Available' : 'Unavailable'}
                      </Badge>
                      <Badge variant="outline" className={getConditionColor(printer.condition)}>
                        {printer.condition}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAvailability(printer.id)}
                      className={printer.available ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}
                    >
                      {printer.available ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(printer)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Printer</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove "{printer.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemove(printer.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <Box className="w-4 h-4" />
                      Build Volume
                    </h4>
                    <p className="text-sm">
                      {printer.buildVolume ? 
                        `${printer.buildVolume.x} × ${printer.buildVolume.y} × ${printer.buildVolume.z} mm` : 
                        'Not specified'
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Hourly Rate
                    </h4>
                    <p className="text-sm font-semibold">${(printer.hourlyRate ?? 0).toFixed(2)}/hour</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Location
                    </h4>
                    <p className="text-sm">{printer.location}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Supported Materials</h4>
                  <div className="flex flex-wrap gap-1">
                    {printer.supportedMaterials.map(material => (
                      <Badge key={material} variant="secondary" className="text-xs">
                        {material}
                      </Badge>
                    ))}
                  </div>
                </div>

                {printer.description && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{printer.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <PrinterModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Add New Printer"
        onSave={handleSaveAdd}
        initialData={defaultFormData}
      />
      
      <PrinterModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Edit Printer"
        onSave={handleSaveEdit}
        initialData={formData}
      />
    </div>
  );
};