# 🎟️ Event Booking Platform — Microservices

A microservices-based event booking platform built with **Node.js** and **Express**. The system is composed of independently deployable services, each owning its own database and domain logic.

## Architecture Overview

```
┌─────────────────┐      ┌──────────────────────┐
│  User Service    │      │  Catalog Service      │
│  (Express + PG)  │      │  (Express + MongoDB)  │
│  Port 6001       │      │  Port 6002            │
└────────┬────────┘      └──────────┬───────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐      ┌──────────────────────┐
│   PostgreSQL     │      │      MongoDB          │
│   (port 5432)    │      │   (port 27018)        │
└─────────────────┘      └──────────────────────┘
```

## Tech Stack

| Layer          | Technology                            |
| -------------- | ------------------------------------- |
| Runtime        | Node.js (ES Modules)                  |
| Framework      | Express 5                             |
| User DB        | PostgreSQL 15 (via `pg`)              |
| Catalog DB     | MongoDB 6.0 (via Mongoose)            |
| Auth           | JWT (`jsonwebtoken`) + bcrypt         |
| Validation     | Zod                                   |
| Logging        | Winston + Morgan                      |
| Containerisation | Docker Compose                      |
| Dev Tooling    | Nodemon                               |

## Services

### User Service (`user-service/`)

Handles user registration, authentication, and profile management.

- **Database:** PostgreSQL
- **Port:** `6001`

**API Endpoints:**

| Method | Endpoint                | Description          | Auth Required |
| ------ | ----------------------- | -------------------- | ------------- |
| POST   | `/api/v1/auth/register` | Register a new user  | No            |
| POST   | `/api/v1/auth/login`    | Login & receive JWT  | No            |
| GET    | `/api/v1/users/me`      | Get current profile  | Yes           |

**Key Middleware:**
- `requireAuth` — JWT verification guard
- `validateRequest` — Zod schema validation
- `requestLogger` — HTTP request logging via Morgan + Winston

---

### Catalog Service (`catalog-services/`)

Manages the event catalog — creating, listing, and querying events with showtime and pricing data.

- **Database:** MongoDB
- **Port:** `6002`

**API Endpoints:**

| Method | Endpoint           | Description         | Auth Required |
| ------ | ------------------ | ------------------- | ------------- |
| GET    | `/health`          | Health check        | No            |
| GET    | `/api/v1/catalog/` | List all events     | No            |
| POST   | `/api/v1/catalog/` | Create a new event  | No            |

**Event Types:** `movie`, `concert`, `comedy_show`, `tech_conference`

**Key Middleware:**
- `correlationId` — Attaches a correlation ID to every request for tracing
- `validateRequest` — Zod schema validation
- `requestLogger` — HTTP request logging
- `errorHandler` — Centralised error handling with custom `AppError` class

## Project Structure

```
microservices/
├── docker-compose.yml          # PostgreSQL & MongoDB containers
├── user-service/
│   ├── server.js               # Express app entry point
│   ├── config/                 # Database connection (pg Pool)
│   ├── controllers/            # Route handlers (auth, user)
│   ├── middlewares/            # Auth guard, validation, logging
│   ├── repositories/           # Data access layer
│   ├── routes/                 # Express route definitions
│   ├── schemas/                # Zod validation schemas
│   ├── services/               # Business logic layer
│   ├── errors/                 # Custom error classes
│   ├── utils/                  # Logger and helpers
│   └── logs/                   # Winston log output
└── catalog-services/
    ├── server.js               # Express app entry point
    ├── config/                 # MongoDB connection (Mongoose)
    ├── controllers/            # Route handlers (catalog)
    ├── middlewares/            # Correlation ID, validation, error handling
    ├── models/                 # Mongoose schemas (Event)
    ├── repositories/           # Data access layer
    ├── routes/                 # Express route definitions
    ├── schemas/                # Zod validation schemas
    ├── constants/              # App constants
    ├── services/               # Business logic layer
    ├── errors/                 # Custom AppError class
    ├── utils/                  # Logger and helpers
    └── logs/                   # Winston log output
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) & Docker Compose

### 1. Start the databases

```bash
docker-compose up -d
```

This spins up:
- **PostgreSQL** on port `5432` (user: `admin`, db: `user_service_db`)
- **MongoDB** on port `27018` (user: `admin`)

### 2. Configure environment variables

Each service has its own `.env` file. Create them from the examples below:

**`user-service/.env`**
```env
PORT=6001
DB_USER=admin
DB_HOST=localhost
DB_NAME=user_service_db
DB_PASSWORD=secretpassword
DB_PORT=5432
JWT_SECRET=your_jwt_secret_here
```

**`catalog-services/.env`**
```env
PORT=6002
MONGO_URI=mongodb://admin:secretpassword@localhost:27018/catalog_db?authSource=admin
```

### 3. Install dependencies

```bash
# User Service
cd user-service
npm install

# Catalog Service
cd ../catalog-services
npm install
```

### 4. Run the services

Open two terminal windows:

```bash
# Terminal 1 — User Service
cd user-service
npm run dev
```

```bash
# Terminal 2 — Catalog Service
cd catalog-services
npm run dev
```

The services will start on `http://localhost:6001` and `http://localhost:6002` respectively.

## Blog

Follow along with the development journey of this project on the blog:

👉 **[https://learnbybuilding.hashnode.dev/](https://learnbybuilding.hashnode.dev/)**

## License

ISC
