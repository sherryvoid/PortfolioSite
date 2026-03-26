# Portfolio Project Documentation

Welcome to the complete overview of your Full Stack MERN Portfolio! This document explains what we have accomplished, the architecture of the platform, the communication pipeline, and how you can manage all the data (both static and dynamic) moving forward.

---

## 🚀 1. What We Have Done (Tasks & Phases Completed)

We have built a premium, high-performance, and futuristic Single Page Application (SPA) portfolio website powered by the MERN stack.

### Completed Phases:
1. **Backend Foundation:** Built a secure Node.js + Express.js REST API with MongoDB (Mongoose) integration.
2. **Data Modeling:** Designed robust schemas for Admin Users, Profile, Projects, Skills, Certifications, and Contact Messages.
3. **Frontend Framework:** Set up React 19 + Vite with React Router for seamless navigation.
4. **UI/UX & Animations:** Implemented a stunning glassmorphism design system using raw CSS, combined with Framer Motion for scroll animations and interactions (like the honeycomb skill grid).
5. **State Management:** Integrated React Context API (`DataContext`, `AuthContext`, `ThemeContext`) to manage global application state without prop-drilling.
6. **Admin Dashboard:** Created a secured (JWT-authenticated) content management area (`/admin`) to allow you to update your portfolio completely dynamically without touching code.
7. **Contact System:** Built a fully functional contact form that safely stores messages in the database.

---

## 🏗️ 2. Root-Level Architecture & Pipeline

Your project runs on the **MERN** stack:
- **M**ongoDB (Database)
- **E**xpress.js (Node.js Backend Framework)
- **R**eact.js (Frontend UI)
- **N**ode.js (JavaScript Runtime)

### How is the MERN Stack working?

```mermaid
graph TB
    subgraph "🚀 React Frontend (Client)"
        UI["User Interface (Pages/Sections)"]
        Context["React Context (State)"]
        Axios["Axios API Client"]
    end
    
    subgraph "⚙️ Node/Express Backend (Server)"
        Routes["API Routes (/api/*)"]
        Middleware["Auth & Validation"]
        Controllers["Service Logic"]
    end
    
    subgraph "💾 MongoDB Database"
        Collections["Collections (Profile, Projects, Skills)"]
    end

    UI -->|Reads Data| Context
    UI -->|Dispatches Action| Axios
    Axios -->|HTTP Requests (GET/POST)| Routes
    Routes --> Middleware
    Middleware --> Controllers
    Controllers -->|Mongoose Queries| Collections
    Collections -.->|Returns JSON| Controllers
    Controllers -.->|Sends HTTP Response| Axios
    Axios -.->|Updates State| Context
```

### The Communication Pipeline
1. **The User** visits the web page.
2. `DataContext.jsx` automatically uses `Axios` to make a `GET` request to your backend server upon loading.
3. **The Server** receives the request at various endpoints (e.g., `/api/projects`) via Express Router.
4. **The Database** is queried using Mongoose to fetch the latest projects.
5. The server responds with JSON data.
6. React receives the JSON, updates the context state, and renders the stunning UI!

---

## 📂 3. Where Files Are Placed

Here is the "map" to your codebase, highlighting the most important files you should know:

> [!TIP]
> **Client** = What the user sees in the browser.
> **Server** = The brain that processes requests and talks to the database.

### 💻 Client (Frontend) - `client/src/`
```text
client/src/
├── App.jsx                 # 🌟 CORE: The main root file coordinating all Routes and Contexts.
├── index.css               # 🎨 CORE: Your global CSS variables, theme colors, and animations.
├── api/
│   └── axiosConfig.js      # 🔌 COMMUNICATION: Intercepts API calls to attach your Admin Security Token (JWT).
├── context/
│   └── DataContext.jsx     # 🧠 DATA HUB: Fetches all data (Profile, Projects, Skills) ONCE and shares it everywhere.
├── pages/                  # Full pages (e.g., Admin Dashboard, Login, Home layout).
├── sections/               # The "slices" of your main page (Hero, About, Skills, Projects, Contact).
└── components/             # Reusable UI elements (Buttons, GlassCards, Modals, TechIcons).
```

### ⚙️ Server (Backend) - `server/`
```text
server/
├── server.js               # 🌟 CORE: The starting point of your backend server, defining all /api/ paths.
├── config/                 
│   └── db.js               # Connects Express to MongoDB.
├── models/                 # Database Schemas (determines what fields a "Project" or "Skill" must have).
├── routes/                 # 🚦 COMMUNICATION: Maps URLs (like /api/skills) to specific actions.
└── utils/
    └── seedData.js         # The script that filled your database with the current dummy data!
```

---

## 🔗 4. The Communication Files

If you ever need to debug how the client talks to the server, look at these two critical files:

1. **`client/src/api/axiosConfig.js`:** 
   This is the postman of your client. Every time React wants to talk to the backend, it goes through here. It automatically adds your Admin Token to the headers so the backend knows you are authorized to make changes.

2. **`client/src/context/DataContext.jsx`:** 
   This is the brain. Instead of every section fetching its own data, this file fetches **everything** on initial load and distributes it to the Hero, Skills, and Projects sections instantly.

---

## 🛠️ 5. How to Update Your Data Guide

Currently, the dummy data in your app was generated by the `server/utils/seedData.js` file. However, you rarely need to touch the code to update your data! Here is exactly how to replace the dummy data with your real information.

### 🔴 Dynamic Data (Managed via Admin Dashboard)

Because we built a full CMS (Content Management System) in your admin portal, you can change almost everything from your browser!

1. **Go to your Admin Dashboard:** Open `http://localhost:5173/admin` and log in.
2. **Projects:** Navigate to the "Projects" tab to Add, Edit, or Delete your portfolio items.
3. **Skills & Stats:** Navigate to the "Skills" tab to customize the honeycomb grid mapping your expertise.
4. **Social Links & Hero Subtitle:**
   - Go to `Admin` -> `Profile`.
   - Your **Profile Document** is where your GitHub, LinkedIn, Twitter links are stored! 
   - You can also change your `Hero Subtitle`, `Bio`, AND location here. It updates dynamically.
5. **Contact Form Routing:**
   - The contact form automatically posts to the server database.
   - You can view all received messages safely in the `Admin` -> `Messages` tab.

### 🔵 Static Data/Design (Managed via Code)

For structural changes that are "hardcoded", you will need to edit specific files:

| What you want to change | File to edit |
| --- | --- |
| **Theme Colors / Neon Glow** | `client/src/index.css` (Adjust the `--accent-blue` and `--accent-purple` variables) |
| **Hero Name/Text Layout** | `client/src/sections/HeroSection.jsx` |
| **Footer Text** | `client/src/layouts/PublicLayout.jsx` |
| **Adding New Pages** | You'll need to add a `<Route>` inside `client/src/App.jsx` |

> [!IMPORTANT]
> **To add a real working email sender to your Contact Form:**
> Right now it saves to the database. To get email alerts, you must configure your `.env` file in the `server/` directory with a valid SMTP client (like Gmail App Passwords or SendGrid). The logic for email sending is already wired up in the backend once the credentials are provided!
