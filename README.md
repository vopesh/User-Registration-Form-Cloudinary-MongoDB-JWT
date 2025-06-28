# User-Registration-Form-Cloudinary-MongoDB-JWT

A full-stack Node.js application that lets users sign up with an avatar photo, log in securely, and manage their profile.  
Key goals:

* **Zero-friction onboarding** – single multipart request uploads the profile photo to Cloudinary and stores the user in MongoDB.
* **Hardened security** – short-lived access tokens, 7-day refresh tokens, HTTP-only cookies, helmet CSP, rate-limiting, IP allow-listing, and soft-delete with 24 h TTL.
* **Dual interface** – server-rendered EJS pages *and* a clean JSON REST API.

---

## ✨ Features

| Area | Details |
|------|---------|
| **Auth** | Bcrypt-hashed passwords, HS256 JWT access (15 min) + refresh (7 days) cookies, single-session enforcement |
| **Media** | Avatar upload to Cloudinary folder `vopesh-lec18-user-profiles`; local temp file auto-deleted |
| **Data** | MongoDB with Mongoose models for *User*, *RefreshToken*, *DeletedUser* (soft delete with TTL) |
| **Security** | Helmet CSP, rate-limiter (10 req/min/IP) with auto-block, optional 14-day IP allow-listing, secure/strict cookies, session rolling |
| **Admin UX** | Recent-user list (last 10) and soft-delete/restore flow (24 h grace) |
| **API first** | All logic exposed under `/api/*` so the same backend serves SPA/mobile/CLI clients |

---

## 🏗  Tech Stack

* **Runtime** – Node.js 20 +, Express 5
* **Database** – MongoDB + Mongoose
* **Auth** – JSON Web Token, Express-Session (SSR fallback)
* **File store** – Cloudinary
* **Templating** – EJS (for quick SSR pages)
* **Other libs** – dotenv, multer, bcryptjs, connect-flash, express-rate-limit, connect-mongo, helmet

---

## 📂 Project Structure

├── models/ # Mongoose schemas
├── routes/ # SSR + API route files
├── controllers/ # Business logic
├── middlewares/ # auth, rate-limit, error handler…
├── public/ # Static assets
├── views/ # EJS templates
└── server.js # App entry-point

## 🔑 Environment Variables (`.env`)

| Variable | Purpose |
|----------|---------|
| `PORT` | Port to listen on (default 1003) |
| `NODE_ENV` | `development` / `production` |
| `MONGO_URI` | MongoDB connection string |
| `DB_NAME` | Database name |
| `SESSION_SECRET` | Secret for Express-Session |
| `JWT_SECRET` | Signing key for 15-min access tokens |
| `JWT_REFRESH_SECRET` | Signing key for 7-day refresh tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account |
| `CLOUDINARY_API_KEY` | — |
| `CLOUDINARY_API_SECRET` | — |
| `CLOUDINARY_SECURE` | `true` to force https URLs |
| `CLOUDINARY_UPLOAD_FOLDER` | Folder for user avatars |

Create `.env` by copying `.env.example` and filling in the blanks.

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/<you>/<repo>.git
cd <repo>

# 2. Install deps
npm install

# 3. Configure environment
cp .env.example .env
#   → edit .env with your keys

# 4. Run the dev server
npm run dev       # nodemon + dotenv
#   or
node server.js
Server starts on http://localhost:1003 (or your PORT).



API Reference
All endpoints are prefixed with /api and return JSON.

| Method & Path            | Protected | Body / Params                                                          | Purpose                                                           |
| ------------------------ | --------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `POST  /register`        | No        | `name,email,password,country,countryCode,phone`, **multipart** `photo` | Create account + upload avatar                                    |
| `POST  /login`           | No        | `email,password`                                                       | Issue access + refresh tokens (refresh token in HTTP-only cookie) |
| `GET   /users`           | Yes       | Query `?country=&name=`                                                | List users                                                        |
| `GET   /users/:userId`   | Yes       | —                                                                      | Fetch single user                                                 |
| `PUT   /update/:userId`  | Yes       | Editable fields (no password/photo)                                    | Update profile fields                                             |
| `DELETE /delete/:userId` | Yes       | —                                                                      | Soft delete (moves to `deletedUser` archive)                      |
| `PATCH /revoke/:userId`  | Yes       | —                                                                      | *Undo* delete within 24 h                                         |
| `POST  /token/refresh`   | No        | Refresh token cookie                                                   | Rotate + re-issue access token                                    |

Include header Authorization: Bearer <accessToken> on protected routes.


🛡 Security & Hardening
Helmet CSP – locks down script/style/img origins.

Rate-Limiter – 10 req/min; offending IPs blocked for 2 h.

IP Whitelist – /whitelist endpoint marks current IP “safe” for 14 days (stored hashed).

Soft-Delete TTL – archived records auto-purged after 24 h via MongoDB TTL index.

Session Hijack Prevention – single sessionId per user, invalidated on logout/login elsewhere.


🛠 Development Scripts
Command	What it does
npm run dev	Nodemon + dotenv reload


Released under the MIT License – see LICENSE for details.


