# Portfolio Project Definition and Architecture Guide

This is your master manual. It contains a complete structural breakdown of the project, architecture decisions, and interview preparation materials formatted specifically for a Full Stack / React / Node.js Developer.

---

## 1. Complete Folder & File System Breakdown

Your application is heavily decoupled. It follows a strict **Client-Server Architecture**, which makes sure your backend data layer is fully isolated from your frontend presentation layer. 

### `server/` — The Backend Ecosystem
This folder acts as the brain. It runs **Node.js** and **Express.js**, acting as an API that interacts with your **MongoDB** database. It only speaks JSON.
- **`server.js`**: The main entry point. It wires up your Express application, connects the routes, initializes middleware (like Helmet for security and CORS for cross-origin compliance), and conditionally listens on a port.
- **`config/db.js`**: Reaches out to MongoDB. It smartly uses `mongodb-memory-server` as an in-memory fallback during isolated testing environments.
- **`models/`**: Uses **Mongoose** to define the exact shape of your data collections.
  - `User.js`, `Project.js`, `Skill.js`, `Profile.js`, etc.: These dictate required fields, types (String, Number, Array), and handle schema design.
- **`routes/`**: Handles specific HTTP requests (`GET`, `POST`, `PUT`, `DELETE`).
  - E.g., `projects.js` intercepts an incoming request to `/api/projects` and dictates what should logically happen.
- **`middleware/`**: Functions that run "in the middle" of a request before it reaches your final route logic.
  - `errorHandler.js`: Catches crashes so the server responds with a clean error message instead of dying.
  - `rateLimiter.js`: Defends against brute-force attacks and bot-spam.
- **`tests/`**: Contains your **Jest** & **Supertest** test suites ensuring your API endpoints function identically after refactors.

### `client/` — The Frontend Ecosystem
This folder runs **React 19** via **Vite**. It paints the UI, tracks application state, and fetches data from the backend.
- **`index.html`**: The single HTML file your entire application mounts to (Single Page Application design).
- **`src/main.jsx`**: Bootstraps the application, mounts `App.jsx` to the DOM.
- **`src/App.jsx`**: The primary router. It maps URL paths (like `/` or `/admin/login`) to the correct React Element.
- **`src/api/axiosConfig.js`**: Creates a customized **Axios** instance that guarantees your `JWT` token is automatically attached to every authenticated request going to the backend.
- **`src/components/`**: Reusable building blocks.
  - E.g., `GlobalNeuralBg.jsx`, `TechIcon.jsx`, `ThemeToggle.jsx`. 
- **`src/sections/`**: Modular chunks of your Home page (`HeroSection`, `AboutSection`, `SkillsSection`).
- **`src/pages/`**: Complete full-page views (like `admin/Dashboard.jsx` or `public/Home.jsx`).
- **`src/context/`**: **React Context API** silos.
  - `AuthContext.jsx`: Globally answers the question "Is the user logged in right now?"
  - `DataContext.jsx`: Fetches and caches your Portfolio data (Skills, Projects) so you don't overwhelm the backend with fetch requests when rapidly clicking between Admin views.
- **`src/index.css`**: Vanilla CSS file filled with powerful **CSS Variables** (`:root`) allowing the dynamic Dark/Light modes to function without complicated Javascript manipulation.

---

## 2. Interview Prep: What You Used & Why

As you go into software developer interviews, interviewers aren't just looking for *what* you built, they want to hear *why* you made certain architectural decisions. Here are your talking points.

### **Q: Why did you choose Vite over Create-React-App for the Frontend?**
> **How to answer:** "Create-React-App uses Webpack underneath, which essentially bundles the entire application code every time you save a file during development. As an app scales, this becomes extremely slow. I chose **Vite** because it utilizes ES Modules (ESM) in the browser, meaning the dev server starts instantly, and Hot Module Replacement (HMR) is near-instant, regardless of how large the project gets. For production, it uses Rollup for highly optimized bundle splitting."

### **Q: I see you used Context API. Why didn't you use Redux?**
> **How to answer:** "I engineered this portfolio to be modern and lean. State management tools like Redux are exceptionally powerful but introduce heavy boilerplate. Since my core state needs were largely derived from server-state (fetching Projects, Skills, Profiles) and global UI toggles (Dark/Light mode, Authentication state), I relied on the built-in **React Context API** combined with modern Hooks. This kept the architecture lightweight natively without external dependencies, while isolating server calls efficiently."

### **Q: How did you implement security on the backend?**
> **How to answer:** "Security was handled in layers. 
> 1. Authentication relies on **JWT** (JSON Web Tokens) where passwords are theoretically never exposed and safely hashed with **bcryptjs**. 
> 2. For routing defense, I used **Helmet.js** to secure Express HTTP headers against XSS attacks. 
> 3. I implemented **express-rate-limit** to prevent DDOS and brute-force login attempts at the admin portal gate."

### **Q: How does the dynamic theming (Dark / Light mode) work under the hood?**
> **How to answer:** "Instead of using JavaScript to forcibly swap inline styles across hundreds of components (which is non-performant), I leaned heavily into the CSS cascade. I defined two separate data sets in `index.css`: a `:root` block for dark mode, and a `[data-theme='light']` block for light mode. All colors in my React components point to those CSS Variable identifiers (like `var(--bg-card)`). When a user toggles the switch, React binds the string `'light'` or `'dark'` to the `data-theme` attribute on the global HTML tag, and the browser inherently repaints the site instantly."

### **Q: What happens if a user navigates to an Admin route without logging in?**
> **How to answer:** "The frontend utilizes a custom `<ProtectedRoute>` wrapper around React Router configurations. Before the route mounts, it intercepts the navigation attempt, checks `AuthContext` to see if a valid JWT exists in memory/storage, and if not, conditionally returns a `<Navigate>` component forcing them back to `/admin/login`. The backend also operates a defensive `/middleware/auth.js` check, so even if they forcefully bypass the client router or use Postman, the API instantly rejects them with a HTTP 401 Unauthorized response."

### **Q: What optimizations did you implement to ensure the site runs smoothly?**
> **How to answer:** "I employed a few crucial techniques. First, my Admin routes are **Lazy Loaded** using `React.lazy()` and `Suspense`. This means public visitors don't have to download the javascript for managing the database—significantly speeding up initial load time (Time To Interactive). Second, my heavier graphics (like the Neural Network canvas and Framer Motion elements) run decoupled from React's state loop, so complex scrolling actions and re-renders don’t block the main browser UI thread."

---

## 3. How Core App Flows Work

### The Login & Authorization Flow
1. User submits email/password on `/admin/login`.
2. Frontend sends standard `POST` payload to backend `/api/auth/login`.
3. Backend controller searches MongoDB. If found, it compares the hashed password to the input using bcrypt.
4. If a match occurs, backend creates a cryptographically signed JWT token containing the user's ID, and sends it back to the client.
5. The React `AuthContext` receives the token, immediately saves it to `localStorage` (so a browser refresh keeps you logged in), and updates state to `isAuthenticated: true`.
6. From this point forward, every request made by your `axiosConfig.js` automatically slips this token into the header (`Authorization: Bearer <token>`).

### The Mongoose Data Update Flow
1. An Admin updates a project description and hits "Save".
2. React fires `axios.put('/api/projects/:id', updatedData)`.
3. Backend route intercepts, fires `auth` middleware (Verifying the JWT token is valid and not expired).
4. Since it successfully passes the `auth` middleware, the request drops into the controller logic.
5. `Project.findByIdAndUpdate(id)` hits MongoDB. 
6. The updated document returns as JSON, is sent back to React, and `DataContext` natively triggers a re-render showing the saved change on the dashboard.
