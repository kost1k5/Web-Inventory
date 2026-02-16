import { Layout, Switch, Select, Input, Flex } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';

const { Header } = Layout;

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
];

export default function AppHeader() {
  const { t, i18n } = useTranslation();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLanguageChange = (value) => {
    i18n.changeLanguage(value);
    localStorage.setItem('language', value);
  };

  return (
    <Header style={{ display: 'flex', alignItems: 'center' }}>
      <Flex gap="middle" align="center" style={{ width: '100%' }}>
        <Input.Search
          placeholder={t('header.search')}
          style={{ maxWidth: 400 }}
        />
        <Flex gap="small" align="center" style={{ marginLeft: 'auto' }}>
          <Switch
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            checked={isDarkMode}
            onChange={toggleTheme}
          />
          <Select
            value={i18n.language}
            onChange={handleLanguageChange}
            style={{ width: 120 }}
            options={languageOptions}
          />
        </Flex>
      </Flex>
    </Header>
  );
}