"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { printerAPI } from '@/lib/api'
import { 
  MapPin, 
  Star, 
  Filter, 
  Grid3x3, 
  Map, 
  Clock,
  User,
  MessageSquare,
  ChevronDown,
  Search
} from 'lucide-react'

interface Provider {
  id: string
  name: string
  printerType: 'FDM' | 'SLA' | 'SLS'
  printerModel: string
  materials: string[]
  hourlyRate: number
  distance: number
  rating: number
  reviewCount: number
  isAvailable: boolean
  profileImage: string
  location: string
}

const printerTypes = ['FDM', 'SLA', 'SLS'] as const
const allMaterials = ['PLA', 'ABS', 'PETG', 'TPU', 'Standard Resin', 'Tough Resin', 'Flexible Resin', 'Nylon PA11', 'Nylon PA12', 'Glass-filled Nylon', 'PVA', 'HIPS', 'Water-washable Resin', 'Carbon Fiber', 'Fiberglass', 'Kevlar', 'Onyx']

export default function ProviderDiscovery() {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [selectedPrinterTypes, setSelectedPrinterTypes] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 150])
  const [distanceRadius, setDistanceRadius] = useState([10])
  const [showFilters, setShowFilters] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [locationFilter, setLocationFilter] = useState('')

  // Fetch providers from API
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true)
        
        // For development: set test token if no token exists
        if (process.env.NODE_ENV === 'development' && !localStorage.getItem('token')) {
          localStorage.setItem('token', 'test-token');
        }
        
        const response = await printerAPI.getAll(locationFilter || undefined)
        
        // Transform API data to match Provider interface
        const transformedProviders = response.data.map((printer: any) => ({
          id: printer.id,
          name: printer.name || printer.printerModel || 'Unnamed Printer',
          printerType: printer.printerType || 'FDM',
          printerModel: printer.printerModel || 'Unknown Model',
          materials: printer.materials || ['PLA'],
          hourlyRate: printer.hourlyRate || 50,
          distance: Math.random() * 10, // TODO: Calculate actual distance
          rating: printer.rating || 4.5,
          reviewCount: printer.reviewCount || 0,
          isAvailable: printer.isActive !== false,
          profileImage: '/api/placeholder/64/64',
          location: printer.location || 'Unknown Location'
        }))
        
        setProviders(transformedProviders)
      } catch (error) {
        console.error('Error fetching providers:', error)
        // Keep providers empty on error
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [locationFilter])

  const togglePrinterType = (type: string) => {
    setSelectedPrinterTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const toggleMaterial = (material: string) => {
    setSelectedMaterials(prev =>
      prev.includes(material)
        ? prev.filter(m => m !== material)
        : [...prev, material]
    )
  }

  const filteredProviders = providers.filter(provider => {
    const typeMatch = selectedPrinterTypes.length === 0 || selectedPrinterTypes.includes(provider.printerType)
    const materialMatch = selectedMaterials.length === 0 || selectedMaterials.some(mat => provider.materials.includes(mat))
    const priceMatch = provider.hourlyRate >= priceRange[0] && provider.hourlyRate <= priceRange[1]
    const distanceMatch = provider.distance <= distanceRadius[0]
    
    return typeMatch && materialMatch && priceMatch && distanceMatch
  })

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : index < rating 
            ? 'fill-yellow-400/50 text-yellow-400' 
            : 'text-neutral-400'
        }`}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Find Local 3D Printing Services
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover professional 3D printing providers in your area. Compare prices, capabilities, and availability to find the perfect match for your project.
          </p>
        </div>

        {/* Location Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by location (e.g., Downtown, Tech Hub, City)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Filter Toggle & View Mode */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            
            <div className="flex bg-secondary rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2"
              >
                <Grid3x3 className="w-4 h-4" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="flex items-center gap-2"
              >
                <Map className="w-4 h-4" />
                Map
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by provider name or location..."
              className="w-full"
            />
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Printer Type Filter */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Printer Type
                  </label>
                  <div className="space-y-2">
                    {printerTypes.map(type => (
                      <div key={type} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={type}
                          checked={selectedPrinterTypes.includes(type)}
                          onChange={() => togglePrinterType(type)}
                          className="rounded border-border"
                        />
                        <label htmlFor={type} className="text-sm text-muted-foreground cursor-pointer">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Materials Filter */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Materials
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {allMaterials.slice(0, 8).map(material => (
                      <div key={material} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={material}
                          checked={selectedMaterials.includes(material)}
                          onChange={() => toggleMaterial(material)}
                          className="rounded border-border"
                        />
                        <label htmlFor={material} className="text-sm text-muted-foreground cursor-pointer">
                          {material}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Hourly Rate (${priceRange[0]} - ${priceRange[1]})
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={150}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Distance Filter */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Distance Radius ({distanceRadius[0]} miles)
                  </label>
                  <Slider
                    value={distanceRadius}
                    onValueChange={setDistanceRadius}
                    max={25}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {loading ? 'Loading providers...' : `Found ${filteredProviders.length} provider${filteredProviders.length !== 1 ? 's' : ''} in your area`}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Provider Grid */}
        {!loading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map(provider => (
              <Card key={provider.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {provider.location}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={provider.isAvailable ? "default" : "secondary"}
                      className={provider.isAvailable ? "bg-primary text-primary-foreground" : ""}
                    >
                      {provider.isAvailable ? 'Available' : 'Busy'}
                    </Badge>
                  </div>

                  {/* Printer & Materials */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {provider.printerType}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{provider.printerModel}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {provider.materials.slice(0, 3).map(material => (
                        <Badge key={material} variant="secondary" className="text-xs">
                          {material}
                        </Badge>
                      ))}
                      {provider.materials.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{provider.materials.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Hourly Rate</span>
                      <span className="font-semibold text-foreground">${provider.hourlyRate}/hr</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Distance</span>
                      <span className="text-sm text-foreground">{provider.distance} miles</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {renderStars(provider.rating)}
                        </div>
                        <span className="text-sm text-muted-foreground ml-1">
                          ({provider.reviewCount})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Profile
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Request Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Map View Placeholder */}
        {viewMode === 'map' && (
          <Card className="h-96 bg-secondary">
            <CardContent className="h-full flex items-center justify-center">
              <div className="text-center">
                <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Map View</h3>
                <p className="text-muted-foreground">Interactive map showing provider locations</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {filteredProviders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No providers found</h3>
              <p className="text-muted-foreground">Try adjusting your filters to find more providers in your area.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}