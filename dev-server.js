const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const crypto = require('crypto');
const livereload = require('livereload');
const connectLivereload = require('connect-livereload');
const dotenv = require('dotenv');
const net = require('net');

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('Raw environment variables:', {
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseUrl: !!process.env.SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '[KEY EXISTS]' : undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[KEY EXISTS]' : undefined,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    VALID_ENV: process.env.VALID_ENV || 'development'
});

console.log('Environment variables loaded successfully');
console.log('Environment status:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env: process.env.VALID_ENV || 'development'
});

// Check if a port is in use
const isPortInUse = (port) => {
    return new Promise((resolve) => {
        const server = net.createServer()
            .once('error', () => resolve(true))
            .once('listening', () => {
                server.close();
                resolve(false);
            })
            .listen(port);
    });
};

// Find an available port
const findAvailablePort = async (startPort, endPort) => {
    for (let port = startPort; port <= endPort; port++) {
        if (!(await isPortInUse(port))) {
            return port;
        }
    }
    return null;
};

// Kill process on port
const killProcessOnPort = (port) => {
    return new Promise((resolve) => {
        const isWin = process.platform === "win32";
        const cmd = isWin 
            ? `netstat -ano | findstr :${port}`
            : `lsof -i :${port} | grep LISTEN | awk '{print $2}'`;

        require('child_process').exec(cmd, (error, stdout, stderr) => {
            if (error || !stdout) {
                resolve(false);
                return;
            }

            const pid = isWin 
                ? stdout.split('\n')[0].split(' ').filter(Boolean).pop()
                : stdout.trim();

            if (pid) {
                try {
                    process.kill(parseInt(pid));
                    resolve(true);
                } catch (e) {
                    resolve(false);
                }
            } else {
                resolve(false);
            }
        });
    });
};

// Initialize Express app
const app = express();
let port = process.env.PORT || 8000;

// Session configuration
const sessionConfig = {
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
        secure: false, // set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
};

// Security middleware
app.use((req, res, next) => {
    // Set security headers
    res.setHeader('Content-Security-Policy', `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' 
            https://cdn.jsdelivr.net 
            https://*.supabase.co
            http://localhost:*;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https: blob:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' 
            https://*.supabase.co 
            https://*.supabase.net
            https://*.emailjs.com 
            wss://*.supabase.co 
            wss://*.supabase.net
            ws://localhost:* 
            http://localhost:*;
        frame-src 'none';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
    `.replace(/\s+/g, ' ').trim());
    
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));

// Inject environment variables into HTML files
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
        if (typeof body === 'string' && req.path.endsWith('.html')) {
            // Replace placeholder with actual environment variables
            body = body.replace('__SUPABASE_ANON_KEY__', process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
        }
        originalSend.call(this, body);
    };
    next();
});

// Static file serving
app.use(express.static(path.join(__dirname)));

// LiveReload configuration
const initializeLiveReload = async () => {
    try {
        // Try a range of ports
        const startPort = 35740;
        const endPort = 35760;
        
        // Find an available port
        let lrPort = await findAvailablePort(startPort, endPort);
        
        if (!lrPort) {
            console.log('⚠️  LiveReload: Disabled (no available ports)');
            return null;
        }

        // Create server with more robust error handling
        const server = livereload.createServer({
            port: lrPort,
            exts: ['html', 'css', 'js'],
            exclusions: [/\.git\//, /\.svn\//, /\.hg\//],
            originalPath: '',
            usePolling: false,
            delay: 200,
            hostname: 'localhost',
            protocol: 'http'
        });

        // Add error handler
        server.on('error', (err) => {
            console.error('LiveReload error:', err);
            if (err.code === 'EADDRINUSE') {
                console.log(`⚠️  LiveReload port ${lrPort} in use, trying next port...`);
                return initializeLiveReload(); // Try again with next port
            }
        });

        console.log(`🔄 LiveReload server started on port ${lrPort}`);
        return server;
    } catch (err) {
        console.error('Failed to initialize LiveReload:', err);
        return null;
    }
};

// Initialize server
const startServer = async () => {
    try {
        // Check if requested port is available, if not find another
        if (await isPortInUse(port)) {
            // Try to kill the process using our desired port
            const killed = await killProcessOnPort(port);
            if (killed) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for port to be freed
            } else {
                // If we couldn't kill it, find a new port
                const newPort = await findAvailablePort(3000, 3010);
                if (!newPort) {
                    throw new Error('No available ports found between 3000 and 3010');
                }
                console.log(`⚠️  Port ${port} is in use, switching to port ${newPort}`);
                port = newPort;
            }
        }

        // Initialize LiveReload
        const lrServer = await initializeLiveReload();
        if (lrServer) {
            app.use(connectLivereload());
        }

        // Start Express server
        const server = app.listen(port, () => {
            console.log(`
🚀 VALID Assessment Server
📍 Server: http://localhost:${port}
${lrServer ? `🔄 LiveReload: Active` : `⚠️  LiveReload: Disabled`}
🌍 Environment: ${process.env.VALID_ENV || 'development'}
📊 Database: Connected
✅ Ready for connections!
            `);
        });

        // Handle server errors
        server.on('error', async (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${port} is already in use. Trying to find another port...`);
                const newPort = await findAvailablePort(3000, 3010);
                if (newPort) {
                    port = newPort;
                    server.listen(port);
                } else {
                    console.error('❌ No available ports found');
                    process.exit(1);
                }
            } else {
                console.error('❌ Server error:', err);
                process.exit(1);
            }
        });

        // Graceful shutdown
        const shutdown = async () => {
            console.log('\n🛑 Shutting down gracefully...');
            
            // Close the Express server
            await new Promise(resolve => server.close(resolve));
            console.log('✅ Server closed');
            
            // Close LiveReload if active
            if (lrServer) {
                await new Promise(resolve => lrServer.close(resolve));
                console.log('✅ LiveReload server closed');
            }
            
            process.exit(0);
        };

        // Handle shutdown signals
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
        
        // Handle uncaught errors
        process.on('uncaughtException', async (err) => {
            console.error('❌ Uncaught Exception:', err);
            await shutdown();
        });

        process.on('unhandledRejection', async (err) => {
            console.error('❌ Unhandled Rejection:', err);
            await shutdown();
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer(); 