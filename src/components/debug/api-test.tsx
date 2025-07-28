'use client'

import { useState } from 'react'
import { orderAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ApiTest() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (test: string, result: any) => {
    setResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }])
  }

  const testConnection = async () => {
    setLoading(true)
    try {
      console.log('Testing GET /api/test...')
      const response = await orderAPI.testConnection()
      addResult('GET /api/test', { success: true, data: response.data })
    } catch (error: any) {
      console.error('GET test failed:', error)
      addResult('GET /api/test', { 
        success: false, 
        error: error.message,
        status: error.response?.status,
        url: error.config?.url 
      })
    }
    setLoading(false)
  }

  const testPostEndpoint = async () => {
    setLoading(true)
    try {
      console.log('Testing POST /api/test-request...')
      const testData = { message: 'Test from frontend', timestamp: new Date().toISOString() }
      const response = await orderAPI.testPost(testData)
      addResult('POST /api/test-request', { success: true, data: response.data })
    } catch (error: any) {
      console.error('POST test failed:', error)
      addResult('POST /api/test-request', { 
        success: false, 
        error: error.message,
        status: error.response?.status,
        url: error.config?.url 
      })
    }
    setLoading(false)
  }

  const testRealEndpoint = async () => {
    setLoading(true)
    try {
      console.log('Testing POST /api/requests...')
      const testOrderData = {
        files: [{ name: 'test.stl', size: 1000, type: 'application/octet-stream' }],
        material: 'PLA',
        quality: 'Standard',
        quantity: 1,
        requirements: 'Test order',
        location: 'Test Location',
        estimatedCost: 10,
        estimatedTimeline: 24
      }
      
      // Set a test token for development
      localStorage.setItem('token', 'test-token')
      
      const response = await orderAPI.create(testOrderData)
      addResult('POST /api/requests', { success: true, data: response.data })
    } catch (error: any) {
      console.error('Real POST test failed:', error)
      addResult('POST /api/requests', { 
        success: false, 
        error: error.message,
        status: error.response?.status,
        url: error.config?.url,
        response: error.response?.data 
      })
    }
    setLoading(false)
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>API Connection Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testConnection} 
            disabled={loading}
            variant="outline"
          >
            Test GET /api/test
          </Button>
          <Button 
            onClick={testPostEndpoint} 
            disabled={loading}
            variant="outline"
          >
            Test POST /api/test-request
          </Button>
          <Button 
            onClick={testRealEndpoint} 
            disabled={loading}
            variant="default"
          >
            Test POST /api/requests
          </Button>
          <Button 
            onClick={clearResults} 
            disabled={loading}
            variant="destructive"
          >
            Clear Results
          </Button>
        </div>

        {loading && <p>Testing...</p>}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <Card key={index} className={`${result.result.success ? 'border-green-500' : 'border-red-500'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {result.test} - {result.result.success ? '✅ Success' : '❌ Failed'}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{result.timestamp}</p>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
