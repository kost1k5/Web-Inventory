# Web Inventory Management System

Система управления инвентарём с кастомными полями и real-time обсуждениями.

## 🚀 Технологии

**Frontend:** React 19, Ant Design, Socket.IO, i18next  
**Backend:** Node.js, Express, PostgreSQL, Sequelize, Socket.IO

## 📁 Структура

```
client/src/
  ├── components/    # Переиспользуемые компоненты
  ├── pages/         # Страницы (Home, Dashboard, InventoryDetail)
  ├── services/      # API клиент
  └── contexts/      # AuthContext, ThemeContext

server/src/
  ├── models/        # Sequelize модели (User, Inventory, Item)
  ├── routes/        # API endpoints
  └── config/        # database, passport
```

## 🔑 Ключевые фичи

- **Кастомные поля** - до 3 полей каждого типа (text, number, document, checkbox)
- **Кастомные ID** - генерация уникальных ID по формату
- **Real-time обсуждения** - WebSocket через Socket.IO
- **Optimistic Locking** - версионирование для предотвращения конфликтов
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
