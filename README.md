# 🍔 FoodFlow — Food Delivery Microservices Platform

A production-ready food delivery platform built with a **microservices architecture**, **event-driven communication**, and **real-time order tracking**.

---

## 📸 Screenshots

> Customer Dashboard · Restaurant Dashboard · Rider Dashboard · Admin Dashboard

---

## 🏗️ Architecture

```
                        ┌─────────────────────────────────────┐
                        │         Client (React + Vite)        │
                        └──────────────┬──────────────────────┘
                                       │
                        ┌──────────────▼──────────────────────┐
                        │   API Gateway (Port 4000)            │
                        │   Rate Limiting · Helmet · CORS      │
                        │   Response Compression               │
                        └──┬───┬───┬───┬───┬───┬─────────────┘
                           │   │   │   │   │   │
              ┌────────────┘   │   │   │   │   └────────────┐
              │                │   │   │   │                 │
   ┌──────────▼──┐  ┌──────────▼┐ ┌▼───────────┐ ┌────────▼──────┐
   │Auth Service │  │Restaurant │ │   Rider     │ │Admin Service  │
   │  Port 4001  │  │  Service  │ │  Service    │ │  Port 4004    │
   │  PostgreSQL │  │ Port 4002 │ │  Port 4003  │ │  PostgreSQL   │
   └─────────────┘  │PostgreSQL │ │  PostgreSQL │ └───────────────┘
                    │  + Redis  │ └─────────────┘
                    └─────┬─────┘
                          │
          ┌───────────────┼────────────────┐
          │               │                │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
   │  RabbitMQ   │ │    Redis    │ │  Realtime   │
   │  Event Bus  │ │    Cache    │ │   Service   │
   └─────────────┘ └─────────────┘ │  Port 4005  │
                                   │  Socket.IO  │
                                   └─────────────┘
```

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, TypeScript, Vite |
| **Backend** | Node.js, TypeScript, Express |
| **Database** | PostgreSQL (Neon) — separate DB per service |
| **ORM** | Prisma 7 |
| **Message Queue** | RabbitMQ |
| **Cache** | Redis |
| **Real-time** | Socket.IO |
| **Auth** | JWT (Role-based) |
| **Payments** | Razorpay |
| **File Upload** | Cloudinary |
| **Validation** | Zod |
| **Security** | Helmet, Rate Limiting |
| **Containerization** | Docker, Docker Compose |
| **Orchestration** | Kubernetes (manifests in `/k8s`) |

---

## 🚀 Services

| Service | Port | Responsibility |
|---------|------|----------------|
| `gateway` | 4000 | Reverse proxy, rate limiting, compression |
| `auth-service` | 4001 | Register, login, JWT auth, 4 roles |
| `restaurant-service` | 4002 | Restaurants, menu, orders, Redis cache |
| `rider-service` | 4003 | Rider profiles, deliveries, availability |
| `admin-service` | 4004 | Audit logs, restaurant verification |
| `realtime-service` | 4005 | Socket.IO + RabbitMQ consumer |
| `utils-service` | 4006 | Cloudinary uploads, Razorpay payments |

---

## 👥 User Roles & Features

### 🧑 Customer
- Browse restaurants and menus
- Add items to cart
- Place orders with Razorpay payment
- Live order status tracking via Socket.IO

### 🍽️ Restaurant Owner
- Create restaurant (requires admin verification)
- Manage menu items with images (Cloudinary)
- Receive new orders in real-time
- Update order status: `Accepted → Preparing → Ready`
- Toggle restaurant open/closed

### 🏍️ Rider
- View all READY orders available for pickup
- Accept deliveries
- Update delivery status
- Mark orders as delivered

### 🛡️ Admin
- View and verify restaurants (via RabbitMQ event)
- Audit log for all admin actions
- View all users and suspend accounts
- Monitor all service health

---

## 📨 Event-Driven Flow (RabbitMQ)

```
Customer places order
        │
        ▼
restaurant-service  ──publishes──▶  order.placed
        │
        ▼
realtime-service consumes ──▶ emits new-order to restaurant socket room
        │
Restaurant updates status ──publishes──▶  order.status.changed
        │
        ▼
realtime-service consumes ──▶ emits order-status-updated to customer
        │
Order marked READY ──▶ rider sees it in available orders
        │
Rider accepts ──publishes──▶  rider.assigned + order.status.changed (PICKED_UP)
        │
        ▼
realtime-service ──▶ customer notified live
        │
Admin verifies restaurant ──publishes──▶  restaurant.verify
        │
        ▼
restaurant-service consumer ──▶ updates DB + invalidates Redis cache
```

---

## ⚙️ Performance Optimizations

| Optimization | Detail | Impact |
|---|---|---|
| **Redis Caching** | Restaurant list cached with 60s TTL | 6x faster (280ms → 45ms) |
| **Database Indexes** | All frequently queried fields indexed across 4 DBs | 10-100x faster queries |
| **Batch Queries** | Order placement uses single `findMany` instead of N queries | Eliminates N+1 problem |
| **Response Compression** | Gzip compression at gateway level | 60-70% smaller payloads |
| **Pagination** | All list endpoints support `page` & `limit` params | Handles millions of rows |
| **Connection Pooling** | Neon PgBouncer pooler endpoints | Prevents connection exhaustion |
| **Keep-alive Pings** | DB pinged every 4 minutes | Prevents Neon cold starts |

---

## 🔒 Security

- **JWT** authentication on all protected routes
- **Role-based access control** — CUSTOMER, RESTAURANT, RIDER, ADMIN
- **Rate limiting** — 20 auth requests per minute per IP
- **Helmet** security headers on all responses
- **Zod** input validation on every service
- **Axios timeout** on inter-service HTTP calls

---

## 📁 Project Structure

```
food-delivery/
├── gateway/                    # API Gateway
├── auth-service/               # Authentication
├── restaurant-service/         # Restaurants, Menu, Orders
├── rider-service/              # Rider management
├── admin-service/              # Admin operations
├── realtime-service/           # Socket.IO + RabbitMQ consumer
├── utils-service/              # Cloudinary + Razorpay
├── client/                     # React frontend
├── shared/
│   └── types/
│       ├── user.types.ts
│       ├── order.types.ts
│       └── events.types.ts
├── k8s/                        # Kubernetes manifests
│   ├── auth-deployment.yaml
│   ├── restaurant-deployment.yaml
│   ├── rider-deployment.yaml
│   ├── admin-deployment.yaml
│   ├── realtime-deployment.yaml
│   ├── utils-deployment.yaml
│   ├── gateway-deployment.yaml
│   ├── rabbitmq-deployment.yaml
│   ├── redis-deployment.yaml
│   └── hpa.yaml                # Horizontal Pod Autoscaler
├── docker-compose.yml
├── start.bat                   # One-command startup (Windows)
└── README.md
```

---

## 🐳 Docker Images

All images are published on Docker Hub:

```
krishnaandbhuvan/auth-service
krishnaandbhuvan/restaurant-service
krishnaandbhuvan/rider-service
krishnaandbhuvan/admin-service
krishnaandbhuvan/realtime-service
krishnaandbhuvan/utils-service
krishnaandbhuvan/gateway
krishnaandbhuvan/client
```

---

## ☸️ Kubernetes

K8s manifests include **Horizontal Pod Autoscalers** that auto-scale based on CPU:

```yaml
minReplicas: 2
maxReplicas: 10
averageUtilization: 70  # scales up when CPU hits 70%
```

Deploy to any K8s cluster:

```bash
kubectl apply -f k8s/rabbitmq-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/auth-deployment.yaml
kubectl apply -f k8s/restaurant-deployment.yaml
kubectl apply -f k8s/rider-deployment.yaml
kubectl apply -f k8s/admin-deployment.yaml
kubectl apply -f k8s/realtime-deployment.yaml
kubectl apply -f k8s/utils-deployment.yaml
kubectl apply -f k8s/gateway-deployment.yaml
kubectl apply -f k8s/hpa.yaml
```

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 20+
- Docker Desktop
- Neon account (free PostgreSQL)

### 1. Clone

```bash
git clone https://github.com/Krishnabhuvan/food-delivery.git
cd food-delivery
```

### 2. Environment Variables

Copy `.env.example` to `.env` in each service and fill in your values:

```bash
cp auth-service/.env.example auth-service/.env
cp restaurant-service/.env.example restaurant-service/.env
cp rider-service/.env.example rider-service/.env
cp admin-service/.env.example admin-service/.env
cp realtime-service/.env.example realtime-service/.env
cp utils-service/.env.example utils-service/.env
cp gateway/.env.example gateway/.env
cp client/.env.example client/.env
```

### 3. Install Dependencies

```bash
cd auth-service && npm install
cd ../restaurant-service && npm install
cd ../rider-service && npm install
cd ../admin-service && npm install
cd ../realtime-service && npm install
cd ../utils-service && npm install
cd ../gateway && npm install
cd ../client && npm install
```

### 4. Run Migrations

```bash
cd auth-service && npx prisma migrate deploy
cd ../restaurant-service && npx prisma migrate deploy
cd ../rider-service && npx prisma migrate deploy
cd ../admin-service && npx prisma migrate deploy
```

### 5. Start Infrastructure

```bash
docker-compose up rabbitmq redis -d
```

### 6. Start All Services

```bash
# Windows — double click start.bat
start.bat

# Or start each manually
cd auth-service && npx ts-node-dev src/index.ts
```

### 7. Open App

```
http://localhost:5173
```

---

## 🔗 API Reference

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | All roles |

### Restaurants
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/restaurants` | Public |
| POST | `/api/restaurants` | Restaurant |
| GET | `/api/restaurants/me` | Restaurant |
| PATCH | `/api/restaurants/toggle-open` | Restaurant |
| GET | `/api/restaurants/all` | Admin |

### Orders
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/orders` | Customer |
| GET | `/api/orders/my-orders?page=1&limit=10` | Customer |
| GET | `/api/orders/restaurant-orders` | Restaurant |
| PATCH | `/api/orders/:id/status` | Restaurant |
| GET | `/api/orders/ready` | Rider |
| PATCH | `/api/orders/:id/accept` | Rider |
| PATCH | `/api/orders/:id/complete` | Rider |

### Health
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/health` | Public |
| GET | `/health/services` | Public |

---

## 📊 Health Check

```bash
curl http://localhost:4000/health/services
```

```json
{
  "services": [
    { "name": "auth", "status": "up", "latency": "203ms" },
    { "name": "restaurant", "status": "up", "latency": "62ms" },
    { "name": "rider", "status": "up", "latency": "123ms" },
    { "name": "admin", "status": "up", "latency": "63ms" },
    { "name": "realtime", "status": "up", "latency": "60ms" }
  ],
  "timestamp": "2026-05-17T00:00:00.000Z"
}
```

---

## 👨‍💻 Author

**Krishna & Bhuvan**
- GitHub: [@Krishnabhuvan](https://github.com/Krishnabhuvan)
- Docker Hub: [krishnaandbhuvan](https://hub.docker.com/u/krishnaandbhuvan)
