import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import KDBush from 'kdbush';
import { around } from 'geokdbush';
import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';
import { join } from 'path';
// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
// Load and decompress ZIP code data on cold start
const compressedData = readFileSync(join(process.cwd(), 'data/zipcodes.json.gz'));
const jsonData = gunzipSync(compressedData).toString();
const zipCodes = JSON.parse(jsonData);
console.log(`Loaded ${zipCodes.length} ZIP codes`);
// Build KD-tree spatial index
const index = new KDBush(zipCodes.length);
for (let i = 0; i < zipCodes.length; i++) {
    const zip = zipCodes[i];
    if (zip) {
        index.add(zip.lon, zip.lat);
    }
}
index.finish();
console.log('Built KD-tree spatial index');
// Haversine distance calculation
function calculateDistance(point1, point2) {
    const R = 3959; // Earth's radius in miles
    const dLat = toRadians(point2.lat - point1.lat);
    const dLon = toRadians(point2.lon - point1.lon);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
// Find nearby ZIP codes by coordinates
export const findNearbyZipsByCoords = functions.https.onCall(async (data) => {
    const { lat, lon, radius } = data;
    if (typeof lat !== 'number' || typeof lon !== 'number' || typeof radius !== 'number') {
        throw new Error('Invalid input parameters');
    }
    const queryPoint = { lat, lon };
    // Use geokdbush to find nearby points
    const nearbyIndices = around(index, lon, lat, Infinity, radius * 1.60934);
    // Get ZIP codes within exact radius
    const nearbyZips = nearbyIndices
        .map((idx) => {
        const zipCode = zipCodes[idx];
        if (!zipCode)
            return null;
        const distance = calculateDistance(queryPoint, { lat: zipCode.lat, lon: zipCode.lon });
        return distance <= radius ? zipCode.zip : null;
    })
        .filter((zip) => zip !== null);
    if (nearbyZips.length === 0) {
        return [];
    }
    // Query Firestore for printers in nearby ZIP codes
    const printersSnapshot = await db.collection('printers')
        .where('zip', 'in', nearbyZips.slice(0, 10))
        .get();
    const printersWithDistance = [];
    for (const doc of printersSnapshot.docs) {
        const printer = doc.data();
        const printerZip = zipCodes.find(z => z.zip === printer.zip);
        if (printerZip) {
            const distance = calculateDistance(queryPoint, { lat: printerZip.lat, lon: printerZip.lon });
            printersWithDistance.push({ id: doc.id, distance, ...printer });
        }
    }
    return printersWithDistance.sort((a, b) => a.distance - b.distance);
});
// Find nearby ZIP codes by ZIP code
export const findNearbyZips = functions.https.onCall(async (data) => {
    const { zip, radius } = data;
    if (typeof zip !== 'string' || typeof radius !== 'number') {
        throw new Error('Invalid input parameters');
    }
    const sourceZip = zipCodes.find(z => z.zip === zip);
    if (!sourceZip) {
        throw new Error(`ZIP code ${zip} not found`);
    }
    const queryPoint = { lat: sourceZip.lat, lon: sourceZip.lon };
    // Use geokdbush to find nearby points
    const nearbyIndices = around(index, sourceZip.lon, sourceZip.lat, Infinity, radius * 1.60934);
    // Get ZIP codes within exact radius
    const nearbyZips = nearbyIndices
        .map((idx) => {
        const zipCode = zipCodes[idx];
        if (!zipCode)
            return null;
        const distance = calculateDistance(queryPoint, { lat: zipCode.lat, lon: zipCode.lon });
        return distance <= radius ? zipCode.zip : null;
    })
        .filter((zip) => zip !== null);
    if (nearbyZips.length === 0) {
        return [];
    }
    // Query Firestore for printers in nearby ZIP codes
    const printersSnapshot = await db.collection('printers')
        .where('zip', 'in', nearbyZips.slice(0, 10))
        .get();
    const printersWithDistance = [];
    for (const doc of printersSnapshot.docs) {
        const printer = doc.data();
        const printerZip = zipCodes.find(z => z.zip === printer.zip);
        if (printerZip) {
            const distance = calculateDistance(queryPoint, { lat: printerZip.lat, lon: printerZip.lon });
            printersWithDistance.push({ id: doc.id, distance, ...printer });
        }
    }
    return printersWithDistance.sort((a, b) => a.distance - b.distance);
});
//# sourceMappingURL=index.js.map