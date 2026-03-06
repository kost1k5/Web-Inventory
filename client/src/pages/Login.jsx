import { useAuth } from '../hooks/useAuth';
import { Button, Flex, Spin, Card, Typography, Alert } from 'antd';
import { GoogleOutlined, GithubOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect} from 'react';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'https://web-inventory.onrender.com/api';
const AUTH_BASE = API_URL.replace('/api', '');

export function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const errorParam = searchParams.get('error');

  // Если пользователь уже авторизирован, редиректим на Dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card style={{ width: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', borderRadius: 16 }}>
        <Flex vertical align="center" gap="small" style={{ marginBottom: 24 }}>
          <Typography.Title level={3} style={{ margin: 0 }}>{t('login.title') || 'Sign In'}</Typography.Title>
          <Typography.Text type="secondary">{t('app.title')}</Typography.Text>
        </Flex>

        {errorParam === 'blocked' && (
          <Alert
            type="error"
            message={t('login.blocked') || 'Your account has been blocked. Contact the administrator.'}
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}
        {errorParam === 'auth_failed' && (
          <Alert
            type="error"
            message={t('login.authFailed') || 'Authentication failed. Please try again.'}
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        <Flex vertical gap="small">
          <Button
            type="primary"
            size="large"
            block
            icon={<GoogleOutlined />}
            onClick={() => window.location.href = `${AUTH_BASE}/api/auth/google`}
          >
            {t('login.google') || 'Sign in with Google'}
          </Button>

          <Button
            size="large"
            block
            icon={<GithubOutlined />}
            onClick={() => window.location.href = `${AUTH_BASE}/api/auth/github`}
          >
            {t('login.github') || 'Sign in with GitHub'}
          </Button>
        </Flex>
      </Card>
    </div>
  );
}
