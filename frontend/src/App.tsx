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
          {/* Заявка-Объект */}
          <Route path="/requests" element={<MaterialRequestListPage module="object" basePath="/requests" />} />
          <Route path="/requests/new" element={<MaterialRequestFormPage module="object" basePath="/requests" />} />
          <Route path="/requests/:id" element={<MaterialRequestFormPage module="object" basePath="/requests" />} />

          {/* Заявка-Материал */}
          <Route path="/mat-requests" element={<MaterialRequestListPage module="material" basePath="/mat-requests" />} />
          <Route path="/mat-requests/new" element={<MaterialRequestFormPage module="material" basePath="/mat-requests" />} />
          <Route path="/mat-requests/:id" element={<MaterialRequestFormPage module="material" basePath="/mat-requests" />} />

          {/* Справочники */}
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/cost-types" element={<CostTypesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/requests" replace />} />
      </Routes>
    </BrowserRouter>
  </ConfigProvider>
);

export default App;
