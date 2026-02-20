# Complaint System Backend

Express + TypeScript API for the Online Complaint and Grievance Redressal System. Handles authentication, complaint workflows, AI priority analysis, and image uploads.

## Technology Stack

- Node.js, Express 5, TypeScript
- MongoDB + Mongoose
- JWT auth + bcrypt
- Google Generative AI (Gemini) for priority analysis
- Cloudinary + Multer for image uploads
- Winston logging

## Project Structure

```
src/
├── index.ts                          # App entry
├── controller/
│   └── auth.controller.ts            # Register, login, auto-login
├── routes/
│   ├── auth.routes.ts                # /api/auth/*
│   └── complaints.ts                 # /complaints/*
├── models/
│   ├── users.ts                      # User schema
│   └── complaints.ts                 # Complaint schema
├── middleware/
│   ├── auth.middleware.ts            # JWT + role checks
│   └── request-logger.middleware.ts  # Request logging
├── helper/
│   ├── ai.ts                         # Gemini priority analysis
│   └── cloudinary.ts                 # Cloudinary upload helper
└── utils/
    └── logger.ts                     # Winston logger
```

## Prerequisites

- Node.js 18+
- MongoDB instance
- Cloudinary account
- Gemini API key

## Configuration

Create backend/.env:

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

## Install and Run

```
cd backend
npm install
npm run dev
```

Build + start:

```
npm run build
npm start
```

## Scripts

- npm run dev: start API with tsx
- npm run build: compile TypeScript
- npm start: run compiled server

## API Routes

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

## Roles

- User: create and manage own complaints
- Support Staff: view assigned complaints and update status/priority
- Admin: full access, assignment, and reassignment

## Notes

- The server listens on PORT (defaults to 3000).
- Complaint priority is inferred by Gemini; unexpected responses fall back to medium.
- **Error Responses**:
  - `401`: Token not provided or invalid
  - `500`: Internal server error / Image upload failed

---

#### 5. **Get All Complaints (with filters)**
- **Method**: `GET`
- **Path**: `/complaints`
- **Authentication**: Bearer Token (Required) - Any authenticated user
- **Query Parameters** (all optional):
  ```
  status=string          // Filter by status: open|assigned|inProgress|resolved|closed
  priority=string        // Filter by priority: low|medium|high|critical
  q=string              // Search complaints by title or description (case-insensitive)
  ```
- **Processing**:
  - Extracts user ID and role from JWT token
  - Builds filter based on query parameters:
    - If status provided: filter by status
    - If priority provided: filter by priority
    - If search term provided: search title and description with regex
  - **Role-based filtering**:
    - **Admin**: Returns all complaints matching filters, populated with creator username
    - **Support Staff**: Returns only complaints assigned to them, filtered by parameters
    - **User**: Returns only their own complaints, filtered by parameters
  - Selects specific fields (title, description, status, priority, createdAt)
  - Populates creator information
  - Returns filtered list
- **Success Response (200)**:
  ```json
  {
    "complaints": [
      {
        "_id": "complaint_id",
        "title": "string",
        "description": "string",
        "status": "open|assigned|inProgress|resolved|closed",
        "priority": "low|medium|high|critical",
        "createdAt": "ISO_date",
        "createdBy": {
          "_id": "user_id",
          "username": "string"
        }
      }
    ],
    "message": "enga service ah use pannadhuku nandri"
  }
  ```
- **Error Responses**:
  - `401`: Token not provided or invalid
  - `500`: Internal server error

---

#### 6. **Get Single Complaint Details**
- **Method**: `GET`
- **Path**: `/complaints/:id`
- **Authentication**: Bearer Token (Required)
- **URL Parameters**:
  ```
  id: string  // MongoDB complaint ID
  ```
- **Processing**:
  - Extracts user ID and role from JWT token
  - Retrieves complaint by ID
  - Populates creator and assignee information with usernames
  - **Authorization check**: Allows access only if:
    - User is the complaint creator, OR
    - User is the assigned support staff, OR
    - User is admin
  - If unauthorized, returns 403 Forbidden
- **Success Response (200)**:
  ```json
  {
    "complaint": {
      "_id": "complaint_id",
      "title": "string",
      "description": "string",
      "status": "open|assigned|inProgress|resolved|closed",
      "priority": "low|medium|high|critical",
      "imageUrl": "https://...",  // Optional
      "createdAt": "ISO_date",
      "createdBy": {
        "_id": "user_id",
        "username": "string"
      },
      "assignedTo": {
        "_id": "user_id",
        "username": "string"
      }  // May be null if not assigned
    }
  }
  ```
- **Error Responses**:
  - `401`: Token not provided or invalid
  - `403`: Forbidden - unauthorized access
  - `404`: Complaint not found
  - `500`: Internal server error

---

#### 7. **Update Complaint**
- **Method**: `PUT`
- **Path**: `/complaints/:id`
- **Authentication**: Bearer Token (Required)
- **URL Parameters**:
  ```
  id: string  // MongoDB complaint ID
  ```
- **Request Body** (JSON):
  ```json
  {
    "title": "string",           // Optional - for users only
    "description": "string",     // Optional - for users only
    "status": "string",          // Optional
    "priority": "string",        // Optional
    "assignedTo": "userId",      // Optional - admin only
    "comment": "string"          // Optional - comment for timeline
  }
  ```
- **Processing**:
  - **Role-based authorization and permissions**:
    - **Admin**: Can update any field, assign complaints
    - **Support Staff**: Can only update status/priority for assigned complaints
    - **User**: Can only update own complaints' title/description/status
  - Checks if user is authorized for the action
  - Identifies what changed and generates appropriate timeline comment
  - If status changed: timeline comment is "Status changed to {status}"
  - If priority changed: timeline comment is "Priority changed to {priority}"
  - If assigned: timeline comment is "Complaint reassigned"
  - Custom comment can override auto-generated messages
  - Creates timeline entry with:
    - Current status
    - Timestamp
    - User who made change
    - Change comment
  - Saves updated complaint
  - Logs update event
- **Success Response (200)**:
  ```json
  {
    "message": "Complaint updated successfully"
  }
  ```
- **Error Responses**:
  - `400`: Invalid parameters
  - `401`: Token not provided or invalid
  - `403`: Forbidden - unauthorized access/modification
  - `404`: Complaint not found
  - `500`: Internal server error

---

#### 8. **Update Complaint Status (Dedicated endpoint)**
- **Method**: `PUT`
- **Path**: `/complaints/:id/status`
- **Authentication**: Bearer Token (Required)
- **Authorization**: Admin or Support Staff only
- **URL Parameters**:
  ```
  id: string  // MongoDB complaint ID
  ```
- **Request Body** (JSON):
  ```json
  {
    "status": "open|assigned|inProgress|resolved|closed",  // Required
    "comment": "string"                                     // Optional
  }
  ```
- **Processing**:
  - Verifies user is admin or support staff
  - If support staff: checks user is assigned to complaint
  - If admin: allows status update for any complaint
  - Validates new status differs from current status
  - Updates complaint status
  - Creates timeline entry with:
    - New status
    - Timestamp
    - User who updated
    - Comment (custom or default "{status} changed to {new_status}")
  - Saves complaint
  - Logs status update
- **Success Response (200)**:
  ```json
  {
    "message": "Complaint status updated successfully"
  }
  ```
- **Error Responses**:
  - `400`: Complaint already has that status
  - `401`: Token not provided or invalid
  - `403`: Forbidden - not admin/support staff or not assigned
  - `404`: Complaint not found
  - `500`: Internal server error

---

#### 9. **Add Feedback to Complaint**
- **Method**: `POST`
- **Path**: `/complaints/:id/feedback`
- **Authentication**: Bearer Token (Required)
- **Authorization**: Only regular users can provide feedback
- **URL Parameters**:
  ```
  id: string  // MongoDB complaint ID
  ```
- **Request Body** (JSON):
  ```json
  {
    "rating": 1-5,      // Required - numeric rating
    "comment": "string" // Required - feedback comment
  }
  ```
- **Processing**:
  - Verifies user is a regular "user" role (not admin/support staff)
  - Verifies user is the complaint creator
  - Checks complaint status is "resolved" or "closed"
  - Only resolved/closed complaints can receive feedback
  - Stores feedback in complaint document with:
    - Numeric rating (1-5)
    - Text comment
    - Creation timestamp
    - Update timestamp
  - Saves complaint
  - Logs feedback addition
- **Success Response (200)**:
  ```json
  {
    "message": "Feedback added successfully"
  }
  ```
- **Error Responses**:
  - `400`: Complaint not resolved/closed yet
  - `401`: Token not provided or invalid
  - `403`: Forbidden - only users can provide feedback / not complaint creator
  - `404`: Complaint not found
  - `500`: Internal server error

---

## 📊 Data Models

### User Model
```typescript
{
  _id: MongoDB ObjectId
  username: string (unique)
  email: string (unique)
  passwordHash: string (bcrypt hashed)
  role: "user" | "admin" | "supportStaff"
  createdAt: Date
}
```

### Complaint Model
```typescript
{
  _id: MongoDB ObjectId
  title: string
  description: string
  status: "open" | "assigned" | "inProgress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "critical"
  imageUrl?: string (Cloudinary URL)
  createdBy: User reference (ObjectId)
  assignedTo?: User reference (ObjectId)
  timeline: Array of {
    status: string
    timestamp: Date
    comment?: string
    createdAt: Date
    createdBy: User reference (ObjectId)
  }
  createdAt: Date
  updatedAt: Date
  feedback?: {
    rating: number (1-5)
    comment: string
    createdAt: Date
    updatedAt: Date
  }
}
```

## 🔄 Complaint Workflow

1. **User creates complaint** → Status: `open`, Priority: AI-analyzed
2. **Admin assigns to support staff** → Status: `assigned`, `assignedTo` is set
3. **Support staff updates status** → Status: `inProgress`
4. **Support staff resolves** → Status: `resolved`
5. **User provides feedback** → Feedback added to complaint
6. **Admin marks as closed** → Status: `closed` (final state)

## 🤖 AI Priority Analysis

When a complaint is created:
- Title and description are sent to Google's Gemini API
- AI analyzes urgency and returns priority level
- Default priority is "medium" if AI fails
- Priority can be manually overridden by admin/support staff

## 🖼️ Image Upload

- Images are uploaded to Cloudinary on complaint creation
- Stored in 'ibm_hackathon_complaints' folder
- Secure HTTPS URLs are stored in complaint document
- Supports any image format (auto-detected by Cloudinary)

## 📝 Logging

All activities are logged using Winston:
- **Log Levels**: error, warn, info, http, debug
- **Log Files**:
  - `logs/combined.log` - All logs
  - `logs/error.log` - Error logs only
- **HTTP Request Logging**: Duration and status code tracked automatically

## 🔐 Security Features

- **Password Hashing**: bcrypt with 10 rounds
- **JWT Authentication**: 2-hour token expiration
- **Role-based Access Control**: Different permissions per role
- **Authorization Checks**: Field-level access control
- **Admin Secret**: Required to register as admin
- **Error Handling**: Server errors don't expose sensitive information

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- Cloudinary account
- Google Generative AI API key
- Environment variables configured

### Installation
```bash
npm install
```

### Build
```bash
npm run build
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📝 Environment Variables
```
MONGODB_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_secret_key
ADMIN_SECRET=your_admin_registration_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development|production
```

## 📜 License
ISC

---

**Built for IBM Hackathon**
