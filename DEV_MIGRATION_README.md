# 🔄 ACCIS Firestore Development Migration

This document outlines the development-only migration system for upgrading ACCIS Firestore data models to enhanced schema structures.

## ⚠️ IMPORTANT WARNINGS

- **DEVELOPMENT ONLY**: This migration system is designed exclusively for development and staging environments
- **DATA MODIFICATION**: This will permanently modify your Firestore data structure
- **BACKUP REQUIRED**: Always backup your data before running migrations
- **PRODUCTION BLOCKED**: Migration automatically blocks execution in production environments

## 🎯 Migration Overview

### What Gets Migrated

**Users Collection (`/users/{uid}`):**
- ✅ Normalize `userType` → `role` with type safety (`customer` | `provider`)
- ✅ Convert string timestamps to Firestore `Timestamp` objects
- ✅ Add structured `profile` object (avatar, phone, address with coordinates)
- ✅ Add `settings` object (notifications, darkMode, email/SMS preferences)
- ✅ Remove legacy fields and standardize data structure

**Printers Collection (`/printers/{printerId}`):**
- ✅ Structure `buildVolume` with x/y/z dimensions and units
- ✅ Convert materials array/string to detailed material objects with pricing
- ✅ Add `capabilities` (layer heights, speeds, support types, finish options)
- ✅ Enhance `location` with GeoPoint coordinates and service radius
- ✅ Add `pricing` structure (base rate, hourly, material markup, rush multiplier)
- ✅ Add `availability` tracking (status, schedule, queue length)
- ✅ Add `stats` tracking (completed jobs, rating, response time)

**Print Requests Collection (`/printRequests/{requestId}`):**
- ✅ Restructure flat data into nested objects:
  - `requirements` (material, quality, quantity, infill, supports, post-processing)
  - `timeline` (requested deadline, estimated/actual completion)
  - `location` (address, coordinates, pickup/shipping options)
  - `budget` (max amount, currency, inclusions)
  - `files` (original uploads + processed files)
  - `quote` (amount, breakdown, validity, acceptance)
  - `payment` (status, method, transaction details)
- ✅ Add `statusHistory` for complete audit trail
- ✅ Add `priority` levels and `tags` for categorization
- ✅ Denormalize customer/provider data for performance

## 🚀 Running Migrations

### Method 1: Web Interface (Recommended)

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the migration interface:**
   ```
   http://localhost:3000/dev-migration
   ```

3. **Run migrations:**
   - Click "Run Complete Migration" for all collections
   - Or run individual collection migrations with progress tracking

### Method 2: Command Line Scripts

```bash
# Run complete migration
npm run migrate:dev

# Run individual collections
npm run migrate:users
npm run migrate:printers  
npm run migrate:requests
```

### Method 3: Direct Script Execution

```bash
# Complete migration
node scripts/migrate-firestore.js all

# Individual collections
node scripts/migrate-firestore.js users
node scripts/migrate-firestore.js printers
node scripts/migrate-firestore.js requests
```

## 📋 Pre-Migration Checklist

- [ ] ✅ Verify you're in development environment (`NODE_ENV !== 'production'`)
- [ ] 💾 Backup your Firestore data (export collections)
- [ ] 🔑 Ensure Firebase authentication is working
- [ ] 🛑 Stop all running applications that write to Firestore
- [ ] 🔧 Test Firebase connection and permissions
- [ ] 📊 Note current document counts for verification

## 🔧 Environment Setup

### Required Environment Variables

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Environment Control
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development

# Optional: Firestore Emulator
FIRESTORE_EMULATOR_HOST=localhost:8080
```

### Development Dependencies

The migration system uses:
- Firebase SDK v9+ with modular imports
- TypeScript for type safety
- Batch processing for large datasets
- Progress tracking and error handling

## 📊 Migration Features

### Batch Processing
- **Batch Size**: 100 documents per batch (configurable)
- **Memory Management**: Automatic memory cleanup between batches
- **Error Handling**: Individual document error isolation
- **Progress Tracking**: Real-time progress reporting

### Data Validation
- **Type Checking**: Ensures data types match new schema
- **Required Fields**: Validates all required fields are present
- **Data Transformation**: Safely converts legacy formats
- **Fallback Values**: Provides sensible defaults for missing data

### Safety Features
- **Environment Check**: Blocks execution in production
- **User Confirmation**: Requires explicit confirmation before running
- **Error Recovery**: Continues processing if individual documents fail
- **Rollback Info**: Logs all changes for potential rollback

## 🎯 Expected Results

### Performance Improvements

**Before Migration:**
```typescript
// Inefficient client-side filtering
const requests = await getDocs(collection(db, 'printRequests'));
const filtered = requests.docs
  .map(doc => doc.data())
  .filter(req => req.location === city);
```

**After Migration:**
```typescript
// Optimized server-side queries
const q = query(
  collection(db, 'printRequests'),
  where('location.city', '==', city),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc'),
  limit(20)
);
const requests = await getDocs(q);
```

### New Capabilities

1. **Geographic Queries**: GeoPoint coordinates enable location-based searches
2. **Structured Pricing**: Detailed pricing models with material markup
3. **Status Tracking**: Complete audit trail with timestamps and actors
4. **Enhanced Filtering**: Multi-field queries with composite indexes
5. **Denormalized Data**: Improved read performance with strategic denormalization

## 🔍 Monitoring & Verification

### Migration Metrics

The migration tracks:
- **Documents Processed**: Count of successfully migrated documents
- **Processing Time**: Duration of migration operations
- **Error Count**: Number of documents that failed migration
- **Batch Performance**: Processing speed and memory usage

### Post-Migration Verification

```typescript
// Verify user role normalization
const users = await getDocs(query(collection(db, 'users'), where('role', '==', 'provider')));

// Verify printer location structure
const printers = await getDocs(query(collection(db, 'printers'), where('location.coordinates', '!=', null)));

// Verify request status history
const requests = await getDocs(query(collection(db, 'printRequests'), where('statusHistory', '!=', null)));
```

### Health Checks

1. **Data Integrity**: Verify no data loss during migration
2. **Type Consistency**: Ensure all fields match expected types
3. **Index Performance**: Test query performance with new structure
4. **Application Compatibility**: Verify app works with new schema

## 🚨 Troubleshooting

### Common Issues

**Migration Fails to Start:**
```bash
# Check Firebase authentication
firebase login
firebase projects:list

# Verify environment variables
echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID
```

**TypeScript Compilation Errors:**
```bash
# Clear Next.js cache
rm -rf .next
rm -rf node_modules/.cache

# Rebuild
npm run build
```

**Firestore Permission Errors:**
```bash
# Check Firestore rules
firebase firestore:rules:get

# Verify user permissions
firebase auth:export auth_export.json
```

**Memory Issues with Large Datasets:**
- Reduce `MAX_DOCS_PER_BATCH` in migration service
- Run migrations for individual collections separately
- Monitor Node.js memory usage during migration

### Error Recovery

If migration fails partway through:

1. **Check Error Logs**: Review detailed error messages in console/interface
2. **Verify Partial Success**: Some documents may have been migrated successfully
3. **Re-run Migration**: The migration is designed to be idempotent
4. **Manual Cleanup**: If needed, manually fix problematic documents

## 🔄 Rollback Strategy

### Before Migration
```bash
# Export current data
firebase firestore:export gs://your-bucket/backup-$(date +%Y%m%d)
```

### If Rollback Needed
```bash
# Import backup data
firebase firestore:import gs://your-bucket/backup-YYYYMMDD
```

### Selective Rollback
For individual documents, use the Firebase Console or restore specific collections from backup.

## 📚 Code Integration

### Updated Component Usage

```typescript
// Before: Legacy interface
interface OldUser {
  userType: string;
  createdAt: string;
}

// After: Enhanced interface  
interface User {
  role: 'customer' | 'provider';
  profile: {
    avatar?: string;
    address?: {
      coordinates?: GeoPoint;
    };
  };
  createdAt: Timestamp;
}
```

### Query Pattern Updates

```typescript
// Geographic printer search
const q = query(
  collection(db, 'printers'),
  where('isActive', '==', true),
  where('location.coordinates', '!=', null),
  orderBy('location.coordinates'),
  orderBy('stats.averageRating', 'desc')
);

// Request status history
const q = query(
  collection(db, 'printRequests'),
  where('customerId', '==', userId),
  orderBy('updatedAt', 'desc')
);
```

## 🛡️ Security Considerations

### Data Privacy
- Migration preserves all existing user data
- No data is transmitted outside your Firebase project
- All processing happens within your environment

### Access Control
- Migration requires Firebase Admin SDK permissions
- Development environment restriction prevents production access
- User confirmation required before execution

## 📞 Support

### Getting Help

1. **Check Console Output**: Detailed logging for all operations
2. **Review Error Messages**: Specific error details for debugging  
3. **Test with Sample Data**: Run migration on test project first
4. **Firebase Documentation**: Reference official Firestore docs

### Best Practices

- **Start Small**: Test migration with limited data first
- **Monitor Progress**: Watch for errors during execution
- **Verify Results**: Check data integrity after completion
- **Update Queries**: Modify application queries to use new schema
- **Remove Migration Code**: Clean up migration utilities before production

---

## 🎉 Post-Migration Benefits

After successful migration, your ACCIS platform will have:

✅ **Enhanced Performance** - Optimized queries with proper indexing  
✅ **Better Data Structure** - Organized, consistent data models  
✅ **Type Safety** - Full TypeScript support for all schemas  
✅ **Geographic Features** - Location-based search and filtering  
✅ **Audit Trail** - Complete status history for all requests  
✅ **Scalability** - Data structure designed for growth  
✅ **Modern Patterns** - Latest Firestore best practices implemented

Your platform is now ready for advanced features like real-time location tracking, dynamic pricing, comprehensive analytics, and enhanced user experiences! 🚀
