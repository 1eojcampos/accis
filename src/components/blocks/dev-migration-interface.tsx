"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Database,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Printer,
  FileText,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';

import { 
  devMigrationService, 
  isDevEnvironment, 
  runDevMigration 
} from '@/lib/firebase/dev-migration';

interface MigrationProgress {
  current: number;
  total: number;
  percentage: number;
  collection: string;
}

interface MigrationResult {
  collection: string;
  totalDocuments: number;
  processedDocuments: number;
  errors: string[];
  duration: number;
}

interface MigrationState {
  isRunning: boolean;
  currentCollection: string | null;
  progress: { [collection: string]: MigrationProgress };
  results: { [collection: string]: MigrationResult };
  errors: string[];
}

export const DevMigrationInterface = () => {
  const [migrationState, setMigrationState] = useState<MigrationState>({
    isRunning: false,
    currentCollection: null,
    progress: {},
    results: {},
    errors: []
  });

  const [isDevEnv, setIsDevEnv] = useState(false);

  useEffect(() => {
    setIsDevEnv(isDevEnvironment());
  }, []);

  // Update progress for a specific collection
  const updateProgress = (collection: string, progress: MigrationProgress) => {
    setMigrationState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        [collection]: progress
      }
    }));
  };

  // Complete migration for a collection
  const completeMigration = (collection: string, result: MigrationResult) => {
    setMigrationState(prev => ({
      ...prev,
      results: {
        ...prev.results,
        [collection]: result
      },
      progress: {
        ...prev.progress,
        [collection]: {
          current: result.processedDocuments,
          total: result.totalDocuments,
          percentage: 100,
          collection
        }
      }
    }));

    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        toast.error(`Migration Error: ${error}`);
      });
    } else {
      toast.success(`${collection} migration completed successfully!`);
    }
  };

  // Run individual collection migration
  const runSingleMigration = async (
    migrationFn: () => Promise<MigrationResult>,
    collection: string
  ) => {
    if (!isDevEnv) {
      toast.error('Migration can only be run in development environment');
      return;
    }

    try {
      setMigrationState(prev => ({
        ...prev,
        isRunning: true,
        currentCollection: collection,
        errors: []
      }));

      const result = await runDevMigration(migrationFn, 
        `Are you sure you want to migrate the ${collection} collection? This will modify existing data.`
      );

      completeMigration(collection, result);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setMigrationState(prev => ({
        ...prev,
        errors: [...prev.errors, errorMsg]
      }));
      toast.error(`Migration failed: ${errorMsg}`);
    } finally {
      setMigrationState(prev => ({
        ...prev,
        isRunning: false,
        currentCollection: null
      }));
    }
  };

  // Run complete migration
  const runCompleteMigration = async () => {
    if (!isDevEnv) {
      toast.error('Migration can only be run in development environment');
      return;
    }

    try {
      setMigrationState(prev => ({
        ...prev,
        isRunning: true,
        currentCollection: 'all',
        errors: [],
        progress: {},
        results: {}
      }));

      const results = await runDevMigration(
        () => devMigrationService.runCompleteMigration(updateProgress),
        'Are you sure you want to run the complete migration? This will modify ALL collections.'
      );

      // Update results for all collections
      Object.entries(results).forEach(([collection, result]) => {
        completeMigration(collection, result as MigrationResult);
      });

      toast.success('Complete migration finished!');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setMigrationState(prev => ({
        ...prev,
        errors: [...prev.errors, errorMsg]
      }));
      toast.error(`Complete migration failed: ${errorMsg}`);
    } finally {
      setMigrationState(prev => ({
        ...prev,
        isRunning: false,
        currentCollection: null
      }));
    }
  };

  // Reset migration state
  const resetMigrationState = () => {
    setMigrationState({
      isRunning: false,
      currentCollection: null,
      progress: {},
      results: {},
      errors: []
    });
    toast.success('Migration state reset');
  };

  // Helper functions
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusIcon = (collection: string) => {
    if (migrationState.isRunning && migrationState.currentCollection === collection) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    if (migrationState.results[collection]) {
      const result = migrationState.results[collection];
      return result.errors.length > 0 
        ? <XCircle className="w-4 h-4 text-red-500" />
        : <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getCollectionIcon = (collection: string) => {
    switch (collection) {
      case 'users': return <Users className="w-5 h-5" />;
      case 'printers': return <Printer className="w-5 h-5" />;
      case 'printRequests': return <FileText className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  if (!isDevEnv) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Production Environment</h2>
            <p className="text-muted-foreground">
              Migration interface is only available in development environment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-yellow-500" />
                <div>
                  <CardTitle className="text-xl text-yellow-500">
                    🚨 Firestore Development Migration
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Schema upgrade utilities for development environment only
                  </p>
                </div>
              </div>
              <Button
                onClick={resetMigrationState}
                variant="outline"
                size="sm"
                disabled={migrationState.isRunning}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Warning Alert */}
        <Alert className="border-red-500/50 bg-red-500/5">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-500">
            <strong>⚠️ WARNING:</strong> This will modify your Firestore data structure. 
            Only use in development/staging environments. Ensure you have backups before proceeding.
          </AlertDescription>
        </Alert>

        {/* Complete Migration */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Migration</CardTitle>
            <p className="text-muted-foreground">
              Run migration for all collections at once
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={runCompleteMigration}
              disabled={migrationState.isRunning}
              size="lg"
              className="w-full"
            >
              {migrationState.isRunning && migrationState.currentCollection === 'all' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Complete Migration
            </Button>
          </CardContent>
        </Card>

        {/* Individual Collection Migrations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Users Collection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCollectionIcon('users')}
                  <CardTitle className="text-lg">Users</CardTitle>
                </div>
                {getStatusIcon('users')}
              </div>
              <p className="text-sm text-muted-foreground">
                Normalize roles, add profile structure, convert timestamps
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {migrationState.progress.users && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{migrationState.progress.users.percentage}%</span>
                  </div>
                  <Progress value={migrationState.progress.users.percentage} />
                  <p className="text-xs text-muted-foreground">
                    {migrationState.progress.users.current} / {migrationState.progress.users.total} documents
                  </p>
                </div>
              )}

              {migrationState.results.users && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {migrationState.results.users.processedDocuments} processed
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {formatDuration(migrationState.results.users.duration)}
                    </Badge>
                  </div>
                  {migrationState.results.users.errors.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {migrationState.results.users.errors.length} errors
                    </Badge>
                  )}
                </div>
              )}

              <Button
                onClick={() => runSingleMigration(
                  () => devMigrationService.migrateUsersCollection(),
                  'users'
                )}
                disabled={migrationState.isRunning}
                className="w-full"
                size="sm"
              >
                {migrationState.isRunning && migrationState.currentCollection === 'users' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Migrate Users
              </Button>
            </CardContent>
          </Card>

          {/* Printers Collection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCollectionIcon('printers')}
                  <CardTitle className="text-lg">Printers</CardTitle>
                </div>
                {getStatusIcon('printers')}
              </div>
              <p className="text-sm text-muted-foreground">
                Structure capabilities, pricing, location data, availability
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {migrationState.progress.printers && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{migrationState.progress.printers.percentage}%</span>
                  </div>
                  <Progress value={migrationState.progress.printers.percentage} />
                  <p className="text-xs text-muted-foreground">
                    {migrationState.progress.printers.current} / {migrationState.progress.printers.total} documents
                  </p>
                </div>
              )}

              {migrationState.results.printers && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {migrationState.results.printers.processedDocuments} processed
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {formatDuration(migrationState.results.printers.duration)}
                    </Badge>
                  </div>
                  {migrationState.results.printers.errors.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {migrationState.results.printers.errors.length} errors
                    </Badge>
                  )}
                </div>
              )}

              <Button
                onClick={() => runSingleMigration(
                  () => devMigrationService.migratePrintersCollection(),
                  'printers'
                )}
                disabled={migrationState.isRunning}
                className="w-full"
                size="sm"
              >
                {migrationState.isRunning && migrationState.currentCollection === 'printers' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Migrate Printers
              </Button>
            </CardContent>
          </Card>

          {/* Print Requests Collection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCollectionIcon('printRequests')}
                  <CardTitle className="text-lg">Print Requests</CardTitle>
                </div>
                {getStatusIcon('printRequests')}
              </div>
              <p className="text-sm text-muted-foreground">
                Restructure data, add timeline, payment, status history
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {migrationState.progress.printRequests && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{migrationState.progress.printRequests.percentage}%</span>
                  </div>
                  <Progress value={migrationState.progress.printRequests.percentage} />
                  <p className="text-xs text-muted-foreground">
                    {migrationState.progress.printRequests.current} / {migrationState.progress.printRequests.total} documents
                  </p>
                </div>
              )}

              {migrationState.results.printRequests && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {migrationState.results.printRequests.processedDocuments} processed
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {formatDuration(migrationState.results.printRequests.duration)}
                    </Badge>
                  </div>
                  {migrationState.results.printRequests.errors.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {migrationState.results.printRequests.errors.length} errors
                    </Badge>
                  )}
                </div>
              )}

              <Button
                onClick={() => runSingleMigration(
                  () => devMigrationService.migratePrintRequestsCollection(),
                  'printRequests'
                )}
                disabled={migrationState.isRunning}
                className="w-full"
                size="sm"
              >
                {migrationState.isRunning && migrationState.currentCollection === 'printRequests' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Migrate Print Requests
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Migration Summary */}
        {Object.keys(migrationState.results).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Migration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(migrationState.results).map(([collection, result]) => (
                  <div key={collection} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getCollectionIcon(collection)}
                      <h4 className="font-medium capitalize">{collection}</h4>
                      {result.errors.length > 0 ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Processed: {result.processedDocuments}/{result.totalDocuments}</p>
                      <p>Duration: {formatDuration(result.duration)}</p>
                      {result.errors.length > 0 && (
                        <p className="text-red-500">Errors: {result.errors.length}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {migrationState.errors.length > 0 && (
          <Card className="border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-500 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Migration Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {migrationState.errors.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Migration Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Before Migration:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Ensure you're in development environment</li>
                  <li>• Backup your Firestore data</li>
                  <li>• Stop all running applications</li>
                  <li>• Verify Firebase authentication</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">After Migration:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Test your application thoroughly</li>
                  <li>• Verify data integrity</li>
                  <li>• Update query patterns if needed</li>
                  <li>• Remove migration interface before production</li>
                </ul>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-sm text-muted-foreground">
              <strong>Note:</strong> This migration will update existing documents to match the new schema structure. 
              Legacy fields will be converted or restructured. The migration is designed to be safe and preserve data integrity.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
