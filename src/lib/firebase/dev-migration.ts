/**
 * Development-only Firestore schema migration utilities
 * WARNING: Only use in development/staging environments
 */

import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  Timestamp, 
  serverTimestamp,
  query,
  limit,
  startAfter,
  DocumentSnapshot,
  Query,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from './config';

// DocumentData type for Firebase Firestore documents
type DocumentData = { [field: string]: any };

interface MigrationResult {
  collection: string;
  totalDocuments: number;
  processedDocuments: number;
  errors: string[];
  duration: number;
}

interface MigrationProgress {
  current: number;
  total: number;
  percentage: number;
  collection: string;
}

export class FirestoreDevMigration {
  private readonly BATCH_SIZE = 500; // Firestore batch limit
  private readonly MAX_DOCS_PER_BATCH = 100; // Smaller batches for safety

  /**
   * Migrate Users Collection
   * Converts legacy schema to new enhanced structure
   */
  async migrateUsersCollection(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      collection: 'users',
      totalDocuments: 0,
      processedDocuments: 0,
      errors: [],
      duration: 0
    };

    try {
      console.log('🔄 Starting Users collection migration...');
      
      // Get total count first
      const countSnapshot = await getDocs(collection(db, 'users'));
      result.totalDocuments = countSnapshot.size;
      
      if (result.totalDocuments === 0) {
        console.log('ℹ️ No users found to migrate');
        result.duration = Date.now() - startTime;
        return result;
      }

      // Process in batches
      let lastDoc: DocumentSnapshot | null = null;
      let processedCount = 0;

      while (processedCount < result.totalDocuments) {
        const batchQuery: Query<DocumentData> = lastDoc 
          ? query(collection(db, 'users'), startAfter(lastDoc), limit(this.MAX_DOCS_PER_BATCH))
          : query(collection(db, 'users'), limit(this.MAX_DOCS_PER_BATCH));

        const snapshot: QuerySnapshot<DocumentData> = await getDocs(batchQuery);
        
        if (snapshot.empty) break;

        const batch = writeBatch(db);
        let batchCount = 0;

        snapshot.forEach((docSnap: DocumentSnapshot<DocumentData>) => {
          try {
            const data = docSnap.data();
            if (!data) return; // Skip if no data
            
            const uid = docSnap.id;

            // Create enhanced user data structure
            const updatedData = {
              uid: data.uid || uid,
              email: data.email || '',
              displayName: data.displayName || '',
              role: this.normalizeUserRole(data.userType || data.role),
              emailVerified: Boolean(data.emailVerified),
              profile: {
                avatar: data.profile?.avatar || data.photoURL || null,
                phone: data.profile?.phone || data.phone || null,
                address: data.profile?.address || {
                  street: data.address?.street || null,
                  city: data.address?.city || null,
                  state: data.address?.state || null,
                  zipCode: data.address?.zipCode || null,
                  coordinates: data.address?.coordinates || null
                }
              },
              settings: {
                notifications: data.settings?.notifications ?? true,
                darkMode: data.settings?.darkMode ?? false,
                emailNotifications: data.settings?.emailNotifications ?? true,
                smsNotifications: data.settings?.smsNotifications ?? false
              },
              createdAt: this.convertToTimestamp(data.createdAt) || Timestamp.now(),
              updatedAt: serverTimestamp()
            };

            // Remove legacy fields
            const fieldsToRemove = ['userType', 'photoURL', 'phone', 'address'];
            fieldsToRemove.forEach(field => {
              if (field in updatedData) {
                delete (updatedData as any)[field];
              }
            });

            batch.update(docSnap.ref, updatedData);
            batchCount++;
            processedCount++;

            // Report progress
            if (onProgress) {
              onProgress({
                current: processedCount,
                total: result.totalDocuments,
                percentage: Math.round((processedCount / result.totalDocuments) * 100),
                collection: 'users'
              });
            }

          } catch (error) {
            const errorMsg = `Error processing user ${docSnap.id}: ${error}`;
            console.error(errorMsg);
            result.errors.push(errorMsg);
          }
        });

        if (batchCount > 0) {
          await batch.commit();
          console.log(`✅ Processed batch of ${batchCount} users (${processedCount}/${result.totalDocuments})`);
        }

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
      }

      result.processedDocuments = processedCount;
      console.log(`✅ Users migration completed: ${processedCount}/${result.totalDocuments} documents`);

    } catch (error) {
      const errorMsg = `Fatal error in users migration: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Migrate Printers Collection
   * Enhances printer documents with structured data
   */
  async migratePrintersCollection(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      collection: 'printers',
      totalDocuments: 0,
      processedDocuments: 0,
      errors: [],
      duration: 0
    };

    try {
      console.log('🔄 Starting Printers collection migration...');
      
      const countSnapshot = await getDocs(collection(db, 'printers'));
      result.totalDocuments = countSnapshot.size;
      
      if (result.totalDocuments === 0) {
        console.log('ℹ️ No printers found to migrate');
        result.duration = Date.now() - startTime;
        return result;
      }

      let lastDoc: DocumentSnapshot | null = null;
      let processedCount = 0;

      while (processedCount < result.totalDocuments) {
        const batchQuery: Query<DocumentData> = lastDoc 
          ? query(collection(db, 'printers'), startAfter(lastDoc), limit(this.MAX_DOCS_PER_BATCH))
          : query(collection(db, 'printers'), limit(this.MAX_DOCS_PER_BATCH));

        const snapshot: QuerySnapshot<DocumentData> = await getDocs(batchQuery);
        
        if (snapshot.empty) break;

        const batch = writeBatch(db);
        let batchCount = 0;

        snapshot.forEach((docSnap: DocumentSnapshot<DocumentData>) => {
          try {
            const data = docSnap.data();
            if (!data) return; // Skip if no data

            const updatedData = {
              id: data.id || docSnap.id,
              ownerId: data.ownerId || data.userId || '',
              name: data.name || 'Unnamed Printer',
              technology: this.normalizePrinterTechnology(data.technology || data.type),
              buildVolume: {
                x: data.buildVolume?.x || data.buildVolumeX || 200,
                y: data.buildVolume?.y || data.buildVolumeY || 200,
                z: data.buildVolume?.z || data.buildVolumeZ || 200,
                unit: 'mm'
              },
              materials: this.migratePrinterMaterials(data.materials || data.supportedMaterials),
              capabilities: {
                layerHeights: data.capabilities?.layerHeights || data.layerHeights || [0.1, 0.2, 0.3],
                maxSpeed: data.capabilities?.maxSpeed || data.maxSpeed || 60,
                supportTypes: data.capabilities?.supportTypes || data.supportTypes || ['PVA', 'HIPS'],
                finishOptions: data.capabilities?.finishOptions || data.finishOptions || ['standard']
              },
              location: {
                address: data.location?.address || data.location || '',
                city: data.location?.city || data.city || '',
                state: data.location?.state || data.state || '',
                zipCode: data.location?.zipCode || data.zipCode || '',
                coordinates: data.location?.coordinates || data.coordinates || null,
                serviceRadius: data.location?.serviceRadius || data.serviceRadius || 50
              },
              pricing: {
                baseRate: data.pricing?.baseRate || data.baseRate || 0.10,
                hourlyRate: data.pricing?.hourlyRate || data.hourlyRate || 5.00,
                materialMarkup: data.pricing?.materialMarkup || data.materialMarkup || 1.2,
                rushMultiplier: data.pricing?.rushMultiplier || data.rushMultiplier || 1.5
              },
              availability: {
                status: data.availability?.status || data.status || 'available',
                schedule: data.availability?.schedule || data.schedule || {},
                queueLength: data.availability?.queueLength || data.queueLength || 0
              },
              stats: {
                completedJobs: data.stats?.completedJobs || data.completedJobs || 0,
                averageRating: data.stats?.averageRating || data.averageRating || 0,
                responseTime: data.stats?.responseTime || data.responseTime || 24
              },
              isActive: data.isActive ?? true,
              createdAt: this.convertToTimestamp(data.createdAt) || Timestamp.now(),
              updatedAt: serverTimestamp()
            };

            batch.update(docSnap.ref, updatedData);
            batchCount++;
            processedCount++;

            if (onProgress) {
              onProgress({
                current: processedCount,
                total: result.totalDocuments,
                percentage: Math.round((processedCount / result.totalDocuments) * 100),
                collection: 'printers'
              });
            }

          } catch (error) {
            const errorMsg = `Error processing printer ${docSnap.id}: ${error}`;
            console.error(errorMsg);
            result.errors.push(errorMsg);
          }
        });

        if (batchCount > 0) {
          await batch.commit();
          console.log(`✅ Processed batch of ${batchCount} printers (${processedCount}/${result.totalDocuments})`);
        }

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
      }

      result.processedDocuments = processedCount;
      console.log(`✅ Printers migration completed: ${processedCount}/${result.totalDocuments} documents`);

    } catch (error) {
      const errorMsg = `Fatal error in printers migration: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Migrate Print Requests Collection
   * Restructures flat data into nested organized structure
   */
  async migratePrintRequestsCollection(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      collection: 'printRequests',
      totalDocuments: 0,
      processedDocuments: 0,
      errors: [],
      duration: 0
    };

    try {
      console.log('🔄 Starting Print Requests collection migration...');
      
      const countSnapshot = await getDocs(collection(db, 'printRequests'));
      result.totalDocuments = countSnapshot.size;
      
      if (result.totalDocuments === 0) {
        console.log('ℹ️ No print requests found to migrate');
        result.duration = Date.now() - startTime;
        return result;
      }

      let lastDoc: DocumentSnapshot | null = null;
      let processedCount = 0;

      while (processedCount < result.totalDocuments) {
        const batchQuery: Query<DocumentData> = lastDoc 
          ? query(collection(db, 'printRequests'), startAfter(lastDoc), limit(this.MAX_DOCS_PER_BATCH))
          : query(collection(db, 'printRequests'), limit(this.MAX_DOCS_PER_BATCH));

        const snapshot: QuerySnapshot<DocumentData> = await getDocs(batchQuery);
        
        if (snapshot.empty) break;

        const batch = writeBatch(db);
        let batchCount = 0;

        snapshot.forEach((docSnap: DocumentSnapshot<DocumentData>) => {
          try {
            const data = docSnap.data();
            if (!data) return; // Skip if no data

            const updatedData = {
              id: data.id || docSnap.id,
              customerId: data.customerId || '',
              customer: data.customer || {
                name: data.customerName || '',
                email: data.customerEmail || ''
              },
              providerId: data.providerId || null,
              provider: data.provider || (data.providerId ? { name: '', rating: 0 } : null),
              printerId: data.printerId || null,
              printer: data.printer || (data.printerId ? { name: '', technology: '' } : null),
              title: data.title || `Print Request ${docSnap.id.slice(-6)}`,
              description: data.description || data.requirements || '',
              requirements: {
                material: data.requirements?.material || data.material || 'PLA',
                quality: data.requirements?.quality || data.quality || 'standard',
                quantity: data.requirements?.quantity || data.quantity || 1,
                infill: data.requirements?.infill || data.infill || null,
                supportMaterial: data.requirements?.supportMaterial || data.supportMaterial || null,
                postProcessing: data.requirements?.postProcessing || data.postProcessing || []
              },
              timeline: {
                requestedDeadline: this.convertToTimestamp(data.timeline?.requestedDeadline || data.deadline),
                estimatedCompletion: this.convertToTimestamp(data.timeline?.estimatedCompletion || data.estimatedCompletion),
                actualCompletion: this.convertToTimestamp(data.timeline?.actualCompletion || data.actualCompletion)
              },
              location: {
                address: data.location?.address || data.location || '',
                coordinates: data.location?.coordinates || data.coordinates || null,
                pickup: data.location?.pickup ?? true,
                shipping: data.location?.shipping ?? false
              },
              budget: {
                maxAmount: data.budget?.maxAmount || data.budget || data.estimatedCost || 50,
                currency: data.budget?.currency || 'USD',
                includeMaterial: data.budget?.includeMaterial ?? true,
                includeShipping: data.budget?.includeShipping ?? false
              },
              files: {
                original: this.migrateFiles(data.files || []),
                processed: data.processedFiles || {}
              },
              quote: data.quote || (data.quoteAmount ? {
                amount: data.quoteAmount,
                breakdown: { material: 0, labor: data.quoteAmount, shipping: 0 },
                validUntil: null,
                acceptedAt: this.convertToTimestamp(data.acceptedAt)
              } : null),
              payment: data.payment || (data.paymentStatus ? {
                status: data.paymentStatus,
                method: data.paymentMethod || '',
                transactionId: data.transactionId || null,
                paidAt: this.convertToTimestamp(data.paidAt)
              } : null),
              status: data.status || 'pending',
              statusHistory: this.createStatusHistory(data),
              priority: data.priority || 'normal',
              tags: data.tags || [],
              createdAt: this.convertToTimestamp(data.createdAt) || Timestamp.now(),
              updatedAt: serverTimestamp()
            };

            batch.update(docSnap.ref, updatedData);
            batchCount++;
            processedCount++;

            if (onProgress) {
              onProgress({
                current: processedCount,
                total: result.totalDocuments,
                percentage: Math.round((processedCount / result.totalDocuments) * 100),
                collection: 'printRequests'
              });
            }

          } catch (error) {
            const errorMsg = `Error processing print request ${docSnap.id}: ${error}`;
            console.error(errorMsg);
            result.errors.push(errorMsg);
          }
        });

        if (batchCount > 0) {
          await batch.commit();
          console.log(`✅ Processed batch of ${batchCount} print requests (${processedCount}/${result.totalDocuments})`);
        }

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
      }

      result.processedDocuments = processedCount;
      console.log(`✅ Print Requests migration completed: ${processedCount}/${result.totalDocuments} documents`);

    } catch (error) {
      const errorMsg = `Fatal error in print requests migration: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Run complete migration for all collections
   */
  async runCompleteMigration(
    onProgress?: (collection: string, progress: MigrationProgress) => void
  ): Promise<{ [collection: string]: MigrationResult }> {
    console.log('🚀 Starting complete Firestore migration...');
    const startTime = Date.now();
    
    const results: { [collection: string]: MigrationResult } = {};

    try {
      // Migrate Users
      results.users = await this.migrateUsersCollection(
        onProgress ? (progress) => onProgress('users', progress) : undefined
      );

      // Migrate Printers
      results.printers = await this.migratePrintersCollection(
        onProgress ? (progress) => onProgress('printers', progress) : undefined
      );

      // Migrate Print Requests
      results.printRequests = await this.migratePrintRequestsCollection(
        onProgress ? (progress) => onProgress('printRequests', progress) : undefined
      );

      const totalDuration = Date.now() - startTime;
      const totalProcessed = Object.values(results).reduce((sum, result) => sum + result.processedDocuments, 0);
      const totalErrors = Object.values(results).reduce((sum, result) => sum + result.errors.length, 0);

      console.log('🎉 Complete migration finished!');
      console.log(`📊 Summary: ${totalProcessed} documents processed in ${totalDuration}ms`);
      if (totalErrors > 0) {
        console.warn(`⚠️ ${totalErrors} errors encountered`);
      }

    } catch (error) {
      console.error('💥 Fatal error in complete migration:', error);
    }

    return results;
  }

  // Helper methods
  private normalizeUserRole(role: string): 'customer' | 'provider' {
    if (!role) return 'customer';
    const normalized = role.toLowerCase().trim();
    return normalized === 'provider' || normalized === 'seller' ? 'provider' : 'customer';
  }

  private normalizePrinterTechnology(tech: string): 'fdm' | 'sla' | 'sls' | 'polyjet' {
    if (!tech) return 'fdm';
    const normalized = tech.toLowerCase().trim();
    if (['sla', 'resin'].includes(normalized)) return 'sla';
    if (['sls'].includes(normalized)) return 'sls';
    if (['polyjet'].includes(normalized)) return 'polyjet';
    return 'fdm';
  }

  private migratePrinterMaterials(materials: any): { [key: string]: any } {
    if (!materials) {
      return {
        pla: {
          name: 'PLA',
          type: 'thermoplastic',
          colors: ['black', 'white'],
          pricePerGram: 0.03,
          inStock: true
        }
      };
    }

    if (Array.isArray(materials)) {
      const result: { [key: string]: any } = {};
      materials.forEach((mat, index) => {
        const key = typeof mat === 'string' ? mat.toLowerCase() : `material_${index}`;
        result[key] = {
          name: typeof mat === 'string' ? mat : mat.name || 'Unknown',
          type: 'thermoplastic',
          colors: mat.colors || ['black'],
          pricePerGram: mat.pricePerGram || 0.03,
          inStock: mat.inStock ?? true
        };
      });
      return result;
    }

    return materials;
  }

  private migrateFiles(files: any[]): { [key: string]: any } {
    const result: { [key: string]: any } = {};
    if (!Array.isArray(files)) return result;

    files.forEach((file, index) => {
      const fileId = file.id || `file_${index}`;
      result[fileId] = {
        name: file.name || `file_${index}`,
        url: file.url || '',
        size: file.size || 0,
        type: file.type || 'application/octet-stream',
        uploadedAt: this.convertToTimestamp(file.uploadedAt) || Timestamp.now()
      };
    });

    return result;
  }

  private createStatusHistory(data: any): any[] {
    const history = [];
    
    if (data.createdAt) {
      history.push({
        timestamp: this.convertToTimestamp(data.createdAt) || Timestamp.now(),
        status: 'pending',
        actor: data.customerId || '',
        notes: 'Request created'
      });
    }

    if (data.acceptedAt && data.providerId) {
      history.push({
        timestamp: this.convertToTimestamp(data.acceptedAt),
        status: 'accepted',
        actor: data.providerId,
        notes: 'Request accepted by provider'
      });
    }

    if (data.quotedAt && data.quoteAmount) {
      history.push({
        timestamp: this.convertToTimestamp(data.quotedAt),
        status: 'quote-submitted',
        actor: data.providerId || '',
        notes: `Quote submitted: $${data.quoteAmount}`
      });
    }

    if (data.paidAt) {
      history.push({
        timestamp: this.convertToTimestamp(data.paidAt),
        status: 'paid',
        actor: data.customerId || '',
        notes: 'Payment completed'
      });
    }

    // Add migration entry
    history.push({
      timestamp: Timestamp.now(),
      status: data.status || 'pending',
      actor: 'system',
      notes: 'Migrated to new schema'
    });

    return history;
  }

  private convertToTimestamp(value: any): Timestamp | null {
    if (!value) return null;
    if (value instanceof Timestamp) return value;
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
    }
    if (value.toDate && typeof value.toDate === 'function') {
      return value;
    }
    if (value.seconds) {
      return new Timestamp(value.seconds, value.nanoseconds || 0);
    }
    return null;
  }
}

// Export singleton instance
export const devMigrationService = new FirestoreDevMigration();

// Environment check function
export const isDevEnvironment = (): boolean => {
  return process.env.NODE_ENV !== 'production' && 
         process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production';
};

// Safe migration wrapper
export const runDevMigration = async (
  migrationFn: () => Promise<any>,
  confirmationMessage: string = 'Are you sure you want to run this migration?'
): Promise<any> => {
  if (!isDevEnvironment()) {
    throw new Error('Migration can only be run in development environment');
  }

  if (typeof window !== 'undefined' && !window.confirm(confirmationMessage)) {
    throw new Error('Migration cancelled by user');
  }

  return await migrationFn();
};
