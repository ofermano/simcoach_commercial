# Backend setup – run from scratch

Follow these steps so the backend work.

---

## 1. Prerequisites

- **Python 3.10+**
- **PostgreSQL** installed and running (local or remote)
- Terminal in the **Backend** folder: `d:\Flow Simulation\Backend`

---

## 2. Create and use a virtual environment

```powershell
cd "d:\Flow Simulation\Backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
```

You should see `(venv)` in the prompt.

---

## 3. Install dependencies

```powershell
pip install -r requirements.txt
```

---

## 4. Create the database in PostgreSQL

PostgreSQL must have a database named `flow_simulation` (or whatever you set in `.env`).

**Option A – psql (if you have it):**

```powershell
psql -U postgres -c "CREATE DATABASE flow_simulation;"
```

**Option B – pgAdmin or any SQL client:** run:

```sql
CREATE DATABASE flow_simulation;
```

---

## 5. Configure environment (`.env`)

Copy the example and edit with your values:

```powershell
copy .env.example .env
notepad .env
```

**Minimum to run locally:**

| Variable       | What to set                  | Example                                                                 |
| -------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL URL for your DB   | `postgresql+asyncpg://postgres:postgres@localhost:5432/flow_simulation` |
| `SECRET_KEY`   | Long random string (for JWT) | Keep default for dev, or generate one for production                    |

**Format of `DATABASE_URL`:**  
`postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DATABASE`

- **USER** – PostgreSQL user (e.g. `postgres`)
- **PASSWORD** – that user’s password
- **HOST** – `localhost` or your DB host
- **PORT** – usually `5432`
- **DATABASE** – `flow_simulation` (must exist)

**Optional (needed for full features):**

| Variable                     | When needed                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `SMTP_USER`, `SMTP_PASSWORD` | Sending whitelist approval emails and super admin 6-digit codes |
| `GOOGLE_CLIENT_ID`           | Google sign-in                                                  |
| `FRONTEND_SIGNUP_URL`        | Link in approval email (e.g. `http://localhost:5173/signup`)    |

---

## 6. Run migrations (Alembic)

With the venv active and `.env` set (especially `DATABASE_URL`):

```powershell
alembic upgrade head
```

You should see something like:

```
INFO  [alembic.runtime.migration] Running upgrade 001 -> 002, Add super_admins ...
```

This creates/updates tables: `users`, `whitelist_applications`, `super_admins`, and seeds one super admin (username `admin`, password `admin`).

---

## 7. Start the API server

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: **http://localhost:8000**
- Docs: **http://localhost:8000/docs**
- Health: **http://localhost:8000/health**

---

## Quick reference – all commands

```powershell
cd "d:\Flow Simulation\Backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env: set DATABASE_URL (and create DB in PostgreSQL first)
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Troubleshooting

| Problem                           | Fix                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| `No module named 'alembic'`       | Activate venv and run `pip install -r requirements.txt` again.                                |
| `alembic: command not found`      | Use `python -m alembic upgrade head` instead of `alembic upgrade head`.                       |
| Database connection error         | Check PostgreSQL is running, DB exists, and `DATABASE_URL` in `.env` is correct.              |
| `relation "users" already exists` | DB was partly migrated. Run `alembic current` then `alembic upgrade head`; or fix and re-run. |
