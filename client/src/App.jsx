import { ConfigProvider, Layout, theme, App as AntApp } from 'antd';
import { useState } from 'react';
// import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import AppHeader from './components/Header/AppHeader';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { InventoryCreate } from './pages/InventoryCreate';
import { InventoryDetail } from './pages/InventoryDetail';
import { Admin } from './pages/Admin';
import { UserProfile } from './pages/UserProfile';
import SupportModal from './components/Support/SupportModal'

const { Content } = Layout;

function App() {
  const { isDarkMode } = useTheme();
const [open, setOpen] = useState(false);
  return (
    <BrowserRouter>
      {/* Ant Design theme переключается на уровне корневого ConfigProvider. */}
      <ConfigProvider theme={{ algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
        <AntApp>
          <Layout style={{ minHeight: '100vh' }}>

          <AppHeader onOpenSupportTicket={() => setOpen(true)} />
            <Content style={{ padding: '24px' }}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/home" element={<Home />} />
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/inventories/create" element={<InventoryCreate/>} />
                <Route path="/inventories/:id" element={<InventoryDetail />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/users/:userId" element={<UserProfile />} />
                <Route path="*" element={<Navigate to="/home" replace />} />  
              </Routes>
            </Content>
              <SupportModal open={open} onClose={() => setOpen(false)} />
          </Layout>
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
