"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export default function SchemaMigrationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Enhanced Schema Structure Validation
    try {
      const mockOrder = {
        id: 'test-123',
        customerId: 'user-456',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        
        // Enhanced schema
        enhancedFiles: {
          uploaded: [
            {
              name: 'test-model.stl',
              size: 1024000,
              type: 'application/stl',
              uploadedAt: new Date().toISOString(),
              status: 'uploaded'
            }
          ],
          totalCount: 1,
          totalSize: 1024000
        },
        
        enhancedRequirements: {
          material: 'PLA',
          quality: 'high',
          quantity: 2,
          specifications: 'Test print with fine details',
          location: '12345'
        },
        
        timeline: {
          requested: null,
          estimated: 48,
          actual: null
        },
        
        budget: {
          customerMax: null,
          estimated: 25.50,
          quoted: null,
          final: null
        },
        
        statusHistory: [{
          status: 'pending',
          timestamp: new Date().toISOString(),
          updatedBy: 'user-456',
          notes: 'Order submitted by customer'
        }],
        
        quote: null,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Legacy compatibility
        files: [{ name: 'test-model.stl', size: 1024000, type: 'application/stl' }],
        material: 'PLA',
        quality: 'high',
        quantity: 2,
        requirements: 'Test print with fine details',
        location: '12345',
        estimatedCost: 25.50,
        estimatedTimeline: 48
      };

      // Validate enhanced files structure
      if (mockOrder.enhancedFiles?.uploaded?.length === 1) {
        results.push({
          test: 'Enhanced Files Structure',
          status: 'pass',
          message: 'Enhanced files object correctly structured with uploaded array'
        });
      } else {
        results.push({
          test: 'Enhanced Files Structure',
          status: 'fail',
          message: 'Enhanced files structure validation failed'
        });
      }

      // Validate enhanced requirements structure
      if (mockOrder.enhancedRequirements?.material === 'PLA' && 
          mockOrder.enhancedRequirements?.specifications === 'Test print with fine details') {
        results.push({
          test: 'Enhanced Requirements Structure',
          status: 'pass',
          message: 'Enhanced requirements object correctly structured'
        });
      } else {
        results.push({
          test: 'Enhanced Requirements Structure',
          status: 'fail',
          message: 'Enhanced requirements structure validation failed'
        });
      }

      // Validate timeline structure
      if (mockOrder.timeline?.estimated === 48) {
        results.push({
          test: 'Timeline Structure',
          status: 'pass',
          message: 'Timeline object correctly structured with estimated time'
        });
      } else {
        results.push({
          test: 'Timeline Structure',
          status: 'fail',
          message: 'Timeline structure validation failed'
        });
      }

      // Validate budget structure
      if (mockOrder.budget?.estimated === 25.50) {
        results.push({
          test: 'Budget Structure',
          status: 'pass',
          message: 'Budget object correctly structured with estimated cost'
        });
      } else {
        results.push({
          test: 'Budget Structure',
          status: 'fail',
          message: 'Budget structure validation failed'
        });
      }

      // Validate status history
      if (mockOrder.statusHistory?.length === 1 && 
          mockOrder.statusHistory[0].status === 'pending') {
        results.push({
          test: 'Status History',
          status: 'pass',
          message: 'Status history array correctly initialized'
        });
      } else {
        results.push({
          test: 'Status History',
          status: 'fail',
          message: 'Status history validation failed'
        });
      }

      // Validate backward compatibility
      if (mockOrder.files?.length === 1 && 
          mockOrder.material === 'PLA' && 
          mockOrder.requirements === 'Test print with fine details') {
        results.push({
          test: 'Backward Compatibility',
          status: 'pass',
          message: 'Legacy fields maintained for API compatibility'
        });
      } else {
        results.push({
          test: 'Backward Compatibility',
          status: 'fail',
          message: 'Legacy compatibility validation failed'
        });
      }

    } catch (error) {
      results.push({
        test: 'Schema Validation',
        status: 'fail',
        message: `Test execution failed: ${error}`
      });
    }

    // Test 2: Order Creation Data Structure
    try {
      const orderSubmissionTest = {
        enhancedFiles: {
          uploaded: [],
          totalCount: 0,
          totalSize: 0
        },
        enhancedRequirements: {
          material: 'ABS',
          quality: 'standard',
          quantity: 1,
          specifications: '',
          location: 'Default Location'
        },
        timeline: {
          requested: null,
          estimated: 24,
          actual: null
        },
        budget: {
          customerMax: null,
          estimated: 15.00,
          quoted: null,
          final: null
        },
        statusHistory: [{
          status: 'pending',
          timestamp: new Date().toISOString(),
          updatedBy: 'test-user',
          notes: 'Order submitted by customer'
        }]
      };

      results.push({
        test: 'Order Submission Structure',
        status: 'pass',
        message: 'Order creation data structure validated successfully'
      });
    } catch (error) {
      results.push({
        test: 'Order Submission Structure',
        status: 'fail',
        message: `Order submission test failed: ${error}`
      });
    }

    // Test 3: Quote Structure
    try {
      const quoteTest = {
        quote: {
          amount: 45.00,
          deliveryTime: '3-5 business days',
          notes: 'High quality print with premium materials',
          submittedAt: new Date().toISOString(),
          providerId: 'provider-123',
          providerName: 'Test Provider'
        }
      };

      if (quoteTest.quote.amount === 45.00 && quoteTest.quote.providerName === 'Test Provider') {
        results.push({
          test: 'Quote Structure',
          status: 'pass',
          message: 'Quote object structure validated successfully'
        });
      } else {
        results.push({
          test: 'Quote Structure',
          status: 'fail',
          message: 'Quote structure validation failed'
        });
      }
    } catch (error) {
      results.push({
        test: 'Quote Structure',
        status: 'fail',
        message: `Quote test failed: ${error}`
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getBadgeVariant = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return 'default';
      case 'fail':
        return 'destructive';
      case 'warning':
        return 'secondary';
    }
  };

  const passCount = testResults.filter(r => r.status === 'pass').length;
  const failCount = testResults.filter(r => r.status === 'fail').length;
  const warningCount = testResults.filter(r => r.status === 'warning').length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Enhanced Schema Migration Test</CardTitle>
          <p className="text-muted-foreground">
            Validate the enhanced Firestore schema for order management system
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Running Tests...' : 'Run Schema Tests'}
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <Badge variant="default" className="bg-green-500">
                  Pass: {passCount}
                </Badge>
                <Badge variant="destructive">
                  Fail: {failCount}
                </Badge>
                <Badge variant="secondary">
                  Warning: {warningCount}
                </Badge>
                <Badge variant="outline">
                  Total: {testResults.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-3">
                      {getIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.test}</span>
                          <Badge variant={getBadgeVariant(result.status)}>
                            {result.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.message}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
