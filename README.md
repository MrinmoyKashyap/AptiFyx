# AptiFyx — On-Demand Local Services Marketplace

A cross-platform on-demand local services marketplace that connects customers with nearby service professionals in real-time.

## 🏗️ Architecture

AptiFyx follows a **modular microservices** architecture with separate frontend and backend codebases:

```
AptiFyx/
├── backend/          # Node.js/TypeScript API server (Express + Socket.IO)
│   ├── src/
│   │   ├── config/       # Database connections, env config
│   │   ├── events/       # Redis Pub/Sub event bus
│   │   ├── middleware/   # Auth, RBAC, validation, error handling
│   │   ├── modules/      # Domain microservices
│   │   │   ├── identity/ # User auth, profiles, partner registration
│   │   │   ├── location/ # Geospatial matchmaking engine
│   │   │   ├── order/    # Job lifecycle state machine
│   │   │   ├── ledger/   # Simulated wallet & escrow (atomic transactions)
│   │   │   └── chat/     # In-app messaging
│   │   ├── sockets/      # WebSocket handlers (jobs, chat, tracking)
│   │   └── utils/        # Logger, API response helpers
│   └── supabase/         # SQL migrations & seed data
│
├── frontend/         # React Native (Expo) mobile app
│   ├── app/              # Expo Router file-based routing
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API client layer
│   └── store/            # Zustand state management
│
└── packages/         # Shared packages
    └── shared-types/     # TypeScript interfaces & enums
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native (Expo) with TypeScript |
| Backend | Node.js + Express + Socket.IO |
| Auth | JWT (bcrypt + jsonwebtoken) |
| PostgreSQL | Users, wallets, transactions (ACID) |
| MongoDB | Jobs, chat messages (flexible docs) |
| Redis | Geospatial index (GEOSEARCH) + Pub/Sub event bus |
| DevOps | Docker Compose (local dev) |

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)

### Backend Setup

```bash
# Start infrastructure (Postgres, MongoDB, Redis)
docker-compose up -d

# Install dependencies & start server
cd backend
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npx expo start
```

## 💡 Key Features

- **Dual Mode**: Seamlessly switch between Customer and Partner modes
- **Real-Time Matchmaking**: Geospatial partner discovery with expanding radius
- **Live Tracking**: Real-time partner location on map via WebSocket
- **Simulated Economy**: Virtual wallet with atomic escrow transactions
- **In-App Chat**: Real-time messaging tied to job lifecycle
- **Reputation System**: Rating-based partner prioritization

## 📄 License

MIT
