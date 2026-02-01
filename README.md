# SafeRoute - Disaster Response Platform

## 🚨 TRUE OFFLINE P2P (No Internet Required!)

Send SOS alerts to nearby devices **without any internet connection** - just a mobile hotspot!

---

## 📱 HOW IT WORKS

```
📱 Phone A (Hotspot)         📱 Phone B         💻 Laptop
      |                           |                  |
      +------ HOTSPOT WIFI -------+------------------+
                                  |
                         Local Relay Server
                         (runs on laptop)
                                  |
                    SOS broadcasts to ALL devices!
```

---

## 🎯 QUICK START (Hackathon Demo)

### Step 1: Start the Local Relay Server
```bash
cd "Kimi_Agent_Professional UI Enhancement/app"
node local-relay.js
```

### Step 2: Get Your Laptop's IP
```bash
ipconfig
# Look for: IPv4 Address ... 192.168.x.x
```

### Step 3: Setup Hotspot
1. **Phone A**: Turn ON Mobile Hotspot
2. **Laptop + Phone B**: Connect to that hotspot

### Step 4: Open the App
- **Laptop**: Open `http://localhost:5173` (run `npm run dev`)
- **Phone B**: Open `http://<laptop-ip>:5173`

### Step 5: Configure Relay URL (on Phone)
In browser console or app settings, set:
```javascript
localStorage.setItem('local_relay_url', 'ws://192.168.x.x:8765')
```

### Step 6: Test!
1. Tap SOS on one device
2. **Other device receives the alert!**
3. **No internet required! 🎉**

---

## 🔴 Features

| Feature | Description |
|---------|-------------|
| **ONE-TAP SOS** | Big red button |
| **True Offline P2P** | Works on hotspot only |
| **Location Sharing** | GPS works without internet |
| **Auto-Reconnect** | Reconnects if connection drops |

---

## 🛠 Development

```bash
# Install dependencies
npm install

# Run dev server (exposes on network)
npm run dev -- --host

# Run local relay (for offline P2P)
node local-relay.js

# Build for production
npm run build
```

---

## 🎤 Demo Script

1. "In a disaster, cell towers are down. No internet."
2. "But I can create a hotspot with my phone!"
3. Start local relay: `node local-relay.js`
4. Show both devices connected
5. Tap SOS → "Look, other device got the alert!"
6. "This is how disaster victims coordinate rescue!"

🏆 **Real disaster solution - no infrastructure needed!**
