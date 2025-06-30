import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Check if dist directory exists
const distPath = join(__dirname, 'dist');
if (!existsSync(distPath)) {
  console.error('Error: dist directory not found. Make sure to run "npm run build" first.');
  process.exit(1);
}

// Serve static files from dist directory
app.use(express.static(distPath));

// Handle React routing - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('index.html not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving files from: ${distPath}`);
});
