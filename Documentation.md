# Portfolio Project — Complete Documentation

> **Stack:** MongoDB · Express.js · React 19 · Node.js (MERN)  
> **Frontend Build Tool:** Vite 8  
> **Animation Library:** Framer Motion  
> **Styling:** Vanilla CSS with CSS Custom Properties (Dark/Light)

---

## TABLE OF CONTENTS

1. [Root-Level Files](#1-root-level-files)
2. [Server — File-by-File Breakdown](#2-server--file-by-file-breakdown)
3. [Client — File-by-File Breakdown](#3-client--file-by-file-breakdown)
4. [Interview Q&A — Architecture & Design Decisions](#4-interview-qa--architecture--design-decisions)
5. [Interview Q&A — Backend Deep-Dive](#5-interview-qa--backend-deep-dive)
6. [Interview Q&A — Frontend Deep-Dive](#6-interview-qa--frontend-deep-dive)
7. [Interview Q&A — Security & Production](#7-interview-qa--security--production)
8. [Interview Q&A — Performance & Optimization](#8-interview-qa--performance--optimization)
9. [Interview Q&A — Testing](#9-interview-qa--testing)

---

## 1. Root-Level Files

| File | Purpose |
|---|---|
| `.gitignore` | Tells Git which files/folders to exclude from version control (e.g., `node_modules/`, `.env`). |
| `PROJECT_ARCHITECTURE_GUIDE.md` | A static reference document describing the project's architecture at a high level. |
| `Documentation.md` | **This file.** The master documentation you are reading right now. |

The project is split into two completely independent directories: `server/` (backend API) and `client/` (frontend React app). They communicate exclusively over HTTP using JSON.

---

## 2. Server — File-by-File Breakdown

### `server/.env`
The environment configuration file. It stores secrets that must **never** be committed to Git in production. Contains:
- `PORT` — The port Express listens on (5000).
- `MONGODB_URI` — Connection string pointing to the MongoDB database.
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — Cryptographic keys used to sign and verify JSON Web Tokens.
- `JWT_EXPIRE` / `JWT_REFRESH_EXPIRE` — Token lifetimes (access = 15 minutes, refresh = 7 days).
- `CLIENT_URL` — The frontend's origin, used by CORS to whitelist requests.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Default credentials for the auto-seeded admin account.
- `NODE_ENV` — Controls environment-specific behavior (logging, rate-limit thresholds, error stack traces).

### `server/server.js`
**The entry point of the entire backend application.** This file:
1. Loads environment variables from `.env` using `dotenv.config()`.
2. Creates an Express application instance (`const app = express()`).
3. Connects to MongoDB by calling `connectDB()`.
4. Registers **security middleware** in a specific order: Helmet → CORS → Rate Limiter.
5. Conditionally enables Morgan request logging only in development mode.
6. Registers body parsers (`express.json()`) with a 10MB limit to accept project thumbnail uploads as Base64 strings.
7. Mounts all seven route modules under the `/api` prefix.
8. Defines a `/api/health` endpoint that returns `{ status: 'OK' }` — used by deployment platforms to verify the server is alive.
9. Registers the error handler as the **last** middleware (Express requires this specific ordering — a 4-argument function after all routes).
10. Uses `require.main === module` to only call `app.listen()` when the file is run directly (`node server.js`), but **not** when it is imported by test files. This pattern allows Supertest to bind to the app without a port conflict.
11. Exports `app` so test files can `require('./server')`.

### `server/package.json`
Defines project metadata and dependencies:
- **Scripts:** `start` (production), `dev` (Node's `--watch` mode for auto-restart), `seed` (manual data seeding), `test` (Jest with `--forceExit`).
- **Runtime dependencies:** express, mongoose, bcryptjs, jsonwebtoken, cors, helmet, morgan, express-rate-limit, joi, dotenv, mongodb-memory-server, uuid.
- **Dev dependencies:** jest, supertest, cross-env.

---

### `server/config/db.js`
**Database connection and auto-seeding logic.** This file does two critical things:

**Connection Strategy (Graceful Fallback):**
- First checks if `MONGODB_URI` points to localhost or is missing.
- If so, it spins up an **in-memory MongoDB** using `mongodb-memory-server`. This means the app works out-of-the-box with zero database setup — you just run `npm run dev` and it starts.
- If a real MongoDB Atlas URI is configured, it connects normally for persistent storage.

**Auto-Seeding:**
- After connecting, it checks if the `users` collection is empty (`User.countDocuments()`).
- If the database is empty (first run), it calls `autoSeed()` which populates every collection — User, Profile, Projects (6), Skills (18), Certifications (4) — with realistic placeholder data.
- This means the portfolio works immediately with sample content visible on the frontend.

### `server/config/cors.js`
**Cross-Origin Resource Sharing configuration.** Defines which domains are allowed to call the API:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (alternative dev server)
- `process.env.CLIENT_URL` (production frontend URL)
- Requests with no `origin` header (e.g., Postman, cURL, mobile apps) are allowed.
- Enabled methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Allowed headers: `Content-Type, Authorization` (the latter is needed for JWT tokens).
- `credentials: true` permits cookies/auth headers in cross-origin requests.

---

### `server/middleware/auth.js`
**JWT authentication guard.** This is a standard Express middleware function that:
1. Extracts the `Authorization` header from the incoming request.
2. Checks it follows the `Bearer <token>` format.
3. Calls `jwt.verify()` to cryptographically validate the token against `JWT_SECRET`.
4. Looks up the user in MongoDB using the `userId` embedded in the token payload.
5. If valid: attaches `req.user` (without the password hash) and calls `next()` to proceed.
6. If invalid/expired: returns `401 Unauthorized` with a descriptive message.
7. Specifically detects `TokenExpiredError` and sends `{ expired: true }` — the frontend's Axios interceptor uses this flag to trigger the refresh token flow.

### `server/middleware/errorHandler.js`
**Centralized error handler.** Express calls this when any route passes an error to `next(error)`. It catches:
- **Mongoose `ValidationError`** — extracts individual field error messages and returns them as a `400` array.
- **Mongoose duplicate key (`code: 11000`)** — returns a human-readable message like `"Duplicate value for email"`.
- **Mongoose `CastError`** — catches invalid MongoDB ObjectId strings and returns `"Invalid ID format"`.
- **`JsonWebTokenError`** — catches malformed tokens.
- **Everything else** — returns `500 Internal Server Error`. In development mode, includes the stack trace for debugging; in production, hides it.

### `server/middleware/rateLimiter.js`
**Rate limiting using express-rate-limit.** Exports three limiter instances with different thresholds:
- `generalLimiter` — 200 requests per 15 minutes per IP in production (1000 in dev).
- `authLimiter` — 10 login attempts per 15 minutes per IP in production (100 in dev). Applied specifically to `/api/auth/login`.
- `analyticsLimiter` — 120 analytics events per minute per IP in production (500 in dev).

Uses `standardHeaders: true` to send `RateLimit-*` headers to the client, and `legacyHeaders: false` to suppress deprecated `X-RateLimit-*` headers.

---

### `server/models/User.js`
**Mongoose schema for admin accounts.** Fields: `email` (unique, lowercase, trimmed), `password` (min 6 characters), `refreshToken`.

**Key Mongoose features used:**
- **`pre('save')` hook** — Before saving, checks if the password was modified. If so, hashes it with bcrypt using 12 salt rounds. This means the plaintext password **never** touches the database.
- **Instance method `comparePassword()`** — Uses `bcrypt.compare()` to check a login attempt against the stored hash without ever decrypting it.
- **`timestamps: true`** — Automatically adds `createdAt` and `updatedAt` fields.

### `server/models/Project.js`
**Schema for portfolio projects.** Fields: `title`, `slug`, `description`, `longDescription`, `thumbnail` (Base64 string), `images` (array), `techStack` (array of technology name strings), `liveUrl`, `githubUrl`, `category` (enum: web/mobile/ai/backend/other), `featured` (boolean), `order` (number for manual sorting), `views` (auto-incremented on each GET by ID).

**`pre('save')` hook** — Auto-generates a URL-friendly slug from the title (e.g., `"E-Commerce Platform"` → `"e-commerce-platform"`).

### `server/models/Skill.js`
**Schema for tech stack skills.** Fields: `name`, `icon` (a Devicon slug like `"react"` or `"nodejs"`), `category` (enum: frontend/backend/database/devops/tools/language), `proficiency` (0–100), `order`.

### `server/models/Profile.js`
**Schema for the developer's personal information.** A single document in the `profiles` collection stores: `name`, `title`, `bio`, `photo`, `resume`, `email`, `phone`, `location`, `social` (nested object with github/linkedin/twitter/website URLs), `stats` (yearsExperience/projectsCompleted/happyClients), `heroSubtitle`, and `aboutTimeline` (an array of `{ year, title, description }` objects).

### `server/models/Certification.js`
**Schema for professional certifications.** Fields: `title`, `issuer`, `issueDate`, `expiryDate`, `credentialUrl`, `badgeImage`, `order`.

### `server/models/ContactMessage.js`
**Schema for contact form submissions.** Fields: `name`, `email`, `subject`, `message`, `isRead` (boolean, defaults to `false`). Visitors submit messages through the public contact form; the admin can view and mark them as read.

### `server/models/AnalyticsEvent.js`
**Schema for tracking user behavior.** Each event records: `type` (enum: page_view/section_view/project_click/contact_submit/resume_download), `target`, `sessionId`, `ip`, `referrer`, `userAgent`, `country`, `screenSize`, `duration`, `timestamp`.

**Performance optimization:** Defines four MongoDB indexes on `timestamp`, `sessionId`, `type`, and `target` for fast aggregation queries on the admin dashboard.

---

### `server/routes/auth.js`
**Authentication endpoints.** Four routes:
- **`POST /login`** — Validates credentials via bcrypt. On success, generates both an access token (15min) and a refresh token (7 days). Stores the refresh token in the database. Protected by `authLimiter`.
- **`POST /refresh`** — Accepts a refresh token, validates it against `JWT_REFRESH_SECRET`, cross-checks it matches the one stored in the database (to prevent reuse after logout). Issues a brand-new token pair. This is the "silent re-authentication" mechanism.
- **`POST /logout`** — Requires a valid access token. Clears the user's refresh token from the database, effectively invalidating all sessions.
- **`GET /me`** — Returns the current user's ID and email. Used by the frontend on page load to verify if a stored token is still valid.

### `server/routes/projects.js`
**Full CRUD + reorder for projects.** Five routes:
- **`GET /`** — Public. Accepts optional `?category=web` and `?featured=true` query filters. Sorts by `order` ascending, then `createdAt` descending.
- **`GET /:id`** — Public. Returns a single project and increments its `views` counter.
- **`POST /`** — Admin only (protected by `auth` middleware). Creates a new project.
- **`PUT /:id`** — Admin only. Updates a project with `runValidators: true` to enforce schema constraints.
- **`DELETE /:id`** — Admin only. Deletes a project.
- **`PATCH /reorder`** — Admin only. Accepts an array of IDs in the desired display order. Uses `bulkWrite()` to update all order fields in a single database operation instead of N individual updates.

### `server/routes/skills.js`
**CRUD for skills.** Same pattern as projects (GET public, POST/PUT/DELETE admin-only), minus the reorder and view-count features.

### `server/routes/certifications.js`
**CRUD for certifications.** Identical pattern. Sorted by `order` ascending, then `issueDate` descending.

### `server/routes/contact.js`
**Contact form endpoints.** Three routes:
- **`POST /`** — Public. Validates required fields (name, email, message), creates a `ContactMessage` document.
- **`GET /`** — Admin only. Returns all messages sorted by newest first.
- **`PATCH /:id/read`** — Admin only. Toggles the `isRead` boolean (mark as read / mark as unread).
- **`DELETE /:id`** — Admin only. Deletes a message.

### `server/routes/analytics.js`
**Analytics endpoints.** The most complex route file:
- **`POST /event`** — Public (rate-limited). Logs a single analytics event. Extracts the user's IP from `x-forwarded-for` header (for proxied production environments).
- **`GET /overview`** — Admin only. Uses `Promise.all()` to run five MongoDB queries in parallel: total page views, unique sessions, most-clicked project, contact submissions, and 20 most recent events. Accepts `?days=30` as a filter.
- **`GET /visitors`** — Admin only. Uses MongoDB's **aggregation pipeline** to group page views by date, count views per day, and compute unique visitors per day using `$addToSet` + `$size`.
- **`GET /top-projects`** — Admin only. Aggregation pipeline grouping `project_click` events and sorting by click count.
- **`GET /sections`** — Admin only. Aggregation pipeline computing view count and average time spent per section.

### `server/routes/profile.js`
**Profile endpoints.** Two routes:
- **`GET /`** — Public. Finds the single profile document. If none exists (edge case), creates a default one.
- **`PUT /`** — Admin only. Uses `Object.assign()` to merge the request body into the existing profile, preserving fields not included in the update.

---

### `server/utils/generateToken.js`
Two helper functions:
- `generateAccessToken(userId)` — Signs a JWT with `JWT_SECRET`, expires in 15 minutes.
- `generateRefreshToken(userId)` — Signs a JWT with `JWT_REFRESH_SECRET` (a different key), expires in 7 days.

Using separate secrets means a leaked access token cannot be used to forge a refresh token, and vice versa.

### `server/utils/seedData.js`
A standalone script (`node utils/seedData.js`) that populates the database with sample data. Functionally identical to `autoSeed()` in `db.js`, but designed to be run manually.

### `server/tests/health.test.js`
A Jest + Supertest integration test that sends a `GET /api/health` request to the Express app and asserts the response status is `200` and the body contains `{ status: 'OK' }`.

---

## 3. Client — File-by-File Breakdown

### `client/index.html`
The single HTML file for the entire application. Contains a `<div id="root">` where React renders, plus `<link>` tags for Google Fonts (Inter, JetBrains Mono) and a Devicon stylesheet for tech skill icons.

### `client/vite.config.js`
Vite's configuration. Enables the React plugin, sets the dev server to port 5173, and proxies all `/api` requests to `http://localhost:5000` — meaning in development, the frontend and backend can communicate without CORS issues. Also configures Vitest with `jsdom` environment.

### `client/package.json`
Frontend dependencies:
- **React 19 + React DOM** — UI library.
- **react-router-dom** — Client-side routing.
- **axios** — HTTP client for API calls.
- **framer-motion** — Animation library.
- **lenis** — Smooth scrolling library.
- **recharts** — Chart library (admin dashboard graphs).
- **Dev:** Vite, ESLint, Vitest, Testing Library.

---

### `client/src/main.jsx`
The bootstrap file. Calls `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`. This is where React takes over the page.

### `client/src/App.jsx`
**The application's router and provider tree.** Structure:
```
BrowserRouter
  → ThemeProvider    (dark/light mode state)
    → AuthProvider   (login/logout/token state)
      → DataProvider (portfolio data cache)
        → AppRoutes
```

Route mapping:
- `/` → `PublicLayout` wrapping `Home`
- `/admin/login` → `Login` (lazy loaded)
- `/admin/*` → `ProtectedRoute` wrapping `AdminLayout` (lazy loaded sub-routes)
- `*` → redirect to `/`

**Code splitting:** All 7 admin pages use `React.lazy()`, meaning their JavaScript bundles are downloaded only when a user navigates to `/admin/*`. This keeps the public site's initial bundle small and fast.

`ProtectedRoute` checks `AuthContext` — if not authenticated, it redirects to `/admin/login` using `<Navigate>`.

---

### `client/src/api/axiosConfig.js`
**The core HTTP client.** Creates a customized Axios instance with:
- `baseURL` set to `/api` (proxied to backend via Vite in development).
- **Request interceptor:** Before every outgoing request, reads the JWT access token from `localStorage` and attaches it as `Authorization: Bearer <token>`.
- **Response interceptor:** If any response returns `401` with `{ expired: true }`:
  1. Reads the refresh token from `localStorage`.
  2. Sends it to `/api/auth/refresh` to get a new token pair.
  3. Stores the new tokens in `localStorage`.
  4. **Retries the original failed request** with the new access token.
  5. Uses a `_retry` flag to prevent infinite retry loops.
  6. If refresh also fails → clears tokens and redirects to `/admin/login`.

---

### `client/src/context/ThemeContext.jsx`
**Dark/Light mode state management.** Uses `createContext` + `useState`. Reads the initial theme from `localStorage` (persists across sessions). On every theme change, sets the `data-theme` attribute on `<html>`, which triggers all CSS variables to switch values. Exposes `{ theme, toggleTheme }` to all children.

### `client/src/context/AuthContext.jsx`
**Authentication state management.** On mount, checks if an access token exists in `localStorage`. If so, calls `GET /api/auth/me` to validate it server-side. Exposes:
- `user` — the current user object or `null`.
- `loading` — `true` while the initial token validation is running.
- `isAuthenticated` — derived boolean (`!!user`).
- `login(email, password)` — calls the login API and stores tokens.
- `logout()` — calls the logout API and clears tokens.

### `client/src/context/DataContext.jsx`
**Portfolio data cache.** On mount, fires four API calls **in parallel** using `Promise.all()`:
- `GET /api/profile`
- `GET /api/projects`
- `GET /api/skills`
- `GET /api/certifications`

Stores results in state. This means every section of the site reads from an already-fetched cache instead of making its own API call. Exposes a `refetch()` function that the admin panel calls after creating/updating/deleting content.

---

### `client/src/hooks/useAnalytics.js`
**Client-side analytics tracking hook.** Generates a unique session ID per browser tab (stored in `sessionStorage`). Uses a `Set` in a `useRef` to prevent duplicate events within the same session. Exposes:
- `trackSection(sectionName)` — fires once per section when it scrolls into view.
- `trackProjectClick(projectId)` — fires when a user clicks a project card.
- `trackContactSubmit()` — fires when a contact form is submitted.

All events are sent to `POST /api/analytics/event` in the background (errors are silently caught).

---

### `client/src/components/GlobalNeuralBg.jsx`
**The full-screen animated background.** Uses a raw HTML `<canvas>` element to render a particle network:
1. Calculates node count based on viewport size (`window.innerWidth * window.innerHeight / 25000`).
2. Positions nodes randomly, gives each a velocity and pulse phase.
3. On each animation frame: moves nodes, wraps them at viewport edges, draws connection lines between nearby nodes (< 200px apart) with distance-based opacity, draws glowing dots, and animates "signal" particles that travel between connected nodes.
4. Uses `requestAnimationFrame` for 60fps rendering.
5. Properly cleans up listeners and animation in the `useEffect` cleanup function.

### `client/src/components/HeroIllustration.jsx`
**A pure SVG animated illustration** rendered using Framer Motion. Features:
- A brain outline with animated `pathLength` drawing.
- 8 neural nodes with pulsing opacity animations.
- 8 neural connection lines with staggered reveal.
- Floating code symbols (`</>`, `{ }`).
- Two counter-rotating orbit rings with dashed strokes.
- A VR headset outline with glowing scan lines.
- Floating hexagonal shapes.
- A data-loading progress bar with animated width.

Every element uses Framer Motion's `animate` prop for infinite looping animations, and `initial` for entrance transitions.

### `client/src/components/AnimatedSection.jsx`
**A reusable scroll-triggered animation wrapper.** Uses Framer Motion's `useInView` hook to detect when the component enters the viewport. Supports 11 animation variants: `fadeUp`, `fadeDown`, `fadeLeft`, `fadeRight`, `scaleIn`, `blurIn`, `flyBottomLeft`, `flyBottomRight`, `dropIn`, `spinIn`, `flipUp`. Each variant defines `hidden` and `visible` states with different transform, opacity, and filter properties. Also exports `AnimatedChild` for use with `staggerChildren`.

### `client/src/components/CollapsibleSection.jsx`
**Collapsible section container.** Wraps each major section (About, Portfolio, Skills, Certifications, Contact) with:
- A clickable header showing title, gradient-highlighted keyword, subtitle, and decorative hex corners.
- An animated chevron that rotates 180° when toggled.
- A status indicator ("EXPANDED" / "COLLAPSED" with a pulsing green dot).
- `AnimatePresence` for smooth expand/collapse with blur + height transitions.
- Full keyboard accessibility (`Enter` / `Space` to toggle, `role="button"`, `aria-expanded`).

### `client/src/components/TechIcon.jsx`
**Technology icon loader with triple fallback.** For a given technology name (e.g., `"react"`):
1. Tries loading from Devicons CDN (`devicon@latest/icons/react/react-original.svg`).
2. If that fails, tries the `-plain` variant.
3. If that fails, tries Simple Icons CDN.
4. If all fail, renders a `⚡` emoji as a final fallback.

Uses `loading="lazy"` for native browser lazy-loading of images.

### `client/src/components/ThemeToggle.jsx`
**A simple button** that reads from `ThemeContext` and calls `toggleTheme()`. Displays ☀️ in dark mode and 🌙 in light mode.

### `client/src/components/Modal.jsx`
**A reusable modal dialog.** Renders a blurred backdrop overlay with a centered content panel. Click-outside-to-close is handled by `onClick` on the backdrop with `e.stopPropagation()` on the content. Framer Motion handles enter/exit animations (fade + scale + slide).

### `client/src/components/ParticleBackground.jsx`
**A section-level particle background** (used behind the Hero section specifically, separate from the global neural background).

---

### `client/src/layouts/PublicLayout.jsx`
**The shell for the public-facing site.** Renders:
- The `GlobalNeuralBg` canvas behind everything.
- A scroll progress bar at the top (`scaleX` driven by scroll position).
- The navbar with desktop links, a mobile hamburger menu, and theme toggle. The navbar gains a `scrolled` class after 60px of scroll (triggers a backdrop-blur glass effect).
- Mobile menu overlay with staggered link animations.
- Page content (`{children}`).
- A footer with copyright.

### `client/src/layouts/AdminLayout.jsx`
**The shell for the admin panel.** Renders a fixed left sidebar with navigation links (Dashboard, Profile, Projects, Skills, Certifications, Messages) using React Router's `NavLink` (which applies an `.active` class to the current route). The main content area renders child routes via `<Outlet />`. Sidebar includes a theme toggle, "View Site" link, and logout button.

---

### `client/src/pages/public/Home.jsx`
**The public homepage.** Simply composes six section components in order: Hero → About → Portfolio → Skills → Certifications → Contact. Each section manages its own data fetching (from `DataContext`) and its own analytics tracking.

### `client/src/pages/admin/Login.jsx`
Login form with email/password inputs. Calls `AuthContext.login()` on submit. On success, navigates to `/admin`. Shows error messages inline.

### `client/src/pages/admin/Dashboard.jsx`
Admin dashboard displaying analytics data. Fetches from `/api/analytics/overview` and `/api/analytics/visitors`. Renders stat cards (total views, unique visitors, contact submissions) and a Recharts line graph of visitor trends over time.

### `client/src/pages/admin/ProjectsManager.jsx`
Full CRUD interface for projects. Displays a table of all projects with edit/delete buttons. "Add Project" opens a modal form. Each field maps to the Project schema (title, description, techStack, category, featured, URLs, thumbnail upload via Base64).

### `client/src/pages/admin/SkillsManager.jsx`
CRUD interface for skills. Table + modal form for name, icon slug, category, proficiency slider, and display order.

### `client/src/pages/admin/CertsManager.jsx`
CRUD interface for certifications. Table + modal form for title, issuer, dates, credential URL, and badge image.

### `client/src/pages/admin/MessagesManager.jsx`
Displays contact form submissions in a table. Each row shows sender name, email, subject, date. Admin can mark messages as read/unread or delete them.

### `client/src/pages/admin/ProfileManager.jsx`
A large form for editing the single Profile document. Fields for name, title, bio, photo URL, resume URL, email, phone, location, social links (GitHub, LinkedIn, Twitter, Website), stats (years, projects, clients), hero subtitle, and an interactive timeline editor.

---

### `client/src/sections/HeroSection.jsx`
**The landing hero.** Features:
- A **typewriter effect** that cycles through role titles ("AI Engineer", "AR/VR Developer", etc.) by progressively building and deleting the string using `setTimeout` chains.
- Profile name sourced from `DataContext`.
- Animated entrance of text elements with staggered delays.
- The `HeroIllustration` SVG on the right side.
- Orbiting emoji icons around the illustration.
- A scroll indicator at the bottom.

### `client/src/sections/AboutSection.jsx`
**About section** with:
- Profile photo in a gradient-bordered frame with a fade-to-transparent mask at the bottom.
- Bio text from the database.
- Three animated stat counters (`AnimatedCounter` component) that count up from 0 when scrolled into view using `setInterval` at 60fps.
- A timeline of career milestones with alternating left/right entrance animations.

### `client/src/sections/PortfolioSection.jsx`
**Project showcase** with:
- Category filter buttons (All, Web, Mobile, AI, Backend).
- A CSS grid of project cards with alternating entrance animations (left, bottom, right).
- `AnimatePresence` with `mode="popLayout"` for smooth filtering transitions.
- Each card shows: thumbnail (or tech icon fallback), featured badge, title, description, tech stack tags, and live/GitHub links.
- Clicking a card opens a `Modal` with the full project details.
- Analytics tracking: `trackProjectClick()` fires on card click.

### `client/src/sections/SkillsSection.jsx`
**Honeycomb tech stack grid.** Arranges skills in a hexagonal layout:
- Rows alternate between 6 and 5 items (creating the honeycomb offset pattern).
- Responsive breakpoints adjust row sizes (5-4 on tablets, 3-2 on mobile).
- Each hexagon has a colored gradient border and glow based on the technology name.
- Uses `useMemo` to re-compute row chunking only when the filter or window width changes.
- If fewer than 17 skills exist, pads with fallback items to fill the grid pattern.

### `client/src/sections/CertificationsSection.jsx`
**Certification cards** with alternating entrance animations (left, bottom, right). Each card shows badge icon, title, issuer, issue/expiry dates, and a "Verify Credential" link.

### `client/src/sections/ContactSection.jsx`
**Contact form section** with:
- Three hex-shaped info cards (Email, Location, Status).
- A contact form inside a decorative hex-cornered frame with a "SECURE_CHANNEL" header and pulsing status indicator.
- Form submission via `api.post('/api/contact', form)`.
- Success/error status messages with auto-dismiss after 4 seconds.
- Social links sidebar rendered from `profile.social.*` fields.
- Decorative nested hexagonal SVG background pattern.

---

### `client/src/index.css`
**The complete design system** (~2060 lines). Organized into sections:
- **CSS Reset** — Box-sizing, margin/padding removal.
- **Design Tokens (`:root`)** — 60+ CSS custom properties for colors, spacing, typography, shadows, transitions, z-indices.
- **Light Theme (`[data-theme="light"]`)** — Overrides ~20 custom properties for light backgrounds, darker text, and adjusted accent colors.
- **Keyframe Animations** — shimmer, pulse-ring, gradient-shift, float, orbit, status-pulse, scroll-mouse, etc.
- **Typography** — Global font settings, gradient-text utility.
- **Buttons** — Primary (gradient), secondary (glass), with hover transforms and glow effects.
- **Navbar** — Glass-morphism backdrop, scroll-triggered opacity, mobile menu overlay.
- **Hero** — Full-height section, typewriter cursor blink animation, orbit rings.
- **About** — Grid layout, stat cards with glass morphism, timeline with pulsing dots.
- **Portfolio** — Filter buttons, project cards with hover lifts, featured badge styling.
- **Honeycomb Grid** — Clip-path hexagons, gradient borders, glow effects, responsive breakpoints.
- **Contact** — Hex-shaped info cards, hex-clipped inputs, social links.
- **Admin** — Sidebar, stat cards, tables, modals, toasts, loaders.
- **Responsive** — Media queries for 1024px, 768px, and 480px breakpoints.

### `client/src/setupTests.js`
**Test environment setup.** Mocks `IntersectionObserver`, `ResizeObserver` (not available in jsdom), and `axios` (to prevent real HTTP calls during tests).

---

## 4. Interview Q&A — Architecture & Design Decisions

**Q: Walk me through the architecture of this project. Why did you separate frontend and backend?**
> This is a decoupled MERN stack application. The backend is a pure REST API built with Express and Mongoose — it only speaks JSON. The frontend is a React SPA built with Vite. They're in separate folders with separate `package.json` files, separate dependency trees, and separate deployment pipelines.
>
> I chose this architecture because it enforces a strict separation of concerns. The backend doesn't know or care what renders its data — it could be a React app, a mobile app, or a third-party integration. This makes the system horizontally scalable: I can deploy the API on one server and the frontend on a CDN. In development, Vite's proxy (`/api → localhost:5000`) seamlessly bridges the two.

**Q: Why MongoDB and Mongoose instead of PostgreSQL/Prisma?**
> MongoDB was chosen because portfolio data is inherently document-oriented. A project has nested arrays (techStack, images), a profile has nested objects (social links, stats, timeline items) — these map naturally to MongoDB documents rather than relational tables with join overhead. Mongoose provides schema validation, pre/post hooks for business logic (password hashing, slug generation), and instance methods (password comparison) — giving me the safety of a typed schema while keeping the flexibility of a document database.

**Q: You have a `DataContext` that fetches all data on mount. Isn't that wasteful?**
> No — it's actually the opposite. Without DataContext, every section (Hero, About, Portfolio, Skills, Certifications, Contact) would independently call the API on render. That's 6+ HTTP requests that could race condition against each other and cause multiple loading spinners.
>
> Instead, `DataContext` fires exactly four API calls in parallel using `Promise.all()` on initial mount. All six sections then read from already-fetched state with zero network cost. The admin panel calls `refetch()` after mutations to keep the cache fresh. This is essentially a lightweight version of what libraries like TanStack Query do, but without the dependency. In a larger app, I would migrate to TanStack Query for features like stale-while-revalidate and automatic background refetching.

**Q: Why React Context API instead of Redux or Zustand?**
> This portfolio has exactly three pieces of global state: theme preference (dark/light), authentication status, and portfolio data cache. That's three contexts with simple read/write patterns — no derived state, no complex reducers, no state that needs to be composed across multiple stores.
>
> Redux would add 500+ lines of boilerplate (actions, reducers, selectors, store configuration) for zero architectural benefit at this scale. Zustand would be a cleaner alternative, but Context API is built into React — zero bundle cost, zero learning curve for other developers, and perfectly adequate for global state that changes infrequently.

---

## 5. Interview Q&A — Backend Deep-Dive

**Q: Explain your JWT authentication flow in detail. Why two tokens?**
> The system uses a dual-token strategy: a short-lived access token (15 minutes) and a long-lived refresh token (7 days).
>
> **Why not just one long-lived token?** Because JWTs are stateless — once issued, they can't be revoked. If an access token is stolen, the attacker has access for its entire lifetime. By making access tokens expire in 15 minutes, we minimize the damage window.
>
> **How refresh works:** When the access token expires, the frontend's Axios response interceptor detects the `401 { expired: true }` response, sends the refresh token to `/api/auth/refresh`, receives a new token pair, stores them, and silently retries the failed request. The user never sees a login screen.
>
> **Why store the refresh token in the database?** To enable server-side revocation. When a user logs out, we set their `refreshToken` to `null`. Even if someone captured the refresh token, the `/refresh` endpoint checks that the submitted token matches the one in the database — a mismatched token is rejected.
>
> **Why different secrets?** `JWT_SECRET` and `JWT_REFRESH_SECRET` are separate keys. If `JWT_SECRET` is compromised, an attacker can forge access tokens but cannot forge refresh tokens (and vice versa). This is defense in depth.

**Q: Explain the `errorHandler.js` middleware. Why is it important that it's last?**
> Express has a convention: middleware with the signature `(err, req, res, next)` — four parameters — is treated as an error handler. When any route calls `next(error)` or throws, Express skips all remaining normal middleware and jumps directly to the first error handler it finds.
>
> It must be registered **after** all routes because Express processes middleware in registration order. If the error handler were registered before a route, errors from that route wouldn't be caught.
>
> The handler classifies errors by type (Mongoose validation, duplicate key, cast error, JWT error) and maps each to an appropriate HTTP status code and human-readable JSON response. In production, it strips the stack trace. This means frontend code always receives structured JSON errors it can display, rather than raw stack traces or HTML error pages.

**Q: How does the analytics aggregation pipeline work?**
> The visitor trends endpoint (`/api/analytics/visitors`) uses MongoDB's aggregation framework, which is essentially a server-side data processing pipeline:
>
> 1. **`$match`** — Filters to only `page_view` events within the last N days.
> 2. **`$group`** — Groups events by date (using `$dateToString` to extract `YYYY-MM-DD`). For each group, it counts total views (`$sum: 1`) and collects unique session IDs (`$addToSet: '$sessionId'`).
> 3. **`$project`** — Reshapes the output: renames `_id` to `date`, converts the unique sessions set to a count with `$size`.
> 4. **`$sort`** — Orders by date ascending for chronological chart rendering.
>
> This runs entirely inside MongoDB's engine, which is far more efficient than fetching all raw events to Node.js and aggregating in JavaScript.

**Q: What does `bulkWrite` do in the project reorder route, and why is it better than individual updates?**
> When the admin drags-and-drops projects to reorder them, the frontend sends `{ orderedIds: ['id3', 'id1', 'id2', ...] }`. The backend needs to set `order: 0` for id3, `order: 1` for id1, `order: 2` for id2, and so on.
>
> A naive approach would loop through the array and call `Project.findByIdAndUpdate()` N times — that's N round trips to the database. `bulkWrite()` batches all N `updateOne` operations into a single command sent to MongoDB. The database processes them atomically in one network request. For 20 projects, that's 20x fewer database calls.

---

## 6. Interview Q&A — Frontend Deep-Dive

**Q: How does your theming system work without any JavaScript re-renders on toggle?**
> The entire theming system is CSS-driven. In `index.css`, I define two sets of CSS custom properties:
> - `:root { --bg-primary: #04070D; --text-primary: #E8EDF5; ... }` (dark defaults)
> - `[data-theme="light"] { --bg-primary: #F1F5FB; --text-primary: #0F172A; ... }` (light overrides)
>
> Every color in the entire application references these variables (`background: var(--bg-primary)`). When the user toggles the theme, React sets `document.documentElement.setAttribute('data-theme', 'light')` — a single DOM mutation. The browser's CSS engine instantly re-evaluates all `var()` functions and repaints. There is no React re-render tree walk, no style recalculation in JavaScript, no individual prop changes.
>
> This is objectively faster than CSS-in-JS solutions (styled-components, Emotion) or utility-class approaches (Tailwind), because the CSS cascade handles it at the engine level.

**Q: How does the Axios interceptor handle token refresh without the user noticing?**
> The response interceptor in `axiosConfig.js` intercepts **every** HTTP response. When a request fails with `401` and the response body contains `expired: true`, the interceptor:
> 1. Sets `_retry = true` on the original request config to prevent infinite loops.
> 2. Sends the refresh token to `/api/auth/refresh`.
> 3. On success, stores the new token pair in `localStorage`.
> 4. Modifies the original request's `Authorization` header with the new access token.
> 5. Re-dispatches the original request via `return api(originalRequest)`.
>
> From the component's perspective, the `await api.get('/projects')` call just takes slightly longer — it never sees the 401. This is called **transparent token rotation**.

**Q: Explain how the typewriter effect in HeroSection works.**
> It's a state machine driven by `useEffect`. Three states of variables: `text` (the currently displayed string), `isDeleting` (boolean), and `roleIndex` (which role to type).
>
> On each render, the effect compares the current `text` to the target string. If `text` is shorter than the target and `isDeleting` is false → append the next character (70ms delay). If `text` equals the full target → wait 2.2 seconds, then set `isDeleting = true`. If `isDeleting` is true and `text` isn't empty → remove the last character (35ms delay, faster than typing for a natural feel). If `text` is empty and `isDeleting` → advance to the next role and reset.
>
> The `useEffect` cleanup function (returning `clearTimeout`) prevents memory leaks and ensures the previous timeout is cancelled when state changes rapidly.

**Q: How does the honeycomb grid achieve the hexagonal offset pattern?**
> The hexagonal visual has two layers:
>
> **CSS clip-path:** Each hex cell uses `clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)` — this clips a rectangular div into a hexagon shape. The outer `.hex-wrapper` shows the gradient border, while the slightly smaller `.hex-inner` sits inside it with the background color of the theme, revealing the gradient as a "border ring".
>
> **Row-based offset:** Rows alternate between 6 items and 5 items. The 5-item rows naturally center differently than 6-item rows, creating the honeycomb interlock. Each row has a negative bottom margin (`margin-bottom: -35px`) that pushes the next row upward so the hexagons nestle into each other's gaps. `useMemo` re-chunks the filtered array into rows whenever the filter or window width changes, adjusting row sizes for different breakpoints.

**Q: What is `React.lazy()` and why did you use it only for admin pages?**
> `React.lazy()` is React's built-in code-splitting mechanism. It tells the bundler (Vite/Rollup) to split the imported module into a separate JavaScript chunk file. That chunk is only downloaded from the server when the component is first rendered.
>
> I applied it exclusively to admin pages because the public portfolio is the primary user experience — visitors should never wait for code to download. The admin panel (Dashboard, ProjectsManager, SkillsManager, CertsManager, MessagesManager, ProfileManager, Login) includes heavy libraries like Recharts and complex form logic. By lazy-loading these, the public site's initial JavaScript bundle is significantly smaller, resulting in faster Time To Interactive.
>
> The `<Suspense fallback={...}>` wrapper displays a spinner while the lazy chunk downloads, so there's no blank screen.

---

## 7. Interview Q&A — Security & Production

**Q: What security measures have you implemented?**
> **Layer 1 — Transport:** In production, the app would run behind HTTPS (handled by the hosting provider or a reverse proxy like Nginx).
>
> **Layer 2 — HTTP Headers:** Helmet.js sets secure HTTP headers: `X-Content-Type-Options: nosniff` (prevents MIME sniffing), `X-Frame-Options: DENY` (prevents clickjacking), `Strict-Transport-Security` (forces HTTPS), and several others.
>
> **Layer 3 — CORS:** Only whitelisted origins can make API calls. Requests from unknown domains are rejected with a CORS error before they even reach the route handlers.
>
> **Layer 4 — Rate Limiting:** Three tiers of rate limiting. The auth endpoint is the tightest (10 login attempts per 15 minutes) to prevent brute-force attacks.
>
> **Layer 5 — Authentication:** JWT tokens with short expiry. Passwords hashed with bcrypt (12 salt rounds). Refresh tokens stored in the database for server-side revocation.
>
> **Layer 6 — Input Validation:** Mongoose schemas enforce field types, required fields, string trimming, and enum constraints. The error handler catches validation errors and returns structured messages instead of leaking database internals.
>
> **Layer 7 — Authorization:** Every write route (POST/PUT/DELETE) passes through the `auth` middleware. An unauthenticated user cannot modify any data even if they directly call the API.

**Q: What is CORS and why do you need it?**
> CORS (Cross-Origin Resource Sharing) is a browser security feature. By default, JavaScript running on `http://localhost:5173` (the frontend) cannot make HTTP requests to `http://localhost:5000` (the backend) because they're different origins (different ports count as different origins).
>
> The CORS middleware sends `Access-Control-Allow-Origin` headers that tell the browser "yes, requests from this origin are permitted." Without it, every API call would fail with a CORS error in the browser console.
>
> In production, I would set `CLIENT_URL` to my actual deployed frontend domain (e.g., `https://shaheryar.dev`) instead of localhost.

---

## 8. Interview Q&A — Performance & Optimization

**Q: How do you ensure smooth animations on lower-end devices?**
> Several techniques:
> 1. `will-change: transform, filter` CSS hints tell the browser to composite specific elements on the GPU.
> 2. The neural network background uses raw Canvas 2D — no DOM elements, no React re-renders, no virtual DOM diffing. The animation loop runs via `requestAnimationFrame`, which automatically throttles to the monitor's refresh rate and pauses when the tab is hidden.
> 3. The scroll listener in `PublicLayout` uses `{ passive: true }`, telling the browser the handler won't call `preventDefault()` and the scroll can proceed without waiting for JavaScript execution.
> 4. `useInView({ once: true })` in `AnimatedSection` means the intersection observer disconnects after the first trigger — no ongoing computation for already-animated elements.
> 5. `useMemo` in `SkillsSection` prevents recomputing the honeycomb row chunking on every render — only when `filtered` or `windowWidth` actually change.

**Q: Explain `Promise.all()` in `DataContext`. What happens if one request fails?**
> `Promise.all()` runs all four API calls concurrently. In a sequential approach (`await profile; await projects; await skills; await certs;`), the total time would be the **sum** of all four response times. With `Promise.all()`, the total time is the **maximum** of the four — typically 2-3x faster.
>
> The tradeoff: if **any** single request fails, `Promise.all()` rejects immediately and the `catch` block triggers. We'd lose all data even if 3 out of 4 succeeded. If I needed partial data resilience, I'd use `Promise.allSettled()` instead, which always resolves and returns the status of each promise individually. For a portfolio where all data is essential for rendering, `Promise.all()` with a full retry is the correct choice.

---

## 9. Interview Q&A — Testing

**Q: How is the project tested?**
> The project has two test suites:
>
> **Backend (Jest + Supertest):** The server exports the Express app without calling `app.listen()` (guarded by `require.main === module`). Supertest binds to the app directly and sends HTTP requests in-process. The health check test verifies the `/api/health` endpoint returns `200 { status: 'OK' }`.
>
> **Frontend (Vitest + Testing Library):** Vitest runs with a `jsdom` environment, simulating a browser DOM. The setup file mocks `IntersectionObserver`, `ResizeObserver` (missing in jsdom), and `axios` (to prevent real network calls). The SkillsSection test verifies the component renders without crashing and displays the expected "Tech" heading.
>
> For production readiness, I would expand the test suite with: integration tests for auth flows, Mongoose model validation tests, and user interaction tests using `@testing-library/user-event`.

**Q: Why Vitest instead of Jest for the frontend?**
> Vitest is designed to run inside Vite's module transformation pipeline. It understands JSX, ESM imports, CSS imports, and Vite-specific features (like `import.meta.env`) natively — without needing Babel transforms or separate Jest configuration. Tests run significantly faster because Vitest reuses Vite's cached module graph. The API is intentionally Jest-compatible (same `describe`, `it`, `expect` syntax), so the migration cost is zero.
