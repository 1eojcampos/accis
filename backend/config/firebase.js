import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
let serviceAccount;

try {
  // Always use relative path from the config directory
  const keyPath = join(__dirname, 'keys', 'firebase-service-account.json');
  console.log('Attempting to read service account from:', keyPath);
  
  try {
    serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
    console.log('Successfully loaded service account');
  } catch (error) {
    console.error('Error reading service account file:', error);
    throw error;
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  throw new Error('Firebase service account credentials not found');
}

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialize services
const db = getFirestore(app);
const auth = admin.auth(app);

export { auth, db, admin };
