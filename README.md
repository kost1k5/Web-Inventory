# Web Inventory

Веб-приложение для управления инвентарём. Пользователи создают инвентари с произвольными полями и кастомными ID, добавляют элементы, обсуждают их в режиме реального времени.

**Живая версия:** https://web-inventory-alpha.vercel.app

---

## Стек

| Часть | Технологии |
|---|---|
| Frontend | React 19, Ant Design 5, React Router, Socket.IO client, react-i18next |
| Backend | Node.js, Express 5, Passport.js (OAuth), Socket.IO |
| База данных | PostgreSQL, Sequelize ORM |
| Деплой | Vercel (frontend), Render (backend), Render PostgreSQL |

---

## Структура репозитория

```
/
├── client/          # React-приложение (деплоится на Vercel)
│   └── src/
│       ├── components/   # переиспользуемые компоненты (Header, ItemForm, ...)
│       ├── contexts/     # AuthContext, ThemeContext
│       ├── pages/        # страницы: Home, Dashboard, InventoryDetail, ...
│       └── services/     # api.js — единственная точка входа для HTTP-запросов
│
└── server/          # Express-приложение (деплоится на Render)
    └── src/
        ├── config/       # database.js (Sequelize), passport.js (OAuth стратегии)
        ├── middleware/   # requireAuth, requireAdmin
        ├── models/       # User, Inventory, Item, InventoryField, Tag, ...
        ├── routes/       # auth.js, inventories.js, admin.js, uploads.js
        └── utils/        # userService.js
```

---

## Локальный запуск

### Требования

- Node.js 18+
- PostgreSQL (локальная база или строка подключения)

### Установка

```bash
# Backend
cd server
cp .env.example .env    # заполни переменные
npm install
npm run dev             # порт 5000

# Frontend (в отдельном терминале)
cd client
npm install
npm run dev             # порт 5173
```

### Переменные окружения (server/.env)

```env
DATABASE_URL=           # строка подключения PostgreSQL (или DB_* переменные ниже)
DB_USER=
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432
DB_NAME=web_inventory

SESSION_SECRET=         # любая случайная строка

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## Деплой

### Backend → Render

1. Создай новый **Web Service** в Render, подключи репозиторий
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `node src/app.js`
5. Добавь все переменные из `.env.example` в **Environment**
6. Для `GOOGLE_CALLBACK_URL` и `GITHUB_CALLBACK_URL` используй `https://ваш-домен.onrender.com/api/auth/.../callback`

### Frontend → Vercel

1. Подключи репозиторий, Root Directory: `client`
2. Добавь переменную `VITE_API_URL=https://ваш-домен.onrender.com/api`
3. Добавь `VITE_IMGBB_API_KEY` для загрузки изображений

### OAuth

**Google:** [console.cloud.google.com](https://console.cloud.google.com) → Credentials → OAuth Client → Authorized redirect URIs → добавь callback URL сервера

**GitHub:** [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → твоё приложение → Authorization callback URL

---

## Основные возможности

- **Кастомные поля** — до 3 полей каждого типа на инвентарь: строка, текст, число, документ/ссылка, чекбокс
- **Кастомные ID** — настраиваемый формат (текст, случайное число, дата, UUID, последовательность), drag-and-drop порядок элементов
- **Права доступа** — публичный инвентарь или список конкретных пользователей
- **Автосохранение** — настройки инвентаря сохраняются каждые 7 секунд с optimistic locking
- **Обсуждения** — real-time через Socket.IO, Markdown
- **Поиск** — full-text по названию и описанию инвентарей и элементов
- **Темы и локализация** — светлая/тёмная тема, English/Russian, сохраняется в профиле
- **Статистика** — количество элементов, min/max/avg для числовых полей, топ-значения для строковых
- **Лайки** — один лайк на элемент с каждого пользователя
- **Админ-панель** — блокировка, разблокировка, удаление пользователей, управление ролями

---

## Архитектурные решения

**Почему фиксированные поля, а не dynamic columns?**
Инвентарь использует фиксированную схему: по 3 поля каждого типа в таблице `Items`. Тип и заголовок полей хранятся в `InventoryFields`. Это позволяет делать агрегацию (`AVG`, `MIN`, `MAX`) простыми SQL-запросами без динамического SQL и позволяет редактировать поля инвентаря без миграций схемы.

**Optimistic locking**
Каждый инвентарь и каждый элемент хранит целочисленный `version`. При сохранении клиент передаёт текущую версию, сервер проверяет совпадение и возвращает `409 Conflict` при коллизии. Это защищает от потери данных при одновременном редактировании.

**Сессии в PostgreSQL**
Сессии хранятся в таблице `session` через `connect-pg-simple`. Это позволяет серверу перезапускаться (Render free tier засыпает) без разлогинивания пользователей.

- **Управление доступом** - public/private инвентари

## 🛠️ Установка

```bash
# Backend
cd server
npm install
npm start

# Frontend
cd client  
npm install
npm run dev
```

## 📖 Архитектура

### Кастомные поля
Конфигурация в `InventoryField`, данные в `Item` (textField1-3, numberField1-3, etc).

### Real-time
```javascript
// Client
socket.emit('sendComment', data);
socket.on('newComment', (comment) => addToList(comment));

// Server
socket.on('sendComment', (data) => {
  saveToDb(data);
  io.to(room).emit('newComment', saved);
});
```

### Optimistic Locking
Поле `version` в Inventory - инкрементируется при каждом update.

## 🎨 UI особенности

- Без кнопок в строках таблицы (toolbar)
- Responsive дизайн
- Light/Dark режим
- EN/RU локализация

## 🎓 Для защиты проекта

Подробный разбор архитектуры, сценария демо и вопросов на защите: `DEFENSE_GUIDE.md`.

### Что уже закрывает ТЗ

- Табличное представление инвентарей и элементов (без кнопок действий в строках, через toolbar).
- Публичный просмотр инвентарей/элементов для неавторизованных пользователей.
- Разделы инвентаря через вкладки: Items, Discussion, Settings (базовая часть готова).
- Кастомные поля элементов через фиксированные колонки БД (`textField1..3`, `numberField1..3` и т.д.), без JSON-хранения.
- Real-time обсуждение (Socket.IO): новые комментарии приходят без перезагрузки страницы.
- Базовый optimistic locking для инвентаря через поле `version`.

### Что показать на демонстрации (5–7 минут)

1. Главная страница: таблицы последних и популярных инвентарей.
2. Личный кабинет: мои инвентари и инвентари с доступом.
3. Страница инвентаря:
   - Items: добавление/редактирование/удаление через toolbar.
   - Settings: изменение данных и сохранение с `version`.
   - Discussion: комментарий в реальном времени из двух вкладок браузера.
4. Кратко пояснить, почему поля не в JSON и как обеспечивается совместимость всех items одного inventory.

### Почему такая архитектура

- **PostgreSQL + Sequelize**: удобно делать агрегации и индексы, лучше для учебного ТЗ, чем document storage.
- **Фиксированные колонки для кастомных полей**: соответствует ограничению «до 3 полей каждого типа», упрощает фильтрацию и статистику.
- **`version` для optimistic locking**: защищает от silent overwrite при одновременном редактировании.
- **Socket.IO для Discussion**: простой и надежный near real-time канал для обновлений 2–5 секунд.

### Типовые вопросы преподавателя и короткие ответы

- **Почему не JSON для хранения полей item?**  
  Потому что нужны редактирование структуры полей, агрегации и предсказуемые SQL-запросы без full-scan и без сложной миграции данных.

- **Как решается конфликт одновременного редактирования?**  
  Клиент отправляет `version`, сервер сравнивает с текущей в БД. При расхождении возвращается конфликт, а клиент обновляет данные.

- **Почему в таблице нет кнопок Edit/Delete в каждой строке?**  
  Это требование ТЗ: действия вынесены в toolbar для выбранных строк.

- **Как обеспечивается real-time в обсуждении?**  
  Клиент подписывается на room инвентаря, сервер рассылает `newComment` всем участникам комнаты.

### Границы текущего MVP

Готова рабочая база для защиты core-части фронтенда. Остальные пункты ниже — запланированная доработка.

## 📝 TODO

- [ ] Custom ID Builder (Drag-and-Drop)
- [ ] Fields управление (Drag-and-Drop) 
- [ ] Access управление (autocomplete)
- [ ] Statistics tab
- [ ] Auto-save (7-10 сек)

---

Разработчик: [Tvoe Imya]
