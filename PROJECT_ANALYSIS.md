# Project Analysis

This project is a microservices-based application consisting of two primary Node.js/Express services: `catalog-services` and `user-service`. It utilizes Docker Compose to orchestrate and manage its databases (PostgreSQL and MongoDB).

## Architecture Overview

- **User Service:** Handles user authentication, registration, and profile management using a PostgreSQL database. It runs on port `6001`.
- **Catalog Service:** Manages event catalogs, allowing the creation and retrieval of events using a MongoDB database. It runs on port `6002`.

---

## 1. Root Directory

### `docker-compose.yml`
Defines the infrastructure dependencies for the microservices.
- **`postgres-user-db`**: Runs a PostgreSQL database (`postgres:15-alpine`) on port `5432` for the User Service. Initializes a database named `user_service_db`.
- **`mongodb-catalog`**: Runs a MongoDB database (`mongo:6.0`) on port `27018` for the Catalog Service.

---

## 2. User Service (`/user-service`)

A Node.js Express application responsible for secure user authentication and profile fetching.

### Dependencies
- `express` (web framework)
- `bcrypt` (password hashing)
- `jsonwebtoken` (JWT authentication)
- `pg` (PostgreSQL client)
- `zod` (schema validation)

### Entry Point
- **`server.js`**: Initializes the Express app, configures JSON parsing, mounts routes at `/api/auth` and `/api/users`, and starts the server on port `6001`.

### Controllers (`/controllers`)
- **`authController.js`**:
  - `registerUser`: Validates if a user already exists, hashes the password using `bcrypt`, and inserts the new user into the PostgreSQL database. Returns the newly created user details.
  - `loginUser`: Verifies user credentials, compares passwords using `bcrypt`, and returns a JWT token along with user details upon successful authentication.
- **`userController.js`**:
  - `getProfile`: Retrieves the user's profile details from the database using the user ID extracted from the authenticated JWT token.

### Routes (`/routes`)
- **`authRoutes.js`**: Maps endpoints for `/register` and `/login` to `authController.js`.
- **`userRoutes.js`**: Maps endpoints for user-related actions to `userController.js`.

### Middlewares (`/middlewares`)
- **`requireAuth.js`**: Intercepts protected requests, extracts the JWT token from the `Authorization` header, verifies its authenticity, and attaches the decoded user payload to `req.user`.
- **`validateRequest.js`**: A generic middleware factory that uses a provided Zod schema to parse and validate incoming `req.body` data, failing the request early if constraints are not met.

### Schemas (`/schemas`)
- **`authSchema.js`**: Defines Zod validation schemas:
  - `registerSchema`: Validates email format, enforces password constraints (minimum length, uppercase, special character), and optionally validates the user `role`.
  - `loginSchema`: Validates the presence of email and password.

### Configuration (`/config`)
- **`db.js`**: Sets up the PostgreSQL database connection pool.

---

## 3. Catalog Service (`/catalog-services`)

A Node.js Express application handling event listings, such as movies, concerts, and tech conferences.

### Dependencies
- `express` (web framework)
- `mongoose` (MongoDB Object Data Modeling)

### Entry Point
- **`server.js`**: Initializes the Express app, mounts a simple health check endpoint (`/health`), mounts catalog routes at `/api/catalog`, connects to the database, and starts the server on port `6002`.

### Controllers (`/controllers`)
- **`catalogController.js`**:
  - `getEvents`: Fetches and returns all available events from the MongoDB database using the `Event` model.
  - `handleCreateEvents`: Creates a new event document using data from `req.body` (title, type, description, metadata, showtimes) and saves it to the database.

### Models (`/models`)
- **`event.js`**: Defines the Mongoose schema for an Event. It includes strict typing for:
  - `title` (String, required)
  - `type` (Enum: "movie", "concert", "comedy_show", "tech_confrence", required)
  - `description` (String)
  - `metadata` (Mixed object type)
  - `showtimes` (Array containing objects with `startTime`, `availableSeats`, and `price`).

### Routes (`/routes`)
- **`catalogRoutes.js`**: Maps endpoints for fetching and creating events to `catalogController.js`.

### Configuration (`/config`)
- **`db.js`**: Handles the connection to the MongoDB database.

### Schemas (`/schemas`)
- Currently an empty directory, presumably intended for future request validation schemas.
