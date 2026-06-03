# Microservices Architecture Simulation: Event Booking System

An open-source, locally simulated distributed system designed to bridge the gap between High-Level Design (HLD) concepts and Low-Level Design (LLD) implementation. 

This project explores how microservices interact, handle data consistency, and scale. It serves as a hands-on technical sandbox for understanding SQL/NoSQL tradeoffs, inter-service communication, and advanced backend patterns.

## 🏗 System Architecture Overview

The system is broken down into domain-specific microservices, each owning its database to enforce loose coupling.

| Service | Port | Database | Role |
| :--- | :--- | :--- | :--- |
| **User Service** | `6001` | PostgreSQL | Identity management, RBAC, and secure authentication. |
| **Catalog Service** | `6002` | MongoDB | Highly-read, flexible schema storage for events and movies. |
| **Booking Service** | `TBD` | PostgreSQL | Transactional engine for seat locking and order creation. |
| **API Gateway** | `TBD` | N/A | Single entry point, rate limiting, and request routing. |

---

## ✅ Progress: What Has Been Built

### Phase 1: The Core Foundation
We have successfully established the fundamental independent services with robust LLD practices.

#### 1. User Service (Port 6001)
* **Database:** PostgreSQL (Running via Docker `postgres:15-alpine`).
* **Features:** * Strict structured schema for user identities (`customer`, `admin`, `venue_manager`).
    * Secure password hashing using `bcrypt`.
    * Stateless authentication using JSON Web Tokens (JWT).
    * Protected profile endpoints with custom authorization middleware.
* **Security:** Implemented strict request payload validation using **Zod** to catch malformed data before it reaches the database.

#### 2. Catalog Service (Port 6002)
* **Database:** MongoDB (Running via Docker `mongo:6.0`).
* **Features:**
    * Flexible document schema using **Mongoose** to handle varying event metadata (e.g., movies vs. concerts).
    * RESTful endpoints to create and retrieve event catalogs.
* **Security:** Mitigated Mass Assignment Vulnerabilities by explicitly destructuring incoming request bodies before database insertion.

---

## 🚀 Roadmap: What We Are Building Next

### Phase 2: Inter-Service Communication
The services are currently isolated. The next major milestone is connecting them to handle cross-domain transactions.

* **The Booking Service:** Building the engine that allows a user to reserve a ticket.
* **Synchronous Fetching:** The Booking Service will securely communicate with the User Service to verify identity and the Catalog Service to check seat availability.
* **Concurrency Control:** Implementing seat-locking mechanisms to prevent double-booking when multiple users attempt to buy the same ticket simultaneously.

### Phase 3: Advanced System Design Concepts
Once basic communication is established, we will harden the system.

* **Caching (Redis):** Implementing an in-memory cache for the Catalog Service to handle heavy read traffic.
* **Message Queues (RabbitMQ):** Decoupling the system by transitioning from synchronous HTTP calls to asynchronous event-driven architecture (e.g., publishing a `TICKET_BOOKED` event).
* **Notification Service:** A passive worker service that listens to the message queue and simulates sending emails/SMS.
* **API Gateway & Rate Limiting:** Funneling all traffic through a single entry point and protecting the infrastructure from DDoS attacks.