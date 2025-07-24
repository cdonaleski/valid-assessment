/**
 * Mobile VALID Assessment Server
 * Simple Express server for serving the standalone mobile assessment
 */

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const path = require('path');
const routes = require('./api/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://cdnjs.cloudflare.com",
                "https://use.fontawesome.com",
                "https://fonts.googleapis.com"
            ],
            fontSrc: [
                "'self'", 
                "https://cdnjs.cloudflare.com",
                "https://use.fontawesome.com",
                "https://fonts.gstatic.com"
            ],
            connectSrc: ["'self'", "https://*.supabase.co"]
        }
    }
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// **SECURE CONFIGURATION ENDPOINT**
app.get('/api/config', (req, res) => {
    console.log('🔒 Configuration requested');
    
    // Only serve public configuration - never expose sensitive keys
    const config = {
        supabaseUrl: process.env.SUPABASE_URL,
        // Note: We provide the anon key here as it's meant to be public
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        webhookBaseUrl: process.env.WEBHOOK_BASE_URL || `http://localhost:${PORT}`,
        environment: process.env.NODE_ENV || 'development'
    };

    // Validate that required configuration is present
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
        console.error('❌ Missing required environment variables');
        return res.status(500).json({
            error: 'Server configuration error',
            message: 'Required environment variables not set'
        });
    }

    console.log('✅ Configuration served successfully');
    res.json(config);
});

// API routes
app.use('/api', routes);

// Serve main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Mobile VALID Assessment Server`);
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${process.env.SUPABASE_URL ? 'Configured' : 'Not configured'}`);
    console.log(`🔒 API Config Endpoint: http://localhost:${PORT}/api/config`);
    console.log(`✅ Ready for connections!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Shutting down gracefully...');
    process.exit(0);
}); 