# Complaint System Frontend

Next.js 14+ UI for the Online Complaint and Grievance Redressal System. Provides authentication, complaint submission, dashboards, and detail views.

## Technology Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Custom API wrapper with JWT attachment

## Features

- Authentication (login, register, auto-login)
- Role-based dashboards (User, Admin, Support Staff)
- Complaint creation with image upload
- Complaint detail view with timeline
- Status and priority updates

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── admin/page.tsx
│   │   └── complaints/[id]/page.tsx
│   ├── types/index.ts
│   └── utils/api.ts
├── package.json
├── next.config.mjs
├── tailwind.config.js
└── tsconfig.json
```

## Prerequisites

- Node.js 18+
- Backend API running (defaults to http://localhost:3000)

## Install and Run

```
cd frontend
npm install
PORT=3001 npm run dev
```

Open http://localhost:3001

## Build and Start

```
npm run build
npm start
```

## API Integration

The base URL is hardcoded in src/utils/api.ts:

```
const API_BASE_URL = 'http://localhost:3000';
```

Update that value if your backend runs on a different host or port.

## Routes Used

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/me
- GET /complaints
- POST /complaints
- GET /complaints/:id
- PUT /complaints/:id
- PUT /complaints/:id/status

## Status and Priority

Status values: open, assigned, inProgress, resolved, closed

Priority values: low, medium, high, critical
- `medium` - Medium urgency
- `high` - High urgency
- `critical` - Critical urgency

## 🔒 Security

- JWT tokens stored in localStorage
- Automatic token attachment to API requests
- Client-side route protection
- Role-based access control
- Secure image uploads via FormData

## 📝 Development Notes

- Uses Next.js 14 App Router (not Pages Router)
- All pages are client components (`'use client'`)
- TypeScript strict mode enabled
- Tailwind utility-first CSS approach
- No external state management library (uses React hooks)

## 🐛 Troubleshooting

**Issue:** API requests fail with CORS errors
- **Solution:** Ensure backend has CORS enabled for `http://localhost:3000`

**Issue:** Images not uploading
- **Solution:** Check that `Content-Type` is NOT set for FormData requests

**Issue:** "Token expired" errors
- **Solution:** Log out and log in again (tokens expire after 2 hours)

**Issue:** Role redirect not working
- **Solution:** Clear localStorage and re-authenticate

## 📄 License

ISC

---

**Built for IBM Hackathon**
