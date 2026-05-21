# AptiFyx 🚀

AptiFyx is a cross-platform On-Demand Local Services Marketplace.

## 🛠️ Tech Stack
- **Monorepo**: TurboRepo / npm workspaces
- **Frontend**: React Native (Expo), Zustand, Socket.IO Client, Tailwind (Simulated UI constants)
- **Backend**: Node.js, Express, Socket.IO
- **Databases**: PostgreSQL (Auth/Ledger), MongoDB (Order/Chat), Redis (PubSub/Geo Location)

## 📁 Repository Structure
\`\`\`
.
├── backend/            # Express Microservices & Sockets
│   ├── src/modules/    # Domain Logic (Identity, Location, Order, Ledger, Chat)
│   └── supabase/       # PostgreSQL Migrations & Seeding
├── frontend/           # Expo React Native App
│   ├── app/            # Expo Router (Auth/Customer/Partner Flows)
│   ├── components/     # UI Component Library
│   ├── services/       # Axios & Socket endpoints
│   └── store/          # Zustand State Management
└── packages/           # Shared Code
    └── shared-types/   # TypeScript Data Models
\`\`\`

## 🚀 Getting Started

### Start the Databases
Make sure Docker is running on your machine.
\`\`\`bash
docker-compose up -d
\`\`\`
*(This automatically boots Postgres, Mongo, Redis, and runs the SQL Seed Scripts!)*

### Start the Backend
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

### Start the Mobile App
\`\`\`bash
cd frontend
npm install
npx expo start
\`\`\`
*(Scan the QR code with Expo Go, or type `a` / `i` to launch an emulator)*

## 🔑 Demo Accounts
The database is automatically seeded with users for testing the App Mode switching:
- **Customer**: `customer1@aptifyx.test` (password: `password123`)
- **Partner**: `partner1@aptifyx.test` (password: `password123`)
