import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Check if dist directory exists
const distPath = join(__dirname, 'dist');
console.log('Looking for dist directory at:', distPath);
console.log('Dist directory exists:', existsSync(distPath));

if (existsSync(distPath)) {
  console.log('Contents of dist directory:', readdirSync(distPath));
} else {
  console.error('Error: dist directory not found. Make sure to run "npm run build" first.');
  // Don't exit, let's see what directories exist
  console.log('Current directory contents:', readdirSync(__dirname));
}

// Serve static files from dist directory
app.use(express.static(distPath));

// Add a test route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    distExists: existsSync(distPath),
    distContents: existsSync(distPath) ? readdirSync(distPath) : []
  });
});

// Handle React routing - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  console.log('Serving request for:', req.path);
  console.log('Looking for index.html at:', indexPath);
  
  if (existsSync(indexPath)) {
    console.log('Serving index.html');
    res.sendFile(indexPath);
  } else {
    console.log('index.html not found, sending error');
    res.status(500).send(`
      <h1>Build Error</h1>
      <p>index.html not found at: ${indexPath}</p>
      <p>Dist directory exists: ${existsSync(distPath)}</p>
      <p>Current directory: ${__dirname}</p>
      <p>Directory contents: ${JSON.stringify(readdirSync(__dirname))}</p>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving files from: ${distPath}`);
  console.log(`Visit /health to check build status`);
});
