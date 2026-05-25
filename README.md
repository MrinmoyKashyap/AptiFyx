# AptiFyx — On-Demand Local Services Marketplace

A fully-functional, production-grade cross-platform marketplace connecting customers with local service professionals in real-time.

---

## Architecture

```
AptiFyx2/
├── backend/        # Node.js + Express + Socket.io + Prisma (SQLite)
└── mobile/         # Expo React Native (iOS + Android)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo React Native + TypeScript |
| API | Node.js + Express + TypeScript |
| Real-time | Socket.io (WebSockets) |
| Database | SQLite via Prisma ORM |
| State | Zustand |
| Maps | react-native-maps |
| Auth | JWT + Phone OTP |
| Navigation | React Navigation v6 |

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The server starts on **http://localhost:3000**

> **OTP in Dev Mode**: The `/api/auth/send-otp` endpoint returns the OTP directly in the response for testing. In production, integrate an SMS gateway (e.g., Twilio, MSG91).

### 2. Mobile App

```bash
cd mobile
npm install
```

**Configure API URL** — Update `src/services/api.ts`:
- Android Emulator: `http://10.0.2.2:3000`
- iOS Simulator: `http://localhost:3000`
- Physical Device: `http://<YOUR_MACHINE_IP>:3000`

```bash
npx expo start
```

---

## User Flows

### Customer Flow
1. **Register** → Name, Phone, Address + Location detection
2. **OTP Verification** → 6-digit SMS OTP
3. **Select Service** → Plumbing, Electrician, etc.
4. **Broadcast** → Request sent to nearby providers on map
5. **Provider Accepts** → OTP appears on customer screen
6. **Call** → Provider calls to discuss job & price
7. **Share OTP** → Provider enters OTP to start job
8. **Job Completes** → Provider slides to confirm completion

### Service Provider Flow
1. **Register** → Name, Phone, Services offered, Location
2. **OTP Verification** → 6-digit SMS OTP
3. **Dashboard** → Toggle Online/Offline
4. **Incoming Request** → Alert with 30-second countdown
5. **Accept & Call** → Connected to customer via phone
6. **Complete Job** → Slide-to-confirm gesture
7. **Commission** → ₹20 per job, Pay Now or Pay Later (max 2 deferred)

---

## Real-time Events (Socket.io)

| Event | Direction | Description |
|-------|-----------|-------------|
| `customer:broadcast_job` | Client→Server | Customer broadcasts a request |
| `provider:new_job` | Server→Provider | New job notification |
| `provider:accept_job` | Client→Server | Provider accepts |
| `customer:provider_accepted` | Server→Customer | Job accepted, OTP sent |
| `provider:job_taken` | Server→All Providers | Job no longer available |
| `provider:cancel_job` | Client→Server | Provider cancels |
| `customer:provider_cancelled` | Server→Customer | Re-broadcast triggered |
| `provider:complete_job` | Client→Server | Provider marks complete |
| `customer:job_completed` | Server→Customer | Job done notification |
| `provider:update_location` | Client→Server | Location update (every 15s) |

---

## API Endpoints

### Auth
```
POST /api/auth/send-otp          { phone, role }
POST /api/auth/customer/verify-otp  { phone, otp, name?, address?, ... }
POST /api/auth/provider/verify-otp  { phone, otp, name?, services?, ... }
PUT  /api/auth/profile           { name, address, latitude, longitude }
```

### Jobs (Customer)
```
POST /api/jobs/broadcast         { serviceSlug, serviceName, latitude, longitude }
GET  /api/jobs/active
POST /api/jobs/:id/cancel
GET  /api/jobs/history
```

### Provider
```
GET  /api/providers/me
POST /api/providers/toggle-status { isOnline }
POST /api/providers/location      { latitude, longitude }
PUT  /api/providers/services      { services }
GET  /api/providers/earnings
```

### Payments
```
GET  /api/payments/pending
POST /api/payments/pay            { payAll?, commissionIds? }
POST /api/payments/pay-later
```

### Services
```
GET  /api/services
```

---

## Commission System

- AptiFyx charges **₹20 per completed job**
- Providers can defer payment up to **2 jobs**
- After 2 deferred payments, must pay before accepting more jobs
- Payments are **dummy/mock** — no real money involved

---

## Environment Variables (backend/.env)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_secret_key"
PORT=3000
COMMISSION_AMOUNT=20
MAX_UNPAID_JOBS=2
BROADCAST_RADIUS_KM=5
BROADCAST_EXPAND_SECONDS=30
BROADCAST_MAX_RADIUS_KM=20
```

---

## Services Available

🔧 Plumbing · ⚡ Electrician · 🪚 Carpentry · 🧹 Cleaning
🎨 Painting · ❄️ AC Repair · 🐛 Pest Control · 📦 Moving
🔌 Appliance Repair · 🌿 Gardening · 🔐 Security · 🛋️ Interior Design

---

## Key Features

- ✅ Phone OTP Authentication (customer & provider flows)
- ✅ Real-time job broadcasting with expanding radius (5km → 20km)
- ✅ Live map tracking with Socket.io
- ✅ Provider online/offline toggle with GPS tracking
- ✅ Job start OTP verification
- ✅ Slide-to-complete gesture for providers
- ✅ Commission ledger with Pay Now / Pay Later
- ✅ Modern, elegant UI with gradient design system
- ✅ Cross-platform (iOS + Android)

---

## Deployment Notes

For production:
1. Replace SQLite with PostgreSQL (update `DATABASE_URL`)
2. Integrate SMS gateway for real OTP delivery
3. Add Redis for pub/sub and geospatial indexing at scale
4. Deploy backend to AWS ECS/EKS or Railway
5. Configure push notifications via Expo Notifications + FCM
