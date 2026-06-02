# ACEPlay_AdminPanel

# ACEPlay Admin System

Admin panel and REST API for managing ACEPlay website content including casinos, promotions, banners, games, navigation menus, homepage sections, and site settings.

---

## Architecture

```text
Admin Panel (Nuxt)
        │
        ▼
Auth API (/api/auth) + Admin API (/api/admin)
        │
        ▼
     MongoDB

ACEPlay Website
        │
        ▼
 Public API (/api/public)
        │
        ▼
 MongoDB (Published Content Only)
```

### Authentication Flow

* Administrators can register and log in through the Admin Panel.
* Authentication is handled using JWT tokens.
* All Admin API routes require a valid JWT Bearer Token.
* Public API endpoints are read-only and expose only published content.

---

## Features

### Admin Management

* Admin Registration
* Admin Login
* JWT Authentication
* Protected CRUD Operations

### Content Management

* Site Settings
* Navigation Menu
* Hero Banners
* Big Wins Carousel
* Popular Games
* Exclusive Promotions
* Promotion Banners
* Casinos
* Games
* Countries

### Public Content Delivery

* Homepage Content API
* Published Casinos
* Published Banners
* Published Promotions
* Published Games
* Other Published Website Content

---

## Prerequisites

Before running the project, ensure you have:

* Node.js 18+
* MongoDB (Local or MongoDB Atlas)
* Docker (Optional)

---

# Backend Setup

## 1. Clone Repository

```bash
git clone <repository-url>
cd aceplay-admin-system
```

## 2. Configure Environment Variables

```bash
cp .env.example .env
```

Update the `.env` file and set:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

## 3. Start MongoDB (Optional)

Using Docker:

```bash
docker compose up -d
```

## 4. Install Dependencies

```bash
npm install
```

## 5. Start Development Server

```bash
npm run dev
```

Backend API will run at:

```text
http://localhost:5000
```

---

# Authentication API

Base URL:

```text
/api/auth
```

| Method | Endpoint  | Description                     |
| ------ | --------- | ------------------------------- |
| POST   | /register | Create admin account            |
| POST   | /login    | Authenticate and receive JWT    |
| GET    | /me       | Get current authenticated admin |

### Authorization Header

```http
Authorization: Bearer <jwt_token>
```

---

# Admin API

Base URL:

```text
/api/admin
```

All endpoints require authentication.

| Section           | Endpoint       |
| ----------------- | -------------- |
| Site Settings     | /site-settings |
| Navigation Menu   | /navigation    |
| Hero Banners      | /banners       |
| Big Wins Carousel | /big-wins      |
| Popular Games     | /popular-games |
| Promotions        | /promotions    |
| Casinos           | /casinos       |
| Games             | /games         |
| Countries         | /countries     |

---

# Public API

Base URL:

```text
/api/public
```

Read-only endpoints exposing published content.

### Homepage

```http
GET /api/public/homepage
```

Returns the complete homepage payload for the ACEPlay website.

### Additional Endpoints

```http
GET /api/public/casinos
GET /api/public/banners
GET /api/public/big-wins
GET /api/public/promotions
GET /api/public/games
GET /api/public/countries
```

---

# Frontend Setup (Nuxt)

Navigate to the frontend directory:

```bash
cd frontend
```

## Configure Environment Variables

```bash
cp .env.example .env
```

Update:

```env
NUXT_PUBLIC_API_BASE=http://localhost:5000
```

## Install Dependencies

```bash
npm install
```

## Start Development Server

```bash
npm run dev
```

Frontend will run at:

```text
http://localhost:3000
```

> Ensure the backend server is running before starting the frontend application.

---

# Available Scripts

## Backend

| Command     | Description                  |
| ----------- | ---------------------------- |
| npm run dev | Start development API server |
| npm start   | Start production API server  |

## Frontend

| Command       | Description                   |
| ------------- | ----------------------------- |
| npm run dev   | Start Nuxt development server |
| npm run build | Build frontend for production |

---

# Technology Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication

### Frontend

* Nuxt.js
* Vue.js
* Tailwind CSS

### DevOps

* Docker
* Docker Compose

---

# Project Structure

```text
aceplay-admin-system/
│
├── controllers/
├── routes/
├── models/
├── middleware/
├── config/
├── frontend/
│   ├── pages/
│   ├── components/
│   └── layouts/
│
├── .env
├── package.json
└── README.md
```

---

## License

This project is proprietary and intended for ACEPlay internal administration and content management.
