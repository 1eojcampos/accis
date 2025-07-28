"use client"

import { useState, useEffect } from "react"
import { Upload, FileType, Package, Settings, PlusCircle, MinusCircle, MapPin, Clock, Calculator, ExternalLink, Search, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { orderAPI } from "@/lib/api"

interface OrderCreationProps {
  selectedProvider?: any
  onBack?: () => void
}

const steps = [
  { id: 1, title: "Upload Model", icon: Upload, description: "Add your 3D files" },
  { id: 2, title: "Material & Settings", icon: Settings, description: "Choose specifications" },
  { id: 3, title: "Requirements", icon: FileType, description: "Additional details" },
  { id: 4, title: "Review & Quote", icon: Calculator, description: "Final confirmation" }
]

const materials = [
  { value: "pla", label: "PLA", description: "Biodegradable, easy to print", price: 1.0 },
  { value: "abs", label: "ABS", description: "Strong and durable", price: 1.2 },
  { value: "petg", label: "PETG", description: "Chemical resistant", price: 1.5 },
  { value: "resin", label: "Resin", description: "High detail finish", price: 2.0 },
  { value: "metal", label: "Metal", description: "Industrial strength", price: 5.0 }
]

const qualitySettings = [
  { value: "draft", label: "Draft", description: "Fast printing, lower detail", multiplier: 0.8 },
  { value: "standard", label: "Standard", description: "Balanced quality and speed", multiplier: 1.0 },
  { value: "high", label: "High Quality", description: "Finest detail, longer print time", multiplier: 1.5 }
]

export default function OrderCreation({ selectedProvider, onBack }: OrderCreationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedMaterial, setSelectedMaterial] = useState<string>("")
  const [selectedQuality, setSelectedQuality] = useState<string>("")
  const [requirements, setRequirements] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [location, setLocation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const generateExternalLinks = (query: string) => {
    const encodedQuery = encodeURIComponent(query)
    return {
      yeggi: `https://www.yeggi.com/q/${encodedQuery}/`,
      thingiverse: `https://www.thingiverse.com/search?q=${encodedQuery}&sort=relevance`
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchResults([searchQuery.trim()])
    } else {
      setSearchResults([])
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        file => file.name.toLowerCase().endsWith('.stl') || file.name.toLowerCase().endsWith('.obj')
      )
      setFiles(prev => [...prev, ...droppedFiles])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        file => file.name.toLowerCase().endsWith('.stl') || file.name.toLowerCase().endsWith('.obj')
      )
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const calculateEstimate = () => {
    if (!selectedMaterial || !selectedQuality) return { cost: 0, timeline: 0 }
    
    const baseCost = 25
    const material = materials.find(m => m.value === selectedMaterial)
    const quality = qualitySettings.find(q => q.value === selectedQuality)
    
    const materialMultiplier = material?.price || 1
    const qualityMultiplier = quality?.multiplier || 1
    const fileComplexity = files.length > 0 ? files.length * 0.3 + 1 : 1
    
    const cost = Math.round(baseCost * materialMultiplier * qualityMultiplier * quantity * fileComplexity)
    const timeline = Math.max(1, Math.round(2 * qualityMultiplier * fileComplexity))
    
    return { cost, timeline }
  }

  const estimate = calculateEstimate()
  const nearbyProviders = 12

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return files.length > 0
      case 2: return selectedMaterial && selectedQuality
      case 3: return true
      case 4: return true
      default: return false
    }
  }

  const handleSubmitOrder = async () => {
    if (!selectedMaterial || !selectedQuality || files.length === 0) {
      setSubmitError("Please complete all required fields")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      const estimate = calculateEstimate()
      
      // Convert files to a format suitable for API
      const fileData = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }))

      const orderData = {
        files: fileData,
        material: selectedMaterial,
        quality: selectedQuality,
        quantity,
        requirements,
        location: location || 'Default Location',
        estimatedCost: estimate.cost,
        estimatedTimeline: estimate.timeline,
        // Include selected provider information if available
        ...(selectedProvider && {
          preferredProviderId: selectedProvider.id,
          preferredProviderName: selectedProvider.name
        })
      }

      console.log('Submitting order:', orderData)
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
      
      const response = await orderAPI.create(orderData)
      
      if (response.status === 201) {
        setSubmitSuccess(true)
        // Reset form after successful submission
        setTimeout(() => {
          setFiles([])
          setSelectedMaterial("")
          setSelectedQuality("")
          setQuantity(1)
          setRequirements("")
          setLocation("")
          setCurrentStep(1)
          setSubmitSuccess(false)
        }, 3000)
      }
    } catch (error: any) {
      console.error('Order submission error:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      })
      
      let errorMessage = "Failed to submit order. Please try again."
      
      if (error.response?.status === 404) {
        errorMessage = "API endpoint not found. Please check your connection and try again."
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in and try again."
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button and Selected Provider */}
        {onBack && (
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse Printers
            </Button>
            
            {selectedProvider && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {selectedProvider.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Selected Provider: {selectedProvider.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{selectedProvider.printerType} Printer</span>
                      <span>${selectedProvider.hourlyRate}/hour</span>
                      <span>{selectedProvider.distance} miles away</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    ⭐ {selectedProvider.rating}
                  </Badge>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 font-[var(--font-display)]">
            Create Your Order
          </h1>
          <p className="text-lg text-muted-foreground font-[var(--font-body)]">
            {selectedProvider 
              ? `Upload your 3D models to request a quote from ${selectedProvider.name}`
              : 'Upload your 3D models and get instant quotes from local providers'
            }
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <nav className="flex space-x-8">
            {steps.map((step) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <div key={step.id} className="flex flex-col items-center space-y-2">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors duration-200
                    ${isActive ? 'bg-accent border-accent text-accent-foreground' : 
                      isCompleted ? 'bg-accent/20 border-accent text-accent' : 
                      'bg-card border-border text-muted-foreground'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium font-[var(--font-display)] ${
                      isActive || isCompleted ? 'text-accent' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground font-[var(--font-body)]">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Area */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-card-foreground font-[var(--font-display)]">
                  {steps[currentStep - 1].title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Browse & Upload */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* Model Search Section */}
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search for 3D models..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1"
                        />
                        <Button onClick={handleSearch} variant="outline">
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </Button>
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="space-y-4 p-4 bg-muted/10 rounded-lg">
                          <h4 className="font-medium text-card-foreground">External Model Sources:</h4>
                          {searchResults.map((query, index) => {
                            const links = generateExternalLinks(query);
                            return (
                              <div key={index} className="space-y-2">
                                <div className="text-sm text-muted-foreground">
                                  Results for: <span className="font-medium">"{query}"</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <Button
                                    variant="outline"
                                    className="justify-start h-auto p-4"
                                    onClick={() => window.open(links.yeggi, '_blank')}
                                  >
                                    <div className="text-left">
                                      <div className="flex items-center gap-2 mb-1">
                                        <ExternalLink className="w-4 h-4" />
                                        <span className="font-medium">Yeggi.com</span>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Search millions of 3D models
                                      </div>
                                    </div>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="justify-start h-auto p-4"
                                    onClick={() => window.open(links.thingiverse, '_blank')}
                                  >
                                    <div className="text-left">
                                      <div className="flex items-center gap-2 mb-1">
                                        <ExternalLink className="w-4 h-4" />
                                        <span className="font-medium">Thingiverse</span>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Community-created designs
                                      </div>
                                    </div>
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {searchResults.length === 0 && searchQuery && (
                        <div className="text-center py-6 text-muted-foreground">
                          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Click search to find models on external platforms</p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border pt-6"></div>

                    {/* File Upload Section */}
                    <div
                      className={`
                        relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
                        ${dragActive ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}
                      `}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        multiple
                        accept=".stl,.obj"
                        onChange={handleFileInput}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-card-foreground mb-2 font-[var(--font-display)]">
                        Drop your 3D files here
                      </p>
                      <p className="text-sm text-muted-foreground font-[var(--font-body)]">
                        Supports STL and OBJ formats. Click to browse or drag and drop.
                      </p>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-card-foreground font-[var(--font-display)]">
                          Uploaded Files ({files.length})
                        </h3>
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-md border border-border">
                            <div className="flex items-center space-x-2">
                              <FileType className="w-4 h-4 text-accent" />
                              <span className="text-sm text-card-foreground font-[var(--font-body)]">{file.name}</span>
                              <span className="text-xs text-muted-foreground font-[var(--font-body)]">
                                ({(file.size / 1024 / 1024).toFixed(1)} MB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Material & Settings */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Material Selection */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-card-foreground font-[var(--font-display)]">
                          Material
                        </Label>
                        <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                          <SelectTrigger className="bg-input border-border text-card-foreground">
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {materials.map((material) => (
                              <SelectItem key={material.value} value={material.value} className="text-popover-foreground">
                                <div>
                                  <div className="font-medium font-[var(--font-display)]">{material.label}</div>
                                  <div className="text-xs text-muted-foreground font-[var(--font-body)]">{material.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quality Settings */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-card-foreground font-[var(--font-display)]">
                          Print Quality
                        </Label>
                        <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                          <SelectTrigger className="bg-input border-border text-card-foreground">
                            <SelectValue placeholder="Select quality" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {qualitySettings.map((quality) => (
                              <SelectItem key={quality.value} value={quality.value} className="text-popover-foreground">
                                <div>
                                  <div className="font-medium font-[var(--font-display)]">{quality.label}</div>
                                  <div className="text-xs text-muted-foreground font-[var(--font-body)]">{quality.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-card-foreground font-[var(--font-display)]">
                        Quantity: {quantity}
                      </Label>
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="border-border text-card-foreground hover:bg-accent/10"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </Button>
                        <Slider
                          value={[quantity]}
                          onValueChange={(value) => setQuantity(value[0])}
                          max={100}
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(quantity + 1)}
                          className="border-border text-card-foreground hover:bg-accent/10"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Requirements */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-card-foreground font-[var(--font-display)]">
                        Location (Optional)
                      </Label>
                      <Input
                        placeholder="Enter your location for better provider matching..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="bg-input border-border text-card-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-card-foreground font-[var(--font-display)]">
                        Special Requirements (Optional)
                      </Label>
                      <Textarea
                        placeholder="Add any special instructions, color preferences, finishing requirements, or delivery notes..."
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        className="min-h-[120px] bg-input border-border text-card-foreground resize-none font-[var(--font-body)]"
                      />
                      <p className="text-xs text-muted-foreground font-[var(--font-body)]">
                        Provide detailed specifications to help providers deliver exactly what you need.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-card-foreground font-[var(--font-display)]">Files</h3>
                        <p className="text-sm text-muted-foreground font-[var(--font-body)]">{files.length} file(s) uploaded</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-card-foreground font-[var(--font-display)]">Material</h3>
                        <p className="text-sm text-muted-foreground font-[var(--font-body)]">
                          {materials.find(m => m.value === selectedMaterial)?.label || 'Not selected'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-card-foreground font-[var(--font-display)]">Quality</h3>
                        <p className="text-sm text-muted-foreground font-[var(--font-body)]">
                          {qualitySettings.find(q => q.value === selectedQuality)?.label || 'Not selected'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-card-foreground font-[var(--font-display)]">Quantity</h3>
                        <p className="text-sm text-muted-foreground font-[var(--font-body)]">{quantity} item(s)</p>
                      </div>
                    </div>
                    {requirements && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-card-foreground font-[var(--font-display)]">Special Requirements</h3>
                        <p className="text-sm text-muted-foreground font-[var(--font-body)]">{requirements}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error/Success Messages */}
                {submitError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {submitError}
                    </AlertDescription>
                  </Alert>
                )}
                
                {submitSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Order submitted successfully! Providers will be notified and can start responding to your request.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1 || isSubmitting}
                    className="border-border text-card-foreground hover:bg-accent/10"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={currentStep === 4 ? handleSubmitOrder : nextStep}
                    disabled={!canProceed() || isSubmitting}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {isSubmitting ? 'Submitting...' : currentStep === 4 ? 'Submit Order' : 'Next Step'}
                  </Button>
                </div>

                {/* Submit Order Success/Error Message */}
                {currentStep === 4 && submitError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <AlertDescription className="text-sm">
                      {submitError}
                    </AlertDescription>
                  </Alert>
                )}
                {currentStep === 4 && submitSuccess && (
                  <Alert variant="default" className="mt-4">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <AlertDescription className="text-sm">
                      Order submitted successfully!.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quote Estimation Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-card-foreground font-[var(--font-display)]">
                  Quote Estimation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cost Estimate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-[var(--font-body)]">Estimated Cost</span>
                    <Calculator className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-2xl font-bold text-accent font-[var(--font-display)]">
                    ${estimate.cost > 0 ? estimate.cost.toLocaleString() : '--'}
                  </p>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-[var(--font-body)]">Estimated Timeline</span>
                    <Clock className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-lg font-semibold text-card-foreground font-[var(--font-display)]">
                    {estimate.timeline > 0 ? `${estimate.timeline} day${estimate.timeline > 1 ? 's' : ''}` : '--'}
                  </p>
                </div>

                {/* Nearby Providers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-[var(--font-body)]">Nearby Providers</span>
                    <MapPin className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-lg font-semibold text-card-foreground font-[var(--font-display)]">
                    {nearbyProviders} available
                  </p>
                </div>

                {/* Breakdown */}
                {estimate.cost > 0 && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold text-card-foreground mb-3 font-[var(--font-display)]">
                      Cost Breakdown
                    </h4>
                    <div className="space-y-2 text-xs font-[var(--font-body)]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base cost</span>
                        <span className="text-card-foreground">$25</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Material ({materials.find(m => m.value === selectedMaterial)?.label})</span>
                        <span className="text-card-foreground">x{materials.find(m => m.value === selectedMaterial)?.price?.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quality ({qualitySettings.find(q => q.value === selectedQuality)?.label})</span>
                        <span className="text-card-foreground">x{qualitySettings.find(q => q.value === selectedQuality)?.multiplier?.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantity</span>
                        <span className="text-card-foreground">x{quantity}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground font-[var(--font-body)]">
                  * Final pricing may vary based on provider and specific requirements
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}