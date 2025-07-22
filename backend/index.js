import * as functions from 'firebase-functions';
import app from './server.js';

// Initialize Firebase Functions
export const api = functions.https.onRequest(app);
