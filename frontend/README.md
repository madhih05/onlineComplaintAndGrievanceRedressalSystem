# Complaint System Frontend

A modern Next.js 14+ frontend application for the Online Complaint and Grievance Redressal System.

## 🚀 Technology Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React hooks (useState, useEffect)
- **API Communication:** Custom fetch wrapper with JWT authentication

## 📋 Features

- **Authentication System**
  - User login and registration
  - Role-based access control (User, Admin, Support Staff)
  - JWT token-based authentication
  - Auto-login with token verification

- **User Dashboard**
  - Submit new complaints with image upload
  - View personal complaints
  - Track complaint status
  - Click-to-view complaint details

- **Admin/Staff Dashboard**
  - View all complaints (Admin) or assigned complaints (Staff)
  - Update complaint status via dropdown
  - View user information
  - Track priorities set by AI

- **Complaint Detail Page**
  - View full complaint details
  - Timeline of complaint history
  - Edit complaint based on role permissions
  - Image display for attached files
  - Add comments to timeline

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page with auth redirect
│   │   ├── globals.css             # Global styles with Tailwind
│   │   ├── login/
│   │   │   └── page.tsx            # Login/Registration page
│   │   ├── dashboard/
│   │   │   └── page.tsx            # User dashboard
│   │   ├── admin/
│   │   │   └── page.tsx            # Admin/Staff dashboard
│   │   └── complaints/
│   │       └── [id]/
│   │           └── page.tsx        # Complaint detail page
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   └── utils/
│       └── api.ts                  # API fetch wrapper
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── next.config.mjs                 # Next.js config
├── tailwind.config.js              # Tailwind CSS config
├── postcss.config.js               # PostCSS config
└── .gitignore                      # Git ignore rules
```

## 🔐 User Roles

### User
- Submit complaints with title, description, and optional image
- View and edit own complaints
- Update complaint title, description, and status
- Add comments to timeline

### Support Staff
- View assigned complaints
- Update complaint status and priority
- Add comments to timeline

### Admin
- View all complaints
- Update any complaint
- Assign complaints to support staff
- Change status, priority, and assignee
- Full system access

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Backend API running on `http://localhost:3000`

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## 🔌 API Integration

The frontend communicates with the backend API at `http://localhost:3000`. The API wrapper automatically handles:

- JWT token attachment to requests
- Content-Type headers (JSON vs FormData)
- Error handling and message extraction
- Response parsing

### API Endpoints Used

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/me` - Token verification
- `GET /complaints` - Fetch complaints (filtered by role)
- `POST /complaints` - Create new complaint
- `GET /complaints/:id` - Get single complaint
- `PUT /complaints/:id` - Update complaint
- `PUT /complaints/:id/status` - Update complaint status

## 🎨 UI/UX Features

- **Responsive Design:** Works on desktop, tablet, and mobile
- **Loading States:** Spinners and disabled buttons during API calls
- **Error Handling:** User-friendly error messages
- **Success Feedback:** Toast-like success messages with actions
- **Color-Coded Badges:** 
  - Status badges (open, assigned, in progress, resolved, closed)
  - Priority badges (low, medium, high, critical)
- **Interactive Timeline:** Visual representation of complaint history
- **Form Validation:** Client-side validation with required fields
- **Role-Based UI:** Different interfaces and permissions per role

## 📱 Pages Overview

### 1. Home Page (`/`)
- Checks for stored JWT token
- Verifies token with backend
- Redirects to appropriate dashboard based on role

### 2. Login Page (`/login`)
- Toggle between login and registration
- Role selection for registration
- Admin secret validation
- Automatic redirect after successful auth

### 3. User Dashboard (`/dashboard`)
- Two-column layout
- Left: Submit new complaint form
- Right: Personal complaints list
- Success alerts with "Open Complaint" action

### 4. Admin Dashboard (`/admin`)
- Data table view of all/assigned complaints
- Inline status dropdown for quick updates
- Clickable titles to view details
- Priority and status badges

### 5. Complaint Detail Page (`/complaints/[id]`)
- View mode with full complaint details
- Edit mode with role-based form fields
- Timeline sidebar with history
- Image display for attachments
- Back navigation to dashboard

## 🚦 Status & Priority Values

### Status
- `open` - Newly created complaint
- `assigned` - Assigned to support staff
- `inProgress` - Being worked on
- `resolved` - Issue resolved
- `closed` - Ticket closed

### Priority (AI-Generated)
- `low` - Low urgency
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
