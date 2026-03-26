import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public pages
import Home from './pages/public/Home';

// Admin pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ProjectsManager from './pages/admin/ProjectsManager';
import SkillsManager from './pages/admin/SkillsManager';
import CertsManager from './pages/admin/CertsManager';
import MessagesManager from './pages/admin/MessagesManager';
import ProfileManager from './pages/admin/ProfileManager';

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
      <Route path="/admin/login" element={<Login />} />

      {/* Protected Admin */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<ProjectsManager />} />
        <Route path="skills" element={<SkillsManager />} />
        <Route path="certifications" element={<CertsManager />} />
        <Route path="messages" element={<MessagesManager />} />
        <Route path="profile" element={<ProfileManager />} />
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
