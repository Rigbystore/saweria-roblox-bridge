const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ambil dari environment variables
const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const UNIVERSE_ID = process.env.UNIVERSE_ID;
const TOPIC_NAME = "SaweriaDonation";

console.log('🚀 Starting Saweria to Roblox Bridge...');
console.log('📍 Universe ID:', UNIVERSE_ID);
console.log('🔑 API Key:', ROBLOX_API_KEY ? 'Configured ✅' : 'Missing ❌');

// Endpoint untuk menerima webhook Saweria
app.post('/saweria-webhook', async (req, res) => {
    try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📩 Webhook received at:', new Date().toISOString());
        console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
        console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
        
        const donation = req.body;
        
        // Format data untuk Roblox
        const notifData = {
            donor_name: donation.donator_name || donation.donor_name || donation.name || "Anonymous",
            amount: parseInt(donation.amount) || parseInt(donation.total) || 0,
            message: donation.message || donation.comment || donation.note || "",
            timestamp: Date.now(),
            donation_id: donation.id || ""
        };
        
        console.log('📤 Formatted data for Roblox:', JSON.stringify(notifData, null, 2));
        
        if (!ROBLOX_API_KEY || !UNIVERSE_ID) {
            throw new Error('Missing ROBLOX_API_KEY or UNIVERSE_ID in environment variables');
        }
        
        // Kirim ke Roblox MessagingService
        const robloxUrl = `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/${TOPIC_NAME}`;
        console.log('🎯 Sending to:', robloxUrl);
        
        const response = await axios.post(
            robloxUrl,
            {
                message: JSON.stringify(notifData)
            },
            {
                headers: {
                    'x-api-key': ROBLOX_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Successfully sent to Roblox!');
        console.log('📊 Roblox response:', response.status, response.statusText);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        res.status(200).json({ 
            success: true, 
            message: 'Donation processed and sent to Roblox',
            data: notifData
        });
        
    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ERROR:', error.message);
        if (error.response) {
            console.error('📛 Response status:', error.response.status);
            console.error('📛 Response data:', JSON.stringify(error.response.data, null, 2));
        }
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: error.response?.data
        });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.send(`
        <h1>🎮 Saweria to Roblox Bridge</h1>
        <p>Status: <strong style="color: green;">Running</strong></p>
        <p>Universe ID: <strong>${UNIVERSE_ID || 'Not configured'}</strong></p>
        <p>API Key: <strong>${ROBLOX_API_KEY ? '✅ Configured' : '❌ Missing'}</strong></p>
        <hr>
        <p>Webhook endpoint: <code>POST /saweria-webhook</code></p>
    `);
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        universe_id: UNIVERSE_ID,
        api_key_configured: !!ROBLOX_API_KEY
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Webhook endpoint: http://localhost:${PORT}/saweria-webhook`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
