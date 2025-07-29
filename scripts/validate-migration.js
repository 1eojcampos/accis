#!/usr/bin/env node

/**
 * Firestore Migration Validation Script
 * 
 * Usage:
 *   npm run validate:migration
 *   node scripts/validate-migration.js
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit, where } from 'firebase/firestore';

// Firebase configuration
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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const validateMigration = async () => {
  console.log('🔍 Validating Firestore Migration...');
  console.log('═'.repeat(50));

  const results = {
    users: { total: 0, migrated: 0, issues: [] },
    printers: { total: 0, migrated: 0, issues: [] },
    printRequests: { total: 0, migrated: 0, issues: [] }
  };

  try {
    // Validate Users Collection
    console.log('👥 Validating Users collection...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    results.users.total = usersSnapshot.size;

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      let isMigrated = true;
      
      // Check for new schema fields
      if (!data.role || !['customer', 'provider'].includes(data.role)) {
        results.users.issues.push(`${doc.id}: Invalid or missing role field`);
        isMigrated = false;
      }
      
      if (!data.profile) {
        results.users.issues.push(`${doc.id}: Missing profile object`);
        isMigrated = false;
      }
      
      if (!data.settings) {
        results.users.issues.push(`${doc.id}: Missing settings object`);
        isMigrated = false;
      }
      
      if (data.createdAt && typeof data.createdAt === 'string') {
        results.users.issues.push(`${doc.id}: createdAt still string format`);
        isMigrated = false;
      }
      
      // Check for legacy fields that should be removed
      if (data.userType) {
        results.users.issues.push(`${doc.id}: Legacy userType field still present`);
        isMigrated = false;
      }
      
      if (isMigrated) results.users.migrated++;
    });

    // Validate Printers Collection
    console.log('🖨️ Validating Printers collection...');
    const printersSnapshot = await getDocs(collection(db, 'printers'));
    results.printers.total = printersSnapshot.size;

    printersSnapshot.forEach(doc => {
      const data = doc.data();
      let isMigrated = true;
      
      // Check for enhanced structure
      if (!data.buildVolume || typeof data.buildVolume !== 'object') {
        results.printers.issues.push(`${doc.id}: Missing or invalid buildVolume object`);
        isMigrated = false;
      }
      
      if (!data.capabilities) {
        results.printers.issues.push(`${doc.id}: Missing capabilities object`);
        isMigrated = false;
      }
      
      if (!data.location || !data.location.address) {
        results.printers.issues.push(`${doc.id}: Missing structured location`);
        isMigrated = false;
      }
      
      if (!data.pricing) {
        results.printers.issues.push(`${doc.id}: Missing pricing object`);
        isMigrated = false;
      }
      
      if (!data.availability) {
        results.printers.issues.push(`${doc.id}: Missing availability object`);
        isMigrated = false;
      }
      
      if (!data.stats) {
        results.printers.issues.push(`${doc.id}: Missing stats object`);
        isMigrated = false;
      }
      
      if (isMigrated) results.printers.migrated++;
    });

    // Validate Print Requests Collection
    console.log('📄 Validating Print Requests collection...');
    const requestsSnapshot = await getDocs(query(collection(db, 'printRequests'), limit(100)));
    results.printRequests.total = requestsSnapshot.size;

    requestsSnapshot.forEach(doc => {
      const data = doc.data();
      let isMigrated = true;
      
      // Check for nested structure
      if (!data.requirements || typeof data.requirements !== 'object') {
        results.printRequests.issues.push(`${doc.id}: Missing requirements object`);
        isMigrated = false;
      }
      
      if (!data.timeline || typeof data.timeline !== 'object') {
        results.printRequests.issues.push(`${doc.id}: Missing timeline object`);
        isMigrated = false;
      }
      
      if (!data.location || typeof data.location !== 'object') {
        results.printRequests.issues.push(`${doc.id}: Missing structured location`);
        isMigrated = false;
      }
      
      if (!data.budget || typeof data.budget !== 'object') {
        results.printRequests.issues.push(`${doc.id}: Missing budget object`);
        isMigrated = false;
      }
      
      if (!data.files || typeof data.files !== 'object') {
        results.printRequests.issues.push(`${doc.id}: Missing files object`);
        isMigrated = false;
      }
      
      if (!Array.isArray(data.statusHistory)) {
        results.printRequests.issues.push(`${doc.id}: Missing statusHistory array`);
        isMigrated = false;
      }
      
      if (isMigrated) results.printRequests.migrated++;
    });

    // Report Results
    console.log('\n📊 Validation Results:');
    console.log('═'.repeat(50));

    Object.entries(results).forEach(([collection, result]) => {
      const migrationPercentage = result.total > 0 ? ((result.migrated / result.total) * 100).toFixed(1) : '0';
      const status = result.migrated === result.total ? '✅' : '⚠️';
      
      console.log(`\n${status} ${collection.toUpperCase()}:`);
      console.log(`   Total Documents: ${result.total}`);
      console.log(`   Migrated: ${result.migrated} (${migrationPercentage}%)`);
      console.log(`   Issues: ${result.issues.length}`);
      
      if (result.issues.length > 0) {
        console.log('   Issues Details:');
        result.issues.slice(0, 5).forEach(issue => {
          console.log(`     • ${issue}`);
        });
        if (result.issues.length > 5) {
          console.log(`     ... and ${result.issues.length - 5} more issues`);
        }
      }
    });

    // Overall Summary
    const totalDocs = Object.values(results).reduce((sum, r) => sum + r.total, 0);
    const totalMigrated = Object.values(results).reduce((sum, r) => sum + r.migrated, 0);
    const totalIssues = Object.values(results).reduce((sum, r) => sum + r.issues.length, 0);
    const overallPercentage = totalDocs > 0 ? ((totalMigrated / totalDocs) * 100).toFixed(1) : '0';

    console.log('\n' + '═'.repeat(50));
    console.log('🎯 OVERALL MIGRATION STATUS:');
    console.log(`   Total Documents: ${totalDocs}`);
    console.log(`   Successfully Migrated: ${totalMigrated} (${overallPercentage}%)`);
    console.log(`   Total Issues: ${totalIssues}`);

    if (totalIssues === 0) {
      console.log('\n🎉 ✅ All documents successfully migrated!');
      console.log('   Your ACCIS platform is ready with the enhanced schema.');
    } else {
      console.log('\n⚠️ Some documents need attention.');
      console.log('   Consider re-running the migration for affected collections.');
    }

    // Recommendations
    console.log('\n📋 Next Steps:');
    if (totalIssues === 0) {
      console.log('   1. ✅ Test your application with the new schema');
      console.log('   2. ✅ Update any hardcoded queries to use new field names');
      console.log('   3. ✅ Deploy updated security rules and indexes');
      console.log('   4. ✅ Remove migration code before production deployment');
    } else {
      console.log('   1. ⚠️ Review and fix the issues listed above');
      console.log('   2. ⚠️ Re-run migration for collections with issues');
      console.log('   3. ⚠️ Validate again before proceeding');
    }

  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  }
};

// Run validation
validateMigration();
