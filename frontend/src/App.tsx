import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';
import TemplateBuilder from './pages/admin/TemplateBuilder';
import Checklist from './pages/employee/CheckList';

function Dashboard() {
  return <div className="p-10 text-ink-900">Dashboard placeholder — built in Day 5</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/admin/templates" element={<TemplateBuilder />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}