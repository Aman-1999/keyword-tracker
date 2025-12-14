# 🚀 Keyword Tracker - SEO Ranking & Analytics Platform

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Redux](https://img.shields.io/badge/Redux-Toolkit-purple?style=flat-square&logo=redux)

A full-stack enterprise-grade SEO ranking tracker for monitoring keyword positions across 200+ countries and search engines. Built with performance, scalability, and developer experience in mind.

## 📚 Table of Contents
- [✨ Features](#-features)
- [🏗 System Architecture](#-system-architecture)
- [📂 Project Structure](#-project-structure)
- [🔐 Authentication & Security](#-authentication--security)
- [🛠 Technical Implementation](#-technical-implementation)
  - [Rank Check Workflow](#rank-check-workflow)
  - [Data Pipeline](#data-pipeline)
  - [Caching Strategy](#caching-strategy)
- [🔌 API Reference](#-api-reference)
- [💾 Database Schema](#-database-schema)
- [🚀 Getting Started](#-getting-started)

---

## ✨ Features

### Core Functionality
- **Live Search**: Real-time rank checking using DataForSEO's Live API.
- **Deep SERP Analysis**:
  - **Organic Results**: Rank, URL, Title, Snippet.
  - **AI Overviews (SGE)**: Capture and display AI-generated summaries.
  - **Featured Snippets**: "Position Zero" detection.
  - **Local Packs**: Map result tracking with ratings and addresses.
  - **Knowledge Graphs**: Entity data display.
  - **People Also Ask**: Related questions extraction.
- **Multi-Location Support**: Precise targeting by Country, State, Region, or City.
- **Advanced Filtering**: Device type (Desktop/Mobile/Tablet), OS, and Language.

### User Experience
- **Interactive Dashboard**: Recent searches, token usage, and quick actions.
- **History Management**: Comprehensive logs of all past queries with re-run capabilities.
- **Data Export**: One-click export to **JSON**, **CSV**, and **Excel**.
- **Responsive Design**: Mobile-first UI with beautiful gradients and animations.

### System & Admin
- **Role-Based Access Control (RBAC)**: Admin vs Regular User distinctions.
- **Credit System**: Token-based usage limits to control API costs.
- **Admin Dashboard**: Monitoring tools for API usage and user statistics.

---

## 🏗 System Architecture

The application follows a modern **Serverless Monolith** architecture using Next.js App Router.

```mermaid
graph TD
    Client[Client (Browser)] <-->|HTTPS/JSON| NextAPI[Next.js API Routes]
    
    subgraph "Backend Layer"
        NextAPI <-->|Auth Check| Middleware[Middleware Edge]
        NextAPI <-->|Mongoose| MongoDB[(MongoDB Database)]
        NextAPI <-->|REST| D4S[DataForSEO API]
    end
    
    subgraph "State & UI"
        Client --Redux--> Store[Redux Store]
        Store --Persist--> LocalStorage
    end
```

### Key Technologies
- **Frontend**: Next.js 15 (Server & Client Components), Lucide Icons for UI.
- **State Management**: **Redux Toolkit** for global state (Auth, User Prefs) + **React Query** (via `fetch`) for server state.
- **Backend**: Next.js Serverless Functions (`/app/api`).
- **Database**: MongoDB with Mongoose ODM for strict schema validation.
- **Auth**: Custom JWT implementation using `jose` library (Stateless).

---

## 📂 Project Structure

```bash
📦 keyword-tracker
├── 📂 app                 # Next.js App Router (Pages & API)
│   ├── 📂 admin           # Admin Dashboard pages
│   ├── 📂 api             # Backend API Routes
│   │   ├── 📂 auth        # Login/Signup endpoints
│   │   ├── 📂 check-rank  # Core ranking logic
│   │   └── 📂 locations   # Location search API
│   ├── 📂 dashboard       # User Dashboard
│   ├── 📂 history         # Search History page
│   └── 📂 results         # Result visualization pages
├── 📂 components          # Reusable React components
├── 📂 lib                 # Utilities & Configurations
│   ├── db.ts             # MongoDB Connection Helper
│   ├── jwt.ts            # Token generation/verification
│   ├── dataForSeo...ts   # 3rd Party API wrappers
│   └── exportUtils.ts    # Data export logic
├── 📂 models              # Mongoose Database Models
├── 📂 store               # Redux Store configuration
├── 📜 middleware.ts       # Edge Middleware for Route Protection
└── 📜 tailwind.config.js  # Styling configuration
```

---

## 🔐 Authentication & Security

The app uses a custom, secure **JWT-based authentication flow**.

1. **Login**: User submits credentials to `/api/auth`.
2. **Token Generation**: Server verifies user and signs a JWT containing `userId` and `role`.
3. **Cookie Storage**: The JWT is stored in an **HTTP-only**, **Secure** cookie named `token`.
4. **Middleware Protection**:
   - `middleware.ts` intercepts requests to `/dashboard` and `/admin`.
   - Verifies the `token` cookie signature.
   - Decodes payload.
   - Injects `x-user-id` and `x-user-role` headers into the request for API routes to consume.
   - Redirects unauthenticated users to `/login`.
5. **RBAC**: Admin routes verify `payload.role === 'admin'`.

---

## 🛠 Technical Implementation

### Rank Check Workflow
1. **Request**: User submits domain, keywords, and location.
2. **Validation**: API checks user's token balance (`CreditUsage` check).
3. **Execution**:
   - Backend calls `DataForSEO` Live API.
   - **Cost Optimization**: Results are cached in `MasterSERP` collection for 24 hours. If a request matches a recent cache, it is served instantly without API cost.
4. **Processing**:
   - Unique `task_id` is generated.
   - Raw SERP data is normalized.
   - Organic ranks, features, and metrics (ETV) are extracted.
5. **Storage**:
   - `SearchHistory` document created for the session.
   - `RankingResult` documents created for each keyword.
6. **Response**: Frontend receives the `historyId` and redirects to the results page.

### Caching Strategy
To save API costs, we implement a custom 2-layer cache:
1. **Frontend Cache**: React state and browser history for instant back-navigation.
2. **Database Cache**: `MasterSERP` collection stores raw API responses indexed by `keyword + location + device + language`.
   - **TTL**: 24 Hours.
   - **Hit Logic**: Before calling DataForSEO, the system queries `MasterSERP`.

---

## 🔌 API Reference

### 🛡️ Auth
- `POST /api/auth` - Login (`action: 'login'`) or Register (`action: 'signup'`).

### 🔎 Ranking
- `POST /api/check-rank/regular`
  - **Body**: `{ domain, keywords: string[], location_code, language, device, os }`
  - **Description**: Main entry point for rank checking.
- `GET /api/check-rank/results/[historyId]`
  - **Description**: Returns summary status of a search batch. Pollable for long-running tasks.
- `GET /api/result/[taskId]`
  - **Description**: Returns full SERP details for a single keyword (100 top results + features).

### 👤 User
- `GET /api/user/history` - User's search logs (Paginated).
- `GET /api/user/tokens` - Current credit balance.

### 🌍 System
- `GET /api/locations?q=London` - Search for supported locations.
- `GET /api/admin/stats` - (Admin Only) System health metrics.

---

## 💾 Database Schema

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | User Accounts | `email`, `password` (hashed), `role`, `tokens` |
| **Location** | Geo DB | `location_code`, `location_name`, `country_iso_code` |
| **SearchHistory** | Session Log | `user_id`, `domain`, `location`, `keyword_count` |
| **RankingResult** | SERP Data | `keyword`, `rank`, `url`, `history_id`, `etv` |
| **MasterSERP** | Raw Cache | `hash_key`, `full_json_response`, `created_at` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Database (Local or Atlas)
- DataForSEO API Account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd keyword-tracker
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/seo-tool
   JWT_SECRET=super_secret_random_string_at_least_32_chars
   DATAFORSEO_LOGIN=your_email@example.com
   DATAFORSEO_PASSWORD=your_api_password
   ```

4. **Seed Database (Required)**
   Populate the locations database (crucial for autocomplete):
   ```bash
   npm run populate-locations
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Access the App**
   - Frontend: `http://localhost:3000`
   - Admin: `http://localhost:3000/login` (Create an account, then manually set `role: "admin"` in MongoDB)

---

## 📝 Scripts

- `npm run dev`: Start dev server.
- `npm run build`: Build for production.
- `npm run start`: Start production server.
- `npm run populate-locations`: Import location data from `data.json` into MongoDB.

---
Built with ❤️ for SEO Professionals.
