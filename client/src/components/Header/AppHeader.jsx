import { Layout, Switch, Select, Input, Flex, Button, Avatar, Dropdown } from 'antd';
import { SunOutlined, MoonOutlined, LogoutOutlined, UserOutlined,  QuestionCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useEffect } from 'react';

const { Header } = Layout;

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
];

export default function AppHeader({onOpenSupportTicket}) {
  const { t, i18n } = useTranslation();
  const { isDarkMode, installTheme, theme } = useTheme();
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();

const handleThemeChange = async (checked) => {
  const previousTheme = theme;
  const newTheme = checked ? 'dark' : 'light';

  // Мгновенно применяем тему в UI, затем подтверждаем изменение на сервере.
  installTheme(newTheme);

  if (!user) {
    return;
  }

  try {
    await api.settings.updateSettings({ theme: newTheme });
    await checkAuth();
  } catch (error) {
    installTheme(previousTheme);
    console.error('Failed to update theme setting:', error);
  }
};

    useEffect(() => {
    if (user?.theme) {
      installTheme(user.theme)
    };
  }, [user?.theme, installTheme]);

  const handleLanguageChange = async (value) => {
    try {
      if (!user){
         i18n.changeLanguage(value);
    localStorage.setItem('language', value);
        return;
      }
    await api.settings.updateSettings({ language: value })
    i18n.changeLanguage(value);
    localStorage.setItem('language', value);
    await checkAuth();
    } catch (error) {
      console.error('Failed to update language setting:', error);
    }
  };

  useEffect(() => {
    if (user?.language && i18n.language !== user.language) {
      i18n.changeLanguage(user.language);
    };
  }, [user?.language, i18n]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

 
  const userMenuItems = [
    {
      key: 'profile',
      label: `${user?.name} (${user?.email})`,
      disabled: true,
    },
    {
      key: 'home',
      label: t('header.home'),
      onClick: () => navigate('/home'),
    },
    {
      key: 'dashboard',
      label: t('header.dashboard'),
      onClick: () => navigate('/dashboard'),
    },
    ...(user?.isAdmin
      ? [{
          key: 'admin',
          label: t('header.admin'),
          onClick: () => navigate('/admin'),
        }]
      : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: t('header.logout'),
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Header style={{ display: 'flex', alignItems: 'center' }}>
      <Flex gap="middle" align="center" style={{ width: '100%' }}>
        <Input.Search
          placeholder={t('header.search')}
          style={{ maxWidth: 400 }}
          onSearch={(value) => navigate(`/home?q=${encodeURIComponent(value || '')}`)}
        />
        <Flex gap="small" align="center" style={{ marginLeft: 'auto' }}>
          <Switch
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            checked={isDarkMode}
            onChange={handleThemeChange}
          />
          <Button
  type="text"
  icon={<QuestionCircleOutlined />}
  onClick={onOpenSupportTicket}
/>
          <Select
            value={i18n.language}
            onChange={handleLanguageChange}
            style={{ width: 120 }}
            options={languageOptions}
          />
          {user ? (
            <Dropdown menu={{ items: userMenuItems }}>
              <Avatar size={32} icon={<UserOutlined />} style={{ cursor: 'pointer' }}>
                {user.name?.charAt(0).toUpperCase()}
              </Avatar>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')}>
              {t('header.login') || 'Вход'}
            </Button>
          )}
        </Flex>
      </Flex>
    </Header>
  );
}