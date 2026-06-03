# 🏗️ Backend Engineering — Deep Dive Notes
### Microservices-Based Event Booking System

> **Purpose:** These notes go beyond surface-level explanations. Every section answers *why* a decision was made, *what problem* it solves, *how* it works in practice, and *what happens if* you skip it.

---

## Table of Contents

1. [Introduction & Mental Model](#introduction--mental-model)
2. [Layered Architecture](#1-layered-architecture)
3. [Async Wrapper](#2-async-wrapper)
4. [Global Error Handling](#3-global-error-handling)
5. [Custom Error Class (AppError)](#4-custom-error-class-apperror)
6. [Validation Architecture](#5-validation-architecture)
7. [Zod Schema Validation](#6-zod-schema-validation)
8. [Validation Middleware](#7-validation-middleware)
9. [Generic Request Validation](#8-generic-request-validation)
10. [Error Normalization](#9-error-normalization)
11. [Schema Composition](#10-schema-composition)
12. [Schema Derivation & Partial Updates](#11-schema-derivation--partial-updates)
13. [Domain Layer vs Transport Layer](#12-domain-layer-vs-transport-layer)
14. [Request Sanitization](#13-request-sanitization)
15. [Validation Transformations](#14-validation-transformations)
16. [Business Validation vs Schema Validation](#15-business-validation-vs-schema-validation)
17. [API Response Standardization](#16-api-response-standardization)
18. [ApiResponse Utility](#17-apiresponse-utility)
19. [Response Metadata](#18-response-metadata)
20. [Pagination Architecture](#19-pagination-architecture)
21. [Current Architecture Summary](#current-backend-architecture)
22. [Core Principles Learned](#core-principle)

---

## Introduction & Mental Model

Before writing a single line of code, it's important to understand **what backend engineering actually is**.

Most beginners think backend engineering means:
- Writing routes
- Querying a database
- Returning JSON

That's just **syntax**. Real backend engineering is about **decisions** — decisions that determine how maintainable, scalable, testable, and debuggable a system will be when it grows.

### The Real Goal

When you build a backend system the way a professional would, you're thinking about:

| Concern | What It Means |
|---|---|
| **Separation of Concerns** | Each piece of code has one job |
| **Layered Architecture** | Code is organized in layers, each with a specific role |
| **Contracts** | Predictable inputs and outputs between layers |
| **Maintainability** | Future developers (or you, 6 months later) can understand and change the code |
| **Scalability** | The system can handle more load, more features, or more teams |
| **Consistency** | The system behaves predictably everywhere |

### Why Microservices?

In a **monolith**, all features live in one codebase. When the codebase grows:
- One bug can crash everything
- Deploying one feature requires deploying everything
- Teams step on each other's code
- Scaling one feature means scaling everything

In **microservices**, each feature is its own independent service:
- `user-service` handles users
- `catalog-service` handles events
- Each service has its own database, its own deployment, its own failure boundary

This project builds toward that architecture, so every design decision you make early is **amplified at scale**. Bad habits become architectural crises. Good habits become superpowers.

---

## 1. Layered Architecture

### The Problem — Why "Everything in Controllers" Fails

Let's look at the beginner pattern closely:

```js
const getEvents = async (req, res) => {
    const events = await Event.find();
    res.json(events);
}
```

This looks perfectly fine. It works. So what's wrong?

Now imagine a real-world requirement:
- Get all events
- Only return events that are not sold out
- If the user is an admin, include draft events
- Apply pagination
- Log the request for analytics
- If the user is on a premium plan, show extra details

Your controller now looks like:

```js
const getEvents = async (req, res) => {
    try {
        let query = { isSoldOut: false };

        if (req.user.role === 'admin') {
            query = {};
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const events = await Event.find(query)
            .skip(skip)
            .limit(limit);

        const total = await Event.countDocuments(query);

        if (req.user.isPremium) {
            // attach premium details...
        }

        logger.info(`Events fetched by ${req.user.id}`);

        res.json({
            data: events,
            page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
```

This controller is now:
- **Doing too much** — it queries, paginates, applies business rules, formats response, and handles errors
- **Untestable** — you can't test business logic without simulating an HTTP request
- **Fragile** — one change to how pagination works requires changing every controller
- **Non-reusable** — if another route needs the same logic, you copy-paste it

This is called **Fat Controller** syndrome, and it's one of the most common beginner mistakes in backend engineering.

---

### The Solution — Layered Architecture

The fix is to give each concern its own dedicated **layer**:

```
Request (HTTP)
    ↓
Controller        → Receives request, calls service, returns response
    ↓
Service           → Business logic, workflows, decisions
    ↓
Repository        → Database interaction only
    ↓
Database          → MongoDB / PostgreSQL / etc.
```

Each layer **only knows about the layer directly below it**. A controller never talks to the database. A service never talks directly to HTTP. This is called **Separation of Concerns**.

---

### Controller Layer — The Traffic Director

The controller's **only job** is to:
1. Extract data from the request (`req.body`, `req.params`, `req.query`)
2. Pass it to the service
3. Return what the service gives back

```js
// ✅ GOOD — thin controller
const getEventById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const event = await eventService.getEventById(id);
    res.status(200).json(new ApiResponse(200, event, "Event fetched successfully"));
});
```

Notice what the controller does NOT do:
- ❌ No database queries
- ❌ No business logic (`if isSoldOut...`)
- ❌ No validation
- ❌ No error handling (handled by `asyncHandler` + global middleware)

The controller is just a **bridge** between HTTP and your application's brain (the service).

**Why does this matter?**
- You can swap HTTP for gRPC or message queues — the service doesn't change
- You can test the service independently of HTTP
- The controller is readable at a glance

---

### Service Layer — The Brain

The service layer is where **decisions are made**. It contains:
- Business rules ("you can't book a sold-out event")
- Application workflows ("when a booking is confirmed, send a confirmation email")
- Inter-service communication ("notify the notification-service")
- State-dependent validation ("this showtime is already taken")

```js
// eventService.js
const createEvent = async (eventData) => {
    // Business rule: No two events can have the same title on the same date
    const existing = await eventRepository.findByTitleAndDate(
        eventData.title,
        eventData.date
    );

    if (existing) {
        throw new AppError("An event with this title already exists on this date", 409);
    }

    return await eventRepository.create(eventData);
};
```

The service:
- Calls the repository (not the database directly)
- Makes business decisions
- Throws meaningful errors
- Does NOT touch `req` or `res`

**Why no `req`/`res` in services?**
Because the service doesn't care *how* the request came in. Whether it's HTTP, a cron job, or a CLI script — the service logic is the same. This is **technology independence**.

---

### Repository Layer — The Data Access Layer

The repository's **only job** is to talk to the database. Nothing else.

```js
// eventRepository.js
const findById = async (id) => {
    return await Event.findById(id);
};

const create = async (data) => {
    return await Event.create(data);
};

const findByTitleAndDate = async (title, date) => {
    return await Event.findOne({ title, date });
};
```

The repository:
- Knows about MongoDB (or whatever database you're using)
- Translates business requests into database queries
- Returns raw data to the service

**Why not just use Mongoose in the service directly?**
Because if you ever switch from MongoDB to PostgreSQL, you only need to change the repository. The service doesn't care. This is **database independence**.

```
Service: "Give me the event with id 123"
Repository: "SELECT * FROM events WHERE id = 123" OR Event.findById(123)
```

The service speaks **domain language**. The repository speaks **database language**.

---

## 2. Async Wrapper

### The Problem — Repetitive Try-Catch

Every controller that uses `async/await` needs error handling:

```js
const getEvents = async (req, res, next) => {
    try {
        const events = await eventService.getAllEvents();
        res.json(events);
    } catch (error) {
        next(error); // Pass to global error handler
    }
};

const createEvent = async (req, res, next) => {
    try {
        const event = await eventService.createEvent(req.body);
        res.json(event);
    } catch (error) {
        next(error);
    }
};
```

Imagine having 20 controllers. That's 60 lines of identical try-catch boilerplate. If you ever want to change how errors are forwarded, you change 20 files.

### The Solution — `asyncHandler`

```js
// utils/asyncHandler.js
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncHandler;
```

Now controllers become:

```js
const getEvents = asyncHandler(async (req, res) => {
    const events = await eventService.getAllEvents();
    res.json(events);
});
```

No try-catch. No `next`. If `eventService.getAllEvents()` throws, `asyncHandler` automatically catches it and passes it to `next(error)`, which triggers your global error handler.

### How It Works Internally

```
asyncHandler(fn)
    → returns a new function (req, res, next) => { ... }
    → when this function is called by Express:
        → it calls fn(req, res, next)
        → wraps the result in Promise.resolve()
        → if the promise rejects, .catch(next) forwards the error
```

`Promise.resolve()` is important because if `fn` is not async (or doesn't return a promise), the code still works safely.

### Why This Is a Pattern Worth Knowing

This is a **Higher-Order Function** — a function that takes a function and returns a function. It's a foundational pattern in JavaScript and functional programming. Understanding `asyncHandler` is understanding closures, HOFs, and middleware composition all at once.

---

## 3. Global Error Handling

### The Problem — Distributed Error Logic

Without centralized error handling, every route handles its own errors differently:

```js
// Route 1
catch (error) {
    res.status(500).json({ message: "Something went wrong" });
}

// Route 2
catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
}

// Route 3
catch (error) {
    console.error(error);
    res.status(400).send("Bad request");
}
```

The API is now **inconsistent**. The frontend developer doesn't know what structure to expect. Debugging is painful. Adding a feature (like logging all errors) requires touching every single route.

### The Solution — Global Error Middleware

Express has a special 4-argument middleware signature for error handling:

```js
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
```

Register it **last** in your Express app:

```js
// app.js
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

// Must be AFTER all routes
app.use(errorHandler);
```

Now **every** error in every route, controller, service, or repository gets funneled here automatically. One place to:
- Format the response
- Log the error
- Alert your monitoring system (like Sentry)
- Return a safe message to the client (hiding internal details in production)

### The Error Flow

```
Controller calls service
    → Service throws new AppError("Event not found", 404)
    → asyncHandler catches it
    → Calls next(error)
    → Express routes it to errorHandler middleware
    → Client receives: { success: false, message: "Event not found" }
```

### Why Stack Traces in Development Only?

```js
...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
```

In development, stack traces help you debug instantly. In production, they're a **security risk** — they expose your internal code structure, file paths, and logic to potential attackers. Never send stack traces to clients in production.

---

## 4. Custom Error Class (AppError)

### Why JavaScript's Built-In `Error` Isn't Enough

JavaScript's native `Error` only has a `message` and `stack`. When you throw errors in a backend:

```js
throw new Error("Event not found");
```

Your error handler receives this error, but it has no HTTP status code. How does it know to return 404 vs 500 vs 401?

Without custom errors:

```js
// In errorHandler.js
const statusCode = err.statusCode || 500;  // Where does statusCode come from?
```

You'd have to set `statusCode` manually on each error after throwing it. That's messy and error-prone.

### The Solution — `AppError`

```js
// utils/AppError.js
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);          // Sets this.message
        this.statusCode = statusCode;
        this.isOperational = true;  // Marks this as an expected error

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
```

Now anywhere in your codebase:

```js
throw new AppError("Event not found", 404);
throw new AppError("Unauthorized", 401);
throw new AppError("Seat already booked", 409);
```

The global error handler reads `err.statusCode` automatically:

```js
const statusCode = err.statusCode || 500;
```

### `isOperational` Flag — A Critical Concept

There are two kinds of errors in production:

| Type | Example | What to do |
|---|---|---|
| **Operational** | "Event not found", "Invalid credentials" | Expected. Return to client gracefully. |
| **Programmer Error** | `Cannot read property of undefined` | Unexpected bug. Log it, alert the team, possibly restart. |

By setting `isOperational = true` on `AppError`, your error handler can distinguish them:

```js
if (!err.isOperational) {
    // This is a bug, not an expected failure
    logger.critical(err);
    process.exit(1);  // In some cases, restart the process
}
```

This is professional-grade error management used in production systems.

---

## 5. Validation Architecture

### Why Validation Is Its Own Architectural Concern

Validation is not just "checking if the title is a string." It's a **boundary protection mechanism**. Think of your backend as a building:

```
Internet (Untrusted World)
        ↓
[  VALIDATION WALL  ]   ← Nothing invalid gets through
        ↓
Controller
        ↓
Service (Trusted Zone)
        ↓
Database
```

If invalid data gets past the validation wall:
- Your service might crash (`Cannot read property of undefined`)
- Your database might store garbage data
- Your application logic might behave incorrectly
- You might expose security vulnerabilities (e.g., mass assignment attacks)

### The Request Lifecycle With Validation

```
Incoming Request
    ↓
Validation Middleware (schema check)
    → If invalid: Return 400 immediately, controller never runs
    → If valid: Attach sanitized data to req, call next()
    ↓
Controller
    ↓
Service (receives trusted, validated data)
    ↓
Repository
    ↓
Database
```

### Why Validate Before Controllers?

Controllers should receive **clean, trusted, typed data**. If you validate inside a controller:
- You mix validation logic with HTTP logic
- The controller becomes fat
- Validation can't be reused across routes
- Testing requires simulating validation

As middleware, validation is:
- **Reusable** — attach to any route
- **Composable** — stack multiple validators
- **Testable** — test validation independently
- **Separated** — controllers never touch raw untrusted data

---

## 6. Zod Schema Validation

### Why Zod?

JavaScript is dynamically typed. At runtime, you have no guarantee that:
- `req.body.title` is a string (it could be a number, null, or missing)
- `req.body.price` is a positive number (it could be negative or a string like "free")
- `req.params.id` is a valid MongoDB ObjectId

Zod lets you **declare what shape data should have**, then validates at runtime.

```js
// schemas/eventSchema.js
const { z } = require('zod');

const createEventSchema = z.object({
    title: z.string()
             .min(3, "Title must be at least 3 characters")
             .max(100, "Title cannot exceed 100 characters"),
    price: z.number()
             .positive("Price must be positive"),
    date: z.string()
            .datetime("Date must be a valid ISO datetime"),
    capacity: z.number()
               .int("Capacity must be an integer")
               .min(1, "Capacity must be at least 1"),
    category: z.enum(["music", "sports", "theater", "comedy"], {
        errorMap: () => ({ message: "Category must be one of: music, sports, theater, comedy" })
    }),
});
```

### How Zod Validation Works

```js
const result = createEventSchema.safeParse(req.body);

if (!result.success) {
    // result.error contains all validation failures
    console.log(result.error.issues);
    // [{ path: ['title'], message: 'Title must be at least 3 characters' }]
} else {
    // result.data is the validated, typed data
    const validData = result.data;
}
```

**`safeParse` vs `parse`:**
- `parse` throws an exception on failure
- `safeParse` returns `{ success: true, data }` or `{ success: false, error }` — no exception

Use `safeParse` in middleware since you want to handle failures gracefully, not crash.

### Why Zod Over Express-Validator or Joi?

| Feature | Zod | Joi | Express-Validator |
|---|---|---|---|
| TypeScript inference | ✅ Native | ⚠️ Partial | ❌ |
| Schema composition | ✅ Excellent | ✅ Good | ⚠️ Limited |
| `.partial()`, `.extend()` | ✅ Built-in | ⚠️ Workarounds | ❌ |
| Error messages | ✅ Structured | ✅ Structured | ⚠️ Per-rule |
| Bundle size | ✅ Small | ⚠️ Larger | ⚠️ Larger |

Zod is the modern standard, especially if you're working toward TypeScript.

---

## 7. Validation Middleware

### The Pattern

Instead of validating inside controllers, you create a **generic middleware factory**:

```js
// middleware/validateRequest.js
const validateRequest = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));

            return res.status(400).json({
                success: false,
                message: "Validation Error",
                errors,
            });
        }

        req.body = result.data;  // Replace req.body with validated/sanitized data
        next();
    };
};
```

Usage in routes:

```js
// routes/eventRoutes.js
router.post(
    '/',
    validateRequest(createEventSchema),  // Middleware runs first
    eventController.createEvent           // Controller only runs if validation passes
);
```

### What Happens When Validation Fails

```
POST /events
Body: { title: "ab", price: -10 }
        ↓
validateRequest middleware runs
        ↓
Zod finds: title too short, price must be positive
        ↓
Returns 400:
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    { "field": "title", "message": "Title must be at least 3 characters" },
    { "field": "price", "message": "Price must be positive" }
  ]
}
        ↓
Controller never runs
```

The controller receives only **clean, validated data**.

---

## 8. Generic Request Validation

### Evolving the Validator

Initially, the middleware only validates `req.body`:

```js
const result = schema.safeParse(req.body);
```

But real-world routes need to validate all parts of the request:

| Request Part | Example | When You Need It |
|---|---|---|
| `req.body` | `{ title: "Batman" }` | POST, PUT, PATCH |
| `req.params` | `/events/:id` | Any route with URL params |
| `req.query` | `?page=1&limit=10` | Pagination, filtering |
| `req.headers` | `Authorization: Bearer ...` | Auth tokens (usually handled by auth middleware) |

### Upgraded Generic Validator

```js
// middleware/validateRequest.js
const validateRequest = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if (!result.success) {
            const errors = result.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));

            return res.status(400).json({
                success: false,
                message: "Validation Error",
                errors,
            });
        }

        // Attach validated data back
        req.body = result.data.body || req.body;
        req.params = result.data.params || req.params;
        req.query = result.data.query || req.query;

        next();
    };
};
```

Schema structure changes accordingly:

```js
const getEventsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        category: z.string().optional(),
    }),
});

const getEventByIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid event ID"),
    }),
});
```

Now a route like:

```js
router.get(
    '/:id',
    validateRequest(getEventByIdSchema),
    eventController.getEventById
);
```

validates the `id` param before the controller even sees it.

---

## 9. Error Normalization

### The Problem — Raw Errors Are Ugly and Unsafe

Zod's raw error format:

```json
{
  "issues": [
    {
      "code": "too_small",
      "minimum": 3,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "String must contain at least 3 character(s)",
      "path": ["title"]
    }
  ],
  "name": "ZodError"
}
```

This is **not** what you want to send to a client. It's:
- Too verbose
- Contains internal Zod implementation details
- Not developer-friendly for frontend consumers
- Inconsistent with your standard response format

### The Solution — Normalize to Friendly Format

Transform Zod errors into a structured, consistent format:

```js
const errors = zodError.issues.map(issue => ({
    field: issue.path.join('.'),     // ["address", "city"] → "address.city"
    message: issue.message,          // Human-readable message
}));
```

Output:

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "field": "title",
      "message": "Title must be at least 3 characters"
    },
    {
      "field": "price",
      "message": "Price must be positive"
    }
  ]
}
```

### Why Does This Matter?

Frontend developers consuming your API can now:

```js
// Frontend code
if (!response.success) {
    response.errors.forEach(error => {
        showFieldError(error.field, error.message);
    });
}
```

Without normalization, every API error would require custom parsing. With normalization, there's a **contract** — a predictable structure the frontend can always rely on.

---

## 10. Schema Composition

### The Problem — Duplication

Imagine you have `createEventSchema` and `updateEventSchema`. Both deal with the same fields:

```js
// BAD: Duplicated definitions
const createEventSchema = z.object({
    title: z.string().min(3).max(100),
    price: z.number().positive(),
    date: z.string().datetime(),
    capacity: z.number().int().min(1),
});

const updateEventSchema = z.object({
    title: z.string().min(3).max(100),  // SAME
    price: z.number().positive(),        // SAME
    date: z.string().datetime(),         // SAME
    capacity: z.number().int().min(1),   // SAME
});
```

If you change the validation rule for `title` (e.g., increase max length to 150), you must change it in **every schema**. This violates the **DRY principle** (Don't Repeat Yourself).

### The Solution — Shared Field Definitions

```js
// schemas/eventFields.js (Shared definitions)
const { z } = require('zod');

const eventFields = {
    title: z.string()
             .min(3, "Title must be at least 3 characters")
             .max(100, "Title cannot exceed 100 characters"),
    price: z.number()
             .positive("Price must be positive"),
    date: z.string()
            .datetime("Must be a valid ISO datetime"),
    capacity: z.number()
               .int("Must be an integer")
               .min(1, "Capacity must be at least 1"),
    category: z.enum(["music", "sports", "theater", "comedy"]),
};

// schemas/eventSchemas.js (Derived schemas)
const createEventSchema = z.object({
    body: z.object({
        title: eventFields.title,
        price: eventFields.price,
        date: eventFields.date,
        capacity: eventFields.capacity,
        category: eventFields.category,
    }).strict(),
});

const updateEventSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i),
    }),
    body: z.object({
        title: eventFields.title.optional(),
        price: eventFields.price.optional(),
        date: eventFields.date.optional(),
        capacity: eventFields.capacity.optional(),
        category: eventFields.category.optional(),
    }).strict(),
});
```

Now the `title` validation is defined in **one place**. Change it once, all schemas are updated automatically.

### The Principle: Single Source of Truth

In software, **single source of truth** means a piece of information exists in exactly one place. When you change it, everything that derives from it changes too. This is a foundational principle in both databases (normalization) and code (DRY).

---

## 11. Schema Derivation & Partial Updates

### The Problem — Requiring All Fields for Updates

When updating an event with `PATCH /events/:id`, the user might only want to change the price:

```json
{ "price": 150 }
```

But if your update schema requires all fields:

```js
const updateEventSchema = z.object({
    title: z.string().min(3),   // Required!
    price: z.number().positive(), // Required!
    // ...
});
```

The client is forced to send ALL fields even if they only want to change one. This is:
- Bad UX (forces unnecessary data transfer)
- Error-prone (client might accidentally overwrite data)
- Not RESTful (`PATCH` is for partial updates, `PUT` is for full replacement)

### The Solution — `.partial()`

Zod's `.partial()` takes an object schema and makes all fields optional:

```js
const eventBaseSchema = z.object({
    title: z.string().min(3).max(100),
    price: z.number().positive(),
    date: z.string().datetime(),
    capacity: z.number().int().min(1),
    category: z.enum(["music", "sports", "theater", "comedy"]),
});

// For creating: all fields required
const createEventSchema = z.object({
    body: eventBaseSchema,
});

// For updating: all fields optional (but at least one must be present)
const updateEventSchema = z.object({
    params: z.object({ id: z.string() }),
    body: eventBaseSchema.partial().refine(
        (data) => Object.keys(data).length > 0,
        "At least one field must be provided for update"
    ),
});
```

### HTTP Semantics: PUT vs PATCH

| Method | Meaning | Body |
|---|---|---|
| `PUT` | Replace the entire resource | All fields |
| `PATCH` | Update only specified fields | Only changed fields |

`PATCH` with `.partial()` is the correct pattern for update operations where you don't want to force a full replacement.

---

## 12. Domain Layer vs Transport Layer

### One of the Most Important Architectural Concepts

This is a concept that separates junior from senior backend engineers.

### Transport Layer — HTTP Concerns

The **transport layer** deals with how data arrives:
- HTTP method (GET, POST, PUT, DELETE)
- Request body (`req.body`)
- URL parameters (`req.params`)
- Query strings (`req.query`)
- Headers (`req.headers`)
- Status codes (200, 404, 500)

This is the "envelope" your data comes in. It's an HTTP concept, not a business concept.

### Domain Layer — Business Concerns

The **domain layer** deals with what the data means:
- An `Event` has a `title`, `price`, `showtimes`, `capacity`
- A `Booking` belongs to a `User` and an `Event`
- A `User` has an `email` and a `role`

These concepts exist regardless of whether your API is HTTP, gRPC, GraphQL, or WebSockets.

### Why Separate Them?

```js
// ❌ BAD: Service knows about HTTP
const createEvent = async (req) => {
    const { title, price } = req.body;
    const userId = req.user.id;
    // ...
};

// ✅ GOOD: Service knows only about business concepts
const createEvent = async ({ title, price, userId }) => {
    // title, price, userId are domain concepts — not HTTP concepts
    // ...
};
```

If you later switch from HTTP to gRPC:
- The bad version: rewrite the service
- The good version: only change the controller (the transport adapter)

### Practical Example

```
Client sends HTTP POST:
{
  req.body: { title: "Batman", price: 100 }
  req.params: { id: "64abc..." }
  req.user: { id: "user123" }
}
         ↓
Controller extracts domain data:
{
  title: "Batman",
  price: 100,
  userId: "user123"
}
         ↓
Service receives pure domain data
         ↓
Repository saves to database
```

The service never knows it was an HTTP request. It just gets business data.

---

## 13. Request Sanitization

### The Problem — Unexpected Fields

What happens if a client sends:

```json
{
  "title": "Batman Begins",
  "price": 150,
  "isAdmin": true,
  "role": "superuser",
  "internalSecret": "bypass-auth"
}
```

Without sanitization, these fields pass through validation. If your code does:

```js
await Event.create(req.body);
```

MongoDB might actually store `isAdmin: true` on the event document. Or worse, if you're using something like:

```js
await User.updateOne({ _id: userId }, req.body);
```

A malicious user could update their own `role` to `admin`. This is called a **mass assignment vulnerability** and it has caused real security breaches.

### The Solution — `.strict()`

Zod's `.strict()` rejects any fields not defined in the schema:

```js
const createEventSchema = z.object({
    title: z.string().min(3),
    price: z.number().positive(),
}).strict();  // Any extra field causes validation to fail
```

Now sending `{ title: "Batman", price: 150, isAdmin: true }` returns a 400 error:

```json
{
  "errors": [
    {
      "field": "isAdmin",
      "message": "Unrecognized key(s) in object: 'isAdmin'"
    }
  ]
}
```

### The Principle: Allowlist, Not Blocklist

A blocklist approach says: "Block these bad fields." But you can never predict every bad field.

An allowlist approach says: "Only allow these specific fields." Everything else is rejected. This is the secure approach.

`.strict()` implements the allowlist approach.

---

## 14. Validation Transformations

### The Problem — Type Mismatches From HTTP

HTTP is a text-based protocol. Everything in a URL query string is a **string**:

```
GET /events?page=1&limit=10&isPremium=true
```

`req.query` gives you:
```js
{
  page: "1",         // string, not number
  limit: "10",       // string, not number
  isPremium: "true"  // string, not boolean
}
```

If you pass `"1"` to `skip = (page - 1) * limit`, you get:
```js
("1" - 1) * "10" = 0 * "10" = 0  // JavaScript coerces this, but it's dangerous
```

And `isPremium === true` fails because `"true" !== true`.

### The Solution — `z.coerce`

Zod's `coerce` transforms the string before validating it:

```js
const querySchema = z.object({
    query: z.object({
        page: z.coerce.number()   // "1" → 1
                      .int()
                      .min(1)
                      .default(1),
        limit: z.coerce.number()  // "10" → 10
                       .int()
                       .min(1)
                       .max(100)
                       .default(10),
        isPremium: z.coerce.boolean()  // "true" → true
                           .optional(),
    }),
});
```

After validation with coercion:
```js
req.query = { page: 1, limit: 10, isPremium: true }
//                 ^ number  ^ number    ^ boolean
```

Your service layer receives properly typed data without any manual parsing.

### Common Coercion Cases

| Input | Zod Coercion | Output |
|---|---|---|
| `"1"` | `z.coerce.number()` | `1` |
| `"true"` | `z.coerce.boolean()` | `true` |
| `"false"` | `z.coerce.boolean()` | `false` |
| `"2024-01-01"` | `z.coerce.date()` | `Date` object |
| `123` | `z.coerce.string()` | `"123"` |

---

## 15. Business Validation vs Schema Validation

### The Most Important Backend Concept

This distinction is what separates an architect from a developer.

### Schema Validation — "Is The Data Correct?"

Schema validation checks the **structure and format** of the data. It doesn't need the database or any system state:

```js
title: z.string().min(3)       // Is title a string with at least 3 chars?
price: z.number().positive()   // Is price a positive number?
email: z.string().email()      // Is email a valid email format?
```

These rules are **static**. They're defined at schema definition time. They don't require any database queries.

**Schema validation belongs in the Validation Middleware layer.**

### Business Validation — "Is The Data Allowed Given Current State?"

Business validation checks **runtime conditions** that depend on database state, business rules, or current system state:

| Rule | Why It's Business Validation |
|---|---|
| "Email already exists" | Requires checking the database |
| "Event is sold out" | Requires checking current bookings count |
| "Showtime conflicts with another event" | Requires checking existing showtimes |
| "User has already booked this event" | Requires checking the bookings table |
| "Coupon code is valid and not expired" | Requires checking the coupons table |

**Business validation belongs in the Service layer.**

### Why This Separation Matters

```js
// ❌ BAD: Business validation in middleware
const validateRequest = (schema) => async (req, res, next) => {
    // ... Zod validation ...

    // This doesn't belong here!
    const existing = await User.findOne({ email: req.body.email });
    if (existing) {
        return res.status(409).json({ message: "Email already exists" });
    }

    next();
};

// ✅ GOOD: Business validation in service
const registerUser = async ({ email, password, name }) => {
    // Schema validation already passed, now check business rules
    const existing = await userRepository.findByEmail(email);
    if (existing) {
        throw new AppError("Email already exists", 409);
    }
    // ... create user
};
```

The middleware approach creates problems:
- Middleware now has database dependencies (hard to test, hard to reuse)
- Business logic leaks into the transport layer
- What happens with gRPC or WebSocket transport? You'd need separate middleware.

The service approach:
- Service is pure business logic, testable in isolation
- Works regardless of transport protocol
- Can reuse the same validation from any code path (HTTP, cron job, CLI)

---

## 16. API Response Standardization

### The Problem — Inconsistent Responses

Without a standard, different developers write different response shapes:

```js
// Developer A
res.json({ event: eventData });

// Developer B
res.json({ data: eventData, status: "ok" });

// Developer C
res.json(eventData);  // Just the raw object!

// Developer D
res.json({ result: eventData, code: 200 });
```

The frontend developer is now forced to handle 4 different response structures. Worse, if they're calling multiple endpoints in sequence, they can't write reusable response handling code.

This problem grows exponentially with the number of endpoints and team members.

### The Solution — Standard Response Envelope

Define a **single structure** for all API responses:

```json
{
  "success": true | false,
  "message": "Human-readable description",
  "data": { ... } | null,
  "errors": [ ... ] | null,
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

Every endpoint, every developer, every response — same structure.

### Success Response Examples

```json
// GET /events/:id
{
  "success": true,
  "message": "Event fetched successfully",
  "data": {
    "id": "64abc123",
    "title": "Batman Begins",
    "price": 150
  }
}

// GET /events (paginated list)
{
  "success": true,
  "message": "Events fetched successfully",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 53,
    "totalPages": 6
  }
}

// POST /events
{
  "success": true,
  "message": "Event created successfully",
  "data": { "id": "64abc456", "title": "New Event" }
}
```

### Error Response Examples

```json
// 404 Not Found
{
  "success": false,
  "message": "Event not found"
}

// 400 Validation Error
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    { "field": "title", "message": "Title must be at least 3 characters" }
  ]
}
```

Frontend code can now be written once and reused everywhere:

```js
const handleApiResponse = (response) => {
    if (!response.success) {
        showError(response.message);
        if (response.errors) {
            showFieldErrors(response.errors);
        }
        return;
    }
    return response.data;
};
```

---

## 17. ApiResponse Utility

### Why a Utility Class?

Without it, every controller manually constructs the response:

```js
// Controller A
res.status(200).json({
    success: true,
    message: "Event fetched successfully",
    data: event
});

// Controller B
res.status(201).json({
    success: true,
    message: "Event created successfully",
    data: newEvent
});
```

If you ever want to add a `timestamp` to every response, you change 30 controllers.

### The ApiResponse Class

```js
// utils/ApiResponse.js
class ApiResponse {
    constructor(statusCode, data, message = "Success", meta = null) {
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
        if (meta) this.meta = meta;
    }
}

module.exports = ApiResponse;
```

Usage in controllers:

```js
const getEventById = asyncHandler(async (req, res) => {
    const event = await eventService.getEventById(req.params.id);
    res.status(200).json(new ApiResponse(200, event, "Event fetched successfully"));
});

const createEvent = asyncHandler(async (req, res) => {
    const event = await eventService.createEvent(req.body);
    res.status(201).json(new ApiResponse(201, event, "Event created successfully"));
});
```

Now adding a `timestamp` field means one change in `ApiResponse`:

```js
class ApiResponse {
    constructor(statusCode, data, message = "Success", meta = null) {
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
        this.timestamp = new Date().toISOString();  // Added once, everywhere
        if (meta) this.meta = meta;
    }
}
```

Every single response now includes a timestamp. One line change.

---

## 18. Response Metadata

### What Is Metadata?

Metadata is **data about data**. The `data` field contains the business payload (events, users, bookings). Metadata describes the context of that payload.

### Why Metadata Matters

Without pagination metadata, the frontend doesn't know:
- How many total items exist
- How many pages there are
- Whether there's a next page to fetch

The frontend is forced to disable "next page" buttons or make additional requests just to find out if more data exists.

### Metadata Structure

```json
{
  "success": true,
  "message": "Events fetched successfully",
  "data": [/* 10 events */],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 53,
    "totalPages": 6,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

Frontend can now implement pagination controls trivially:

```js
// Frontend
const { data: events, meta } = await fetchEvents({ page: currentPage });

renderEvents(events);
renderPaginationControls({
    currentPage: meta.page,
    totalPages: meta.totalPages,
    hasNext: meta.hasNextPage,
    hasPrev: meta.hasPrevPage,
});
```

### Beyond Pagination

Metadata can also include:

```json
{
  "meta": {
    "requestId": "uuid-for-tracing",
    "processingTimeMs": 45,
    "cacheHit": true,
    "apiVersion": "v1"
  }
}
```

These are useful for debugging, monitoring, and client-side performance optimization.

---

## 19. Pagination Architecture

### Why Pagination Is a Service Concern

Pagination is a **business concern**, not a transport concern. Consider:

- **Limit**: How many items per page? (business rule: "never return more than 100 items at once")
- **Skip**: How many items to skip? (calculated from page number)
- **Total**: How many items exist? (requires a database count query)
- **Total Pages**: How many pages? (calculated from total and limit)

These calculations involve business rules and database state. They belong in the **Service Layer**.

### The Pagination Flow

```js
// eventService.js
const getAllEvents = async ({ page = 1, limit = 10, filters = {} }) => {
    const skip = (page - 1) * limit;

    const [events, totalItems] = await Promise.all([
        eventRepository.findAll({ filters, skip, limit }),
        eventRepository.countAll({ filters }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
        data: events,
        meta: {
            page,
            limit,
            total: totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
};
```

The controller just passes through:

```js
const getAllEvents = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const result = await eventService.getAllEvents({ page, limit });

    res.status(200).json(
        new ApiResponse(200, result.data, "Events fetched successfully", result.meta)
    );
});
```

### Using `Promise.all` for Parallel Queries

```js
const [events, totalItems] = await Promise.all([
    eventRepository.findAll(...),
    eventRepository.countAll(...),
]);
```

`Promise.all` runs both database queries **simultaneously**. Without it:

```js
const events = await eventRepository.findAll(...);      // Wait 50ms
const totalItems = await eventRepository.countAll(...); // Wait 50ms
// Total: 100ms
```

With `Promise.all`:
```
findAll and countAll run together → Wait 50ms (max of both)
// Total: 50ms
```

This is a significant performance optimization when making multiple independent database calls.

---

## Current Backend Architecture

Here's the complete picture of the architecture you've built, with all components working together:

```
Incoming HTTP Request
        ↓
[Express Router]
        ↓
[Validation Middleware]  ← Zod schema validation
    ↓ (if invalid)       ← .strict() for sanitization
    400 Error            ← z.coerce for transformations
    ↓ (if valid)
[Controller]             ← Thin, asyncHandler wrapped
        ↓
[Service Layer]          ← Business logic & rules
    ↓ (if business rule violation)
    AppError → next(error) → Global Error Handler
    ↓ (if valid)
[Repository Layer]       ← Database interaction only
        ↓
[Database (MongoDB)]
        ↓
[Repository returns data]
        ↓
[Service enriches data]
        ↓
[Controller wraps in ApiResponse]
        ↓
[Global Error Handler]   ← Catches all errors from anywhere
        ↓
Consistent JSON Response
```

### The Complete Component List

| Component | File | Responsibility |
|---|---|---|
| `asyncHandler` | `utils/asyncHandler.js` | Catches async errors, calls `next(error)` |
| `AppError` | `utils/AppError.js` | Structured errors with status codes |
| `ApiResponse` | `utils/ApiResponse.js` | Standardized success response format |
| `validateRequest` | `middleware/validateRequest.js` | Generic Zod validation middleware |
| `errorHandler` | `middleware/errorHandler.js` | Global error handling & formatting |
| `eventController` | `controllers/eventController.js` | HTTP request/response handling |
| `eventService` | `services/eventService.js` | Business logic & validation |
| `eventRepository` | `repositories/eventRepository.js` | Database queries |
| `eventSchemas` | `schemas/eventSchemas.js` | Zod validation schemas |
| `eventFields` | `schemas/eventFields.js` | Shared field definitions |

---

## Core Principle

### What Backend Engineering Actually Is

After going through all these architectural patterns, the core lesson is:

> **Backend engineering is not about writing code. It's about managing complexity through separation of concerns.**

Every decision in this architecture answers one question:
> **"What responsibility does this layer own?"**

| Layer | Owns |
|---|---|
| Controller | HTTP request/response translation |
| Service | Business logic and rules |
| Repository | Database interaction |
| Validation Middleware | Input contracts |
| Error Handler | Consistent error responses |
| Schemas | Data shape definitions |

When responsibilities leak across layers, the system becomes:
- **Hard to test** — can't test service without making an HTTP request
- **Hard to change** — changing one thing breaks multiple unrelated things
- **Hard to scale** — business logic coupled to transport makes it impossible to reuse
- **Hard to debug** — an error could come from anywhere

When responsibilities are properly separated, the system becomes:
- **Testable** — each layer testable in isolation
- **Maintainable** — changes are localized
- **Scalable** — layers can be swapped independently
- **Debuggable** — clear flow from request to response

### The Microservices Connection

All of these patterns are even more important in microservices because:

- **Each service is independently deployed** — bad architecture in one service doesn't fix itself when you split it out
- **Services communicate over the network** — inconsistent response formats cause inter-service bugs
- **Teams own individual services** — poor separation means teams constantly break each other
- **Distributed failures** — without proper error handling, one service's bug can cascade to all others

The architecture you've built for one service is the template for every service in your system. **Get it right once. Replicate it everywhere.**

---

## Summary Table

| Concept | What It Solves | Key Tool/Pattern |
|---|---|---|
| Layered Architecture | Fat controllers, mixed concerns | Controller → Service → Repository |
| asyncHandler | Repetitive try-catch | Higher-order function wrapping |
| Global Error Handler | Inconsistent error responses | Express 4-arg middleware |
| AppError | Untyped error objects | Custom Error class with statusCode |
| Validation Architecture | Invalid data reaching business logic | Middleware before controller |
| Zod Validation | Runtime type checking | Schema definition with safeParse |
| Validation Middleware | Repeated validation code | Factory function returning middleware |
| Generic Request Validation | Only body validated | `{ body, params, query }` schema |
| Error Normalization | Ugly raw Zod errors | Map issues to `{ field, message }` |
| Schema Composition | Duplicated field definitions | Shared `eventFields` object |
| Schema Derivation | All fields required for PATCH | `.partial()` on base schema |
| Domain vs Transport | Services coupled to HTTP | Services receive domain data, not req |
| Request Sanitization | Mass assignment attacks | `.strict()` on Zod schemas |
| Validation Transformations | String query params | `z.coerce.number()` etc. |
| Business vs Schema Validation | Wrong layer for DB checks | Schema in middleware, business in service |
| API Response Standardization | Inconsistent response shapes | Standard `{ success, message, data }` |
| ApiResponse Utility | Repeated response construction | Class with constructor args |
| Response Metadata | Missing pagination info | `meta` field with page info |
| Pagination Architecture | Pagination in wrong layer | Service calculates, controller returns |

---

*These notes were created as a learning companion to the Microservices Event Booking System project.*
*Last updated: May 2026*
