import type { FC } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { AppLayout } from './components/AppLayout';
import { MaterialRequestListPage } from './pages/MaterialRequestListPage';
import { MaterialRequestFormPage } from './pages/MaterialRequestFormPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CostTypesPage } from './pages/CostTypesPage';

const App: FC = () => (
  <ConfigProvider locale={ruRU} theme={{ token: { colorPrimary: '#1677ff' } }}>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/requests" element={<MaterialRequestListPage />} />
          <Route path="/requests/new" element={<MaterialRequestFormPage />} />
          <Route path="/requests/:id" element={<MaterialRequestFormPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/cost-types" element={<CostTypesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/requests" replace />} />
      </Routes>
    </BrowserRouter>
  </ConfigProvider>
);

export default App;
