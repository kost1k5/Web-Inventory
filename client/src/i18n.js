import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      'app.title': 'Inventory Management',
      'header.search': 'Search...',
      'header.theme': 'Theme',
      'header.language': 'Language',
    }
  },
  ru: {
    translation: {
      'app.title': 'Управление инвентарём',
      'header.search': 'Поиск...',
      'header.theme': 'Тема',
      'header.language': 'Язык',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',  
    fallbackLng: 'en',
    interpolation: { escapeValue: false }  
  });

export default i18n;