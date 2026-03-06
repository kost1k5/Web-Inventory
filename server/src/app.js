const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const uploadsRouter = require('./routes/uploads');
const sequelize = require('./config/database');
const passport = require('./config/passport');
const Item = require('./models/Item');  
const Discussion = require('./models/Discussion');
const ItemLike = require('./models/ItemLike');

const inventoriesRouter = require('./routes/inventories');

// Импортируем модели — sync() создаст таблицы только для импортированных моделей
const User = require('./models/User');
const Inventory = require('./models/Inventory');
const InventoryField = require('./models/InventoryField');
const Category = require('./models/Category');
const Tag = require('./models/Tag');
const InventoryAccess = require('./models/InventoryAccess');

// ASSOCIATIONS (связи между моделями)
// User ↔ Inventory (один user может иметь много inventories)
User.hasMany(Inventory, { foreignKey: 'ownerId' });
Inventory.belongsTo(User, { foreignKey: 'ownerId' });

// Inventory ↔ InventoryField (один inventory имеет много fields)
Inventory.hasMany(InventoryField, { foreignKey: 'inventoryId' });
InventoryField.belongsTo(Inventory, { foreignKey: 'inventoryId' });

// Inventory ↔ Tag (many-to-many через связующую таблицу InventoryTags)
Inventory.belongsToMany(Tag, { through: 'InventoryTags', foreignKey: 'inventoryId' });
Tag.belongsToMany(Inventory, { through: 'InventoryTags', foreignKey: 'tagId' });

// Inventory ↔ User (many-to-many через связующую таблицу InventoryAccess)
Inventory.belongsToMany(User,{through: InventoryAccess, foreignKey:'inventoryId', otherKey:'userId'});
User.belongsToMany(Inventory,{through: InventoryAccess, foreignKey:'userId', otherKey:'inventoryId'});

// Inventory ↔ Item (один inventory имеет много items)
Inventory.hasMany(Item, { foreignKey: 'inventoryId' });
Item.belongsTo(Inventory, { foreignKey: 'inventoryId' });

// User ↔ Item (один user создал много items)
User.hasMany(Item, { foreignKey: 'createdBy' });
Item.belongsTo(User, { foreignKey: 'createdBy' });

// Inventory ↔ Discussion
Inventory.hasMany(Discussion, { foreignKey: 'inventoryId' });
Discussion.belongsTo(Inventory, { foreignKey: 'inventoryId' });

// User ↔ Discussion
User.hasMany(Discussion, { foreignKey: 'userId' });
Discussion.belongsTo(User, { foreignKey: 'userId' });

// Item ↔ ItemLike
Item.hasMany(ItemLike, { foreignKey: 'itemId' });
ItemLike.belongsTo(Item, { foreignKey: 'itemId' });

// User ↔ ItemLike
User.hasMany(ItemLike, { foreignKey: 'userId' });
ItemLike.belongsTo(User, { foreignKey: 'userId' });

// Импортируем роуты
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: /^http:\/\/localhost:\d+$/,
    credentials: true,
  },
});
const PORT = process.env.PORT || 5000;

// Middleware — ПОРЯДОК ВАЖЕН!
// 1. Парсеры и CORS
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
    ].filter(Boolean);
    if (!origin || allowed.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());      // Парсим JSON из тела запросов
app.use('/api/upload', uploadsRouter);
// 2. Управление сессиями
// express-session хранит информацию о залогиненном пользователе
// Для production нужно использовать store (например, connect-postgres)
// Для dev используем встроенную Memory-store (она сбрасывается при перезапуске)
app.use(
  session({
    store: new pgSession(
      process.env.DATABASE_URL
        ? {
            conString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            createTableIfMissing: true,
          }
        : {
            conObject: {
              user: process.env.DB_USER,
              password: process.env.DB_PASSWORD,
              host: process.env.DB_HOST,
              port: process.env.DB_PORT,
              database: process.env.DB_NAME,
            },
            createTableIfMissing: true,
          }
    ),
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS в production
      maxAge: 24 * 60 * 60 * 1000, // 24 часа
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    }
  })
);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 3. Инициализация Passport
app.use(passport.initialize());
app.use(passport.session());

// Тестовый роут — проверяем что сервер работает
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Подключаем роуты аутентификации
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Подключаем роуты инвентарей
app.use('/api/inventories', inventoriesRouter);

io.on('connection', (socket) => {
  socket.on('joinInventory', (inventoryId) => {
    if (!inventoryId) return;
    socket.join(`inventory:${inventoryId}`);
  });

  socket.on('leaveInventory', (inventoryId) => {
    if (!inventoryId) return;
    socket.leave(`inventory:${inventoryId}`);
  });

  socket.on('sendComment', async ({ inventoryId, text, userId }) => {
    try {
      if (!inventoryId || !text || !userId) return;

      const created = await Discussion.create({
        inventoryId,
        userId,
        text: String(text).trim(),
      });

      const payload = await Discussion.findByPk(created.id, {
        include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      });

      io.to(`inventory:${inventoryId}`).emit('newComment', payload);
    } catch (error) {
      console.error('Socket sendComment error:', error);
    }
  });
});

// Подключаемся к БД и запускаем сервер
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // sync() без alter — таблицы уже существуют, структура управляется миграциями
    await sequelize.sync();
    console.log('✅ Models synchronized');

    // Инициализируем предопределённые категории
    const defaultCategories = [
      { name: 'Equipment' },
      { name: 'Furniture' },
      { name: 'Book' },
      { name: 'Other' }
    ];
    
    for (const cat of defaultCategories) {
      await Category.findOrCreate({
        where: { name: cat.name },
        defaults: { name: cat.name }
      });
    }
    console.log('✅ Default categories initialized');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📧 OAuth configured:`);
      console.log(`   - Google callback: http://localhost:${PORT}/api/auth/google/callback`);
      console.log(`   - Facebook callback: http://localhost:${PORT}/api/auth/facebook/callback`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    process.exit(1);
  }
}

start();
