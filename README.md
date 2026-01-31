# SafeRoute - Disaster Response Platform

## 🌊 Offline Emergency SOS with P2P Transfer

A disaster-resilient web app that works **without internet** using peer-to-peer communication.

---

## 📱 How to Connect Mobile for Demo

### Step 1: Get Your Vercel URL
Your app is deployed at: `https://hackathon-frontend-seven-theta.vercel.app`

### Step 2: Open on Mobile
1. Connect your **laptop AND phone to the SAME WiFi**
2. On your phone browser, open the Vercel URL
3. Login with your account

### Step 3: Test P2P SOS Transfer
1. **Turn OFF mobile data** on your phone (keep WiFi on)
2. On phone: You'll see "📡 P2P Mode" and orange offline banner
3. On phone: **Tap the big red SOS button** at bottom
4. On laptop: **See the SOS alert appear!**

---

## 🔴 Features

| Feature | Description |
|---------|-------------|
| **ONE-TAP SOS** | Big red button - no complex steps |
| **P2P Transfer** | SOS goes directly to nearby devices |
| **Offline Mode** | Works without internet (PWA) |
| **Auto Location** | Grabs GPS in 3 seconds |
| **Phone Vibrate** | Alerts when SOS received |

---

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

---

## 📡 How P2P Works

```
Phone (Offline) ---> WiFi ---> Laptop (Online) ---> Backend Server
      |                              |
      |--- BroadcastChannel ---------|
```

All devices on the same network automatically discover each other!

---

## 🎯 Hackathon Demo Script

1. Show app working online (shelters load)
2. Turn off internet → Offline banner appears
3. Show shelters still display (cached)
4. Tap SOS → Broadcasts to other device
5. Turn internet back on → Data syncs

**Perfect for disaster scenarios where cell towers are down!**
