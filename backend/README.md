# Online Complaint and Grievance Redressal System

An intelligent complaint management platform built during a hackathon that allows users to submit complaints, track their status, and helps administrators manage and resolve grievances efficiently.

## 🚀 Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **AI Integration**: Google Generative AI (Gemini API)
- **Image hosting**: Cloudinary
- **File Upload**: Multer
- **Logging**: Winston

## 📋 Project Structure

```
src/
├── index.ts                          # Application entry point
├── controller/
│   └── auth.controller.ts            # Authentication logic (register, login, auto-login)
├── routes/
│   ├── auth.routes.ts                # Authentication endpoints
│   └── complaints.ts                 # Complaint management endpoints
├── models/
│   ├── users.ts                      # User data model and schema
│   └── complaints.ts                 # Complaint data model and schema
├── middleware/
│   ├── auth.middleware.ts            # JWT verification and role authorization
│   └── request-logger.middleware.ts  # HTTP request logging
├── helper/
│   ├── ai.ts                         # AI-powered priority analysis
│   ├── cloudinary.ts                 # Image upload to Cloudinary
└── utils/
    └── logger.ts                     # Winston logging configuration
```

## 🔐 User Roles and Permissions

The system has three user roles with different permissions:

### 1. **User**
- Create complaints
- View own complaints
- Update own complaints (title, description, status)
- Provide feedback for resolved/closed complaints
- Cannot modify priority or assign to staff

### 2. **Support Staff**
- View assigned complaints only
- Update status and priority of assigned complaints
- Add comments to timeline
- Cannot reassign complaints

### 3. **Admin**
- View all complaints
- Assign complaints to support staff
- Update all complaint fields (status, priority, title, description)
- Reassign complaints
- Full system access

## 📡 API Endpoints Documentation

### Authentication Endpoints

#### 1. **User Registration**
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Authentication**: None (Public)
- **Request Body**:
  ```json
  {
    "username": "string",          // Unique username
    "email": "string",             // Unique email address
    "password": "string",          // Password (will be hashed)
    "role": "user|admin|supportStaff",  // Optional, defaults to "user"
    "adminSecret": "string"        // Required if role is "admin"
  }
  ```
- **Processing**:
  - Validates that email is not already registered
  - If registering as admin, verifies admin secret matches `ADMIN_SECRET` env variable
  - Hashes password using bcrypt (10 rounds)
  - Creates new user in database
  - Generates JWT token with userId and role
  - Logs registration event
- **Success Response (201)**:
  ```json
  {
    "message": "User registered successfully",
    "token": "jwt_token_string",
    "userId": "mongodb_user_id",
    "role": "user|admin|supportStaff"
  }
  ```
- **Error Responses**:
  - `400`: Email already in use / Invalid admin secret
  - `500`: Internal server error

---

#### 2. **User Login**
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Authentication**: None (Public)
- **Request Body**:
  ```json
  {
    "email": "string",      // Registered email
    "password": "string"    // User password
  }
  ```
- **Processing**:
  - Finds user by email in database
  - Compares provided password with stored hashed password using bcrypt
  - If credentials invalid, returns error
  - Generates JWT token with userId and role (expires in 2 hours)
  - Logs login event
- **Success Response (200)**:
  ```json
  {
    "message": "Login successful",
    "token": "jwt_token_string",
    "userId": "mongodb_user_id",
    "role": "user|admin|supportStaff"
  }
  ```
- **Error Responses**:
  - `400`: Invalid email or password
  - `500`: Internal server error

---

#### 3. **Auto-Login (Token Verification)**
- **Method**: `POST`
- **Path**: `/api/auth/me`
- **Authentication**: Bearer Token (Required)
- **Request Headers**:
  ```
  Authorization: Bearer <jwt_token>
  ```
- **Processing**:
  - Extracts token from Authorization header
  - Verifies and decodes JWT token
  - Retrieves user from database
  - Logs auto-login event
- **Success Response (200)**:
  ```json
  {
    "message": "Auto-login successful",
    "userId": "mongodb_user_id",
    "role": "user|admin|supportStaff"
  }
  ```
- **Error Responses**:
  - `401`: No token provided / Invalid token
  - `404`: User not found
  - `500`: Server configuration error (JWT_SECRET not set)

---

### Complaint Management Endpoints

#### 4. **Create Complaint**
- **Method**: `POST`
- **Path**: `/complaints`
- **Authentication**: Bearer Token (Required) - Any authenticated user
- **Request Body** (multipart/form-data):
  ```
  title: string               // Complaint title (required)
  description: string         // Detailed complaint description (required)
  image: File                 // Optional image file attachment
  ```
- **Processing**:
  - Extracts user ID from JWT token
  - If image is provided:
    - Converts file buffer to base64
    - Uploads to Cloudinary in 'ibm_hackathon_complaints' folder
    - Stores secure HTTPS URL
  - Uses Google Gemini AI to automatically analyze complaint title and description
  - AI returns priority level: "low", "medium", "high", or "critical"
  - Creates new complaint with:
    - Status set to "open"
    - AI-analyzed priority
    - Current timestamp
    - Creator user ID
    - Image URL (if provided)
  - Initializes timeline with creation entry
  - Saves complaint to database
  - Logs complaint creation
- **Success Response (201)**:
  ```json
  {
    "message": "Complaint created successfully",
    "complaintId": "complaint_mongodb_id"
  }
  ```
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
