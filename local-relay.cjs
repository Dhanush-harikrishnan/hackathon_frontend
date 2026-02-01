// local-relay.cjs - Simple SOS relay server for offline P2P
// Run this on your laptop when on a hotspot for true offline P2P
// Usage: node local-relay.cjs

const http = require('http');
const WebSocket = require('ws');

const PORT = 8765;
const clients = new Set();
const sosMessages = [];

// Create HTTP server for health check
const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', clients: clients.size, sos_count: sosMessages.length }));
        return;
    }

    if (req.url === '/sos' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sosMessages));
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

// Create WebSocket server for real-time relay
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`📱 Device connected! Total: ${clients.size}`);

    // Send existing SOS messages to new client
    if (sosMessages.length > 0) {
        ws.send(JSON.stringify({ type: 'SOS_HISTORY', messages: sosMessages }));
    }

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());

            if (message.type === 'SOS') {
                console.log('🚨 SOS RECEIVED:', message.data);

                // Store the SOS
                sosMessages.push(message.data);

                // Relay to ALL other connected devices
                clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'SOS_BROADCAST', data: message.data }));
                    }
                });
            }
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log(`📱 Device disconnected. Total: ${clients.size}`);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║          🚨 SafeRoute OFFLINE P2P Relay Server               ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  📡 WebSocket:  ws://localhost:${PORT}                          ║`);
    console.log(`║  🌐 HTTP:       http://localhost:${PORT}/health                 ║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  HOW TO USE:                                                 ║');
    console.log('║  1. Turn ON your Mobile Hotspot                              ║');
    console.log('║  2. Connect laptop + other devices to hotspot                ║');
    console.log('║  3. Run: ipconfig (find your laptop IP)                      ║');
    console.log('║  4. Other devices connect to ws://<laptop-ip>:8765           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Waiting for devices to connect...');
});
