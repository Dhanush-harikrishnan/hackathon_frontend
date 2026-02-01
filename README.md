# SafeRoute - Disaster Response Platform

## 🌊 Offline Emergency SOS with P2P Transfer

Works **without internet** using peer-to-peer communication!

---

## 🚨 CROSS-DEVICE P2P DEMO (Hotspot Method)

For true cross-device SOS transfer, run the app **locally on your laptop**:

### Step 1: Find Your Laptop's IP Address
```bash
# On Windows:
ipconfig
# Look for "IPv4 Address" like: 192.168.x.x
```

### Step 2: Run the App Locally
```bash
cd "Kimi_Agent_Professional UI Enhancement/app"
npm run dev -- --host
```
This starts the server on your laptop's IP (e.g., `http://192.168.1.5:5173`)

### Step 3: Create Hotspot & Connect
1. **Phone A**: Turn ON Mobile Hotspot
2. **Laptop**: Connect to Phone A's hotspot
3. **Phone B**: Also connect to same hotspot

### Step 4: Open the App
- **On Laptop**: Open `http://localhost:5173`
- **On Phones**: Open `http://192.168.x.x:5173` (your laptop's IP)

### Step 5: Test SOS!
1. Login on all devices
2. Tap SOS on any device
3. **All other devices receive the alert!**

---

## 📱 Why This Works

```
📱 Phone A (Hotspot) ←→ 💻 Laptop (Running Server) ←→ 📱 Phone B
                              ↓
                    [Same App Server = Shared State]
                              ↓
                    [SOS broadcasts to ALL devices!]
```

The laptop acts as a local server - no internet required!

---

## 🔴 Features

| Feature | Description |
|---------|-------------|
| **ONE-TAP SOS** | Big red button at bottom |
| **Cross-Device P2P** | Works via local server |
| **Offline Ready** | No internet needed |
| **Auto Location** | GPS works offline |

---

## 🎯 Hackathon Demo Script

1. "Cell towers are down in a flood. No internet."
2. "One person creates a hotspot with their phone."
3. "I run SafeRoute on my laptop, everyone connects."
4. Show laptop IP: `npm run dev -- --host`
5. Open app on mobile via laptop's IP
6. Tap SOS → Other devices receive it!
7. "Victims can coordinate rescue without any internet!"

**🏆 Real disaster solution - no infrastructure needed!**
