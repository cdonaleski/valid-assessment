const path = require('path');
const fs = require('fs');

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL;

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  
  // Debug logging for requests
  console.log(`[${method}] ${url}`);

  // API config endpoint
  if (url === '/api/config') {
    const config = {
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      nodeEnv: NODE_ENV,
      webhookBaseUrl: WEBHOOK_BASE_URL
    };

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(config);
    return;
  }

  // Serve static files
  if (method === 'GET') {
    let filePath;
    
    if (url === '/' || url === '/index.html') {
      filePath = path.join(__dirname, '../index.html');
    } else if (url.startsWith('/js/')) {
      filePath = path.join(__dirname, '..', url);
    } else if (url.startsWith('/css/')) {
      filePath = path.join(__dirname, '..', url);
    } else if (url.match(/\.(png|jpg|jpeg|gif|svg|ico)$/i)) {
      // Handle image files
      filePath = path.join(__dirname, '..', url);
      console.log(`📷 Image request: ${url} -> ${filePath}`);
    } else {
      // Default to index.html for SPA routing
      filePath = path.join(__dirname, '../index.html');
    }

    try {
      if (fs.existsSync(filePath)) {
        // Handle binary files (images) separately
        if (filePath.match(/\.(png|jpg|jpeg|gif|svg|ico)$/i)) {
          const content = fs.readFileSync(filePath);
          
          // Set appropriate content type for images
          if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
          } else if (filePath.match(/\.(jpg|jpeg)$/i)) {
            res.setHeader('Content-Type', 'image/jpeg');
          } else if (filePath.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
          } else if (filePath.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
          } else if (filePath.endsWith('.ico')) {
            res.setHeader('Content-Type', 'image/x-icon');
          }
          
          res.status(200).send(content);
        } else {
          // Handle text files
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Set appropriate content type
          if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
          } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
          }
          
          res.status(200).send(content);
        }
      } else {
        // File not found, serve index.html
        console.log(`❌ File not found: ${filePath}`);
        const indexPath = path.join(__dirname, '../index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(indexContent);
      }
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(404).json({ error: 'Not found' });
  }
}; 