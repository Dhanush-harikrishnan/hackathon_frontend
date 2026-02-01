# SafeRoute - Disaster Response Platform

## 🌊 Offline Emergency SOS with P2P Transfer

Works **without internet** using peer-to-peer communication - perfect for disasters!

---

## � REAL DISASTER SCENARIO (No WiFi Router!)

In a flood, there's no WiFi. Use **Mobile Hotspot** instead:

### How It Works:
```
📱 Phone A (Creates Hotspot) ←→ 📱 Phone B (Joins Hotspot) ←→ 💻 Laptop (Joins Hotspot)
         ↓                              ↓                           ↓
    [SafeRoute App]              [SafeRoute App]             [SafeRoute App]
         ↓                              ↓                           ↓
    [Tap SOS] ----→ P2P Transfer ----→ [Receives SOS Alert!]
```

### Step-by-Step:
1. **One person** turns ON their phone's **Mobile Hotspot** (no internet needed!)
2. **Other devices** connect to that hotspot
3. Everyone opens SafeRoute app
4. **Tap SOS → All connected devices get the alert!**

> 💡 Mobile Hotspot creates a local network - no internet required!

---

## 📱 Demo Setup (For Hackathon)

### Quick Demo:
1. Phone A: Turn on **Mobile Hotspot** (Settings → Hotspot)
2. Phone B / Laptop: Connect to Phone A's hotspot
3. Open `https://hackathon-frontend-seven-theta.vercel.app` on both
4. Login on both devices
5. **Tap SOS on one device → See alert on the other!**

---

## 🔴 Features

| Feature | Description |
|---------|-------------|
| **ONE-TAP SOS** | Big red button - no complex steps |
| **P2P Transfer** | Works via hotspot, no internet needed |
| **Offline Mode** | PWA - works without connectivity |
| **Auto Location** | GPS works without internet |
| **Phone Vibrate** | Alerts when SOS received |

---

## 🎯 Hackathon Demo Script

1. "In a flood, cell towers are down. No internet."
2. "But we can create our own network with hotspot!"
3. Turn on hotspot → Connect devices
4. Tap SOS → Other device receives it instantly
5. "This is how disaster victims can communicate!"

**🏆 This solves real-world disaster communication problems!**
