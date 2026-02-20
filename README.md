# Online Complaint and Grievance Redressal System

An intelligent complaint management platform that lets users submit complaints, track status, and enables admins/support staff to triage and resolve issues efficiently. The project has a Node/Express + MongoDB backend and a Next.js frontend.

## Project Structure

```
backend/   # Express + TypeScript API
frontend/  # Next.js 14+ App Router UI
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local or hosted)
- Cloudinary account (image uploads)
- Google Gemini API key (AI priority analysis)

## Setup

### 1) Backend configuration

Create a .env file in backend/:

```
MONGODB_URI=mongodb://localhost:27017/complaints
JWT_SECRET=your_jwt_secret
ADMIN_SECRET=your_admin_signup_secret
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
PORT=3000
NODE_ENV=development
```

Notes:
- PORT defaults to 3000 if not set.
- ADMIN_SECRET is required only when registering admin accounts.

### 2) Install dependencies

From the repository root:

```
cd backend
npm install

cd ../frontend
npm install
```

## Run the project

### Start the backend

```
cd backend
npm run dev
```

The backend listens on http://localhost:3000 by default.

### Start the frontend

The frontend fetches the API from http://localhost:3000 (see frontend/src/utils/api.ts). Because the backend uses port 3000, start Next.js on another port:

```
cd frontend
PORT=3001 npm run dev
```

Open http://localhost:3001

## Production build

Backend:

```
cd backend
npm run build
npm start
```

Frontend:

```
cd frontend
npm run build
npm start
```

## Useful scripts

Backend (backend/package.json):
- npm run dev: start API with tsx
- npm run build: compile TypeScript
- npm start: run compiled server

Frontend (frontend/package.json):
- npm run dev: start Next.js dev server
- npm run build: build for production
- npm start: run production server

## API overview

Base URL: http://localhost:3000

Auth:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/me

Complaints:
- POST /complaints
- GET /complaints
- GET /complaints/:id
- PUT /complaints/:id
- PUT /complaints/:id/status

See the detailed backend API docs in backend/README.md and frontend behavior in frontend/README.md.

## Troubleshooting

- CORS errors: ensure the backend is running and reachable at http://localhost:3000.
- Port conflicts: keep backend on 3000 and run frontend on 3001 (PORT=3001 npm run dev).
- Images not uploading: do not set Content-Type manually for FormData requests.

## License

ISC
