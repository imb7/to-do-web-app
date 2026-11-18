# TaskFlow: Standalone To-Do Web Application

A complete, production-ready full-stack To-Do web application built with **React 18**, **Node.js 22**, **Express.js**, and **MySQL 8.x**.

This directory is **100% self-contained**:
- It contains all frontend, backend, database schema, tests, and deployment configuration files.
- You can run it **locally** for development and testing.
- You can deploy it **manually** to any standalone Linux/Ubuntu VM or EC2 instance.
- It also acts as the **application payload** that can be dropped directly into the `packer-golden-ami/app-payload/` directory to bake into an AWS Golden AMI.

---

## 📖 Table of Contents

- [Application Features](#-application-features)
- [Technology Stack](#-technology-stack)
- [Directory Structure](#-directory-structure)
- [Local Development Setup](#-local-development-setup)
- [Running Automated Tests](#-running-automated-tests)
- [Manual Deployment to Ubuntu EC2](#-manual-deployment-to-ubuntu-ec2)
- [Integration with Packer Golden AMI](#-integration-with-packer-golden-ami)
- [API Documentation](#-api-documentation)

---

## ✨ Application Features

1. **Authentication & Multi-Tenancy:**
   - User registration (4–30 char username, unique enforcement).
   - Strong password requirements (>= 12 chars, upper, lower, number, special char).
   - Salted bcrypt password hashing (12 rounds).
   - Stateless JWT authentication via HTTP-only cookies or Authorization Bearer headers.
   - Helmet security headers and brute-force rate limiting.
   - Strict per-user data isolation (`user_id = req.user.id`).

2. **Task CRUD & Status Workflows:**
   - Create, edit, search, and delete tasks (with deletion confirmation dialog).
   - Status toggle: Mark as completed (`status = 'COMPLETED'`, records `completed_at` timestamp) or mark as pending (`completed_at = null`).
   - Separate views for pending and completed tasks.

3. **Historical Reports (Direct MySQL Queries):**
   - **Daily Filter:** View tasks created on a selected date.
   - **Monthly Filter:** View tasks created in a selected month, grouped by date.
   - **Range Filter:** Custom start and end date range.
   - High-performance composite indexes on `(user_id, created_at)` and `(user_id, status)`.

4. **Responsive Dashboard:**
   - Summary cards: Total tasks, pending, completed, and due today.
   - Completion percentage progress meter.
   - Recent tasks table with quick actions.
   - Quick Add Task modal accessible from any screen.
   - Responsive for mobile, tablet, and desktop.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Axios, Lucide React, Custom CSS |
| **Backend** | Node.js 22 LTS, Express.js, JWT, bcryptjs, Helmet, Express-Rate-Limit |
| **Database** | MySQL 8.x (InnoDB, utf8mb4, UTC timestamps, mysql2 promise pool) |
| **Web Server** | Nginx (static file hosting & reverse proxy to port 5000) |
| **Process Manager** | PM2 |

---

## 📂 Directory Structure

```
todo-app/
├── backend/
│   ├── database/
│   │   ├── schema.sql         # InnoDB tables, foreign keys, and indexes
│   │   └── init-db.js         # Database migration runner script
│   ├── src/
│   │   ├── config/            # MySQL connection pool configuration
│   │   ├── controllers/       # Auth, Task, History, and Dashboard controllers
│   │   ├── middleware/        # JWT auth, rateLimiter, validation, errorHandler
│   │   ├── models/            # Parameterized SQL models
│   │   ├── routes/            # Express route declarations
│   │   ├── app.js             # Express application configuration
│   │   └── server.js          # Server startup & graceful shutdown
│   ├── tests/                 # 32 Jest + Supertest integration tests
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components (Sidebar, Modals, Cards)
│   │   ├── context/           # AuthContext (user, token, session)
│   │   ├── pages/             # Dashboard, Tasks, Completed, History, Auth
│   │   ├── services/          # Axios API client functions
│   │   ├── styles/            # Responsive CSS design system
│   │   ├── App.jsx            # React Router route structure
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── config/
│   ├── nginx/todo-app.conf    # Nginx reverse proxy virtual host
│   ├── pm2/ecosystem.config.js# PM2 production process configuration
│   └── systemd/todo-app-first-boot.service
├── docs/
│   ├── manual-deployment.md   # Step-by-step Ubuntu EC2 deployment guide
│   ├── architecture.md        # Architecture overview & Mermaid diagrams
│   └── api.md                 # REST API reference and payload specifications
├── .env.example
└── README.md
```

---

## 💻 Local Development Setup

### 1. Start Local MySQL
```bash
docker run -d --name todo-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=todo_application \
  -e MYSQL_USER=todo_user \
  -e MYSQL_PASSWORD=todo_password \
  -p 3306:3306 mysql:8
```

### 2. Start the Backend
```bash
cd backend
cp .env.example .env
npm install
npm run db:init     # Applies database/schema.sql
npm run dev         # Starts Express API on http://localhost:5000
```

### 3. Start the Frontend
```bash
cd ../frontend
npm install
npm run dev         # Starts Vite dev server on http://localhost:5173
```
Open `http://localhost:5173` in your browser. All `/api` requests are proxied automatically to `http://127.0.0.1:5000`.

---

## 🧪 Running Automated Tests

```bash
cd backend
npm test
```
Executes 32 comprehensive tests covering registration, login, JWT issuance, task CRUD, status toggling, daily/monthly/range historical queries, and multi-tenant data isolation.

To test the frontend production build:
```bash
cd frontend
npm run build
```

---

## 🚀 Manual Deployment to Ubuntu EC2

If you want to manually deploy this application onto a standalone Ubuntu 24.04 LTS EC2 instance without Packer:

👉 **[Read the Complete Step-by-Step Manual Deployment Guide](file:///todo-app/docs/manual-deployment.md)**

Summary of manual steps:
1. Provision Ubuntu 24.04 EC2 instance.
2. Install Node.js 22, PM2, Nginx, and MySQL 8.
3. Copy this `todo-app` directory to `/var/www/todo-app`.
4. Run `npm ci --only=production` in `backend` and `npm ci && npm run build` in `frontend`.
5. Configure MySQL database, create user, and run migrations.
6. Configure `/etc/todo-app/todo-app.env` and Nginx reverse proxy.
7. Start the backend with PM2.

---

## 📦 Integration with Packer Golden AMI

This entire `todo-app` directory is structured to serve as the application payload for the companion Packer project.

To bake this application into an immutable AWS Golden AMI:
1. Copy the contents of this `todo-app/` directory into `packer-golden-ami/app-payload/`.
2. Run `packer build .` inside the `packer-golden-ami/` directory.

---

## 📚 API Documentation

Detailed REST API endpoints, request bodies, query parameters, and JSON response samples are documented in [docs/api.md](file:///todo-app/docs/api.md).
