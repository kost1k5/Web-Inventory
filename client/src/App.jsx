import { ConfigProvider, Layout, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from './hooks/useTheme';
import AppHeader from './components/Header/AppHeader';

const { Content } = Layout;

function App() {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  return (
    <ConfigProvider theme={{ algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Content style={{ padding: '24px' }}>
          <h1>{t('app.title')}</h1>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
