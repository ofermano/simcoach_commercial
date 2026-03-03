### Frontend Setup

#### Requirements

- **Node**: 18+ (or your current LTS)

#### Install

```bash
cd Frontend
npm install
```

#### Environment

```bash
cd Frontend
cp .env.example .env
```

Then edit `.env`:

- **VITE_API_URL**: usually `http://localhost:8000`
- **VITE_GOOGLE_CLIENT_ID**: must match backend `GOOGLE_CLIENT_ID`

#### Run dev server

```bash
npm run dev
# UI at http://localhost:5173
```

---

### Main Flows

#### Driver

- **`/join`** – Join beta waitlist.
- **Admin approval** – Super admin approves via `/admin`.
- **Email** – User receives an HTML approval email with a signup link.
- **`/signup?token=...`** – Complete signup, choosing Google or password.
- **`/onboarding`** – Forced questionnaire:
  - Display name
  - Driving level
  - Goal
  - Driving style
- **`/download`** – Only accessible if:
  - User is whitelisted, and
  - Questionnaire is completed.
- **`/profile`** – Driver can later edit display name and questionnaire answers.

#### Super admin

- **`/admin/login`** – 2-step email code login for super admin.
- **`/admin`** – Whitelist queue with pagination.
- **`/admin/profiles`** – Driver profiles and questionnaire history, with pagination.