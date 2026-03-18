import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // App
      'app.title': 'Inventory Management',

      // Header / menu
      'header.search': 'Search...',
      'header.home': 'Home',
      'header.dashboard': 'My Inventories',
      'header.admin': 'Admin Panel',
      'header.logout': 'Log Out',
      'header.login': 'Log In',

      // Common buttons
      'btn.add': 'Add',
      'btn.save': 'Save',
      'btn.cancel': 'Cancel',
      'btn.delete': 'Delete',
      'btn.create': 'Create',
      'btn.close': 'Close',

      // Table columns
      'col.title': 'Title',
      'col.description': 'Description',
      'col.author': 'Author',
      'col.items': 'Items',
      'col.isPublic': 'Public',
      'col.yes': 'Yes',
      'col.no': 'No',
      'col.total': 'Total: {{count}}',

      // Home page
      'home.latest': 'Latest Inventories',
      'home.top5': 'Top 5 by Item Count',
      'home.tagCloud': 'Tag Cloud',
      'home.noTags': 'No tags yet',
      'profile.inventories': 'Inventories',
      'profile.noInventories': 'No inventories yet',
      'home.searchResults': 'Search results: "{{query}}"',
      'home.foundCount': 'Found: {{count}} inventories',

      // Dashboard
      'dashboard.myInventories': 'My Inventories',
      'dashboard.accessInventories': 'Inventories with Access',
      'dashboard.createNew': 'Create New',
      'dashboard.emptyMine': 'No inventories. Create your first one!',
      'dashboard.emptyAccess': 'No inventories have been shared with you yet',

      // Items toolbar
      'toolbar.addItem': 'Add Item',
      'toolbar.delete': 'Delete ({{count}})',
      'toolbar.like': 'Like',
      'toolbar.liked': 'Liked',
      'toolbar.removeLike': 'Remove like',
      'toolbar.addLike': 'Add like',
      'toolbar.selectHint': 'Select a row · Double-click to edit',
      'toolbar.multiHint': 'Selected: {{count}} · Like one item at a time',
      'toolbar.selectAll': 'Select All',
      'toolbar.deselectAll': 'Deselect All',

      // Inventory detail tabs
      'tab.items': 'Items',
      'tab.discussion': 'Discussion',
      'tab.settings': 'Settings',
      'tab.customIds': 'Custom IDs',
      'tab.access': 'Access',
      'tab.fields': 'Fields',
      'tab.stats': 'Stats',

      // Items table
      'items.empty': 'No items. Add the first one!',
      'items.editHint': 'Double-click a row to edit',
      'items.customId': 'Custom ID',
      'items.addedAt': 'Added',
      'items.addItem': 'Add Item',
      'items.editItem': 'Edit Item',

      // Fields tab
      'fields.title': 'Item Fields',
      'fields.add': '+ Add Field',
      'fields.dragHint': 'Drag cards to reorder',
      'fields.modal.title': 'Add Field',
      'fields.name': 'Field Name',
      'fields.namePlaceholder': 'E.g.: Author, Price, Year',
      'fields.desc': 'Description (hint)',
      'fields.descPlaceholder': 'Optional — shown as tooltip in forms',
      'fields.type': 'Field Type',
      'fields.index': 'Index (0–2)',
      'fields.indexTooltip': 'Up to 3 fields of each type (indices 0, 1, 2)',
      'fields.order': 'Display Order',
      'fields.showInTable': 'Show in table',
      'fields.addBtn': 'Add Field',
      'fields.orderSaved': 'Field order saved',
      'fields.added': 'Field added',
      'fields.showTooltip': 'Hide from table',
      'fields.hideTooltip': 'Show in table',
      'fields.deleteTooltip': 'Delete field',

      // Field types
      'fieldType.text': 'Text',
      'fieldType.multiline': 'Multiline',
      'fieldType.number': 'Number',
      'fieldType.document': 'Document',
      'fieldType.checkbox': 'Checkbox',

      // Discussion
      'discussion.noComments': 'No comments yet. Be the first!',
      'discussion.placeholder': 'Write a comment... (Markdown supported)',
      'discussion.post': 'Post',

      // Access tab
      'access.title': 'Access Settings',
      'access.addUser': 'Add user by name or email',
      'access.save': 'Grant Access',
      'access.noUsers': 'No users have been granted access',
      'access.searchPlaceholder': 'Start typing name or email...',

      // Admin
      'admin.title': 'User Administration',
      'admin.col.name': 'Name',
      'admin.col.email': 'Email',
      'admin.col.role': 'Role',
      'admin.col.status': 'Status',
      'admin.col.actions': 'Actions',
      'admin.role.admin': 'Admin',
      'admin.role.user': 'User',
      'admin.status.active': 'Active',
      'admin.status.blocked': 'Blocked',
      'admin.makeAdmin': 'Make Admin',
      'admin.removeAdmin': 'Remove Admin',
      'admin.block': 'Block',
      'admin.unblock': 'Unblock',
      'admin.delete': 'Delete',
      'admin.total': 'Total users: {{count}}',

      // Create inventory page
      'create.pageTitle': 'Create New Inventory',
      'create.name': 'Inventory Name',
      'create.namePlaceholder': 'E.g.: Office Equipment',
      'create.nameRequired': 'Please enter a name',
      'create.nameMin': 'Minimum 3 characters',
      'create.nameMax': 'Maximum 100 characters',
      'create.category': 'Category',
      'create.categoryPlaceholder': 'Select category',
      'create.categoryRequired': 'Please select a category',
      'create.description': 'Description (Markdown)',
      'create.descriptionPlaceholder': 'Enter description with Markdown support...',
      'create.descriptionRequired': 'Please add a description',
      'create.tags': 'Tags',
      'create.tagsHint': 'Start typing to search existing tags or create new ones',
      'create.tagsPlaceholder': 'Add tags...',
      'create.isPublic': 'Public Access',
      'create.isPublicHint': 'If enabled, any authenticated user can add items',
      'create.image': 'Image (optional)',
      'create.imageHint': 'Upload an illustration for this inventory',
      'create.uploadBtn': 'Upload Image',
      'create.uploadSuccess': 'Image uploaded!',
      'create.uploadError': 'Image upload failed',
      'create.submit': 'Create Inventory',
      'create.success': 'Inventory created!',
      'create.error': 'Failed to create inventory',

      // Inventory settings
      'settings.title': 'Inventory Settings',
      'settings.name': 'Title',
      'settings.description': 'Description (Markdown)',
      'settings.category': 'Category',
      'settings.tags': 'Tags',
      'settings.image': 'Image URL',
      'settings.isPublic': 'Public (all authenticated users can add items)',
      'settings.saving': 'Saving...',
      'settings.saved': 'Saved',

      // Stats
      'stats.title': 'Statistics',
      'stats.totalItems': 'Total Items',

      // Custom ID tab
      'customId.saved': 'Custom ID format saved',
      'customId.hint': 'Add elements, reorder via drag-and-drop, then save the format.',
      'customId.save': 'Save Format',
      'customId.remove': 'Remove',

      //Support
      'support.help' : 'Help & Support',
      'support.createTicket': 'Create Support Ticket',
      'support.modalTitle': 'Submit a Support Ticket',
      'support.summary': 'Summary',
      'support.summaryPlaceholder': 'Briefly describe the problem',
      'support.priority': 'Priority',
      'support.priorityHigh': 'High',
      'support.priorityAverage': 'Average',
      'support.priorityLow': 'Low',
      'support.submit': 'Submit',
      'support.cancel': 'Cancel',
      'support.loginRequired': 'You need to be logged in to submit a support ticket.',
      'support.success': 'Support ticket submitted successfully!',
    },
  },
  ru: {
    translation: {
      // App
      'app.title': 'Управление инвентарём',

      // Header / menu
      'header.search': 'Поиск...',
      'header.home': 'Главная',
      'header.dashboard': 'Мои инвентари',
      'header.admin': 'Панель администратора',
      'header.logout': 'Выйти',
      'header.login': 'Войти',

      // Common buttons
      'btn.add': 'Добавить',
      'btn.save': 'Сохранить',
      'btn.cancel': 'Отмена',
      'btn.delete': 'Удалить',
      'btn.create': 'Создать',
      'btn.close': 'Закрыть',

      // Table columns
      'col.title': 'Название',
      'col.description': 'Описание',
      'col.author': 'Автор',
      'col.items': 'Items',
      'col.isPublic': 'Публичный',
      'col.yes': 'Да',
      'col.no': 'Нет',
      'col.total': 'Всего: {{count}}',

      // Home page
      'home.latest': 'Последние инвентари',
      'home.top5': 'Топ-5 по количеству элементов',
      'home.tagCloud': 'Облако тегов',
      'home.noTags': 'Теги пока не добавлены',
      'profile.inventories': 'Инвентари',
      'profile.noInventories': 'Нет инвентарей',
      'home.searchResults': 'Результаты поиска: "{{query}}"',
      'home.foundCount': 'Найдено инвентарей: {{count}}',

      // Dashboard
      'dashboard.myInventories': 'Мои инвентари',
      'dashboard.accessInventories': 'Инвентари с доступом',
      'dashboard.createNew': 'Создать новый',
      'dashboard.emptyMine': 'Нет инвентарей. Создайте первый!',
      'dashboard.emptyAccess': 'Вам пока не выдан доступ ни к одному инвентарю',

      // Items toolbar
      'toolbar.addItem': 'Добавить элемент',
      'toolbar.delete': 'Удалить ({{count}})',
      'toolbar.like': 'Лайк',
      'toolbar.liked': 'Нравится',
      'toolbar.removeLike': 'Убрать лайк',
      'toolbar.addLike': 'Поставить лайк',
      'toolbar.selectHint': 'Выберите строку · Двойной клик — редактировать',
      'toolbar.multiHint': 'Выбрано: {{count}} · Лайкнуть можно только один элемент',
      'toolbar.selectAll': 'Выбрать все',
      'toolbar.deselectAll': 'Снять выделение',

      // Inventory detail tabs
      'tab.items': 'Items',
      'tab.discussion': 'Обсуждение',
      'tab.settings': 'Настройки',
      'tab.customIds': 'Custom IDs',
      'tab.access': 'Доступ',
      'tab.fields': 'Поля',
      'tab.stats': 'Статистика',

      // Items table
      'items.empty': 'Нет элементов. Добавьте первый!',
      'items.editHint': 'Двойной клик по строке — редактировать',
      'items.customId': 'Custom ID',
      'items.addedAt': 'Добавлен',
      'items.addItem': 'Добавить элемент',
      'items.editItem': 'Редактировать элемент',

      // Fields tab
      'fields.title': 'Поля элементов',
      'fields.add': '+ Добавить поле',
      'fields.dragHint': 'Перетащивайте карточки для смены порядка',
      'fields.modal.title': 'Добавить поле',
      'fields.name': 'Название поля',
      'fields.namePlaceholder': 'Например: Автор, Цена, Год выпуска',
      'fields.desc': 'Описание (подсказка)',
      'fields.descPlaceholder': 'Необязательно — отображается как tooltip в форме',
      'fields.type': 'Тип поля',
      'fields.index': 'Индекс (0–2)',
      'fields.indexTooltip': 'Каждого типа может быть не больше 3 полей (индексы 0, 1, 2)',
      'fields.order': 'Порядок отображения',
      'fields.showInTable': 'Показывать в таблице',
      'fields.addBtn': 'Добавить поле',
      'fields.orderSaved': 'Порядок полей сохранён',
      'fields.added': 'Поле добавлено',
      'fields.showTooltip': 'Скрыть из таблицы',
      'fields.hideTooltip': 'Показать в таблице',
      'fields.deleteTooltip': 'Удалить поле',

      // Field types
      'fieldType.text': 'Текст',
      'fieldType.multiline': 'Многострочный',
      'fieldType.number': 'Число',
      'fieldType.document': 'Документ',
      'fieldType.checkbox': 'Чекбокс',

      // Discussion
      'discussion.noComments': 'Нет комментариев. Будьте первым!',
      'discussion.placeholder': 'Написать комментарий... (поддерживается Markdown)',
      'discussion.post': 'Отправить',

      // Access tab
      'access.title': 'Настройки доступа',
      'access.addUser': 'Добавить пользователя по имени или email',
      'access.save': 'Выдать доступ',
      'access.noUsers': 'Нет пользователей с доступом',
      'access.searchPlaceholder': 'Начните вводить имя или email...',

      // Admin
      'admin.title': 'Управление пользователями',
      'admin.col.name': 'Имя',
      'admin.col.email': 'Email',
      'admin.col.role': 'Роль',
      'admin.col.status': 'Статус',
      'admin.col.actions': 'Действия',
      'admin.role.admin': 'Администратор',
      'admin.role.user': 'Пользователь',
      'admin.status.active': 'Активен',
      'admin.status.blocked': 'Заблокирован',
      'admin.makeAdmin': 'Сделать админом',
      'admin.removeAdmin': 'Снять права',
      'admin.block': 'Заблокировать',
      'admin.unblock': 'Разблокировать',
      'admin.delete': 'Удалить',
      'admin.total': 'Всего пользователей: {{count}}',

      // Login page
      'login.title': 'Вход в систему',
      'login.google': 'Войти через Google',
      'login.github': 'Войти через GitHub',
      'login.blocked': 'Ваш аккаунт заблокирован. Обратитесь к администратору.',
      'login.authFailed': 'Ошибка аутентификации. Попробуйте ещё раз.',

      // Create inventory page
      'create.pageTitle': 'Создание нового инвентаря',
      'create.name': 'Название инвентаря',
      'create.namePlaceholder': 'Например: Офисная техника',
      'create.nameRequired': 'Пожалуйста, введите название',
      'create.nameMin': 'Минимум 3 символа',
      'create.nameMax': 'Максимум 100 символов',
      'create.category': 'Категория',
      'create.categoryPlaceholder': 'Выберите категорию',
      'create.categoryRequired': 'Выберите категорию',
      'create.description': 'Описание (Markdown)',
      'create.descriptionPlaceholder': 'Введите описание с поддержкой Markdown...',
      'create.descriptionRequired': 'Добавьте описание',
      'create.tags': 'Теги',
      'create.tagsHint': 'Начните вводить для поиска или создайте новый тег',
      'create.tagsPlaceholder': 'Добавьте теги...',
      'create.isPublic': 'Публичный доступ',
      'create.isPublicHint': 'Если включено, любой авторизованный пользователь сможет добавлять элементы',
      'create.image': 'Изображение (опционально)',
      'create.imageHint': 'Загрузите иллюстрацию для инвентаря',
      'create.uploadBtn': 'Загрузить изображение',
      'create.uploadSuccess': 'Изображение загружено!',
      'create.uploadError': 'Ошибка загрузки изображения',
      'create.submit': 'Создать инвентарь',
      'create.success': 'Инвентарь успешно создан!',
      'create.error': 'Ошибка при создании инвентаря',

      // Inventory settings
      'settings.title': 'Настройки инвентаря',
      'settings.name': 'Название',
      'settings.description': 'Описание (Markdown)',
      'settings.category': 'Категория',
      'settings.tags': 'Теги',
      'settings.image': 'URL изображения',
      'settings.isPublic': 'Публичный (все авторизованные пользователи могут добавлять элементы)',
      'settings.saving': 'Сохранение...',
      'settings.saved': 'Сохранено',

      // Stats
      'stats.title': 'Статистика',
      'stats.totalItems': 'Всего элементов',

      // Custom ID tab
      'customId.saved': 'Формат Custom ID сохранён',
      'customId.hint': 'Добавляйте элементы, меняйте порядок drag-and-drop, затем сохраните формат.',
      'customId.save': 'Сохранить формат',
      'customId.remove': 'Удалить',

      //Support
      'support.help' : 'Помощь и поддержка',
      'support.createTicket': 'Создать тикет поддержки',
      'support.modalTitle': 'Создать тикет поддержки',
      'support.summary': 'Краткое описание',
      'support.summaryPlaceholder': 'Коротко опишите проблему',
      'support.priority': 'Приоритет',
      'support.priorityHigh': 'Высокий',
      'support.priorityAverage': 'Средний',
      'support.priorityLow': 'Низкий',
      'support.submit': 'Отправить',
      'support.cancel': 'Отмена',
      'support.loginRequired': 'Войдите в систему, чтобы создать тикет поддержки',
      'support.success': 'Тикет поддержки успешно создан',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'ru',
    fallbackLng: 'ru',
    interpolation: { escapeValue: false },
  });

export default i18n;