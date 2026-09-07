# CoSathi (को-साथी)
### Cooperative-Owned Household & Community Services Platform

CoSathi is a next-generation MERN platform transforming gig services into a dignified, cooperative-owned ecosystem. It introduces democratic work distribution, Gemini-driven voice job understanding, deterministic rate card reconciliation, and a dedicated worker social security and welfare pool.

---

## Architecture Overview

```
CoSathi/
├── client/                      # React 18 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI & role components
│   │   ├── context/             # AuthContext, LanguageContext, SocketContext
│   │   ├── hooks/               # Custom hooks (voice, geo)
│   │   ├── i18n/                # Hindi & English bilingual dictionary
│   │   ├── layouts/             # CustomerLayout, WorkerLayout, CooperativeLayout
│   │   ├── pages/               # /customer/*, /worker/*, /cooperative/*, /auth/*
│   │   ├── services/            # Axios API & Socket clients
│   │   └── utils/
│   ├── tailwind.config.js       # CoSathi Earth & Cooperative Theme Palette
│   └── vite.config.js
│
├── server/                      # Node.js + Express + Socket.io Backend
│   ├── src/
│   │   ├── config/              # MongoDB connection with Atlas & Memory fallback
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # JWT auth guards & error handling
│   │   ├── models/              # 22 Mongoose schemas with 2dsphere GeoJSON
│   │   ├── routes/              # Express API endpoints
│   │   ├── services/            # Matching, Gemini, Pricing, Forecasting
│   │   ├── socket/              # Real-time WebSocket server
│   │   └── utils/
│   │       └── seed.js          # Master seed script with fairness test profiles
│   └── .env.example
│
└── package.json                 # Monorepo root script runner
```

---

## 22 MongoDB Data Models

1. `User` - Base identity & credentials
2. `CustomerProfile` - Addresses, GeoJSON location point, booking stats
3. `WorkerProfile` - Skills, cooperative membership, simulated Aadhaar verification
4. `Cooperative` - Society registration, service zones, welfare pool balance
5. `ServiceCategory` - Bilingual names, inspection fees, display orders
6. `RateCardItem` - Authoritative pricing items, cooperative caps
7. `RateCardVersion` - Governed rate schedule versions
8. `Booking` - End-to-end booking state machine with GeoJSON coords
9. `BookingAssignment` - Worker offer tracking with fairness score at dispatch
10. `BookingStatusHistory` - Immutable lifecycle audit trail
11. `WorkerAvailability` - Real-time duty switch (`isOnDuty`) & dispatch state
12. `WorkerLocation` - 2dsphere geo coordinates, heading, speed
13. `WorkerPerformance` - Multi-factor metrics (7-day load, rating, fairness score)
14. `Review` - Multi-attribute rating (punctuality, quality, behavior, badges)
15. `Bill` - Reconciled line items with 5% cooperative welfare deduction
16. `Payment` - Mock UPI payment records
17. `Dispute` - Cooperative arbitration and mediation tickets
18. `WelfareRecord` - Social security contribution and relief payout ledger
19. `Transaction` - Double-entry cooperative financial transactions
20. `DemandForecast` - AI predictive booking volumes per zone
21. `Notification` - Bilingual push/in-app alert records
22. `AuditLog` - Administrative action tracking

---

## Environment Variables Configuration

### `server/.env`
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/cosathi
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
CLIENT_URL=http://localhost:5173
```
> **Note**: If `MONGO_URI` is not accessible locally, the server automatically starts an embedded in-memory MongoDB instance in development mode for zero-friction testing.

### `client/.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Quick Setup & Execution

### 1. Install Dependencies
```bash
# Install root, server, and client packages
npm run install:all
```

### 2. Seed Database
```bash
npm run seed
```
This populates:
- **1 Cooperative**: Delhi Shramik Kalyan Sahakari Samiti Ltd.
- **1 Admin**: `9811001100` / `CoSathi@2026`
- **4 Customers**: `9871000001` to `9871000004` / `CoSathi@2026`
- **12 Workers** with distinct fairness profiles:
  - `Worker A` (9810010001): 4.9 rating, 200 completed jobs, 12 recent bookings (Overloaded)
  - `Worker B` (9810010002): 4.6 rating, 90 completed jobs, 3 recent bookings (Underloaded - favored by fairness algorithm)
  - `Worker C` (9810010003): 4.8 rating, 150 completed jobs, 6 recent bookings (Balanced)
- **5 Categories & 8 Rate Card Items**
- Sample completed booking, bill, mock UPI transaction, review, and welfare deposit.

### 3. Run Development Servers
```bash
# Concurrently runs Express on :5000 and Vite on :5173
npm run dev

# Or run separately:
npm run server   # Express API + Sockets
npm run client   # React + Vite Frontend
```

---

## Testing & Verification
- **Frontend**: Open `http://localhost:5173`
- **Backend Health Check**: Open `http://localhost:5000/api/health`
