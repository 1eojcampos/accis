#!/usr/bin/env node

/**
 * Standalone Firestore Migration Script
 * 
 * Usage:
 *   npm run migrate:dev
 *   npm run migrate:users
 *   npm run migrate:printers  
 *   npm run migrate:requests
 * 
 * Or run directly:
 *   node scripts/migrate-firestore.js [collection]
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { devMigrationService } from '../src/lib/firebase/dev-migration.js';

// Environment check
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Migration cannot be run in production environment');
  process.exit(1);
}

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const db = getFirestore(app);
  
  // Connect to emulator if running locally
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('🔧 Connecting to Firestore emulator...');
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
  
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  process.exit(1);
}

// Progress reporting
const reportProgress = (collection, progress) => {
  const bar = '█'.repeat(Math.floor(progress.percentage / 5)) + 
              '░'.repeat(20 - Math.floor(progress.percentage / 5));
  process.stdout.write(`\r${collection}: [${bar}] ${progress.percentage}% (${progress.current}/${progress.total})`);
};

// Main migration function
const runMigration = async (collection = 'all') => {
  console.log('🚀 Starting Firestore migration...');
  console.log(`📊 Target: ${collection}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('─'.repeat(50));

  try {
    let results;

    switch (collection.toLowerCase()) {
      case 'users':
        console.log('👥 Migrating Users collection...');
        results = { users: await devMigrationService.migrateUsersCollection(
          (progress) => reportProgress('Users', progress)
        )};
        break;

      case 'printers':
        console.log('🖨️ Migrating Printers collection...');
        results = { printers: await devMigrationService.migratePrintersCollection(
          (progress) => reportProgress('Printers', progress)
        )};
        break;

      case 'requests':
      case 'printrequests':
        console.log('📄 Migrating Print Requests collection...');
        results = { printRequests: await devMigrationService.migratePrintRequestsCollection(
          (progress) => reportProgress('Print Requests', progress)
        )};
        break;

      case 'all':
      default:
        console.log('🔄 Running complete migration...');
        results = await devMigrationService.runCompleteMigration(
          (collection, progress) => reportProgress(collection, progress)
        );
        break;
    }

    // Clear progress line
    process.stdout.write('\n');
    console.log('─'.repeat(50));

    // Report results
    console.log('📊 Migration Results:');
    Object.entries(results).forEach(([col, result]) => {
      console.log(`\n${col.toUpperCase()}:`);
      console.log(`  ✅ Processed: ${result.processedDocuments}/${result.totalDocuments} documents`);
      console.log(`  ⏱️ Duration: ${result.duration}ms`);
      
      if (result.errors.length > 0) {
        console.log(`  ❌ Errors: ${result.errors.length}`);
        result.errors.forEach((error, index) => {
          console.log(`    ${index + 1}. ${error}`);
        });
      } else {
        console.log(`  ✅ No errors`);
      }
    });

    const totalProcessed = Object.values(results).reduce((sum, result) => sum + result.processedDocuments, 0);
    const totalErrors = Object.values(results).reduce((sum, result) => sum + result.errors.length, 0);

    console.log('\n' + '═'.repeat(50));
    console.log(`🎉 Migration completed!`);
    console.log(`📈 Total documents processed: ${totalProcessed}`);
    console.log(`⚠️ Total errors: ${totalErrors}`);

    if (totalErrors === 0) {
      console.log('✅ All migrations completed successfully!');
    } else {
      console.log('⚠️ Some errors occurred. Please review the output above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const collection = args[0] || 'all';

// Confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(`⚠️ This will modify your Firestore data. Continue with ${collection} migration? (y/N): `, (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    rl.close();
    runMigration(collection);
  } else {
    console.log('❌ Migration cancelled');
    rl.close();
    process.exit(0);
  }
});
