const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(cors());

// Configuration
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || "https://discordapp.com/api/webhooks/1470562638453932032/tr3ErVDxVH66ju_9Tl9fo7LYyzqgyBnMd79QEHBlHA_ZoEDuod4zReFGgnd1QtyokExb";
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "MTQ3MDU1MzI3NDI3NjExODU0OA.G7JTt7.0rt2D6X2pcWq9M1243f0Nj782Y2f33iQL83kVg";
const ADMIN_CHANNEL_ID = process.env.ADMIN_CHANNEL_ID || "1470563050712072192";

// Database setup
const db = new sqlite3.Database('./keys.db');

// Create tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS keys (
            id TEXT PRIMARY KEY,
            key_code TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            status TEXT DEFAULT 'active',
            user_id INTEGER,
            assigned_to TEXT,
            assigned_at DATETIME,
            last_used DATETIME,
            use_count INTEGER DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            key_code TEXT,
            first_verified DATETIME,
            last_verified DATETIME,
            verification_count INTEGER DEFAULT 0,
            banned INTEGER DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS admin_accounts (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Discord Logging Function
async function LogToDiscord(message, type = 'info', details = {}) {
    try {
        let color = 0x3498db; // blue
        if (type === 'success') color = 0x2ecc71; // green
        if (type === 'error') color = 0xe74c3c; // red
        if (type === 'warning') color = 0xf39c12; // orange

        const embed = {
            title: message,
            color: color,
            timestamp: new Date().toISOString(),
            fields: []
        };

        // Add details as fields
        for (const [key, value] of Object.entries(details)) {
            embed.fields.push({
                name: key,
                value: String(value),
                inline: true
            });
        }

        const payload = {
            embeds: [embed]
        };

        await axios.post(DISCORD_WEBHOOK, payload);
    } catch (err) {
        console.error('Discord logging error:', err.message);
    }
}

// Middleware for admin auth
const checkAdminAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

    const token = authHeader.split(' ')[1];
    if (token !== process.env.ADMIN_TOKEN) {
        return res.status(403).json({ error: 'Invalid admin token' });
    }
    next();
};

// ===== ADMIN ENDPOINTS =====

// Generate new key
app.post('/admin/generate-key', checkAdminAuth, (req, res) => {
    const { days_valid = 30, assigned_to = null } = req.body;
    const keyCode = generateKey();
    const expiresAt = new Date(Date.now() + days_valid * 24 * 60 * 60 * 1000).toISOString();

    db.run(
        'INSERT INTO keys (id, key_code, expires_at, assigned_to) VALUES (?, ?, ?, ?)',
        [uuidv4(), keyCode, expiresAt, assigned_to],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });

            LogToDiscord('🔑 New Key Generated', 'success', {
                'Key': keyCode,
                'Valid Days': days_valid,
                'Assigned To': assigned_to || 'Unassigned',
                'Expires': new Date(expiresAt).toLocaleString()
            });

            res.json({ 
                success: true, 
                key: keyCode, 
                expires_at: expiresAt,
                valid_for_days: days_valid
            });
        }
    );
});

// List all keys
app.get('/admin/keys', checkAdminAuth, (req, res) => {
    db.all('SELECT * FROM keys ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ keys: rows });
    });
});

// Get key details
app.get('/admin/key/:keyCode', checkAdminAuth, (req, res) => {
    db.get(
        'SELECT * FROM keys WHERE key_code = ?',
        [req.params.keyCode],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Key not found' });
            res.json({ key: row });
        }
    );
});

// Update key (assign, revoke, etc)
app.post('/admin/key/:keyCode/update', checkAdminAuth, (req, res) => {
    const { status, assigned_to, expires_at } = req.body;

    let query = 'UPDATE keys SET';
    let params = [];
    let updates = [];

    if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
    }
    if (assigned_to !== undefined) {
        updates.push('assigned_to = ?');
        params.push(assigned_to);
    }
    if (expires_at !== undefined) {
        updates.push('expires_at = ?');
        params.push(expires_at);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
    }

    query += ' ' + updates.join(', ') + ' WHERE key_code = ?';
    params.push(req.params.keyCode);

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Key not found' });

        LogToDiscord('⚙️ Key Updated', 'warning', {
            'Key': req.params.keyCode,
            'New Status': status || 'Unchanged',
            'Assigned To': assigned_to || 'Unchanged'
        });

        res.json({ success: true, message: 'Key updated' });
    });
});

// Delete key
app.delete('/admin/key/:keyCode', checkAdminAuth, (req, res) => {
    db.run('DELETE FROM keys WHERE key_code = ?', [req.params.keyCode], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Key not found' });

        LogToDiscord('🗑️ Key Deleted', 'error', {
            'Key': req.params.keyCode
        });

        res.json({ success: true, message: 'Key deleted' });
    });
});

// Revoke key
app.post('/admin/key/:keyCode/revoke', checkAdminAuth, (req, res) => {
    db.run(
        'UPDATE keys SET status = ? WHERE key_code = ?',
        ['revoked', req.params.keyCode],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Key not found' });

            LogToDiscord('⛔ Key Revoked', 'error', {
                'Key': req.params.keyCode
            });

            res.json({ success: true, message: 'Key revoked' });
        }
    );
});

// Ban user
app.post('/admin/user/:userId/ban', checkAdminAuth, (req, res) => {
    db.run(
        'UPDATE users SET banned = 1 WHERE user_id = ?',
        [req.params.userId],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });

            LogToDiscord('🚫 User Banned', 'error', {
                'User ID': req.params.userId
            });

            res.json({ success: true, message: 'User banned' });
        }
    );
});

// Get user info
app.get('/admin/user/:userId', checkAdminAuth, (req, res) => {
    db.get(
        'SELECT * FROM users WHERE user_id = ?',
        [req.params.userId],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'User not found' });
            res.json({ user: row });
        }
    );
});

// List all users
app.get('/admin/users', checkAdminAuth, (req, res) => {
    db.all('SELECT * FROM users ORDER BY first_verified DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ users: rows });
    });
});

// ===== CLIENT ENDPOINTS =====

// Verify key (used by the Lua script)
app.post('/verify-key', (req, res) => {
    const { key, userId, username } = req.body;

    if (!key || !userId) {
        return res.status(400).json({ valid: false, error: 'Missing key or userId' });
    }

    // Check if user is banned
    db.get(
        'SELECT * FROM users WHERE user_id = ? AND banned = 1',
        [userId],
        (err, bannedUser) => {
            if (bannedUser) {
                LogToDiscord('🚫 Banned User Attempted Access', 'error', {
                    'Username': username,
                    'User ID': userId,
                    'Key': key
                });
                return res.status(403).json({ valid: false, error: 'User is banned' });
            }

            // Find key
            db.get(
                'SELECT * FROM keys WHERE key_code = ?',
                [key],
                (err, keyRow) => {
                    if (err) return res.status(500).json({ valid: false, error: 'Database error' });
                    if (!keyRow) {
                        LogToDiscord('❌ Invalid Key Attempted', 'warning', {
                            'Username': username,
                            'User ID': userId,
                            'Key': key
                        });
                        return res.json({ valid: false, error: 'Invalid key' });
                    }

                    // Check if key is active
                    if (keyRow.status !== 'active') {
                        LogToDiscord('⛔ ' + keyRow.status.toUpperCase() + ' Key Used', 'warning', {
                            'Username': username,
                            'User ID': userId,
                            'Key': key,
                            'Status': keyRow.status
                        });
                        return res.json({ valid: false, error: 'Key is ' + keyRow.status });
                    }

                    // Check expiration
                    if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
                        LogToDiscord('⏰ Expired Key Used', 'warning', {
                            'Username': username,
                            'User ID': userId,
                            'Key': key,
                            'Expired At': new Date(keyRow.expires_at).toLocaleString()
                        });
                        return res.json({ valid: false, error: 'Key has expired' });
                    }

                    // Check if key is already assigned to different user
                    if (keyRow.user_id && keyRow.user_id !== userId) {
                        LogToDiscord('⚠️ Key Used By Different User', 'warning', {
                            'Current User': username,
                            'Current ID': userId,
                            'Original ID': keyRow.user_id,
                            'Key': key
                        });
                        return res.json({ valid: false, error: 'Key is already in use' });
                    }

                    // Update key with user info
                    const now = new Date().toISOString();
                    db.run(
                        'UPDATE keys SET user_id = ?, last_used = ?, use_count = use_count + 1 WHERE key_code = ?',
                        [userId, now, key],
                        (err) => {
                            if (err) return res.status(500).json({ valid: false, error: 'Database error' });

                            // Update or create user record
                            db.run(
                                `INSERT INTO users (user_id, username, key_code, first_verified, last_verified, verification_count) 
                                 VALUES (?, ?, ?, ?, ?, 1)
                                 ON CONFLICT(user_id) DO UPDATE SET 
                                 last_verified = ?, verification_count = verification_count + 1`,
                                [userId, username, key, now, now, now],
                                (err) => {
                                    if (err) return res.status(500).json({ valid: false, error: 'Database error' });

                                    LogToDiscord('✅ Key Verified Successfully', 'success', {
                                        'Username': username,
                                        'User ID': userId,
                                        'Key': key,
                                        'Expires': new Date(keyRow.expires_at).toLocaleString()
                                    });

                                    res.json({ 
                                        valid: true, 
                                        message: 'Key verified successfully',
                                        expires_at: keyRow.expires_at
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// Helper function to generate key
function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 16; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key.match(/.{1,4}/g).join('-'); // Format as XXXX-XXXX-XXXX-XXXX
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'online' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Key system running on port ${PORT}`);
});