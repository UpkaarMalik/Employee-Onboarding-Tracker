import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';
import TemplateBuilder from './pages/admin/TemplateBuilder';
import Checklist from './pages/employee/CheckList';
import Notes from './pages/notes/Notes';
import Resources from './pages/resources/Resources';
import Company from './pages/company/Company';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

function Dashboard() {
  return <div className="text-ink-900">Dashboard placeholder — built in Day 5</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/checklist" element={<Checklist />} />
              <Route path="/admin/templates" element={<TemplateBuilder />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/company" element={<Company />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
