# Brighton Academic Tutoring Platform — Integration Documentation

> **Document Version:** 1.0  
> **Platform:** Brighton Academic Matching System  
> **Last Updated:** May 2026  
> **Tech Stack:** Next.js 15, Neon PostgreSQL, Prisma 7, Neon Auth, Resend, Cloudinary, Jitsi Meet, FastAPI

---

## Table of Contents

1. [Purpose of Integration](#1-purpose-of-integration)
2. [Integrated Components](#2-integrated-components)
3. [Integration Architecture & Data Flow Diagrams](#3-integration-architecture--data-flow-diagrams)
4. [Technologies Used](#4-technologies-used)
5. [Integration Process / Procedure](#5-integration-process--procedure)
6. [API / Interface Documentation](#6-api--interface-documentation)
7. [Database Schema Reference](#7-database-schema-reference)
8. [Testing and Validation](#8-testing-and-validation)
9. [Issues Encountered and Solutions](#9-issues-encountered-and-solutions)
10. [Security Considerations](#10-security-considerations)
11. [Screenshots / Evidence](#11-screenshots--evidence)

---

## 1. Purpose of Integration

The Brighton Academic Tutoring Platform integrates multiple independent systems — a Next.js frontend and API backend, PostgreSQL database, cloud authentication service, email delivery service, media storage, video conferencing, and an AI assessment engine — to deliver a seamless end-to-end tutoring experience.

### Why Integration Is Needed

1. **Unified User Experience** — Students, tutors, and admins interact through a single web application with role-based dashboards, eliminating the need to switch between separate tools.

2. **Secure Authentication** — Session-based authentication via Neon Auth protects all sensitive operations, ensuring only authorized users can access platform features.

3. **Real-Time Communication** — In-app notifications, email alerts, and an internal messaging system connect all platform users across booking, confirmation, and tutoring workflows.

4. **Automated Workflows** — Booking confirmations, email notifications, AI assessment scoring, and personalized tutor recommendations happen without manual intervention, reducing administrative overhead.

5. **Scalable Architecture** — Serverless API routes, database connection pooling, and cloud-based third-party services ensure the platform can handle growth without infrastructure changes.

---

## 2. Integrated Components

### 2.1 Component Overview

| # | Component | Technology | Purpose |
|---|---|---|---|
| 1 | **Frontend Application** | Next.js 15 (React 19, TypeScript, Tailwind CSS 4, Framer Motion) | User interface, client-side routing, state management, animations |
| 2 | **Backend API** | Next.js API Routes (serverless functions) + Python/FastAPI backend | RESTful endpoints for all business logic, AI processing |
| 3 | **Database** | PostgreSQL via Neon (serverless, cloud-hosted) | Persistent storage for all platform data |
| 4 | **ORM** | Prisma 7 with `@prisma/adapter-pg` | Type-safe database access, schema management, migrations |
| 5 | **Authentication** | Neon Auth (Better Auth under the hood) | Session-based auth, email/password signup, OTP verification, password reset |
| 6 | **Email Service** | Resend API | Transactional emails: email verification, booking confirmations, cancellations, message alerts |
| 7 | **Media Storage** | Cloudinary (unsigned upload preset) | Profile images, tutor intro videos, resource files |
| 8 | **Video Classroom** | Jitsi Meet (embedded via iframe) | Live video tutoring sessions |
| 9 | **Avatar Generation** | DiceBear API | Default avatar images for users without uploaded photos |
| 10 | **UI Components** | shadcn/ui, Lucide Icons, Sonner (toast), Embla Carousel | Pre-built accessible UI components and icons |
| 11 | **Theme System** | next-themes + CSS variables + localStorage | Dark/light mode with server-side persistence |
| 12 | **AI Backend** | Python FastAPI (Uvicorn) | Supplementary AI question bank and analysis endpoints |

### 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                               │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │ Landing Page │  │ Auth Pages   │  │ Dashboard (Role-based)    │  │
│  │ (/)          │  │ (/login,     │  │ ┌─────────────────────┐  │  │
│  │              │  │  /signup,    │  │ │ Student: Home,       │  │  │
│  │              │  │  /reset-pwd) │  │ │ Tutors, Classes,     │  │  │
│  │              │  │              │  │ │ Calendar, Favorites  │  │  │
│  │              │  │              │  │ ├─────────────────────┤  │  │
│  │              │  │              │  │ │ Tutor: Home,         │  │  │
│  │              │  │              │  │ │ Bookings, Classes,   │  │  │
│  │              │  │              │  │ │ Calendar, Analytics  │  │  │
│  │              │  │              │  │ ├─────────────────────┤  │  │
│  │              │  │              │  │ │ Admin: Dashboard,    │  │  │
│  │              │  │              │  │ │ Tutors, Students     │  │  │
│  │              │  │              │  │ └─────────────────────┘  │  │
│  └─────────────┘  └──────────────┘  └───────────────────────────┘  │
└──────────────────────┬──────────────────────┬──────────────────────┘
                       │                      │
                       ▼                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER (API ROUTES)                     │
│                                                                      │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Auth Routes  │ │ User     │ │ Booking  │ │ Messaging Routes │   │
│  │ /api/auth/*  │ │ Routes   │ │ Routes   │ │ /api/messages    │   │
│  │              │ │ /api/me  │ │ /api/    │ │                  │   │
│  │ /api/signup/ │ │ /api/    │ │ bookings │ │ /api/notifications│   │
│  │ student      │ │ profile  │ │          │ │                  │   │
│  │ /api/signup/ │ │          │ │          │ │ /api/theme       │   │
│  │ tutor        │ │          │ │          │ │                  │   │
│  └─────────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│                                                                      │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Tutor Routes │ │ Admin    │ │ AI Routes│ │ Resource Routes  │   │
│  │ /api/tutors  │ │ Routes   │ │ /api/ai/ │ │ /api/resources   │   │
│  │ /api/favorites│ │ /api/    │ │ generate │ │                  │   │
│  │ /api/reviews  │ │ admin/* │ │ /api/ai/ │ │ /api/session-    │   │
│  │               │ │          │ │ analyze  │ │ notes            │   │
│  └─────────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    MIDDLEWARE (middleware.ts)                    │  │
│  │  - Checks session cookie on every request                      │  │
│  │  - Allows public routes (/, /login, /signup, /reset-password)   │  │
│  │  - Protects /dashboard/* routes                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────┬───────────────────────┘
                       │                      │
                       ▼                      ▼
┌─────────────────┐  ┌────────────────────┐  ┌──────────────────────┐
│   NEON AUTH     │  │   PRISMA ORM       │  │   EXTERNAL SERVICES  │
│  (Session Mgmt) │  │   (DB Access)      │  │                      │
│                 │  │                    │  │  ┌────────────────┐  │
│  • Sign up/in   │  │  ┌──────────────┐  │  │  │ Resend (Email) │  │
│  • OTP Verify   │  │  │ Prisma Pool  │  │  │  │ api.resend.com │  │
│  • Password     │  │  │ (Singleton)  │  │  │  └────────────────┘  │
│    Reset        │  │  └──────┬───────┘  │  │                      │
│  • Session      │  │         │          │  │  ┌────────────────┐  │
│    Cookies      │  │         ▼          │  │  │ Cloudinary     │  │
└─────────────────┘  │  ┌──────────────┐  │  │  │ (Media Upload) │  │
                     │  │ PostgreSQL   │  │  │  └────────────────┘  │
                     │  │ (Neon Cloud) │  │  │                      │
                     │  └──────────────┘  │  │  ┌────────────────┐  │
                     └────────────────────┘  │  │ Jitsi Meet     │  │
                                             │  │ (Video Calls)  │  │
                                             │  └────────────────┘  │
                                             │                      │
                                             │  ┌────────────────┐  │
                                             │  │ DiceBear       │  │
                                             │  │ (Avatars)      │  │
                                             │  └────────────────┘  │
                                             │                      │
                                             │  ┌────────────────┐  │
                                             │  │ Python FastAPI │  │
                                             │  │ (AI Backend)   │  │
                                             │  └────────────────┘  │
                                             └──────────────────────┘
```

---

## 3. Integration Architecture & Data Flow Diagrams

### 3.1 Authentication Flow

```
┌─────────┐     ┌──────────┐     ┌───────────┐     ┌───────────┐
│  User   │────▶│  Login/  │────▶│  Neon     │────▶│  Session  │
│ Browser │     │  Signup  │     │  Auth API │     │  Cookie   │
│         │◀────│  Page    │◀────│           │◀────│  Set      │
└─────────┘     └──────────┘     └───────────┘     └───────────┘
                                                          │
                                                          ▼
┌─────────┐     ┌──────────┐     ┌───────────┐     ┌───────────┐
│  User   │────▶│  Request │────▶│  Middle-  │────▶│  Protected│
│  Page   │     │  /dash-  │     │  ware     │     │  Route    │
│         │◀────│  board/* │◀────│  (Cookie  │◀────│  Access   │
└─────────┘     └──────────┘     │  Check)   │     │  Granted  │
                                 └───────────┘     └───────────┘

┌─────────┐     ┌──────────┐     ┌───────────┐     ┌───────────┐
│  API    │────▶│  auth.   │────▶│  Prisma   │────▶│  Return   │
│  Route  │     │  getSess-│     │  Query    │     │  User     │
│         │◀────│  ion()   │◀────│           │◀────│  Data     │
└─────────┘     └──────────┘     └───────────┘     └───────────┘
```

**Step-by-step:**
1. User navigates to login/signup page
2. Neon Auth handles credential submission and returns a session cookie
3. On subsequent requests, `middleware.ts` checks for valid session
4. Public routes (home, login, signup) bypass auth check
5. Protected routes (`/dashboard/*`) require valid session
6. Each API route independently verifies session via `auth.getSession()`
7. User profile data is fetched from Prisma using the authenticated user ID

### 3.2 Student Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BOOKING CREATION                                 │
│                                                                         │
│  STUDENT                    SERVER                     TUTOR            │
│    │                          │                          │              │
│    │  Browse Tutors           │                          │              │
│    │─────────────────────────▶│                          │              │
│    │  GET /api/tutors         │                          │              │
│    │◀─────────────────────────│                          │              │
│    │                          │                          │              │
│    │  Select Date/Time        │                          │              │
│    │─────────────────────────▶│                          │              │
│    │  POST /api/bookings      │                          │              │
│    │  { tutorDbId, date }     │                          │              │
│    │                          │                          │              │
│    │  ┌───────────────────────────────────────┐          │              │
│    │  │ Validate: date future, no duplicate,  │          │              │
│    │  │ no tutor conflict                     │          │              │
│    │  └───────────────────────────────────────┘          │              │
│    │                          │                          │              │
│    │  ┌───────────────────────────────────────┐          │              │
│    │  │ Create Booking (status: PENDING)      │          │              │
│    │  │ Set meetLink (Jitsi room)             │          │              │
│    │  │ Create Notification (student + tutor) │          │              │
│    │  │ Send Email (student + tutor)          │          │              │
│    │  └───────────────────────────────────────┘          │              │
│    │                          │                          │              │
│    │◀── Booking Created ─────│                          │              │
│    │                          │                          │              │
│    │                          │                          │  Notification│
│    │                          │                          │◀─────────────│
│    │                          │                          │              │
│    │                          │      Email Alert         │              │
│    │                          │─────────────────────────▶│              │
│    │                          │                          │              │
│    │                          │      Confirm Booking     │              │
│    │                          │◀─────────────────────────│              │
│    │                          │  PATCH /api/bookings/[id]│              │
│    │                          │  { status: "CONFIRMED" } │              │
│    │                          │                          │              │
│    │  ┌───────────────────────────────────────┐          │              │
│    │  │ Update Booking → CONFIRMED            │          │              │
│    │  │ Create Notification (student)         │          │              │
│    │  │ Send Email with classroom URL         │          │              │
│    │  └───────────────────────────────────────┘          │              │
│    │                          │                          │              │
│    │  Notification ✅        │                          │              │
│    │◀────────────────────────│                          │              │
│    │                          │                          │              │
│    │  Email with URL         │                          │              │
│    │◀────────────────────────│                          │              │
│    │                          │                          │              │
│    │  Enter Classroom        │                          │              │
│    │─────────────────────────▶│                          │              │
│    │  /dashboard/classroom/  │                          │              │
│    │  [bookingId]            │                          │              │
│    │                          │                          │              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 AI Assessment Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI ASSESSMENT PIPELINE                           │
│                                                                         │
│  STUDENT                    SERVER (Next.js)              QUESTION BANK │
│    │                          │                              │          │
│    │  Select Grade/Level      │                              │          │
│    │─────────────────────────▶│                              │          │
│    │                          │                              │          │
│    │  GET /api/ai/questions   │                              │          │
│    │  ?grade=GRADE_7&count=30 │                              │          │
│    │                          │─────────────────────────────▶│          │
│    │                          │  Randomly select 30 questions│          │
│    │                          │◀─────────────────────────────│          │
│    │◀── Questions (no        │                              │          │
│    │     correct answers)    │                              │          │
│    │                          │                              │          │
│    │  Student Answers All 30 │                              │          │
│    │─────────────────────────▶│                              │          │
│    │                          │                              │          │
│    │  POST /api/ai/analyze    │                              │          │
│    │  { grade, answers[] }    │                              │          │
│    │                          │                              │          │
│    │  ┌────────────────────────────────────────────────┐    │          │
│    │  │ 1. Grade each answer (correct/incorrect)        │    │          │
│    │  │ 2. Calculate per-subject accuracy               │    │          │
│    │  │ 3. Calculate per-topic accuracy                 │    │          │
│    │  │ 4. Identify weaknesses (<70%)                   │    │          │
│    │  │ 5. Identify strengths (≥80%)                    │    │          │
│    │  │ 6. Assign mastery level (Beginner/Developing/   │    │          │
│    │  │    Proficient/Advanced)                         │    │          │
│    │  │ 7. Generate study plan                          │    │          │
│    │  │ 8. Generate tutor recommendations               │    │          │
│    │  └────────────────────────────────────────────────┘    │          │
│    │                          │                              │          │
│    │◀── Results with:        │                              │          │
│    │      score, percentage   │                              │          │
│    │      mastery_level        │                              │          │
│    │      subject_breakdown    │                              │          │
│    │      weaknesses          │                              │          │
│    │      strengths           │                              │          │
│    │      study_plan          │                              │          │
│    │      tutor_recommendations│                              │          │
│    │                          │                              │          │
│    │  Save Attempt to DB     │                              │          │
│    │  POST /api/test-history  │                              │          │
│    │─────────────────────────▶│                              │          │
│    │                          │                              │          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Messaging Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MESSAGING SYSTEM                                 │
│                                                                         │
│  USER A                     SERVER                      USER B         │
│    │                          │                          │              │
│    │  GET /api/messages       │                          │              │
│    │  (list conversations)    │                          │              │
│    │◀────────────────────────│                          │              │
│    │                          │                          │              │
│    │  GET /api/messages       │                          │              │
│    │  ?conversationWith=UserB │                          │              │
│    │◀── Messages in order ───│                          │              │
│    │                          │                          │              │
│    │  ┌─────────────────────────────┐                   │              │
│    │  │ Mark unread messages as read│                   │              │
│    │  └─────────────────────────────┘                   │              │
│    │                          │                          │              │
│    │  Send Message            │                          │              │
│    │─────────────────────────▶│                          │              │
│    │  POST /api/messages      │                          │              │
│    │  { receiverId, content } │                          │              │
│    │                          │                          │              │
│    │  ┌───────────────────────────────────────┐          │              │
│    │  │ Validate receiver exists              │          │              │
│    │  │ Validate content (non-empty, ≤2000)   │          │              │
│    │  │ Create Message record                 │          │              │
│    │  │ Create Notification for receiver      │          │              │
│    │  │ Send Email (fire-and-forget)          │          │              │
│    │  └───────────────────────────────────────┘          │              │
│    │                          │                          │              │
│    │◀── Message Created ─────│                          │              │
│    │                          │                          │              │
│    │                          │        Notification      │              │
│    │                          │─────────────────────────▶│              │
│    │                          │                          │              │
│    │                          │    (Client polls every   │              │
│    │                          │     30s for new messages)│              │
│    │                          │                          │              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Admin Dashboard Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD                                  │
│                                                                         │
│  ADMIN                      SERVER                      DATABASE        │
│    │                          │                          │              │
│    │  Load Dashboard          │                          │              │
│    │─────────────────────────▶│                          │              │
│    │  GET /api/admin/dashboard│                          │              │
│    │                          │                          │              │
│    │  ┌─────────────────────────────────────────┐       │              │
│    │  │ Verify: user.role === 'ADMIN'           │       │              │
│    │  └─────────────────────────────────────────┘       │              │
│    │                          │                          │              │
│    │  ┌─────────────────────────────────────────────┐   │              │
│    │  │ Parallel Prisma Queries:                    │   │              │
│    │  │ • Count tutors (total, pending, approved,   │   │              │
│    │  │   rejected)                                 │   │              │
│    │  │ • Count students                            │   │              │
│    │  │ • Count bookings (total, pending, confirmed,│   │              │
│    │  │   completed, cancelled)                    │   │              │
│    │  │ • Count users & admins                      │   │              │
│    │  │ • Recent 5 bookings (with user details)     │   │              │
│    │  │ • Recent 5 tutors                           │   │              │
│    │  │ • Recent 5 students                         │   │              │
│    │  │ • Monthly trends (last 6 months)            │   │              │
│    │  └─────────────────────────────────────────────┘   │              │
│    │                          │                          │              │
│    │◀── Aggregated Data ─────│                          │              │
│    │   totals: {             │                          │              │
│    │     tutors, students,   │                          │              │
│    │     bookings, users,    │                          │              │
│    │     admins              │                          │              │
│    │   }                     │                          │              │
│    │   tutorBreakdown: {...} │                          │              │
│    │   bookingBreakdown: {...}│                          │              │
│    │   trends: {             │                          │              │
│    │     bookingsByMonth,    │                          │              │
│    │     usersByMonth        │                          │              │
│    │   }                     │                          │              │
│    │   recent: {             │                          │              │
│    │     bookings, tutors,   │                          │              │
│    │     students            │                          │              │
│    │   }                     │                          │              │
│    │                          │                          │              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.6 Media Upload Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLOUDINARY MEDIA UPLOAD                         │
│                                                                         │
│  USER                        CLOUDINARY                   SERVER       │
│    │                            │                          │           │
│    │  Select File              │                          │           │
│    │  (image/video)            │                          │           │
│    │                            │                          │           │
│    │  POST to Cloudinary       │                          │           │
│    │  /v1_1/{cloud_name}/      │                          │           │
│    │  {resource_type}/upload   │                          │           │
│    │──────────────────────────▶│                          │           │
│    │  { file, upload_preset }  │                          │           │
│    │                            │                          │           │
│    │  Returns secure_url       │                          │           │
│    │◀──────────────────────────│                          │           │
│    │                            │                          │           │
│    │  Send URL to Server       │                          │           │
│    │  (via form/PATCH profile) │                          │           │
│    │─────────────────────────────────────────────────────▶│           │
│    │                            │                          │           │
│    │                            │       Store URL in DB   │           │
│    │                            │       (user.image,      │           │
│    │                            │       resource.fileUrl) │           │
│    │                            │                          │           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technologies Used

### 4.1 Core Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15.2.8 | React framework with App Router, server components, API routes |
| **React** | 19.0.0 | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Node.js** | (via Next.js) | JavaScript runtime |

### 4.2 Styling & UI

| Technology | Version | Purpose |
|---|---|---|
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Framer Motion** | 12.38.0 | Animation library |
| **shadcn/ui** | (latest) | Pre-built accessible components (Button, Card, Sheet, Dropdown, Carousel, etc.) |
| **Lucide React** | 0.469.0 | Icon library |
| **Sonner** | 2.0.7 | Toast notifications |
| **Embla Carousel** | 8.6.0 | Carousel component |
| **Base UI** | 1.4.1 | Low-level UI primitives |
| **next-themes** | 0.4.6 | Theme management |
| **class-variance-authority** | 0.7.1 | Component variant management |
| **tailwind-merge** | 3.6.0 | Tailwind class merging |

### 4.3 Database & ORM

| Technology | Version | Purpose |
|---|---|---|
| **PostgreSQL** | (Neon serverless) | Relational database |
| **Prisma** | 7.7.0 | ORM with type-safe queries and migrations |
| **Prisma Adapter PG** | 7.7.0 | PostgreSQL adapter for Prisma |
| **pg** | 8.20.0 | PostgreSQL client for Node.js (connection pooling) |

### 4.4 Authentication

| Technology | Version | Purpose |
|---|---|---|
| **Neon Auth** | 0.2.0-beta.1 | Session-based authentication with email/password |
| **Better Auth** | (bundled) | Underlying auth library used by Neon Auth |

### 4.5 External Services

| Service | Integration Point | Purpose |
|---|---|---|
| **Neon (PostgreSQL)** | `DATABASE_URL` env var | Cloud-hosted database |
| **Neon Auth** | `NEON_AUTH_BASE_URL` | Authentication endpoints |
| **Resend** | `RESEND_API_KEY` + `api.resend.com` | Transactional email delivery |
| **Cloudinary** | `api.cloudinary.com` + upload preset | Image/video upload & hosting |
| **Jitsi Meet** | `meet.jit.si` via iframe | Video conferencing |
| **DiceBear** | `api.dicebear.com` | Avatar generation |

### 4.6 Backend & AI

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.x | AI backend runtime |
| **FastAPI** | (latest) | Python web framework |
| **Uvicorn** | (latest) | ASGI server |
| **Pydantic** | (latest) | Data validation |

### 4.7 Development Tools

| Tool | Purpose |
|---|---|
| **ESLint 9** | Code linting |
| **TypeScript** | Type checking |
| **npm** | Package management |
| **Git** | Version control |
| **GitHub** | Remote repository |

---

## 5. Integration Process / Procedure

### 5.1 Database Integration (Prisma + Neon)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 DATABASE INTEGRATION SETUP                              │
│                                                                         │
│  Step 1 ── Configure Connection                                        │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ DATABASE_URL='postgresql://user:pass@host/db?sslmode=require'      │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 2 ── Define Schema (prisma/schema.prisma)                       │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ generator client {                                        │          │
│  │   provider = "prisma-client-js"                           │          │
│  │   output   = "../app/generated/prisma"                    │          │
│  │ }                                                          │          │
│  │ generator client {                                        │          │
│  │   provider = "prisma-client-js"                           │          │
│  │   output   = "../app/generated/prisma"                    │          │
│  │ }                                                          │          │
│  │ datasource db {                                           │          │
│  │   provider = "postgresql"                                  │          │
│  │ }                                                          │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 3 ── Create Singleton Client (lib/prisma.ts)                    │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ const pool = new Pool({ connectionString });              │          │
│  │ const adapter = new PrismaPg(pool);                       │          │
│  │ const prisma = new PrismaClient({ adapter });             │          │
│  │ // Stored in globalThis to survive hot-reload             │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 4 ── Run Migrations                                             │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ npx prisma migrate dev --name init                       │          │
│  │ npx prisma generate                                      │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 5 ── Seed Database                                              │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ Subjects: Mathematics, Science, English, Filipino,       │          │
│  │           History, MAPEH, EsP                             │          │
│  │ Tests: Linked to subjects and levels                     │          │
│  │ Demo accounts via prisma/seed.mjs                        │          │
│  └──────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code — Database Singleton Pattern (`lib/prisma.ts`):**
```typescript
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma';

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient | undefined,
  pool: Pool | undefined,
  adapter: PrismaPg | undefined
};

if (!globalForPrisma.prisma) {
  const connectionString = process.env.DATABASE_URL;
  globalForPrisma.pool = new Pool({ connectionString });
  globalForPrisma.adapter = new PrismaPg(globalForPrisma.pool);
  globalForPrisma.prisma = new PrismaClient({
    adapter: globalForPrisma.adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma!;
```

### 5.2 Authentication Integration (Neon Auth)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION INTEGRATION SETUP                      │
│                                                                         │
│  Step 1 ── Server Auth Client (lib/auth/server.ts)                    │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ import { createNeonAuth } from '@neondatabase/auth/next/server'    │
│  │ export const auth = createNeonAuth({                      │          │
│  │   baseUrl: process.env.NEON_AUTH_BASE_URL!,              │          │
│  │   cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! }        │
│  │ });                                                       │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 2 ── Client Auth Client (lib/auth/client.ts)                   │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ 'use client';                                             │          │
│  │ import { createAuthClient } from '@neondatabase/auth/next'         │
│  │ export const authClient = createAuthClient();             │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 3 ── Provider in Root Layout (app/layout.tsx)                   │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ <AuthUIProvider authClient={authClient as any}>          │          │
│  │   {children}                                              │          │
│  │ </AuthUIProvider>                                         │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 4 ── Middleware (middleware.ts)                                  │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ const authMiddleware = auth.middleware({ loginUrl: "/login" })     │
│  │                                                           │          │
│  │ export default function middleware(req) {                 │          │
│  │   // Allow public routes through without auth check      │          │
│  │   if (isPublicPath(pathname)) return NextResponse.next();│          │
│  │   // All other routes go through auth middleware          │          │
│  │   return authMiddleware(req);                             │          │
│  │ }                                                         │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 5 ── API Route Handler (app/api/auth/[...path]/route.ts)        │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ import { auth } from '@/lib/auth/server';                │          │
│  │ export const { GET, POST } = auth.handler();             │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 6 ── Protected API Pattern                                      │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ const { data } = await auth.getSession({                  │          │
│  │   fetchOptions: { headers: req.headers }                  │          │
│  │ });                                                       │          │
│  │ if (!data?.user?.id) return 401;                          │          │
│  │ // Proceed with business logic                             │          │
│  └──────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Email Integration (Resend)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   EMAIL INTEGRATION SETUP                               │
│                                                                         │
│  Step 1 ── Environment Variable                                       │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ RESEND_API_KEY=re_xxx                                   │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 2 ── Send Email Helper (lib/email.ts)                          │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ export async function sendEmail({ to, subject, html }) { │          │
│  │   // If no API key configured → log to console          │          │
│  │   if (!apiKey) return logFallback();                    │          │
│  │   // POST to https://api.resend.com/emails              │          │
│  │   const res = await fetch('https://api.resend.com/emails', {       │
│  │     method: 'POST',                                      │          │
│  │     headers: { Authorization: `Bearer ${apiKey}` },      │          │
│  │     body: JSON.stringify({ from, to, subject, html })    │          │
│  │   });                                                     │          │
│  │   return res.ok;                                          │          │
│  │ }                                                         │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 3 ── Email Templates                                          │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ • emailVerificationEmail({ name, email, verificationUrl })        │
│  │ • bookingRequestSentStudent({ studentName, tutorName,    │          │
│  │     date, time })                                        │          │
│  │ • bookingRequestSentTutor({ tutorName, studentName,      │          │
│  │     date, time, bookingUrl })                            │          │
│  │ • bookingConfirmationStudent({ studentName, tutorName,   │          │
│  │     date, time, classroomUrl })                          │          │
│  │ • bookingNotificationTutor({ tutorName, studentName,     │          │
│  │     date, time, classroomUrl })                          │          │
│  │ • bookingCancelledEmail({ recipientName, cancelledByName,│          │
│  │     date, time })                                        │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 4 ── Fire-and-Forget Pattern                                    │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ // Email sends must NOT block the API response          │          │
│  │ sendEmail({ ... }).catch(err => {                       │          │
│  │   console.error('Email failed:', err);                  │          │
│  │ });                                                      │          │
│  └──────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Media Upload Integration (Cloudinary)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   CLOUDINARY INTEGRATION SETUP                          │
│                                                                         │
│  Step 1 ── Environment Variables                                      │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhjvdb6t7              │          │
│  │ NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=Unsigned            │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 2 ── Cloudinary Configuration                                   │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ 1. Create Cloudinary account                              │          │
│  │ 2. Enable "Unsigned" upload preset in Settings > Upload  │          │
│  │ 3. Configure preset settings (file size, type limits)    │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 3 ── Upload Helper (lib/cloudinary.ts)                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ export async function uploadToCloudinary(                 │          │
│  │   file: File | Blob,                                     │          │
│  │   resourceType: 'video' | 'image' | 'raw' = 'image'     │          │
│  │ ): Promise<string> {                                      │          │
│  │   formData.append('file', file);                         │          │
│  │   formData.append('upload_preset', UPLOAD_PRESET);       │          │
│  │   const res = await fetch(                               │          │
│  │     `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}       │
│  │     /${resourceType}/upload`,                            │          │
│  │     { method: 'POST', body: formData }                   │          │
│  │   );                                                      │          │
│  │   const data = await res.json();                         │          │
│  │   return data.secure_url;                                 │          │
│  │ }                                                         │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 4 ── Next.js Image Configuration (next.config.ts)               │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ images: {                                                │          │
│  │   remotePatterns: [                                      │          │
│  │     { protocol: "https", hostname: "res.cloudinary.com" }          │
│  │   ]                                                       │          │
│  │ }                                                         │          │
│  └──────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Video Classroom Integration (Jitsi Meet)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   JITSI MEET INTEGRATION SETUP                         │
│                                                                         │
│  Step 1 ── Content Security Policy (next.config.ts)                   │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ // Critical: Jitsi requires specific CSP permissions     │          │
│  │ headers: [{                                              │          │
│  │   source: "/(.*)",                                       │          │
│  │   headers: [{                                            │          │
│  │     key: "Content-Security-Policy",                      │          │
│  │     value: [                                             │          │
│  │       "frame-src 'self' https://meet.jit.si",           │          │
│  │       "connect-src 'self' wss://meet.jit.si",           │          │
│  │       "script-src 'self' 'unsafe-inline' 'unsafe-eval'   │          │
│  │         https://meet.jit.si",                            │          │
│  │       "media-src 'self' blob: mediastream:"              │          │
│  │     ].join("; ")                                         │          │
│  │   }]                                                      │          │
│  │ }]                                                        │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 2 ── Generate Classroom Link on Booking Creation                 │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ // When a booking is created:                           │          │
│  │ const meetLink = `/dashboard/classroom/${booking.id}`; │          │
│  │ await prisma.booking.update({                           │          │
│  │   where: { id: booking.id },                            │          │
│  │   data: { meetLink }                                    │          │
│  │ });                                                      │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 3 ── Classroom Page (app/dashboard/classroom/[id]/page.tsx)     │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ // Renders Jitsi Meet iframe with room name = booking ID │          │
│  │ <iframe                                              │          │
│  │   src={`https://meet.jit.si/Brighton-${booking.id}`}   │          │
│  │   allow="camera; microphone; fullscreen; display-capture"          │
│  │ />                                                       │          │
│  └──────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.6 AI Assessment Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   AI ASSESSMENT INTEGRATION SETUP                       │
│                                                                         │
│  Step 1 ── Define Question Bank (app/api/ai/questions/bank.ts)        │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ 200+ questions across multiple subjects:                 │          │
│  │ • Filipino (Vocabulary, Grammar, Literature, Idioms)     │          │
│  │ • English (Grammar, Literature, Vocabulary)              │          │
│  │ • Mathematics (Algebra, Geometry, Trigonometry,          │          │
│  │   Statistics, Fractions, Radicals)                      │          │
│  │ • Science (Biology, Chemistry, Physics, Earth Science)   │          │
│  │ • Social Studies (Philippine History, Geography)         │          │
│  │ • MAPEH (Music, Health, Arts, Physical Education)        │          │
│  │ • EsP (Edukasyon sa Pagpapakatao)                       │          │
│  │ Organized by grade level (GRADE_1 through GRADE_12)      │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 2 ── Question API (app/api/ai/questions/route.ts)               │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ GET /api/ai/questions?grade=GRADE_7&count=30            │          │
│  │ Response: Random 30 questions (without correct answer)   │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 3 ── Analysis Engine (app/api/ai/analyze/route.ts)              │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ POST /api/ai/analyze                                     │          │
│  │ Body: { grade: "GRADE_7", answers: [{ questionId,       │          │
│  │   answer }] }                                            │          │
│  │                                                           │          │
│  │ Processing Steps:                                         │          │
│  │ 1. Grade each answer (correct/incorrect)                 │          │
│  │ 2. Calculate per-subject accuracy                        │          │
│  │ 3. Calculate per-topic accuracy                          │          │
│  │ 4. Identify weaknesses (<70% accuracy)                   │          │
│  │ 5. Identify strengths (≥80% accuracy)                    │          │
│  │ 6. Determine mastery level:                              │          │
│  │    - ≥90% → Advanced                                     │          │
│  │    - ≥75% → Proficient                                   │          │
│  │    - ≥50% → Developing                                   │          │
│  │    - <50% → Beginner                                     │          │
│  │ 7. Generate personalized study plan                      │          │
│  │ 8. Generate tutor recommendations with search links      │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 4 ── Python FastAPI Backend (backend/main.py)                   │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ Additional AI endpoints for client-side integration:     │          │
│  │ GET  /questions/{level}   → Random questions             │          │
│  │ POST /analyze             → Performance analysis         │          │
│  │ Run with: uvicorn main:app --host 0.0.0.0 --port 8000    │          │
│  └──────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.7 Messaging Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   MESSAGING SYSTEM INTEGRATION                          │
│                                                                         │
│  Step 1 ── Database Model (Prisma)                                    │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ model Message {                                           │          │
│  │   id         String   @id @default(cuid())               │          │
│  │   senderId   String                                       │          │
│  │   receiverId String                                       │          │
│  │   content    String                                       │          │
│  │   createdAt  DateTime @default(now())                     │          │
│  │   isRead     Boolean  @default(false)                     │          │
│  │   receiver   User     @relation("ReceivedMessages")       │          │
│  │   sender     User     @relation("SentMessages")           │          │
│  │ }                                                          │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 2 ── List Conversations                                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ GET /api/messages                                         │          │
│  │ • Fetch all messages where user is sender or receiver    │          │
│  │ • Deduplicate to latest message per conversation         │          │
│  │ • Calculate unread count per conversation                │          │
│  │ • Return: [{ userId, userName, lastMessage,             │          │
│  │              unreadCount }]                               │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 3 ── Conversation View                                           │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ GET /api/messages?conversationWith=USER_ID               │          │
│  │ • Fetch all messages between two users (ordered by date) │          │
│  │ • Mark unread messages as read                           │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 4 ── Send Message                                              │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ POST /api/messages { receiverId, content }               │          │
│  │ • Validate: receiver exists, content non-empty, ≤2000    │          │
│  │ • Create Message record                                   │          │
│  │ • Create Notification for receiver                        │          │
│  │ • Send email notification (fire-and-forget)              │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Step 5 ── Client-Side Polling                                        │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ // Dashboard layout polls every 30s for new messages     │          │
│  │ useEffect(() => {                                         │          │
│  │   const interval = setInterval(fetchUnread, 30_000);     │          │
│  │   return () => clearInterval(interval);                  │          │
│  │ }, [user]);                                               │          │
│  └──────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. API / Interface Documentation

### 6.1 Authentication Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/[...path]` | GET, POST | No | Neon Auth handler (login, signup, OTP, password reset) |
| `/api/signup/student` | POST | No | Register new student account |
| `/api/signup/tutor` | POST | No | Register new tutor account |
| `/api/verify-email` | GET | No | Verify email via token link |
| `/api/verify-email` | POST | Yes | Confirm email verification after OTP |
| `/api/auth/check-email` | GET | No | Check if email already exists |
| `/api/auth/resend-verification` | POST | Yes | Resend verification OTP email |

**Sample Request — POST /api/signup/student:**
```json
{
  "email": "student@example.com",
  "password": "securePassword123",
  "fullName": "Juan Dela Cruz",
  "age": 14,
  "schoolLevel": "HIGH_SCHOOL",
  "gradeLevel": 7,
  "schoolName": "Manila Science High School",
  "parentEmail": "parent@example.com"
}
```

**Sample Response:**
```json
{
  "success": true,
  "requiresVerification": true,
  "message": "Account created! Please check your email for the verification code to complete signup."
}
```

### 6.2 User Profile Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/me` | GET | Yes | Get current authenticated user with full profiles |
| `/api/profile` | PATCH | Yes | Update user profile and role-specific fields |
| `/api/theme` | PATCH | Yes | Update theme preference (dark/light) |

**Sample Request — PATCH /api/profile:**
```json
{
  "name": "Juan Dela Cruz",
  "photoUrl": "https://res.cloudinary.com/demo/image/upload/v1/profile.jpg",
  "headline": "Mathematics & Science Expert",
  "bio": "Passionate educator with 5+ years of experience...",
  "pricingPerHour": "30",
  "introVideoUrl": "https://res.cloudinary.com/demo/video/upload/v1/intro.mp4",
  "subjects": ["Mathematics", "Science", "English"],
  "availability": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00" },
    { "dayOfWeek": 3, "startTime": "13:00", "endTime": "18:00" },
    { "dayOfWeek": 5, "startTime": "09:00", "endTime": "12:00" }
  ],
  "university": "University of the Philippines",
  "degree": "B.S. Mathematics Education"
}
```

**Sample Response — GET /api/me:**
```json
{
  "id": "user_clx...",
  "email": "student@example.com",
  "name": "Juan Dela Cruz",
  "role": "STUDENT",
  "image": null,
  "isVerified": true,
  "isBanned": false,
  "theme": "light",
  "studentProfile": {
    "id": "student_clx...",
    "schoolLevel": "HIGH_SCHOOL",
    "gradeLevel": 7,
    "age": 14,
    "schoolName": "Manila Science High School",
    "parentEmail": "parent@example.com"
  },
  "tutorProfile": null
}
```

### 6.3 Tutor Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/tutors` | GET | No | List approved tutors with sorting & filtering |
| `/api/tutors/[id]` | GET | No | Get single tutor details |
| `/api/favorites` | GET | Yes | List user's saved/favorite tutors |
| `/api/favorites` | POST | Yes | Toggle tutor saved status (save/unsave) |

**Sample Response — GET /api/tutors?sort=best&limit=3:**
```json
[
  {
    "id": "tutor_clx...",
    "userId": "user_clx...",
    "name": "Dr. Maria Santos",
    "image": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    "headline": "Mathematics & Science Specialist",
    "bio": "Over 10 years of experience...",
    "pricingPerHour": 25,
    "subjects": ["Mathematics", "Science"],
    "rating": 4.9,
    "reviewCount": 24,
    "availability": [
      { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00" }
    ],
    "recentRating": 5.0,
    "recentReviewCount": 3
  }
]
```

**Sort Modes:**
| Sort | Description |
|---|---|
| `all` | Default order (no sort applied) |
| `best` | Sorted by rating (desc), then review count (desc) |
| `rising` | Sorted by recent activity: `recentRating × 2 + recentReviewCount + rating × 0.5` |

### 6.4 Booking Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/bookings` | GET | Yes | List user's bookings (role-based — admin sees all) |
| `/api/bookings` | POST | Yes | Create new booking (student → tutor) |
| `/api/bookings/[bookingId]` | PATCH | Yes | Update booking status or reschedule |

**Sample Request — POST /api/bookings:**
```json
{
  "tutorDbId": "tutor_clx...",
  "date": "2026-06-01T10:00:00.000Z"
}
```

**Sample Response — POST /api/bookings:**
```json
{
  "id": "booking_clx...",
  "studentId": "student_clx...",
  "tutorId": "tutor_clx...",
  "date": "2026-06-01T10:00:00.000Z",
  "meetLink": "/dashboard/classroom/booking_clx...",
  "status": "PENDING",
  "tutor": { "headline": "Math Expert", "user": { "name": "Dr. Maria Santos" } }
}
```

**Status Transitions & Rules:**
```
PENDING ──(tutor/admin)──▶ CONFIRMED
PENDING ──(student)──────▶ CANCELLED
PENDING ──(tutor)────────▶ CANCELLED
CONFIRMED ──(tutor/admin)──▶ COMPLETED
CONFIRMED ──(student, >24h)──▶ CANCELLED
CONFIRMED ──(student reschedule)──▶ PENDING (auto-reset)
```

**Sample Request — PATCH /api/bookings/[bookingId]:**
```json
{ "status": "CONFIRMED" }
```
```json
{ "status": "CANCELLED" }
```
```json
{ "date": "2026-06-02T14:00:00.000Z" }
```

### 6.5 Messaging Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/messages` | GET | Yes | List conversations or specific conversation |
| `/api/messages` | POST | Yes | Send message to another user |

**Sample Request — POST /api/messages:**
```json
{
  "receiverId": "user_clx...",
  "content": "Hi! I'd like to discuss scheduling our next session."
}
```

**Sample Response — GET /api/messages (conversations):**
```json
[
  {
    "userId": "user_clx...",
    "userName": "Dr. Maria Santos",
    "userImage": "https://...",
    "lastMessage": "See you on Monday!",
    "lastMessageAt": "2026-05-15T10:30:00.000Z",
    "unreadCount": 2
  }
]
```

### 6.6 Review Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/reviews` | GET | No | List reviews for a tutor (`?tutorId=X`) |
| `/api/reviews` | POST | Yes | Create review (student only, 1–5 rating) |
| `/api/reviews/featured` | GET | No | Get featured reviews for landing page |

**Sample Request — POST /api/reviews:**
```json
{
  "tutorId": "tutor_clx...",
  "bookingId": "booking_clx...",
  "rating": 5,
  "comment": "Excellent tutor! Very patient and knowledgeable."
}
```

### 6.7 Notification Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/notifications` | GET | Yes | Get user's 30 most recent notifications |
| `/api/notifications` | PATCH | Yes | Mark all notifications as read |

**Sample Response — GET /api/notifications:**
```json
[
  {
    "id": "notif_clx...",
    "title": "Session Confirmed! ✅",
    "message": "Dr. Santos has accepted your session on Monday, June 1, 2026 at 10:00 AM.",
    "link": "/dashboard/classes",
    "isRead": false,
    "createdAt": "2026-05-20T14:30:00.000Z"
  }
]
```

### 6.8 AI / Assessment Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/ai/questions` | GET | Yes | Get random questions (`?grade=GRADE_7&count=30`) |
| `/api/ai/analyze` | POST | Yes | Submit answers for scoring and analysis |
| `/api/ai/generate` | POST | Yes | Generate AI tutor bio or headline |

**Sample Request — GET /api/ai/questions:**
```
GET /api/ai/questions?grade=GRADE_7&count=5
```

**Sample Response:**
```json
[
  {
    "id": "mathh1",
    "text": "Solve: 2x + 5 = 13",
    "options": ["3", "4", "5", "6"],
    "topic": "Mathematics - Algebra"
  },
  {
    "id": "scih1",
    "text": "What is the chemical symbol for gold?",
    "options": ["Go", "Gd", "Au", "Ag"],
    "topic": "Science - Chemistry"
  }
]
```

**Sample Request — POST /api/ai/analyze:**
```json
{
  "grade": "GRADE_7",
  "answers": [
    { "questionId": "mathh1", "answer": "4" },
    { "questionId": "mathh2", "answer": "12" },
    { "questionId": "scih1", "answer": "Au" }
  ]
}
```

**Sample Response:**
```json
{
  "score": 18,
  "total": 30,
  "percentage": 60,
  "grade": "GRADE_7",
  "grade_label": "Grade 7 (Junior High School)",
  "mastery_level": "Developing",
  "subject_breakdown": [
    { "subject": "Mathematics", "correct": 5, "total": 10, "accuracy": 50 },
    { "subject": "Science", "correct": 8, "total": 10, "accuracy": 80 },
    { "subject": "English", "correct": 5, "total": 10, "accuracy": 50 }
  ],
  "topic_breakdown": [
    { "topic": "Algebra", "correct": 2, "total": 5, "accuracy": 40 },
    { "topic": "Chemistry", "correct": 4, "total": 5, "accuracy": 80 }
  ],
  "weaknesses": [
    {
      "topic": "Algebra",
      "accuracy": 40,
      "proficiency": "Needs Work",
      "priority": 1,
      "tip": "Focus on understanding concepts, not just memorizing formulas..."
    }
  ],
  "strengths": [
    { "topic": "Chemistry", "accuracy": 80 }
  ],
  "weak_subjects": ["Mathematics", "English"],
  "strong_subjects": ["Science"],
  "recommendation": "You scored 60% — a good starting point! Prioritize: Mathematics, English. With consistent practice and guidance, you'll improve. Don't give up! ✨",
  "study_plan": "Study Plan for Grade 7 (Junior High School):\n1. Prioritize Mathematics — 20 minutes daily reviewing concepts.\n2. Work on English — 15 minutes every other day.\n3. Focus on Algebra — use flashcards and concept maps.\n4. Maintain strengths in Science — review weekly.\nBook a tutor at least twice a week for personalized guidance.",
  "tutor_recommendations": [
    {
      "subject": "Mathematics",
      "searchQuery": "Mathematics",
      "why": "You scored 50% in Mathematics. A tutor can help you focus on understanding concepts, not just memorizing formulas..."
    }
  ]
}
```

### 6.9 Admin Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/admin/dashboard` | GET | Admin | Dashboard analytics (counts, trends, recent activity) |
| `/api/admin/tutors` | GET | Admin | List all tutors with verification status |
| `/api/admin/tutors/[id]` | GET | Admin | Get single tutor full details |
| `/api/admin/tutors/[id]` | PATCH | Admin | Update tutor verification status |
| `/api/admin/students` | GET | Admin | List all students |
| `/api/admin/students/[id]` | GET | Admin | Get single student details |
| `/api/admin/users` | GET | Admin | List all platform users |

**Sample Response — GET /api/admin/dashboard:**
```json
{
  "totals": {
    "tutors": 45,
    "students": 230,
    "bookings": 890,
    "users": 310,
    "admins": 3
  },
  "tutorBreakdown": {
    "pending": 5,
    "approved": 38,
    "rejected": 2
  },
  "bookingBreakdown": {
    "pending": 12,
    "confirmed": 48,
    "completed": 790,
    "cancelled": 40
  },
  "trends": {
    "bookingsByMonth": {
      "2026-01": { "total": 120, "confirmed": 60, "pending": 15, "completed": 40, "cancelled": 5 },
      "2026-02": { "total": 145, "confirmed": 72, "pending": 18, "completed": 48, "cancelled": 7 }
    },
    "usersByMonth": {
      "2026-01": { "total": 25, "tutors": 5, "students": 20 },
      "2026-02": { "total": 30, "tutors": 6, "students": 24 }
    }
  },
  "recent": {
    "bookings": [
      { "id": "booking_clx...", "date": "2026-05-20T10:00:00Z", "status": "CONFIRMED", "student": { "name": "Juan" }, "tutor": { "name": "Maria" } }
    ],
    "tutors": [...],
    "students": [...]
  }
}
```

### 6.10 Resource Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/resources` | GET | No | List resources (`?tutorId=X&level=ELEMENTARY`) |
| `/api/resources` | POST | Yes | Create resource (tutors only) |
| `/api/resources` | DELETE | Yes | Delete own resource (`?id=X`) |

### 6.11 Supplementary Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/stats` | GET | No | Public platform statistics (landing page) |
| `/api/schools` | GET | No | List schools |
| `/api/session-notes` | GET | Yes | Get tutor session notes |
| `/api/session-notes` | POST | Yes | Create session note |
| `/api/test-history` | GET | Yes | Get student test attempt history |
| `/api/seed-accounts` | GET | No | Seed demo accounts |

### 6.12 Python Backend Endpoints (FastAPI)

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Health check — returns `{ "message": "Brighton Tutoring Platform AI Backend" }` |
| `/questions/{level}` | GET | Get random questions (`level`: `ELEMENTARY` or `HIGH_SCHOOL`, `count`: integer) |
| `/analyze` | POST | Simplified analysis (placeholder) |

**Run Command:**
```bash
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 7. Database Schema Reference

### 7.1 Entity-Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA OVERVIEW                             │
│                                                                         │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     │
│  │  User    │1──1│ Student  │1──N│ Booking  │N──1│  Tutor   │     │
│  │          │     │          │     │          │     │          │     │
│  │  id      │     │  id      │     │  status  │     │  id      │     │
│  │  email   │     │  userId  │     │  date    │     │  userId  │     │
│  │  name    │     │  schoolLv│     │  meetLink│     │  headline│     │
│  │  role    │     │  gradeLv │     └────┬─────┘     │  bio     │     │
│  │  image   │     │  age     │          │           │  pricing │     │
│  │  isVerif │     └──────────┘          │           │  avgRate │     │
│  │  isBanned│                         1│1          └────┬──────┘     │
│  │  theme   │     ┌──────────┐     ┌──────────┐        │           │
│  └────┬─────┘     │SessionNote│1──1│ Booking  │        │           │
│       │           │           │     │          │        │           │
│       │           │  content  │     │          │        │           │
│       │           │  tutorId  │     └──────────┘        │           │
│       │           └──────────┘                          │           │
│       │                                                 │           │
│  ┌────┴─────────────┐            ┌──────────────────────┘           │
│  │                  │            │                                  │
│  │  ┌──────────┐    │    ┌──────────────┐    ┌──────────────┐      │
│  │  │ Message  │    │    │  Education   │    │ Certification│      │
│  │  ├──────────┤    │    ├──────────────┤    ├──────────────┤      │
│  │  │ senderId │    │    │ university   │    │ subject      │      │
│  │  │ receiver │    │    │ degree       │    │ certificate  │      │
│  │  │ content  │    │    │ specialization│   │ issuedBy     │      │
│  │  │ isRead   │    │    │ yearStart    │    │ certUrl      │      │
│  │  └──────────┘    │    │ yearEnd      │    └──────────────┘      │
│  │                  │    └──────────────┘                          │
│  │  ┌──────────┐    │                                             │
│  │  │Notification│   │    ┌─────────────────┐    ┌──────────────┐  │
│  │  ├──────────┤    │    │  Availability   │    │ TutorSubject │  │
│  │  │ title    │    │    ├─────────────────┤    ├──────────────┤  │
│  │  │ message  │    │    │ dayOfWeek (0-6) │    │ tutorId      │  │
│  │  │ link     │    │    │ startTime       │    │ subjectId    │  │
│  │  │ isRead   │    │    │ endTime         │    └──────┬───────┘  │
│  │  └──────────┘    │    └─────────────────┘           │          │
│  │                  │                                  │          │
│  │  ┌──────────┐    │    ┌─────────────────┐           │          │
│  │  │SavedTutor│    │    │ Subject         │◀──────────┘          │
│  │  ├──────────┤    │    ├─────────────────┤                      │
│  │  │ userId   │    │    │ name (unique)   │                      │
│  │  │ tutorId  │    │    └────────┬────────┘                      │
│  │  └──────────┘    │             │                               │
│  └──────────────────┘             │                               │
│                                   │                               │
│  ┌──────────┐     ┌──────────┐    │    ┌──────────┐              │
│  │  Review  │     │  Test    │    │    │ Resource │              │
│  ├──────────┤     ├──────────┤    │    ├──────────┤              │
│  │ studentId│     │ subjectId│    │    │ tutorId  │              │
│  │ tutorId  │     │ level    │    │    │ title    │              │
│  │ bookingId│     │          │    │    │ fileUrl  │              │
│  │ rating   │     │          │    │    │ fileType │              │
│  │ comment  │     │          │    │    │ subject  │              │
│  └──────────┘     └────┬─────┘    │    │ level    │              │
│                        │          │    └──────────┘              │
│                   ┌────┴──────┐   │                              │
│                   │ Question  │   │                              │
│                   ├───────────┤   │                              │
│                   │ testId    │   │                              │
│                   │ text      │   │                              │
│                   │ options[] │   │                              │
│                   │ correctAns│   │                              │
│                   └─────┬─────┘   │                              │
│                         │         │                              │
│                   ┌─────┴──────┐  │                              │
│                   │ Attempt    │  │                              │
│                   ├────────────┤  │                              │
│                   │ studentId  │  │                              │
│                   │ testId     │  │                              │
│                   │ score      │  │                              │
│                   │ total      │  │                              │
│                   │ mastery    │  │                              │
│                   │ strengths  │  │                              │
│                   │ weaknesses │  │                              │
│                   │ studyPlan  │  │                              │
│                   └────────────┘  │                              │
│                                    │                              │
│  ┌──────────────────┐             │                              │
│  │ VerificationToken│             │                              │
│  ├──────────────────┤             │                              │
│  │ email            │             │                              │
│  │ token (unique)   │             │                              │
│  │ expiresAt        │             │                              │
│  │ usedAt           │             │                              │
│  └──────────────────┘             │                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Complete Model List

| # | Model | Purpose | Key Fields |
|---|---|---|---|
| 1 | **User** | Core user account | id, email, name, role (STUDENT/TUTOR/ADMIN/PARENT), image, isVerified, isBanned, theme |
| 2 | **Student** | Student profile | userId, schoolLevel (ELEMENTARY/HIGH_SCHOOL), gradeLevel, age, schoolName, parentEmail |
| 3 | **Tutor** | Tutor profile | userId, introVideoUrl, bio, verificationStatus (PENDING/APPROVED/REJECTED), headline, pricingPerHour, averageRating, reviewCount |
| 4 | **Booking** | Tutoring session | studentId, tutorId, date, meetLink, status (PENDING/CONFIRMED/COMPLETED/CANCELLED) |
| 5 | **Message** | User-to-user messaging | senderId, receiverId, content, isRead |
| 6 | **Notification** | In-app notifications | userId, title, message, link, isRead |
| 7 | **Review** | Tutor review/rating | studentId, tutorId, bookingId, rating (1-5), comment |
| 8 | **Subject** | Academic subject | name (unique) |
| 9 | **TutorSubject** | Many-to-many: Tutor ↔ Subject | tutorId, subjectId |
| 10 | **Availability** | Tutor available timeslots | tutorId, dayOfWeek (0-6), startTime, endTime |
| 11 | **Education** | Tutor education history | tutorId, university, degree, specialization, yearStart, yearEnd |
| 12 | **Certification** | Tutor certifications | tutorId, subject, certificate, issuedBy, certificateUrl |
| 13 | **Resource** | Tutor-shared materials | tutorId, title, description, fileUrl, fileType, subject, level |
| 14 | **SessionNote** | Tutor session notes | bookingId, tutorId, content |
| 15 | **SavedTutor** | Student favorites | userId, tutorId |
| 16 | **Test** | Assessment test | subjectId, level (ELEMENTARY/HIGH_SCHOOL) |
| 17 | **Question** | Test question | testId, text, options[], correctAnswer |
| 18 | **Attempt** | Student test attempt | studentId, testId, score, total, mastery, strengths, weaknesses, studyPlan |
| 19 | **VerificationToken** | Email verification | email, token, expiresAt, usedAt |

### 7.3 Enums

| Enum | Values |
|---|---|
| **Role** | `STUDENT`, `TUTOR`, `ADMIN`, `PARENT` |
| **Level** | `ELEMENTARY`, `HIGH_SCHOOL` |
| **VerificationStatus** | `PENDING`, `APPROVED`, `REJECTED` |

---

## 8. Testing and Validation

### 8.1 Authentication Testing

| # | Test Case | Expected Result |
|---|---|---|
| 1 | Login with valid credentials | Session cookie set, redirected to dashboard |
| 2 | Login with wrong password | Error message returned |
| 3 | Access /dashboard without login | Redirected to /login |
| 4 | Signup with new email | Account created, verification email sent |
| 5 | Signup with existing email | "Account already exists" error |
| 6 | Verify email via OTP | `isVerified` set to true |
| 7 | Unverified user tries to access dashboard | Blocked with verification prompt |
| 8 | Tutor with PENDING status tries to access dashboard | "Pending Verification" screen shown |
| 9 | Password reset flow | Reset email sent, password changed |

### 8.2 Booking Testing

| # | Test Case | Expected Result |
|---|---|---|
| 1 | Student creates booking with valid data | Booking created (PENDING), notifications sent |
| 2 | Student creates booking for past date | 400 error: "Cannot book a session in the past" |
| 3 | Duplicate booking (same student + tutor + time) | 409 error: duplicate detected |
| 4 | Tutor double-booking (same time slot) | 409 error: tutor not available |
| 5 | Tutor confirms PENDING booking | Status → CONFIRMED, student notified |
| 6 | Student cancels CONFIRMED booking (>24h away) | Status → CANCELLED, tutor notified |
| 7 | Student cancels CONFIRMED booking (<24h away) | 400 error: cancellation policy |
| 8 | Tutor cancels CONFIRMED booking | 400 error: tutors can only cancel PENDING |
| 9 | Auto-complete past CONFIRMED bookings | Status → COMPLETED on dashboard load |
| 10 | Admin creates booking | Auto-CONFIRMED regardless of date |

### 8.3 Messaging Testing

| # | Test Case | Expected Result |
|---|---|---|
| 1 | Send message to valid user | Message created, notification sent |
| 2 | Send message to non-existent user | 404 error |
| 3 | Send empty message | 400 error |
| 4 | Send message exceeding 2000 characters | 400 error |
| 5 | Open conversation | Unread messages marked as read |
| 6 | Poll for new messages | Unread count updates correctly |

### 8.4 AI Assessment Testing

| # | Test Case | Expected Result |
|---|---|---|
| 1 | Submit all correct answers | 100% score, "Advanced" mastery |
| 2 | Submit all wrong answers | 0% score, "Beginner" mastery |
| 3 | Submit answers across multiple subjects | Per-subject breakdown correctly calculated |
| 4 | Submit with missing grade parameter | 400 error |
| 5 | Submit empty answers array | 400 error |
| 6 | Generate tutor bio | Returns one of 5 template bios with name inserted |
| 7 | Generate tutor headline | Returns one of 10 template headlines |

### 8.5 Admin Testing

| # | Test Case | Expected Result |
|---|---|---|
| 1 | Admin accesses /api/admin/dashboard | Full analytics returned |
| 2 | Non-admin accesses admin endpoint | 403 Forbidden |
| 3 | Approve tutor verification | Tutor status → APPROVED, tutor can access dashboard |
| 4 | Reject tutor verification | Tutor status → REJECTED |
| 5 | View all students | List with school/grade details |

### 8.6 Error Handling Patterns

| Status Code | When | Example |
|---|---|---|
| **200** | Success | GET/POST/PATCH succeeds |
| **201** | Created | POST /api/messages, POST /api/reviews |
| **400** | Bad Request | Missing fields, invalid date, message too long |
| **401** | Unauthorized | No session cookie or expired session |
| **403** | Forbidden | Wrong role, not your resource, unverified user |
| **404** | Not Found | User/tutor/booking doesn't exist |
| **409** | Conflict | Duplicate booking, duplicate review |
| **500** | Server Error | Caught and logged with descriptive message |

### 8.7 API Error Response Format

All API endpoints return errors in a consistent format:
```json
{
  "error": "Human-readable error message"
}
```

---

## 9. Issues Encountered and Solutions

### 9.1 Authentication & User Sync

| Issue | Solution |
|---|---|
| **Neon Auth user creation race condition** — When a user signs up, Neon Auth creates the auth record asynchronously. The `/api/me` endpoint may query Prisma before the webhook syncs. | Implemented a **retry pattern** in `/api/me`: wait 250ms then retry the Prisma query if the first lookup returns null. |
| **Existing auth user during signup** — If a user tries to sign up with an email already registered in Neon Auth, the API returns "already exists" but the backend needs to handle this gracefully. | Check `authError.message` for "already exists" / "exists" and **upsert** the Prisma user record instead of failing. |
| **OTP verification flow** — Neon Auth handles OTP client-side, but the app needs its own verification endpoint to mark `isVerified: true` in the database. | `/api/verify-email` POST endpoint called after successful OTP verification. GET endpoint handles token-based verification links independently. |

### 9.2 Email Delivery

| Issue | Solution |
|---|---|
| **Resend domain verification in development** — Resend's default dev API key (`re_...`) requires domain verification, which fails when running on localhost. | Implemented a **graceful fallback**: if the API returns a 403 `validation_error`, log the email to console instead of crashing the request. |
| **Email sends blocking API responses** — If an email send takes too long, the API response is delayed. | **Fire-and-forget pattern**: email sends use `.catch()` and never `await` within the main request handler. |

### 9.3 Booking Logic

| Issue | Solution |
|---|---|
| **Duplicate booking prevention** — The same student should not be able to book the same tutor at the same time twice. | **Compound check**: query for existing booking with matching `[studentId, tutorId, date]` and active status (`PENDING` or `CONFIRMED`). |
| **Tutor double-booking** — Two different students should not be able to book the same tutor at the same time. | **Conflict query**: check for existing `PENDING` or `CONFIRMED` bookings for the same tutor+date, excluding the current student. |
| **Past sessions showing as CONFIRMED** — Sessions that already ended should not remain in CONFIRMED status. | **Auto-complete middleware**: on tutor/admin dashboard load, update all CONFIRMED bookings with `date < now()` to `COMPLETED`. |
| **Rescheduling resets status** — If a tutor already confirmed a session and the student reschedules, the new date should require re-confirmation. | When rescheduling (PATCH with `date` only), if current status is `CONFIRMED`, automatically set status back to `PENDING`. |

### 9.4 Security & Configuration

| Issue | Solution |
|---|---|
| **Jitsi Meet iframe blocked by Content Security Policy** — Modern browsers block external iframes unless explicitly allowed via CSP headers. | Configured comprehensive CSP in `next.config.ts`: `frame-src`, `script-src`, `connect-src` for `meet.jit.si` and `wss://meet.jit.si`. |
| **Hot-reload exhausts database connections** — Next.js development hot-reload creates new Prisma instances, each opening a new connection pool. | **Singleton pattern** in `lib/prisma.ts`: store the `Pool`, `PrismaPg`, and `PrismaClient` instances on `globalThis`, which survives hot-reloads. |
| **Unauthenticated users seeing student names in reviews** — Review list endpoint was exposing student names regardless of auth status. | Added conditional field exposure: only return `name` and `image` when user is authenticated (`isAuthenticated` flag). |
| **Resource ownership enforcement** — Tutors should only be able to delete their own resources. | Added ownership check: compare `resource.tutor.userId` against authenticated user ID before allowing DELETE. |

### 9.5 Database & Performance

| Issue | Solution |
|---|---|
| **N+1 query pattern for tutor review counts** — The "rising" sort needed recent review activity data. | **Batch-load** review counts using `prisma.review.groupBy()` with a 30-day filter instead of querying per-tutor. |
| **Admin dashboard performance** — Multiple independent counts and queries could slow down dashboard load. | Used `Promise.all()` to run all 11 Prisma queries in parallel, reducing total response time. |

### 9.6 Frontend

| Issue | Solution |
|---|---|
| **Tutor data unavailable on landing page** — When the API returns no tutors (empty database), the landing page shows nothing. | **Mock data fallback**: if API returns empty array or errors, fall back to hardcoded mock tutors (`lib/mock-data.ts`). |
| **Dark mode flash on page load** — Without an inline script, the page renders in light mode before React hydrates and applies dark mode. | **Inline script** in `layout.tsx` `<head>` that reads `localStorage` before first paint and applies the `dark` class immediately. |

---

## 10. Security Considerations

### 10.1 Authentication & Authorization

| Measure | Implementation | Location |
|---|---|---|
| **Session-based authentication** | HTTP-only cookies set by Neon Auth; verified server-side on every request | `middleware.ts`, `auth.getSession()` in each API route |
| **Route protection** | Middleware checks session before allowing access to `/dashboard/*` | `middleware.ts` |
| **Role-based access control** | Each API route checks `user.role` against required role | All `app/api/*/route.ts` files |
| **Email verification required** | New accounts created with `isVerified: false`; must verify before accessing dashboard | `/api/signup/*`, `/api/me`, `/api/verify-email` |
| **Tutor approval workflow** | Tutor accounts must be approved by admin (`APPROVED` status) before accessing platform | `/api/me`, `/api/admin/tutors/[id]` |
| **Session expiry** | Neon Auth handles session TTL; expired sessions return 401 | Neon Auth configuration |

### 10.2 Data Access Control

| Measure | Implementation |
|---|---|
| **Booking ownership** | Users can only read/modify bookings where they are the student or tutor (admins can view all) |
| **24-hour cancellation policy** | Students cannot cancel CONFIRMED sessions within 24 hours of the scheduled time |
| **Resource ownership** | Tutors can only delete their own uploaded resources |
| **Message ownership** | Users can only read messages where they are sender or receiver |
| **Admin-only endpoints** | All `/api/admin/*` routes verify `user.role === 'ADMIN'` |
| **Student-only actions** | Creating reviews requires a valid `studentProfile` |
| **Tutor-only actions** | Creating resources requires a valid `tutorProfile` |

### 10.3 Input Validation

| Measure | Implementation |
|---|---|
| **Required fields** | All POST/PATCH endpoints validate required fields exist |
| **Data types** | TypeScript types + runtime checks (e.g., `typeof rating !== 'number'`) |
| **Length limits** | Message content ≤ 2000 characters, review comment ≤ 2000 characters |
| **Password strength** | Minimum 8 characters on signup |
| **Age validation** | Must be between 5 and 100 |
| **Date validation** | Must be valid date, must be in the future |

### 10.4 Network Security

| Measure | Implementation |
|---|---|
| **Content Security Policy** | CSP headers configured for Jitsi Meet, Cloudinary, and DiceBear |
| **HTTPS** | All external API calls use HTTPS (Resend, Cloudinary, DiceBear, Neon) |
| **CORS** | Python FastAPI backend allows all origins (`allow_origins=["*"]`) |

### 10.5 Data Protection

| Measure | Implementation |
|---|---|
| **Password storage** | Handled by Neon Auth (not stored in application database) |
| **Email privacy** | Student names only exposed to authenticated users in reviews |
| **Environment variables** | All secrets (API keys, database URLs) stored in `.env`, never committed |
| **Error handling** | Server errors return generic "Server error" message; details logged server-side |

### 10.6 Security Checklist

- [ ] All API routes check authentication via `auth.getSession()`
- [ ] Sensitive operations check role-based permissions
- [ ] Email verification required before dashboard access
- [ ] Tutor accounts require admin approval
- [ ] Cancellation policy enforced server-side
- [ ] Duplicate booking prevention at database level
- [ ] Resource ownership enforced before deletion
- [ ] Input validation on all user-submitted data
- [ ] CSP headers configured for external resources
- [ ] Environment variables used for all secrets
- [ ] Error responses do not leak stack traces

---

## 11. Screenshots / Evidence

The following screenshots are recommended to document the integration working end-to-end:

### 11.1 Authentication Flow
| Screenshot | What to capture |
|---|---|
| **Login Page** | `/login` page with email/password fields, "Join Now" link |
| **Signup Page** | `/signup` page with registration form (name, email, password, age, level) |
| **Email Verification** | OTP verification prompt after signup |
| **Dashboard Landing** | `/dashboard` showing user-specific content after login |

### 11.2 Tutor Discovery & Booking
| Screenshot | What to capture |
|---|---|
| **Tutor Listing** | `/dashboard/tutors` showing grid of tutors with ratings, subjects, pricing |
| **Tutor Profile** | `/dashboard/tutors/[id]` with full details, reviews, availability |
| **Booking Creation** | Date/time picker and booking confirmation |
| **Booking Management** | `/dashboard/bookings` showing PENDING/CONFIRMED/COMPLETED sessions |
| **Classroom** | `/dashboard/classroom/[id]` with Jitsi Meet iframe loaded |

### 11.3 AI Assessment
| Screenshot | What to capture |
|---|---|
| **Test Interface** | `/dashboard/test` showing questions with multiple choice options |
| **Results Dashboard** | Score, percentage, mastery level badge |
| **Weakness Analysis** | List of weak subjects/topics with accuracy percentages |
| **Study Plan** | Generated personalized study plan |
| **Tutor Recommendations** | Links to matching tutors based on weak subjects |
| **Test History** | `/dashboard/test-history` showing past attempts and progress |

### 11.4 Messaging
| Screenshot | What to capture |
|---|---|
| **Conversation List** | `/dashboard/messages` showing active conversations with unread counts |
| **Chat View** | Open conversation with sent/received messages |
| **New Message** | Compose and send a new message |

### 11.5 Notifications
| Screenshot | What to capture |
|---|---|
| **Notification Dropdown** | Bell icon with unread badge → dropdown list |
| **Notification Types** | Booking request, confirmation, cancellation, new message |

### 11.6 Admin Panel
| Screenshot | What to capture |
|---|---|
| **Admin Dashboard** | `/dashboard/admin` with analytics (totals, breakdowns, trends) |
| **Tutor Approvals** | `/dashboard/admin/tutors` with PENDING/APPROVED/REJECTED status |
| **Student Management** | `/dashboard/admin/students` list with details |

### 11.7 Profile & Settings
| Screenshot | What to capture |
|---|---|
| **Student Profile** | Edit name, school, grade level |
| **Tutor Profile** | Edit headline, bio, subjects, availability, pricing, education |
| **Theme Toggle** | Dark mode vs light mode across dashboard pages |

### 11.8 Integration Evidence
| Screenshot | What to capture |
|---|---|
| **Email Notification** | Sample email received (booking confirmation) |
| **Cloudinary Upload** | Media file uploaded and hosted on Cloudinary CDN |
| **Jitsi Meet Session** | Active video call in classroom page |
| **Database Query** | Prisma Studio showing populated tables (Users, Bookings, etc.) |
| **API Response** | Browser DevTools showing successful API response with data |

---

## Appendix A: Environment Variables Reference

```env
# ── Database ──
DATABASE_URL='postgresql://user:pass@host/db?sslmode=require'

# ── Neon Auth ──
NEON_AUTH_BASE_URL='https://project.neonauth.region.aws.neon.tech/db/auth'
NEXT_PUBLIC_NEON_AUTH_BASE_URL='https://project.neonauth.region.aws.neon.tech/db/auth'
NEON_AUTH_COOKIE_SECRET='your-secret-here'

# ── Neon API (for deleting auth users) ──
NEON_API_KEY=''
NEON_PROJECT_ID=''
NEON_BRANCH_ID=''

# ── Email (Resend) ──
RESEND_API_KEY='re_xxx'

# ── Media (Cloudinary) ──
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME='your-cloud'
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET='Unsigned'

# ── App URL ──
NEXT_PUBLIC_APP_URL='http://localhost:3000'
```

## Appendix B: Required Prisma Migrations

```bash
# Initialize
npx prisma migrate dev --name init

# After schema changes
npx prisma migrate dev --name description_of_change

# Generate client after schema changes
npx prisma generate

# View database in Prisma Studio
npx prisma studio
```

## Appendix C: Build & Deployment

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint

# Python backend (separate terminal)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

> **End of Integration Documentation**  
> Brighton Academic Tutoring Platform · 2026  
> College of Computer Studies · LSPU