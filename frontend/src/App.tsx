import type { FC } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { AuthProvider, useAuth } from './store/AuthContext';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { MaterialRequestListPage } from './pages/MaterialRequestListPage';
import { MaterialRequestFormPage } from './pages/MaterialRequestFormPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CostTypesPage } from './pages/CostTypesPage';

const ProtectedRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes: FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/requests" replace /> : <LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/requests" element={<MaterialRequestListPage />} />
        <Route path="/requests/new" element={<MaterialRequestFormPage />} />
        <Route path="/requests/:id" element={<MaterialRequestFormPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/cost-types" element={<CostTypesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/requests" replace />} />
    </Routes>
  );
};

const App: FC = () => (
  <ConfigProvider locale={ruRU} theme={{ token: { colorPrimary: '#1677ff' } }}>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </ConfigProvider>
);

export default App;
