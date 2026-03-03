# Flow Simulation Backend

FastAPI backend with **Google OAuth** and **email/password** login. Only **whitelisted** users can sign in. Users apply for whitelisting; once approved, the backend sends an email with a signup link so they can set a password (for email login).

## Features

- **Google OAuth** – Frontend sends Google ID token; backend verifies and issues JWT (only if user is whitelisted).
- **Email/password login** – After whitelist approval, user receives an email with a one-time signup link to set a password; then they can log in with email/password.
- **Whitelist application** – `POST /whitelist/apply` with email (and optional Google `id_token` to link account).
- **Admin** – List pending applications, approve (sends signup email), or deny.
- **PostgreSQL** – All data stored in Postgres (users, whitelist applications, signup tokens).

## Setup

### 1. Python & venv

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### 2. PostgreSQL

Create a database, e.g.:

```sql
CREATE DATABASE flow_db;
```

### 3. Environment

Copy `.env.example` to `.env` and set:

- **DATABASE_URL** – e.g. `postgresql+asyncpg://postgres:postgres@localhost:5432/flow_db`
- **SECRET_KEY** – long random string for JWT
- **ALGORITHM** – e.g. `HS256`
- **ACCESS_TOKEN_EXPIRE_MINUTES** – e.g. `60`
- **GOOGLE_CLIENT_ID** and **GOOGLE_CLIENT_SECRET** – from Google Cloud Console (OAuth 2.0 credentials)
- **SMTP settings** – for whitelist / signup emails (`SMTP_USER`, `SMTP_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM`, etc.)
- **FRONTEND_SIGNUP_URL** – e.g. `http://localhost:5173/signup` (email link will be `FRONTEND_SIGNUP_URL?token=...`)
- **SUPER_ADMIN_EMAIL** – email for the super admin (also used as their username)
- **SUPER_ADMIN_PASSWORD** – password for the super admin

> Alembic loads `Backend/.env` automatically (see `alembic/env.py`), so migrations read these values from the environment.

### 4. Migrations (schema + super admin seed)

```bash
cd Backend
alembic upgrade head
```

This will:

- Create all tables (`users`, `whitelist_applications`, `super_admins`, `questionnaire_responses`, etc.).
- Seed a **super admin** with:
  - `username = SUPER_ADMIN_EMAIL` (log in with this email as username)
  - password from `SUPER_ADMIN_PASSWORD` (stored as a bcrypt hash)

If `SUPER_ADMIN_EMAIL` or `SUPER_ADMIN_PASSWORD` is missing, the migration will fail early.

### 5. Run the API

```bash
cd Backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API base: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email + password (whitelisted only) |
| POST | `/auth/google` | Login with Google ID token (whitelisted only) |
| POST | `/auth/signup` | Set password using token from approval email; returns JWT |
| GET | `/auth/me` | Current user (header: `Authorization: Bearer <token>`) |
| POST | `/whitelist/apply` | Apply for whitelisting (email + optional `id_token`) |
| GET | `/admin/whitelist/applications` | Paginated list of pending whitelist applications (super admin only) |
| POST | `/admin/whitelist/applications/{id}/approve` | Approve and send signup email |
| POST | `/admin/whitelist/applications/{id}/deny` | Deny application |
| GET | `/admin/questionnaires/users` | Paginated list of users with questionnaire responses (super admin only) |
| GET | `/admin/questionnaires/{user_id}` | Full questionnaire history for a user (super admin only) |

## Frontend flow

1. **Whitelisting:** User submits email (and optionally signs in with Google and sends `id_token` to link account). Frontend calls `POST /api/whitelist/apply`.
2. **After approval:** User gets email with link `FRONTEND_SIGNUP_URL?token=...`. On the signup page, frontend calls:
   - `POST /api/auth/signup` with `{ token, password }`, or
   - the Google-signup-with-token endpoint (for Google-based signup),
   to create the account and return a JWT.
3. **Login:** Frontend uses:
   - `POST /api/auth/google` with Google ID token, or
   - `POST /api/auth/login` with email/password.
   The returned `access_token` is sent as `Authorization: Bearer <token>` for protected routes.
4. **Onboarding:** Frontend calls:
   - `GET /api/whitelist/check` – to ensure the driver is whitelisted.
   - `GET /api/questionnaire` – to see if the questionnaire is completed.
   - `POST /api/questionnaire` – to store display name, driving level, goal, and driving style (history preserved).
5. **Super admin:** Logs in via `/api/admin/super-admin/*`, then uses:
   - `/api/admin/whitelist/applications` to manage whitelist approvals.
   - `/api/admin/questionnaires/users` and `/api/admin/questionnaires/{user_id}` to inspect driver profiles and questionnaire history.
