# RecruitAI Client

React + Redux frontend for the AI Recruitment Platform.

## Stack

- React 19 + Vite
- Redux Toolkit
- React Router v7
- Tailwind CSS v4
- Sonner (toast notifications)
- Radix UI primitives (shadcn-style components)

## Run

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Backend must run on `http://localhost:3000` (Vite proxies `/api`).

## Auth routes

| Route | Description |
|-------|-------------|
| `/login` | Sign in |
| `/signup/:token` | Accept invitation & set password |
| `/dashboard` | Protected dashboard (placeholder) |

## Test sign-up flow

Use an invitation token from the backend email/console:

```
http://localhost:5173/signup/<invite-token>
```

After activation, sign in at `/login`.
