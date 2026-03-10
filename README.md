# Web Inventory

Живая версия: https://web-inventory-alpha.vercel.app

## Что умеет приложение

- Авторизация через Google и GitHub OAuth
- Создание инвентарей с названием, описанием, категорией, тегами и изображением
- Публичные и приватные инвентари с настройкой прав на запись
- Кастомные поля элементов: текст, многострочный текст, число, ссылка на документ, чекбокс
- Кастомные ID элементов с настраиваемым форматом
- Табличный просмотр инвентарей и элементов без кнопок действий в строках
- Обсуждение инвентаря в near real-time через Socket.IO
- Лайки для элементов
- Full-text поиск по инвентарям
- Светлая и тёмная темы, локализация интерфейса
- Админ-панель для управления пользователями

## Технологии

| Слой | Технологии |
|---|---|
| Frontend | React 19, Vite, Ant Design, React Router, react-i18next, Socket.IO Client |
| Backend | Node.js, Express 5, Passport.js, Socket.IO |
| Данные | PostgreSQL, Sequelize |
| Сессии | express-session, connect-pg-simple |
| Деплой | Vercel, Render |

## Структура проекта

```text
.
├── client/
│   ├── src/
│   │   ├── components/   # вкладки инвентаря, toolbar, формы
│   │   ├── contexts/     # авторизация и тема
│   │   ├── pages/        # основные страницы приложения
│   │   ├── hooks/        # useAuth, useTheme
│   │   ├── services/     # HTTP-клиент
│   │   └── i18n.js       # переводы интерфейса
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/       # Sequelize и Passport
│   │   ├── middleware/   # проверка авторизации и роли админа
│   │   ├── models/       # модели Sequelize
│   │   ├── routes/       # auth, inventories, admin, uploads
│   │   └── utils/        # служебная логика
│   └── .env.example
├── render.yaml
└── README.md
```

## Локальный запуск

### Требования

- Node.js 18+
- PostgreSQL

### 1. Настройка backend

```bash
cd server
copy .env.example .env
npm install
npm run dev
```

Сервер по умолчанию запускается на порту 5000.

### 2. Настройка frontend

```bash
cd client
npm install
npm run dev
```

Клиент по умолчанию запускается на порту 5173.

### Переменные окружения backend

Файл [server/.env.example](server/.env.example) содержит базовый шаблон.

Ключевые переменные:

```env
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

SESSION_SECRET=change-this-to-a-long-random-string
PORT=5000
FRONTEND_URL=http://localhost:5173

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

NODE_ENV=development
```

### Переменные окружения frontend

Для клиента используются переменные Vite:

```env
VITE_API_URL=http://localhost:5000/api
VITE_IMGBB_API_KEY=
```

## Деплой

### Backend на Render

1. Создать Web Service с корнем проекта server.
2. Указать Build Command: npm install.
3. Указать Start Command: node src/app.js.
4. Добавить переменные из [server/.env.example](server/.env.example).
5. Для OAuth callback использовать домен Render.

### Frontend на Vercel

1. Подключить каталог client как отдельный проект.
2. Добавить VITE_API_URL со ссылкой на backend.
3. При необходимости добавить VITE_IMGBB_API_KEY.

## Архитектурные решения

### Почему поля элементов не хранятся в JSON

По ТЗ у инвентаря допускается до трёх полей каждого типа. Поэтому в модели элемента используются фиксированные колонки, а описание полей хранится отдельно в InventoryField. Такой подход упрощает SQL-агрегации, фильтрацию и изменение конфигурации полей без динамического изменения схемы.

### Кастомный ID не является primary key

У каждого элемента есть глобальный UUID как технический идентификатор. Пользовательский customId хранится отдельно и уникален только в пределах одного инвентаря за счёт составного индекса по inventoryId и customId.

### Optimistic locking

Инвентари и элементы содержат поле version. Клиент передаёт текущую версию при обновлении, а сервер возвращает 409 Conflict, если запись уже изменилась.

### Сессии в PostgreSQL

Сессии сохраняются через connect-pg-simple в PostgreSQL. Это позволяет не терять авторизацию после перезапуска сервера.

### Обсуждения через Socket.IO

Комментарии по инвентарю отправляются в комнату inventory:<id>, поэтому пользователи видят новые сообщения без перезагрузки страницы.

## Основные сущности

- User: профиль, роль администратора, тема и язык интерфейса
- Inventory: карточка инвентаря, права доступа, категория, теги, формат custom ID
- InventoryField: конфигурация пользовательских полей
- Item: элемент инвентаря с фиксированным набором колонок под кастомные поля
- Discussion: сообщения во вкладке обсуждения
- ItemLike: лайки элементов
- InventoryAccess: список пользователей с правом записи

## Что ещё не выполнено по ТЗ

- Нет отдельной страницы item: редактирование сейчас открывается в modal внутри страницы инвентаря.
- Личный кабинет реализован частично: таблица инвентарей с доступом пока собирается не из реального write-access списка.
- Вкладка настроек инвентаря покрывает не все поля ТЗ: category, tags и image пока не редактируются в одном месте.
- Статистика пока считает только количество элементов и агрегаты по числовым полям; топ значений для строковых полей не добавлен.
- Custom ID работает в базовом режиме, но не закрывает все требования по форматированию и вспомогательным popover-подсказкам.
- Тема и язык сохраняются локально в браузере; сохранение этих настроек в профиле пользователя не реализовано.
- Интерфейс переведён не полностью: в части компонентов ещё есть жёстко прошитые строки.
- Поиск сейчас ориентирован в первую очередь на инвентари; отдельный полнотекстовый поиск по данным item реализован не полностью.







