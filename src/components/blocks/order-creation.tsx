"use client"

import { useState } from "react"
import { Upload, FileType, Package, Settings, PlusCircle, MinusCircle, MapPin, Clock, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"

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

export default function OrderCreation() {
  const [currentStep, setCurrentStep] = useState(1)
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedMaterial, setSelectedMaterial] = useState<string>("")
  const [selectedQuality, setSelectedQuality] = useState<string>("")
  const [requirements, setRequirements] = useState("")

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

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 font-[var(--font-display)]">
            Create Your Order
          </h1>
          <p className="text-lg text-muted-foreground font-[var(--font-body)]">
            Upload your 3D models and get instant quotes from local providers
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
                {/* Step 1: File Upload */}
                {currentStep === 1 && (
                  <div className="space-y-6">
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

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="border-border text-card-foreground hover:bg-accent/10"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={currentStep === 4 ? () => {} : nextStep}
                    disabled={!canProceed()}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {currentStep === 4 ? 'Submit Order' : 'Next Step'}
                  </Button>
                </div>
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