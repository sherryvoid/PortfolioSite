# Portfolio Project — Complete Documentation

A high-performance, dynamic, and fully responsive personal portfolio built with the MERN stack. Designed to showcase projects, skills, certifications, and experience with an interactive, modern user interface.

## 🚀 Key Features

- **AI-Powered Job Finder & Matcher**: Integrated platform that analyzes job descriptions and finds the best matching opportunities.
- **One-Click Tailored CV Generator**: Automatically generates highly targeted, ATS-friendly resumes and motivation letters based on specific job listings.
- **Intelligent AI Suggestions**: Provides actionable application strategies, skill gap analysis, and tailored recommendations.
- **Dynamic Content Management**: Complete Admin Dashboard to manage projects, skills, certifications, and profile data without touching the code.
- **Modern UI/UX**: Futuristic, glassmorphic design featuring a neural network canvas background, honeycomb tech-stack grid, and scroll-triggered Framer Motion animations.
- **Secure Authentication**: JWT-based access and refresh token strategy for the admin panel, complete with bcrypt password hashing.
- **Analytics Tracking**: Custom analytics dashboard tracking page views, unique sessions, most clicked projects, and visitor trends over time.
- **Dark/Light Mode**: Seamless, pure CSS-driven theming system with no React re-renders required on toggle.
- **Robust API**: RESTful Express.js backend with Mongoose schemas, comprehensive error handling, security headers (Helmet), and strict rate limiting.

## 🛠️ Technology Stack

**Frontend (Client)**:
- **React 19**: Modern UI library using Context API for state management.
- **Vite 8**: Lightning-fast build tool and dev server.
- **Framer Motion**: For complex, orchestrated scroll and entrance animations.
- **Vanilla CSS**: Custom properties used for styling and light/dark mode logic.
- **Axios**: HTTP client equipped with custom interceptors for transparent JWT rotation.
- **Recharts**: For admin dashboard analytics visualizations.

**Backend (Server)**:
- **Node.js & Express.js**: Fast, scalable REST API server.
- **MongoDB Atlas & Mongoose**: NoSQL document database with strict schema validation.
- **Google Generative AI (Gemini)**: Powers the CV Generator, Job Matcher, and AI application suggestions.
- **JSON Web Tokens (JWT)**: For secure, stateless authentication.
- **Security Utilities**: Helmet.js, Express Rate Limiter, CORS, and Bcryptjs.

## 📋 Requirements

To run this project locally, you will need:
- **Node.js** (v18.0.0 or higher)
- **npm** (Node Package Manager)
- A **MongoDB** database (Either a MongoDB Atlas cloud cluster or a local MongoDB instance). *Note: The app falls back to an in-memory database automatically if no MongoDB URI is provided during development!*

## ⚙️ Setup & Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Portfolio
```

### 2. Backend Setup

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory (you can use `.env.example` as a template) and add the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@yoursite.com
ADMIN_PASSWORD=your_secure_password
NODE_ENV=development
```

Start the backend development server:

```bash
npm run dev
```

*Note: On its first run, the server will auto-seed the database with sample projects, skills, and the admin credentials specified in your `.env`.*

### 3. Frontend Setup

Open a new terminal, navigate to the client directory, and install dependencies:

```bash
cd client
npm install
```

Start the Vite development server:

```bash
npm run dev
```

### 4. Access the Application

- **Public Portfolio**: [http://localhost:5173](http://localhost:5173)
- **Admin Dashboard**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

Log into the admin panel using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you configured in your server's `.env` file to customize the content on your site.

## 📄 License
This project is open for personal use and learning.
