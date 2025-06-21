const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static('.'));

// Handle root path
app.get('/', (req, res) => {
    fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading index.html:', err);
            return res.status(500).send('Error loading the page.');
        }

        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '__SUPABASE_ANON_KEY__';
        const modifiedHtml = data.replace(/__SUPABASE_ANON_KEY__/g, supabaseAnonKey);

        res.send(modifiedHtml);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop');
}); 