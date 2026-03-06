const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
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

// --- Sequelize associations ---
User.hasMany(Inventory, { foreignKey: 'ownerId' });
Inventory.belongsTo(User, { foreignKey: 'ownerId' });

Inventory.hasMany(InventoryField, { foreignKey: 'inventoryId' });
InventoryField.belongsTo(Inventory, { foreignKey: 'inventoryId' });

// Теги — many-to-many через промежуточную таблицу InventoryTags
Inventory.belongsToMany(Tag, { through: 'InventoryTags', foreignKey: 'inventoryId' });
Tag.belongsToMany(Inventory, { through: 'InventoryTags', foreignKey: 'tagId' });

// Список пользователей с доступом на запись — many-to-many через InventoryAccess
Inventory.belongsToMany(User, { through: InventoryAccess, foreignKey: 'inventoryId', otherKey: 'userId' });
User.belongsToMany(Inventory, { through: InventoryAccess, foreignKey: 'userId', otherKey: 'inventoryId' });

Inventory.hasMany(Item, { foreignKey: 'inventoryId' });
Item.belongsTo(Inventory, { foreignKey: 'inventoryId' });

User.hasMany(Item, { foreignKey: 'createdBy' });
Item.belongsTo(User, { foreignKey: 'createdBy' });

Inventory.hasMany(Discussion, { foreignKey: 'inventoryId' });
Discussion.belongsTo(Inventory, { foreignKey: 'inventoryId' });

User.hasMany(Discussion, { foreignKey: 'userId' });
Discussion.belongsTo(User, { foreignKey: 'userId' });

Item.hasMany(ItemLike, { foreignKey: 'itemId' });
ItemLike.belongsTo(Item, { foreignKey: 'itemId' });

User.hasMany(ItemLike, { foreignKey: 'userId' });
ItemLike.belongsTo(User, { foreignKey: 'userId' });

// Импортируем роуты
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');

const app = express();

// Render/Heroku/etc работают за reverse proxy — без этого secure cookies не ставятся
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      /^http:\/\/localhost:\d+$/,
    ].filter(Boolean),
    credentials: true,
  },
});
const PORT = process.env.PORT || 5000;

// --- Middleware ---
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
app.use(express.json());
app.use('/api/upload', uploadsRouter);

// Pg.Pool передаётся явно, чтобы можно было задать ssl: rejectUnauthorized: false
// (при передаче connectionString напрямую в pgSession SSL-опции игнорируются)
const pgPool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
      }
);

app.use(
  session({
    store: new pgSession({
      pool: pgPool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(passport.initialize());
app.use(passport.session());

// --- Routes ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/inventories', inventoriesRouter);

// --- Socket.IO ---
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

// --- Startup ---
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync();

    // Категории добавляются только при первом запуске;
    // новые значения добавляются напрямую в БД без UI
    const defaultCategories = ['Equipment', 'Furniture', 'Book', 'Other'];
    for (const name of defaultCategories) {
      await Category.findOrCreate({ where: { name }, defaults: { name } });
    }

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Startup error:', error.message);
    process.exit(1);
  }
}

start();
