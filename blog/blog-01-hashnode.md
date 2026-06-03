# I'm a CS Student Building BookMyShow from Scratch to Learn Microservices — Here's the Plan

> **Series:** Building an Event Booking System with Microservices  
> **Part:** 01 — The Why, The What, and The Plan  
> **Blog by:** Mohsin Khan

---

## A Little About Me and Why I'm Writing This

I'm a 2nd year CS student who learns by building. Right now I'm deep into backend development and system design — and instead of waiting until I "know enough" to share, I'm documenting everything as I go.

My philosophy is simple:

> **The best way to learn something is to build it. The best way to understand it is to teach it.**

So this blog series is both — me building a real-world backend system, and me explaining every single decision so that you can learn alongside me. Whether you're a student like me or someone trying to finally "get" microservices, this series is for you.

Let's get into it.

---

## What We're Building

We're going to build an **Event Booking System** — think BookMyShow or Ticketmaster.

Users can:
- Browse movies, concerts, and comedy shows
- Book seats for a showtime
- Make payments
- Get booking confirmations

This is the perfect project for microservices because it has **multiple clearly separated domains** — users, catalog, bookings, payments, notifications. Each one can be its own independent service.

Here's a rough picture of what the final system looks like:

```
┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  User        │    │  Catalog        │    │  Booking         │
│  Service     │    │  Service        │    │  Service         │
│  (Auth, JWT) │    │  (Events, Shows)│    │  (Seats, Orders) │
└──────────────┘    └─────────────────┘    └──────────────────┘
       │                    │                       │
┌──────────────┐    ┌───────────────────────────────────────────┐
│  Payment     │    │  Notification Service                     │
│  Service     │    │  (Email / SMS confirmations)              │
└──────────────┘    └───────────────────────────────────────────┘
```

We're not just throwing code together. We're learning **why** each decision is made, **what trade-offs** come with it, and **how real companies** like BookMyShow, Uber, and Netflix structure their systems.

---

## The Tools We'll Use

Here's the full tech stack for this project:

| Tool | Role | Why |
|---|---|---|
| **Node.js + Express** | Building each service | Lightweight, great for REST APIs, huge ecosystem |
| **PostgreSQL** | Relational data (users, bookings, payments) | ACID compliance, structured data, great for financial records |
| **MongoDB** | Catalog data (events, showtimes) | Flexible schema, good for varied event metadata |
| **Docker + Docker Compose** | Running databases and services locally | Consistency across machines, production-like setup |
| **JWT (JSON Web Tokens)** | Authentication between user and services | Stateless auth — services don't need a shared session store |
| **Zod** | Request validation | Runtime type safety in JavaScript |
| **Mongoose** | MongoDB ODM | Schema-based modeling for MongoDB documents |
| **pg (node-postgres)** | PostgreSQL client | Direct, performant SQL queries |
| **nodemon** | Dev auto-restart | Saves time during development |

> Later in the series we'll also add things like message queues (RabbitMQ or Kafka), an API Gateway, and potentially Redis for caching. We'll introduce each when we need it — not before.

---

## First, Let's Talk: What Even Are Microservices?

Before we build anything, we need to understand what we're actually building and why.

### The Old Way: Monolithic Architecture

A **monolith** is when your entire application — user auth, product catalog, orders, payments, notifications — lives in **one single codebase and gets deployed as one single unit**.

```
┌─────────────────────────────────────────┐
│              MONOLITH APP               │
│                                         │
│  User Auth │ Catalog │ Booking │ Payment │
│                                         │
│         One Codebase. One Deploy.       │
└─────────────────────────────────────────┘
          │
          ▼
   Single Database
```

This is how almost every app starts. And honestly? **For most apps, it's totally fine.** Monoliths are simpler, faster to build, easier to debug, and perfectly good for small teams.

### The New Way: Microservices Architecture

A **microservices architecture** breaks that single app into **many small, independent services**. Each service:

- Handles **one specific domain** (users, catalog, bookings, etc.)
- Runs as its **own process** on its own port
- Has its **own database** (no shared DB between services)
- Communicates with other services via **APIs or message queues**
- Can be **deployed independently** — update one service without touching the rest

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   User       │   │   Catalog    │   │   Booking    │
│   Service    │   │   Service    │   │   Service    │
│   :6001      │   │   :6002      │   │   :6003      │
│   PostgreSQL │   │   MongoDB    │   │   PostgreSQL │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## Monolith vs Microservices — Side by Side

| | Monolith | Microservices |
|---|---|---|
| **Codebase** | Single repo, all together | Separate repo (or folder) per service |
| **Deployment** | Deploy everything at once | Deploy each service independently |
| **Scaling** | Scale the whole app | Scale only the service that needs it |
| **Database** | Usually one shared DB | Each service owns its data |
| **Team size** | Works great for small teams | Better for larger, multi-team orgs |
| **Complexity** | Low to start | Higher — more moving parts |
| **Failure** | One bug can bring down everything | One service fails, others keep running |
| **Development speed** | Fast to start | Slower to set up, faster long-term |
| **Communication** | Direct function calls | HTTP requests, message queues |
| **Tech stack** | One language/framework | Each service can use different tech |
| **Testing** | Test one thing | Need to test service contracts too |
| **Good for** | Early stage, small apps | Scale, large systems, big teams |

---

## So... Why Microservices?

Here's the real reason companies like Netflix, Uber, and Amazon moved to microservices — **scale**.

Imagine BookMyShow on a Saturday evening when a massive concert just went on sale. Thousands of users are all trying to book tickets at the exact same time. The **booking service** is getting hammered. But the **user auth service** and **catalog service** are mostly idle.

With a **monolith**, you have to scale the entire application — waste a lot of resources spinning up copies of the whole app when only one part is under pressure.

With **microservices**, you scale only the booking service. Everything else stays the same. That's efficient.

Other reasons companies adopt microservices:

- **Team autonomy** — Team A owns the Booking Service, Team B owns Payments. They don't step on each other's code.
- **Technology flexibility** — You can write your Recommendation Service in Python and your Payment Service in Java and your API in Node.js.
- **Resilience** — If the Notification Service goes down, people can still book tickets. In a monolith, one crash can kill everything.
- **Faster deployments** — Push a bug fix to just the Booking Service without redeploying the entire platform.

---

## But Wait — Microservices Aren't Free

This is the part most tutorials skip. Microservices come with serious trade-offs. Let's be honest about them.

### ⚠️ Trade-offs You Need to Know

**1. Operational Complexity**
Instead of running one app, you're running 5, 10, maybe 50. You need to manage deployments, health checks, logs, and monitoring for all of them. Tools like Docker, Kubernetes, and centralized logging (like ELK Stack) exist to help — but they add complexity.

**2. Network Latency**
When Service A needs data from Service B, it makes an HTTP call (or sends a message). That network hop takes time. In a monolith, it's just a function call — zero latency. In microservices, you're paying a network cost for every cross-service call.

**3. Data Consistency Is Hard**
In a monolith, one database = easy transactions. In microservices, each service has its own DB. If a booking is created but the payment fails, how do you roll back across two different databases? This is a genuinely hard problem (look up "distributed transactions" and "Saga pattern").

**4. Debugging Is Harder**
A bug that crosses multiple services is painful to trace. You need good logging, distributed tracing (tools like Jaeger or Zipkin), and correlation IDs across services just to follow a single request through the system.

**5. More Code to Write**
Service discovery, health checks, circuit breakers, API versioning, inter-service authentication — all of this needs to be built and maintained. You're trading simplicity for flexibility.

**6. Overkill for Small Apps**
If you're building a blog, a portfolio, or a small SaaS — microservices will slow you down and add complexity with zero benefit. Start with a monolith. Microservices are a solution to scale problems. Don't adopt them before you have those problems.

> **The rule of thumb:** Start monolith. Split when you feel pain. Don't build microservices from day one unless you're already at scale.

---

## So Why Are *We* Using Microservices?

Fair question. We're not at scale. We're students.

But here's why it still makes sense for this project:

1. **Learning > Optimizing** — The whole point is to understand how these systems work. You can't learn distributed systems by reading about them. You have to build them.

2. **BookMyShow is a real microservices system** — We're reverse-engineering a production-style architecture. Even if our scale is tiny, the patterns we learn are the same ones used at companies you want to work at.

3. **Career value** — If you can say "I built a multi-service Node.js backend with PostgreSQL, MongoDB, Docker, JWT auth, and inter-service communication" — that stands out.

4. **This is the right project** — Event booking has natural service boundaries (users, catalog, booking, payment, notifications). It maps perfectly to microservices.

---

## What You'll Learn by Building This

By the end of this series, you will understand:

- ✅ How to structure and build independent backend services with Node.js + Express
- ✅ How JWT authentication works across services
- ✅ When to use PostgreSQL vs MongoDB and why
- ✅ How to containerize databases with Docker
- ✅ The Repository Pattern and Service Layer pattern
- ✅ How services communicate via REST APIs
- ✅ How to handle errors globally and gracefully
- ✅ How to validate incoming request data with Zod
- ✅ Inter-service communication concepts
- ✅ Message queues (RabbitMQ or Kafka) — coming later
- ✅ API Gateway pattern — coming later
- ✅ How real systems like BookMyShow, Uber, and Netflix are designed

---

## What's Coming in the Next Blog

Now that you understand the **why**, the next blog is all about the **how** — and we're starting from absolute zero.

Here's exactly what we'll cover in **Part 2**:

**📁 Project Structure**
- How to organize a microservices project in a single monorepo
- What folders to create and why each one exists
- The naming conventions that make large codebases navigable

**🐳 Setting Up Docker**
- Writing your first `docker-compose.yml`
- Spinning up PostgreSQL and MongoDB as containers
- Why we use Docker instead of installing databases locally
- Understanding volumes, ports, and environment variables in Docker

**🗄️ Connecting to Databases**
- Setting up a PostgreSQL connection pool with `pg`
- Connecting to MongoDB with Mongoose
- Writing clean `db.js` config files
- The `.env` file — what goes in it and why it never goes to GitHub

**🚀 Setting Up the User Service**
- Initializing a Node.js + Express project from scratch
- Installing and configuring all dependencies
- Writing `server.js` — your first working Express server
- Understanding ES Modules (`import/export`) vs CommonJS (`require`)

**🔐 Building Authentication from Scratch**
- Creating the `users` table in PostgreSQL
- `POST /api/auth/register` — hashing passwords with `bcrypt`, storing users
- `POST /api/auth/login` — verifying passwords, generating JWT tokens
- `GET /api/users/me` — protecting routes with JWT middleware
- Writing reusable middleware: `requireAuth` and `validateRequest`
- Input validation with Zod schemas

Every single line of code will be explained. Every folder we create, you'll know why it exists.

---

## Follow Along

I'm documenting every single step of this build — every new file, every decision, every bug I hit and fix. If you want to learn backend and system design by actually building something real, follow this series.

Drop a comment if you have questions, if something didn't make sense, or if you want me to go deeper on any topic. I'm learning out loud — and I'm bringing you with me.

See you in Part 2. 🚀

---

*Tags: `#NodeJS` `#Microservices` `#SystemDesign` `#Backend` `#JavaScript` `#Docker` `#LearnInPublic` `#BuildInPublic` `#WebDevelopment` `#CSStudent`*
