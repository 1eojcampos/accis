#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const inputFile = path.join(__dirname, '../src/data/2024_Gaz_zcta_national.txt');
const outputDir = path.join(__dirname, '../functions/data');
const outputFile = path.join(outputDir, 'zipcodes.json.gz');

console.log('Processing ZIP codes from:', inputFile);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read and process the file
const data = fs.readFileSync(inputFile, 'utf8');
const lines = data.split('\n');

// Skip header row
const header = lines[0].split('\t');
console.log('Header columns:', header);

const zipCodes = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const columns = line.split('\t');
  if (columns.length < 3) continue;
  
  const zip = columns[0].trim(); // First column
  const lat = parseFloat(columns[columns.length - 2]); // Penultimate column
  const lon = parseFloat(columns[columns.length - 1]); // Last column
  
  if (zip && !isNaN(lat) && !isNaN(lon)) {
    zipCodes.push({ zip, lat, lon });
  }
}

console.log(`Processed ${zipCodes.length} ZIP codes`);

// Compress and write JSON
const jsonData = JSON.stringify(zipCodes);
const compressed = zlib.gzipSync(jsonData);

fs.writeFileSync(outputFile, compressed);

console.log(`Compressed ZIP code data written to: ${outputFile}`);
console.log(`Original size: ${jsonData.length} bytes`);
console.log(`Compressed size: ${compressed.length} bytes`);
console.log(`Compression ratio: ${Math.round((1 - compressed.length / jsonData.length) * 100)}%`);
