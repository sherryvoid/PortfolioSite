import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public pages
import Home from './pages/public/Home';

// Lazy load admin pages for performance
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProjectsManager = lazy(() => import('./pages/admin/ProjectsManager'));
const SkillsManager = lazy(() => import('./pages/admin/SkillsManager'));
const CertsManager = lazy(() => import('./pages/admin/CertsManager'));
const MessagesManager = lazy(() => import('./pages/admin/MessagesManager'));
const ProfileManager = lazy(() => import('./pages/admin/ProfileManager'));
const JobMatcher = lazy(() => import('./pages/admin/JobMatcher'));
const ApplicationTracker = lazy(() => import('./pages/admin/ApplicationTracker'));
const CVGenerator = lazy(() => import('./pages/admin/CVGenerator'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

const AdminSuspense = ({ children }) => (
  <Suspense fallback={<div className="page-loader"><div className="loader" /></div>}>
    {children}
  </Suspense>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={
        <PublicLayout>
          <Home />
        </PublicLayout>
      } />

      {/* Admin Login */}
      <Route path="/admin/login" element={
        <AdminSuspense><Login /></AdminSuspense>
      } />

      {/* Protected Admin */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminSuspense><Dashboard /></AdminSuspense>} />
        <Route path="projects" element={<AdminSuspense><ProjectsManager /></AdminSuspense>} />
        <Route path="skills" element={<AdminSuspense><SkillsManager /></AdminSuspense>} />
        <Route path="certifications" element={<AdminSuspense><CertsManager /></AdminSuspense>} />
        <Route path="messages" element={<AdminSuspense><MessagesManager /></AdminSuspense>} />
        <Route path="jobs" element={<AdminSuspense><JobMatcher /></AdminSuspense>} />
        <Route path="applications" element={<AdminSuspense><ApplicationTracker /></AdminSuspense>} />
        <Route path="cv-generator" element={<AdminSuspense><CVGenerator /></AdminSuspense>} />
        <Route path="profile" element={<AdminSuspense><ProfileManager /></AdminSuspense>} />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
