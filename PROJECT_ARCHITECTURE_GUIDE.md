# 📘 Portfolio Project — Full Architecture Guide

> **Owner:** Shaheryar | **Stack:** MERN (MongoDB, Express, React, Node.js)  
> **GitHub:** https://github.com/sherryvoid/PortfolioSite  
> **Admin Panel:** http://localhost:5173/admin/login  
> **Public Site:** http://localhost:5173/  

---

## 🗂️ Table of Contents
1. [Phases & What Was Built](#phases--what-was-built)
2. [Root Directory Structure](#root-directory-structure)
3. [Full Pipeline / Architecture](#full-pipeline--architecture)
4. [Is This MVC? — Architecture Pattern](#is-this-mvc--architecture-pattern)
5. [How the MERN Stack Communicates](#how-the-mern-stack-communicates)
6. [Most Important Files — Your Key Files](#most-important-files--your-key-files)
7. [Database Schemas (All Data Models)](#database-schemas-all-data-models)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [Authentication Flow](#authentication-flow)
10. [How to Change Static Data](#how-to-change-static-data)
11. [How to Change Dynamic Data (Admin Panel)](#how-to-change-dynamic-data-admin-panel)
12. [Social Links — Where to Set Them](#social-links--where-to-set-them)
13. [Contact Form — How It Works](#contact-form--how-it-works)
14. [Environment Variables Reference](#environment-variables-reference)
15. [How to Run the Project](#how-to-run-the-project)

---

## 📋 Phases & What Was Built

### Phase 1 — Foundation & Backend Setup
- Created the Express.js server with security middleware (Helmet, CORS, Rate Limiter)
- Set up MongoDB Atlas connection
- Built all 7 REST API route groups: `auth`, `profile`, `projects`, `skills`, `certifications`, `contact`, `analytics`
- Implemented JWT access token + refresh token authentication system
- Created all Mongoose data models (schemas)

### Phase 2 — React Frontend Foundation
- Initialized Vite + React 19 project
- Set up React Router v6 with public and admin route groups
- Created the 3 Context providers: `ThemeContext`, `AuthContext`, `DataContext`
- Set up the Axios HTTP client with automatic JWT injection and refresh logic

### Phase 3 — Public Portfolio UI
- Built the full single-page portfolio with sections: Hero, About, Portfolio, Skills, Certifications, Contact
- Hero Section: animated typewriter effect, cursor-reactive neural background, floating orbit icons
- About Section: profile photo display, bio, dynamic timeline from DB
- Portfolio Section: project grid with category filter, thumbnail display, tech stack tags
- Skills Section: honeycomb (hive) grid with 6-5-6 layout, neon glow effects per tech color
- Certifications Section: card grid with issuer, dates, credential links
- Contact Section: hexagonal layout form wired to backend API

### Phase 4 — Admin Dashboard
- Complete admin panel behind JWT-protected routes at `/admin/*`
- Dashboard with live analytics charts (views, messages, projects count)
- Projects Manager: full CRUD, file upload for thumbnails (stored as base64)
- Skills Manager: add/edit/delete skills with category tagging
- Certifications Manager: full CRUD
- Messages Manager: view/read/delete contact form submissions
- Profile Manager: edit all About section data (photo upload, bio, social links, stats, timeline)

### Phase 5 — Animations & Visual Polish
- Global neural network canvas background (`GlobalNeuralBg.jsx`)
- Framer Motion "assemble from pieces" scroll-triggered animations
- Collapsible sections with animated expand/collapse
- Cursor-reactive particle network in hero section
- Honeycomb skills grid with technology-specific neon glows

### Phase 6 — Bug Fixes & Refinements
- Fixed admin input focus-loss bug (moved `Field` component outside render scope)
- Rebuilt honeycomb from flat-top to pointy-top matching user's reference image
- Added 6-5-6 row pattern with dynamic parity offset to prevent row collisions
- Mobile responsiveness verified across all breakpoints

---

## 🗂️ Root Directory Structure

```
Portfolio/                          ← Git root / project root
├── client/                         ← React Frontend (Vite)
│   ├── src/
│   │   ├── main.jsx                ← Entry point, mounts React app
│   │   ├── App.jsx                 ← Router + Context providers wrapper
│   │   ├── index.css               ← ALL custom CSS / design system
│   │   │
│   │   ├── api/
│   │   │   └── axiosConfig.js      ← HTTP client (JWT auto-inject, refresh logic)
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     ← Login state, isAuthenticated, token mgmt
│   │   │   ├── DataContext.jsx     ← Global data store (profile, projects, skills, certs)
│   │   │   └── ThemeContext.jsx    ← Light/dark mode toggle
│   │   │
│   │   ├── hooks/
│   │   │   └── useAnalytics.js     ← Tracks page/section views for admin dashboard
│   │   │
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx    ← Navbar + Footer wrapper for public pages
│   │   │   └── AdminLayout.jsx     ← Sidebar + header wrapper for admin pages
│   │   │
│   │   ├── components/             ← Reusable UI building blocks
│   │   │   ├── AnimatedSection.jsx ← Scroll-triggered "assemble" entry animations
│   │   │   ├── CollapsibleSection.jsx ← Expandable section wrapper with animation
│   │   │   ├── GlobalNeuralBg.jsx  ← Canvas-based network background (whole page)
│   │   │   ├── HeroIllustration.jsx ← SVG/animated illustration for hero
│   │   │   ├── Modal.jsx           ← Reusable modal dialog
│   │   │   ├── ParticleBackground.jsx ← Cursor-reactive neural network (hero only)
│   │   │   ├── TechIcon.jsx        ← Maps tech names to SVG icon URLs (devicons CDN)
│   │   │   └── ThemeToggle.jsx     ← Dark/light toggle button
│   │   │
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   └── Home.jsx        ← Assembles all 6 public sections in order
│   │   │   └── admin/
│   │   │       ├── Login.jsx       ← Admin login form
│   │   │       ├── Dashboard.jsx   ← Analytics charts, stats overview
│   │   │       ├── ProjectsManager.jsx  ← Manage portfolio projects
│   │   │       ├── SkillsManager.jsx    ← Manage tech skills
│   │   │       ├── CertsManager.jsx     ← Manage certifications
│   │   │       ├── MessagesManager.jsx  ← View contact form messages
│   │   │       └── ProfileManager.jsx   ← Edit name, bio, photo, socials, timeline
│   │   │
│   │   └── sections/               ← The 6 public-facing page sections
│   │       ├── HeroSection.jsx     ← Top banner, typewriter, CTA buttons
│   │       ├── AboutSection.jsx    ← Profile photo, bio, timeline, stats
│   │       ├── PortfolioSection.jsx ← Project grid with filter tabs
│   │       ├── SkillsSection.jsx   ← Honeycomb hive grid
│   │       ├── CertificationsSection.jsx ← Certification cards
│   │       └── ContactSection.jsx  ← Contact form + info cards
│   │
│   ├── index.html                  ← HTML shell, meta tags, font imports
│   ├── vite.config.js              ← Vite build config (proxy to :5000)
│   └── package.json
│
├── server/                         ← Node.js + Express Backend
│   ├── server.js                   ← Entry point, loads middleware & routes
│   │
│   ├── config/
│   │   ├── db.js                   ← MongoDB connection via Mongoose
│   │   └── cors.js                 ← CORS origin allowlist
│   │
│   ├── middleware/
│   │   ├── auth.js                 ← JWT verification (protects admin routes)
│   │   ├── errorHandler.js         ← Global error catching & formatting
│   │   └── rateLimiter.js          ← Prevents API abuse / DDoS
│   │
│   ├── models/                     ← MongoDB Schemas (data shapes)
│   │   ├── User.js                 ← Admin account (email + hashed password)
│   │   ├── Profile.js              ← About section data
│   │   ├── Project.js              ← Portfolio projects
│   │   ├── Skill.js                ← Tech skills
│   │   ├── Certification.js        ← Certifications
│   │   ├── ContactMessage.js       ← Messages from contact form
│   │   └── AnalyticsEvent.js       ← Page/section view tracking
│   │
│   ├── routes/                     ← API endpoint handlers
│   │   ├── auth.js                 ← POST /login, /refresh, /logout
│   │   ├── profile.js              ← GET/PUT /profile
│   │   ├── projects.js             ← CRUD /projects
│   │   ├── skills.js               ← CRUD /skills
│   │   ├── certifications.js       ← CRUD /certifications
│   │   ├── contact.js              ← POST /contact (public), GET/DELETE (admin)
│   │   └── analytics.js            ← Track + query view events
│   │
│   ├── utils/
│   │   └── seedAdmin.js            ← One-time admin user creation from .env
│   │
│   ├── .env                        ← Secret config (never commit this!)
│   └── .env.example                ← Template showing required variables
│
└── PROJECT_ARCHITECTURE_GUIDE.md  ← This file!
```

---

## 🔄 Full Pipeline / Architecture

```
BROWSER (User visits http://localhost:5173/)
        │
        ▼
┌─────────────────────────────────────────────┐
│           REACT FRONTEND (Vite)             │
│  main.jsx → App.jsx → ThemeProvider         │
│                      ↓ AuthProvider         │
│                      ↓ DataProvider         │
│                      ↓ Router               │
│                                             │
│  Public Route (/)      Admin Route (/admin) │
│  └─ PublicLayout       └─ ProtectedRoute    │
│     └─ Home.jsx           (checks JWT)      │
│        ├─ HeroSection       └─ AdminLayout  │
│        ├─ AboutSection         ├─ Dashboard │
│        ├─ PortfolioSection     ├─ Projects  │
│        ├─ SkillsSection        ├─ Skills    │
│        ├─ CertSection          ├─ Certs     │
│        └─ ContactSection       ├─ Messages  │
│                                └─ Profile   │
└─────────────────────────────────────────────┘
        │ Axios HTTP calls via axiosConfig.js
        │ (Bearer token injected automatically)
        ▼
┌─────────────────────────────────────────────┐
│         EXPRESS SERVER (Node.js :5000)       │
│                                             │
│  server.js (entry)                          │
│  │                                          │
│  ├─ Helmet (security headers)               │
│  ├─ CORS (only allows :5173 & production)   │
│  ├─ Rate Limiter (abuse prevention)         │
│  ├─ Morgan (request logging in dev)         │
│  ├─ Body Parser (JSON, 10mb limit)          │
│  │                                          │
│  ├─ /api/auth      → routes/auth.js         │
│  ├─ /api/profile   → routes/profile.js      │
│  ├─ /api/projects  → routes/projects.js     │
│  ├─ /api/skills    → routes/skills.js       │
│  ├─ /api/certs     → routes/certifications  │
│  ├─ /api/contact   → routes/contact.js      │
│  ├─ /api/analytics → routes/analytics.js   │
│  └─ /api/health    (health check endpoint)  │
│                                             │
│  middleware/auth.js verifies JWT before     │
│  any protected admin routes run             │
└─────────────────────────────────────────────┘
        │ Mongoose ORM
        ▼
┌─────────────────────────────────────────────┐
│           MONGODB ATLAS (Cloud DB)           │
│                                             │
│  Collections:                               │
│  ├─ users          (admin credentials)      │
│  ├─ profiles       (about section data)     │
│  ├─ projects       (portfolio items)        │
│  ├─ skills         (tech stack)             │
│  ├─ certifications                          │
│  ├─ contactmessages                         │
│  └─ analyticsevents                         │
└─────────────────────────────────────────────┘
```

---

## 🏛️ Is This MVC? — Architecture Pattern

**Yes — this project follows a modified MVC (Model-View-Controller) pattern across the full stack.**

| Layer | Where In This Project |
|---|---|
| **Model** | `server/models/*.js` — MongoDB schemas define data structure |
| **View** | `client/src/sections/*.jsx` + `client/src/pages/**` — React renders the UI |
| **Controller** | `server/routes/*.js` — All business logic lives in route handlers |

**On the frontend**, it follows the **Context + Component** pattern:
- **Context** (DataContext, AuthContext) acts like a global store / state manager
- **Sections** and **Pages** are the view layer
- **API calls** via `axiosConfig.js` are the frontend "controller" calls

**There is no separate controllers/ folder** — the route files act as controllers. This is a pragmatic Express pattern. If the project grows, you'd extract business logic out of routes into a `controllers/` folder (e.g., `controllers/projectController.js`).

---

## 🔌 How the MERN Stack Communicates

### Step-by-step for a data fetch:

1. **React component mounts** → `DataContext` runs `fetchAll()`
2. `DataContext` calls `api.get('/profile')` via `axiosConfig.js`
3. `axiosConfig.js` automatically adds the `Authorization: Bearer <token>` header from `localStorage`
4. Request hits **Express server** at `POST http://localhost:5000/api/profile`
   - In development, Vite proxies `/api` to `:5000` (configured in `vite.config.js`)
5. The route handler in `routes/profile.js` runs
6. It queries **MongoDB** via Mongoose: `Profile.findOne()`
7. MongoDB returns data → Express returns JSON response
8. `DataContext` stores it in React state
9. Any component using `useData()` automatically re-renders with the new data

### Token Refresh Flow:
```
API call → 401 "expired" response
  → axiosConfig interceptor catches it
  → calls POST /api/auth/refresh with refreshToken from localStorage
  → server validates refresh token, returns new accessToken
  → retries the original request
  → if refresh fails → redirects to /admin/login
```

---

## 🔑 Most Important Files — Your Key Files

| Priority | File | Why It Matters |
|---|---|---|
| ⭐⭐⭐ | `server/.env` | ALL secrets live here. MongoDB URL, JWT keys, admin login |
| ⭐⭐⭐ | `server/server.js` | Backend entry point. Loads everything. |
| ⭐⭐⭐ | `client/src/App.jsx` | Routing hub. Controls what shows at which URL. |
| ⭐⭐⭐ | `client/src/context/DataContext.jsx` | Global data fetcher. All sections get data from here. |
| ⭐⭐⭐ | `client/src/api/axiosConfig.js` | All HTTP communication. JWT injection + refresh. |
| ⭐⭐ | `client/src/index.css` | ALL styling. Design tokens, animations, layouts. |
| ⭐⭐ | `client/src/sections/HeroSection.jsx` | Typewriter roles, greeting text, CTA buttons |
| ⭐⭐ | `client/src/sections/SkillsSection.jsx` | Honeycomb grid, fallback skills if DB is empty |
| ⭐⭐ | `server/models/Profile.js` | Shape of all "About Me" data |
| ⭐⭐ | `server/routes/contact.js` | Contact form submission logic |
| ⭐ | `server/middleware/auth.js` | JWT token validation for all admin routes |
| ⭐ | `client/src/pages/admin/ProfileManager.jsx` | Admin UI to edit about section |

---

## 🗃️ Database Schemas (All Data Models)

### Profile (`server/models/Profile.js`)
Used for the entire **About Section** and **Hero Section**.
```
name             → Your display name
title            → "Full Stack Developer" etc.
bio              → Long description text
photo            → Base64 encoded profile image string
email            → Contact email shown on site
phone            → Contact phone
location         → "Lahore, Pakistan" etc.
heroSubtitle     → Typewriter text (comma-separated roles)
social.github    → GitHub profile URL
social.linkedin  → LinkedIn URL
social.twitter   → Twitter/X URL
social.website   → Personal website URL
stats.yearsExperience  → Number shown in About stats
stats.projectsCompleted
stats.happyClients
aboutTimeline[]  → Array of { year, title, description }
```
**→ Change via:** Admin Panel → Profile & About

---

### Project (`server/models/Project.js`)
```
title            → Project name
description      → Short description (card view)
longDescription  → Full detail (modal/page)
thumbnail        → Base64 image string
techStack[]      → Array of strings ["react", "nodejs"]
liveUrl          → Live demo link
githubUrl        → GitHub repo link
category         → "web" | "mobile" | "ai" | "backend" | "other"
featured         → Boolean (shows ⭐ badge)
views            → Auto-incremented view counter
```
**→ Change via:** Admin Panel → Projects

---

### Skill (`server/models/Skill.js`)
```
name             → "React", "Node.js", "Docker"
icon             → Icon name for TechIcon component
category         → "frontend" | "backend" | "database" | "devops" | "tools"
proficiency      → 0-100 number (not currently displayed in honeycomb)
```
**→ Change via:** Admin Panel → Skills

---

### Certification (`server/models/Certification.js`)
```
title            → "AWS Certified Solutions Architect"
issuer           → "Amazon Web Services"
issuedDate       → Date
expiryDate       → Date (optional)
credentialUrl    → "Verify Credential" link
description      → Short description
```
**→ Change via:** Admin Panel → Certifications

---

### ContactMessage (`server/models/ContactMessage.js`)
```
name, email, subject, message  → from contact form
isRead           → boolean, toggled by admin
```
**→ Read via:** Admin Panel → Messages

---

## 📡 API Endpoints Reference

All public endpoints return JSON. Admin endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/profile` | Public | Get profile data |
| PUT | `/api/profile` | Admin | Update profile data |
| GET | `/api/projects` | Public | List all projects |
| POST | `/api/projects` | Admin | Create project |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| GET | `/api/skills` | Public | List all skills |
| POST | `/api/skills` | Admin | Add skill |
| PUT | `/api/skills/:id` | Admin | Update skill |
| DELETE | `/api/skills/:id` | Admin | Delete skill |
| GET | `/api/certifications` | Public | List certs |
| POST | `/api/certifications` | Admin | Add cert |
| PUT | `/api/certifications/:id` | Admin | Update cert |
| DELETE | `/api/certifications/:id` | Admin | Delete cert |
| POST | `/api/contact` | Public | Submit message |
| GET | `/api/contact` | Admin | List all messages |
| PATCH | `/api/contact/:id/read` | Admin | Toggle read |
| DELETE | `/api/contact/:id` | Admin | Delete message |
| POST | `/api/auth/login` | Public | Login → returns tokens |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | Admin | Logout |
| GET | `/api/health` | Public | Server health check |

---

## 🔐 Authentication Flow

```
Admin Login:
  1. Enter email + password at /admin/login
  2. POST /api/auth/login → server validates against User model (bcrypt)
  3. Server returns { accessToken (15min), refreshToken (7 days) }
  4. Both stored in localStorage
  5. All future requests: axiosConfig auto-adds Bearer token
  6. When accessToken expires → interceptor auto-refreshes silently
  7. When refreshToken expires → forced redirect to login
```

**Admin credentials are set in `server/.env`:**
```
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=yourpassword
```
The server's `seedAdmin.js` creates the admin user the first time you run it. Change these env vars and re-seed if you want to change your password.

---

## ✏️ How to Change Static Data

**Static data** = things hardcoded in the frontend files that don't come from the database.

| What You Want to Change | File to Edit | What to Look For |
|---|---|---|
| Typewriter roles in Hero | `client/src/sections/HeroSection.jsx` | Line 7: `const roles = [...]` |
| "Available for Work" badge | `client/src/sections/HeroSection.jsx` | Line 54: text content |
| "View My Work" / "Get In Touch" button text | `client/src/sections/HeroSection.jsx` | Lines 99-100 |
| Fallback skills (when DB is empty) | `client/src/sections/SkillsSection.jsx` | `const fallbackSkills = [...]` |
| Tech color mappings in hive | `client/src/sections/SkillsSection.jsx` | `getSkillColor()` function |
| Tab label names for skill filter | `client/src/sections/SkillsSection.jsx` | `const categoryLabels = {...}` |
| Hero orbit icons (⚛️ 🧠 🎮 ☁️) | `client/src/sections/HeroSection.jsx` | Line 112 |
| Page title + meta description | `client/index.html` | `<title>` and `<meta>` tags |
| Fonts (currently Inter/Orbitron) | `client/index.html` | Google Fonts `<link>` tag |
| Color palette / design tokens | `client/src/index.css` | `:root { --accent-cyan: ...}` at top |
| Animation speeds globally | `client/src/index.css` | `transition`, `animation` values |

---

## 📋 How to Change Dynamic Data (Admin Panel)

**Dynamic data** = everything stored in MongoDB, editable without code changes.

### Step 1: Login
Go to `http://localhost:5173/admin/login`  
Use the email/password from `server/.env`

### Step 2: Navigate to the right manager

| To Change | Go To |
|---|---|
| Your name, bio, photo, title | Admin → **Profile & About** |
| Typewriter subtitle text | Admin → Profile → "Hero Subtitle" field |
| Years of experience, projects count | Admin → Profile → "Experience Stats" |
| Your timeline (education/work history) | Admin → Profile → "About Timeline" section |
| Portfolio projects | Admin → **Projects** → "+ Add Project" |
| Project thumbnails | Admin → Projects → Edit → upload image |
| Tech skills in honeycomb | Admin → **Skills** → "+ Add Skill" |
| Certifications | Admin → **Certifications** → "+ Add Cert" |
| Messages from visitors | Admin → **Messages** |
| Site analytics/views | Admin → **Dashboard** |

---

## 🔗 Social Links — Where to Set Them

Social links are stored in the **Profile** model in MongoDB.

**To set/update them:**
1. Go to `http://localhost:5173/admin/profile`
2. Scroll to "Contact & Social" section on the right
3. Fill in GitHub, LinkedIn, Twitter, Website URLs
4. Click "Save Changes"

**Where they are displayed on the public site:**
- `client/src/sections/AboutSection.jsx` — renders `profile.social.*`
- `client/src/sections/ContactSection.jsx` — renders contact info from `profile`

**If you want to add a new social platform** (e.g. YouTube), you need to:
1. Add the field to `server/models/Profile.js` (Model)
2. Add the URL field to `client/src/pages/admin/ProfileManager.jsx` (Admin form)
3. Render it in `client/src/sections/AboutSection.jsx` or `ContactSection.jsx`

---

## 📬 Contact Form — How It Works

The contact form at the bottom of the public site works like this:

```
User fills form → clicks Send
      ↓
ContactSection.jsx → POST /api/contact
      ↓
server/routes/contact.js → saves to MongoDB (ContactMessage collection)
      ↓
Admin Panel → Messages tab shows the message
```

**Currently:** Messages are only stored in the database. There is **no email notification** yet.

**To add email notifications (future):** Install `nodemailer`, add your SMTP credentials to `.env`, and call `nodemailer.sendMail()` inside `routes/contact.js` after saving to DB.

**Contact info shown alongside the form** (email, phone, location) comes from the Profile in the database. Update it via Admin → Profile & About.

---

## ⚙️ Environment Variables Reference

File location: `server/.env` (never commit this file!)

```bash
# Server port
PORT=5000

# MongoDB Atlas connection string (get from atlas.mongodb.com)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/portfolio

# JWT Secrets — make these long random strings (use a password generator)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Token expiry durations
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# The URL of your frontend (for CORS whitelist)
CLIENT_URL=http://localhost:5173

# Admin login credentials (seed into DB on first run)
ADMIN_EMAIL=admin@yoursite.com
ADMIN_PASSWORD=choose-a-strong-password

# "development" or "production"
NODE_ENV=development
```

**For the React frontend**, create `client/.env`:
```bash
# Only needed if deploying separately (not proxied)
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 How to Run the Project

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account + cluster created
- `.env` file configured in `server/`

### Terminal 1 — Start Backend
```bash
cd server
npm install
node server.js
# → Server running on port 5000
```

### Terminal 2 — Start Frontend
```bash
cd client
npm install
npm run dev
# → Vite dev server on http://localhost:5173
```

### First Time Setup Only — Create Admin User
```bash
cd server
node utils/seedAdmin.js
# → Creates admin account from ADMIN_EMAIL + ADMIN_PASSWORD in .env
```

### Production Build (Frontend)
```bash
cd client
npx vite build
# → Outputs to client/dist/ — deploy this to Vercel/Netlify
```

---

## 📊 Data Flow Diagrams

### Public Website Load
```
Browser opens localhost:5173
  → React boots (main.jsx → App.jsx)
  → DataProvider.useEffect() fires
  → 4 parallel API calls:
     GET /api/profile       → sets profile state
     GET /api/projects      → sets projects state
     GET /api/skills        → sets skills state
     GET /api/certifications → sets certifications state
  → All 6 sections receive data via useData() hook
  → Page renders with live DB data
```

### Admin Edit Flow
```
Admin edits profile at /admin/profile
  → Types in form fields (controlled inputs via useState)
  → Clicks "Save Changes"
  → ProfileManager.handleSave() fires
  → PUT /api/profile (with Bearer token in header)
  → auth middleware validates JWT
  → routes/profile.js updates MongoDB document
  → server returns updated profile JSON
  → DataContext.refetch() is called
  → DataContext re-fetches all data
  → Public site sections re-render with new data
```

---

## 🎨 Where is the CSS / Design System?

**Everything visual lives in `client/src/index.css`** (~2,100 lines).

Key sections inside the file:
```
:root { }                    ← Design tokens (colors, fonts, spacing, radius)
[data-theme="light"] { }     ← Light mode overrides
body, * { }                  ← Global resets
.btn { }                     ← Button styles (btn-primary, btn-secondary)
.hero { }                    ← Hero section layout
.about-* { }                 ← About section styles
.projects-* { }              ← Portfolio grid
.hive-container / .hex-* { } ← Honeycomb skills grid
.contact-* { }               ← Contact form & info cards
.admin-* { }                 ← Admin dashboard styles
@media (max-width: 768px) { } ← Tablet breakpoint
@media (max-width: 480px) { } ← Mobile breakpoint
```

---

*Last updated: March 2026 | Maintained by Shaheryar*
