# From Zero to Running: Folder Structure, Docker, and How Data Actually Flows

> **Series:** Building an Event Booking System with Microservices
> **Part:** 02 — Setup, Structure & the Basics of Backend
> **Blog by:** Mohsin Khan

---

In Part 1 we talked about the *why* — why microservices, why this project, what we're building, and what trade-offs come with it.

Now we actually start building.

In this part we go from an empty folder to a running MongoDB container with a proper project structure. We'll also cover two concepts you need to understand before writing a single line of backend code — the request-response cycle and how data flows through your application.

Let's go.

---

## Step 1 — Create the Folder Structure

The first thing we do is create our folders. But before we just throw folders around, let's understand *why* we're creating them the way we are.

In a microservices architecture, every service is its own independent application. It has its own server, its own port, its own database, and its own tech stack. They talk to each other through API calls — just like how your frontend talks to your backend.

So when I say "folder structure," I don't mean one project with a bunch of folders. I mean multiple completely separate Node.js projects sitting next to each other, each doing one specific job.

Here's our project root:

```
microservices/
├── user-service/         ← Independent service (Port 6001, PostgreSQL)
├── catalog-services/     ← Independent service (Port 6002, MongoDB)
└── docker-compose.yml    ← Spins up our databases
```

Each of these folders is its own Node.js project with its own `package.json`, its own `node_modules`, its own `.env`, and its own server running on a different port.

Now let's zoom into `catalog-services` — this is the service we'll build in this blog:

```
catalog-services/
├── server.js          ← Entry point. Starts the Express server
├── package.json       ← Project config and dependencies
├── .env               ← Secret config (DB URI, PORT)
│
├── config/            ← Database connection setup
├── models/            ← Mongoose schemas (shape of your data)
├── routes/            ← URL endpoints (what URLs exist)
├── controllers/       ← What happens when a URL is hit
├── services/          ← Business logic layer
├── repositories/      ← Database query layer
├── middlewares/       ← Code that runs between request and controller
├── schemas/           ← Zod validation schemas
├── errors/            ← Custom error classes
├── utils/             ← Shared helper functions
├── constants/         ← App-wide constant values
└── db/                ← (Reserved for raw DB scripts)
```

That might look like a lot. Don't worry — by the end of this series every single one of these folders will make complete sense. We'll build them one by one.

---

## Why Two Different Databases?

Before we set up anything, I want to explain one of the most important decisions in this project — why `user-service` uses **PostgreSQL** (SQL) and `catalog-services` uses **MongoDB** (NoSQL).

It comes down to the shape of the data.

### User data is structured and rigid

Every user has exactly the same fields: `id`, `email`, `password`, `role`. No user has extra fields. No user is missing fields. This is perfect for SQL — it loves structured, consistent data.

### Event data is messy and varied

Now look at what happens if you try to store different event types in a SQL table:

| id | title | type | duration | director | opening_act | keynote_speaker | is_imax |
|---|---|---|---|---|---|---|---|
| 1 | Dune 2 | movie | 166 mins | Denis V. | NULL | NULL | true |
| 2 | Taylor Swift | concert | 180 mins | NULL | Paramore | NULL | NULL |
| 3 | React Conf | tech | NULL | NULL | NULL | Dan Abramov | NULL |

Look at all those `NULL` values. A movie has a director and IMAX flag but no opening act. A concert has an opening act but no director. A tech conference has a keynote speaker but no duration.

This is inefficient and becomes a nightmare at scale. As you add more event types — comedy shows, sports, theatre — you end up with a table that has 50+ columns where 80% of every row is just `NULL`.

**MongoDB solves this.** Instead of rows and columns, MongoDB stores data as documents (think JSON objects). Each document only has the fields *it actually needs*:

```json
// A movie document
{
  "title": "Dune: Part Two",
  "type": "movie",
  "metadata": {
    "director": "Denis Villeneuve",
    "is_imax": true
  }
}

// A concert document — completely different shape, same collection
{
  "title": "Taylor Swift — Eras Tour",
  "type": "concert",
  "metadata": {
    "opening_act": "Paramore"
  }
}
```

No nulls. No wasted space. Each document only stores what it needs. That's why catalog data belongs in MongoDB.

This is one of the most important decisions in system design — choosing the right database for the right job. Not everything needs SQL. Not everything needs NoSQL. **It depends on the shape and access patterns of your data.**

---

## Step 2 — Install Docker and Spin Up MongoDB

We're going to run MongoDB inside a Docker container instead of installing it directly on your machine. Here's why that's the right call:

- **Your machine stays clean** — no leftover software, no messed up system settings
- **Everyone on the team gets the same environment** — "works on my machine" stops being an excuse
- **Easy reset** — if your database gets corrupted with bad test data, delete the container and spin up a fresh one in seconds

But first — what even is Docker?

---

### Docker Explained Simply

**The analogy: shipping containers for code.**

Before shipping containers existed, cargo was loaded onto ships piece by piece — wooden crates, loose barrels, random boxes. Every ship had to be loaded differently. Ports were chaotic.

Then in the 1950s, someone invented the standardized shipping container. Same size, same locks, same process — regardless of what's inside. Every ship, every port, every crane works with the exact same container.

Docker did the same thing for software.

**The 3 things you need to know:**

**1. The Image (The Blueprint)**
Think of it like a frozen meal kit from the supermarket. It has all the ingredients packed together — but nothing is cooking yet. The official MongoDB image is a frozen, pre-built snapshot of the database ready to be used.

**2. The Container (The Running Kitchen)**
When you take that frozen meal kit and put it in the microwave — that's a container. It's a live, running instance created from the image. You can start it, stop it, delete it, or run 5 of them at once on different ports.

**3. The Volume (The Notebook Outside the Microwave)**
A container is temporary. If you delete it, everything stored inside it disappears too. A volume is like a physical notebook sitting *outside* the microwave. Every time the database saves new data, it writes it into this notebook on your actual hard drive. So even if the container is deleted, the data survives.

---

### Installing Docker

**macOS:**
1. Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Download **Docker Desktop for Mac** (choose Apple Silicon or Intel depending on your chip)
3. Open the `.dmg` file and drag Docker to Applications
4. Open Docker from Applications — wait for the whale icon in your menu bar to stop animating
5. Verify in terminal: `docker --version`

**Windows:**
1. Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Download **Docker Desktop for Windows**
3. Run the installer — it will enable WSL 2 (Windows Subsystem for Linux) automatically
4. Restart your machine when prompted
5. Open Docker Desktop after restart
6. Verify in terminal: `docker --version`

**Linux (Ubuntu/Debian):**
```bash
# Update packages
sudo apt-get update

# Install Docker
sudo apt-get install docker-ce docker-ce-cli containerd.io

# Start Docker service
sudo systemctl start docker

# Verify
docker --version
```

---

### Spin Up MongoDB with Docker Compose

Once Docker is installed, create a file called `docker-compose.yml` at the **root of your project** (not inside any service folder) and add this:

```yaml
version: '3.8'

services:
  mongodb-catalog:
    image: mongo:6.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secretpassword
    ports:
      - "27018:27017"
    volumes:
      - mongodata:/data/db

volumes:
  mongodata:
```

**What each line does:**

- `image: mongo:6.0` → Use the official MongoDB version 6 image from Docker Hub
- `MONGO_INITDB_ROOT_USERNAME/PASSWORD` → Creates an admin user when the container first starts
- `ports: "27018:27017"` → Maps port `27017` inside the container to port `27018` on your machine. We use 27018 so it doesn't conflict if you ever install MongoDB locally
- `volumes: mongodata:/data/db` → Everything MongoDB saves goes into the `mongodata` volume on your hard drive — persistent, survives container deletion

Now run this in your terminal from the root folder:

```bash
docker compose up -d
```

- `up` → Start the containers
- `-d` → Run in the background (detached mode) so your terminal isn't blocked

To verify it's running:

```bash
docker ps
```

You should see a container named `mongodb-catalog` with status `Up`. That's your database — running, ready, no MongoDB installation required.

To stop it:
```bash
docker compose down
```

To stop AND delete all saved data (fresh start):
```bash
docker compose down -v
```

---

## Understanding the Role of Each Folder

Now let's understand *why* our `catalog-services` folder is structured the way it is. Each folder has one specific job — and that separation is intentional.

```
catalog-services/
├── server.js       The front door. Sets up Express, registers all routes,
│                   starts listening on a port.
│
├── config/         Database connection lives here. When the server starts,
│                   it reads the DB URI from .env and connects.
│
├── models/         Defines the shape of your data. A Mongoose model tells
│                   MongoDB what fields an event document should have,
│                   what types they are, and what rules apply.
│
├── routes/         Maps URLs to handlers. "If someone hits POST /api/catalog,
│                   run this function." That's all routes do.
│
├── controllers/    The traffic cop. Receives the HTTP request, calls the
│                   right service function, and sends back the response.
│                   No business logic. No direct DB calls.
│
├── services/       Business logic lives here. This is where decisions happen.
│                   "Before creating an event, check if the title already exists."
│                   Controllers call services. Services don't touch HTTP.
│
├── repositories/   The only place that talks to the database directly.
│                   Runs Mongoose queries. No business logic. Just DB operations.
│
├── middlewares/    Code that runs between the request arriving and the
│                   controller running. Validation, authentication,
│                   logging — all middleware.
│
├── schemas/        Zod validation schemas. Defines what a valid request
│                   body looks like before any business logic runs.
│
├── errors/         Custom error classes. Instead of throwing generic errors,
│                   we throw AppError with a status code attached.
│
└── utils/          Small reusable helpers. Like asyncHandler — a wrapper
                    that catches async errors so you don't write try/catch
                    in every controller.
```

The reason for this separation is a principle called **Separation of Concerns** — every piece of code has one job and one job only. Your database layer doesn't make business decisions. Your business logic doesn't know what port the server runs on. When a bug happens, you know exactly which folder to look in.

---

## The Request-Response Cycle

Before writing any code, you need to understand what actually happens when someone makes a request to your backend.

At a high level, it's simple:

**A client sends a request → Your server does something → Your server sends back a response.**

That's it. But let's make it concrete.

When someone hits `GET /api/catalog` in their browser or Postman:

```
1. Client sends HTTP request
   → Method: GET
   → URL: http://localhost:6002/api/catalog
   → Headers: Content-Type, Authorization, etc.

2. Request arrives at your Express server (server.js)
   → Express reads the URL and method
   → Finds a matching route

3. Middleware runs (if any)
   → Is this request valid? Is the user authenticated?
   → If middleware rejects → response goes back immediately
   → If middleware passes → move to next step

4. Controller runs
   → Receives the request object (req)
   → Calls the appropriate service function

5. Service runs
   → Applies business logic
   → Calls the repository

6. Repository runs
   → Queries the database
   → Returns raw data

7. Data travels back up
   Repository → Service → Controller

8. Controller sends response
   → res.status(200).json({ data: events })

9. Client receives response
   → JSON data arrives
   → Frontend renders it
```

Every backend request follows this path. Knowing this cycle is what makes the folder structure make sense — each folder maps to a step in this cycle.

---

## How Data Flows Through Our System

Let's trace a real example — a user wants to create a new event.

**Request:** `POST /api/catalog` with a JSON body containing title, type, showtimes, etc.

```
📱 Client (Postman / Frontend)
        │
        │  POST /api/catalog
        │  Body: { title, type, showtimes }
        ▼
🚪 server.js
   Express receives the request, matches it to /api/catalog router
        │
        ▼
🔍 middlewares/validateRequest.js
   Zod checks: Is the title at least 3 chars? Is the type valid?
   Are showtimes non-empty? Is startTime a valid date?
   → If invalid: return 400 Bad Request immediately
   → If valid: cleaned data is passed forward
        │
        ▼
🎮 controllers/catalogController.js
   Destructures { title, type, description, metadata, showtimes }
   Calls CreateNewEvents(eventData) from the service layer
        │
        ▼
⚙️ services/catalogService.js
   Business logic layer — currently passes through
   (In future: check for duplicate titles, validate showtimes aren't in the past)
   Calls createEvent(eventData) from the repository
        │
        ▼
🗄️ repositories/catalogRepository.js
   Calls Event.create(eventData) — Mongoose runs the DB insert
        │
        ▼
🍃 MongoDB
   Document is stored in the events collection
        │
        ▼ (data travels back up the chain)
🎮 Controller receives the new event object
   Sends: res.status(201).json({ success: true, data: newEvent })
        │
        ▼
📱 Client receives 201 Created with the event data
```

This is the data flow. Request goes down through the layers. Response comes back up. Each layer has one job. Nothing skips a layer.

---

## Step 3 — Install the Packages

Now let's get the actual code set up. Open your terminal.

### Setting up catalog-services

Navigate into the catalog-services folder and initialise a Node.js project:

```bash
cd catalog-services
npm init -y
```

This creates your `package.json`. Now install the dependencies:

```bash
# Core dependencies
npm install express mongoose dotenv zod
```

Install dev dependencies:

```bash
npm install -D nodemon
```

Open `package.json` and add the following to the `scripts` section, and set the module type:

```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js"
  }
}
```

- `"type": "module"` → Enables ES Module syntax (`import/export`) instead of the older `require()` style
- `nodemon server.js` → Auto-restarts the server every time you save a file during development

**What each package does:**

| Package | Purpose |
|---|---|
| `express` | The web framework — handles routing, middleware, HTTP |
| `mongoose` | Connects to MongoDB and lets you define data schemas |
| `dotenv` | Loads your `.env` file into `process.env` |
| `zod` | Validates request data at runtime |
| `nodemon` | Dev tool — watches for file changes and auto-restarts server |

### Setting up user-service

```bash
cd ../user-service
npm init -y
```

```bash
npm install express pg bcrypt jsonwebtoken dotenv zod
npm install -D nodemon
```

Same `package.json` changes apply:

```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js"
  }
}
```

**Extra packages for user-service:**

| Package | Purpose |
|---|---|
| `pg` | PostgreSQL client for Node.js — runs SQL queries |
| `bcrypt` | Hashes passwords before storing them — never store plain text |
| `jsonwebtoken` | Creates and verifies JWT tokens for authentication |

### Create your .env files

Inside `catalog-services/`, create a `.env` file:

```
PORT=6002
MONGO_URI=mongodb://admin:secretpassword@localhost:27018/?authSource=admin
```



> ⚠️ **Important:** Never commit `.env` files to GitHub. Add `.env` to your `.gitignore` file. These files contain passwords and secrets that should never be public.

---

## What's Coming in Part 3

Now that our structure is ready, our Docker container is running, and our packages are installed — the next blog is where we write real code.

Here's exactly what Part 3 covers:

**🍃 Understanding Mongoose**
- What an ODM (Object Document Mapper) is and why we use it
- How Mongoose sits between your Node.js code and MongoDB

**📐 Creating the Event Schema**
- Defining the shape of your event documents
- Field types, required fields, enums, nested objects
- What `timestamps: true` gives you for free

**🚀 Setting Up the Express Server**
- Writing `server.js` from scratch
- Connecting to MongoDB on startup
- Setting up the health check endpoint

**🛣️ First Real Endpoint**
- `GET /api/catalog` — fetch all events from MongoDB
- Walking through the full flow: route → controller → service → repository → DB
- Testing it with Postman

See you in Part 3. 🚀

---

*Tags: `#NodeJS` `#Microservices` `#MongoDB` `#Docker` `#Backend` `#JavaScript` `#SystemDesign` `#LearnInPublic` `#BuildInPublic` `#CSStudent` `#ExpressJS`*
