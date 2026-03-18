const { Router } = require('express');
const { Op, fn, col, literal } = require('sequelize');
const crypto = require('crypto');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const InventoryAccess = require('../models/InventoryAccess');
const InventoryField = require('../models/InventoryField');
const Item = require('../models/Item');
const Discussion = require('../models/Discussion');
const ItemLike = require('../models/ItemLike');
const { title } = require('process');

const router = Router();

// Централизованная проверка прав используется во всех ветках CRUD,
// чтобы правила owner/admin/public/access-list не расходились между эндпоинтами.
async function getAccessFlags(inventory, user) {
  if (!user) return { canView: true, canEdit: false, isOwner: false, isAdmin: false };

  const isOwner = inventory.ownerId === user.id;
  const isAdmin = user.isAdmin === true;

  const hasAccessRecord = await InventoryAccess.findOne({
    where: { inventoryId: inventory.id, userId: user.id },
  });

  const inAccessList = hasAccessRecord !== null;
  const canEdit = isOwner || isAdmin || inventory.isPublic || inAccessList;

  return { canView: true, canEdit, isOwner, isAdmin };
}

// Формат custom ID хранится как JSON-строка в Inventory.
// Если формат повреждён, маршрут откатывается к безопасному дефолту.
function parseCustomIdFormat(rawFormat) {
  try {
    const parsed = JSON.parse(rawFormat);
    return Array.isArray(parsed) && parsed.length ? parsed : [{ type: 'text', value: 'INV-' }, { type: 'r6' }];
  } catch {
    return [{ type: 'text', value: 'INV-' }, { type: 'r6' }];
  }
}

// Генерация custom ID выполняется только при создании item.
// При последующем изменении формата существующие идентификаторы не пересчитываются.
async function generateCustomId(inventory) {
  const formatElements = parseCustomIdFormat(inventory.customIdFormat);
  const now = new Date();
  const sequence = (await Item.count({ where: { inventoryId: inventory.id } })) + 1;

  const parts = formatElements.map((element) => {
    switch (element.type) {
      case 'text':
        return String(element.value || '');
      case 'rand20':
        return String(crypto.randomInt(0, 2 ** 20)).padStart(7, '0');
      case 'rand32':
        return String(crypto.randomInt(0, 2 ** 31)).padStart(10, '0');
      case 'r6':
        return String(crypto.randomInt(100000, 1000000));
      case 'r9':
        return String(crypto.randomInt(100000000, 1000000000));
      case 'guid':
        return crypto.randomUUID();
      case 'datetime':
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      case 'seq': {
        const width = Number(element.width || 0);
        return width > 0 ? String(sequence).padStart(width, '0') : String(sequence);
      }
      default:
        return '';
    }
  });

  return parts.join('');
}

// Поиск объединяет полнотекстовый запрос PostgreSQL, ILIKE и совпадения по тегам.
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json([]);

    const tagSubquery = literal(
      `EXISTS (SELECT 1 FROM "InventoryTags" it JOIN "Tags" t ON t.id = it."tagId" WHERE it."inventoryId" = "Inventory"."id" AND t."name" ILIKE ${Inventory.sequelize.escape('%' + q + '%')})`
    );

    const inventories = await Inventory.findAll({
      where: {
        [Op.or]: [
          literal(`to_tsvector('simple', coalesce("Inventory"."title", '') || ' ' || coalesce("Inventory"."description", '')) @@ plainto_tsquery('simple', ${Inventory.sequelize.escape(q)})`),
          { title: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } },
          tagSubquery,
        ],
      },
      include: [
        { model: User, attributes: ['id', 'name'] },
        { model: Tag, attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    return res.json(inventories);
  } catch (error) {
    console.error('Error searching inventories:', error);
    return res.status(500).json({ error: 'Failed to search inventories' });
  }
});

router.get('/tags/cloud', async (_req, res) => {
  try {
    const tags = await Tag.findAll({
      attributes: [
        'id',
        'name',
        [fn('COUNT', col('Inventories.id')), 'usageCount'],
      ],
      include: [{
        model: Inventory,
        attributes: [],
        through: { attributes: [] },
        duplicating: false,
      }],
      group: ['Tag.id', 'Tag.name'],
      order: [[fn('COUNT', col('Inventories.id')), 'DESC']],
      limit: 50,
      subQuery: false,
    });

    return res.json(tags);
  } catch (error) {
    console.error('Error fetching tag cloud:', error);
    return res.status(500).json({ error: 'Failed to fetch tag cloud' });
  }
});

router.get('/users/suggest', requireAuth, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json([]);

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `${q}%` } },
          { email: { [Op.iLike]: `${q}%` } },
        ],
      },
      attributes: ['id', 'name', 'email'],
      limit: 20,
      order: [['name', 'ASC']],
    });

    return res.json(users);
  } catch (error) {
    console.error('Error suggesting users:', error);
    return res.status(500).json({ error: 'Failed to suggest users' });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/tags/suggest', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const where = q ? { name: { [Op.iLike]: `${q}%` } } : {};
    const tags = await Tag.findAll({ where, attributes: ['id', 'name'], order: [['name', 'ASC']], limit: 20 });
    return res.json(tags.map((t) => t.name));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const inventories = await Inventory.findAll({
      attributes: {
        include: [[fn('COUNT', col('Items.id')), 'itemsCount']],
      },
      include: [
        { model: User, attributes: ['id', 'name'] },
        { model: Item, attributes: [] },
      ],
      group: ['Inventory.id', 'User.id'],
      order: [['createdAt', 'DESC']],
    });

    const normalized = inventories.map((inventory) => ({
      id: inventory.id,
      title: inventory.title,
      description: inventory.description,
      imageUrl: inventory.imageUrl,
      isPublic: inventory.isPublic,
      categoryId: inventory.categoryId,
      itemsCount: Number(inventory.get('itemsCount')) || 0,
      owner: inventory.User,
      createdAt: inventory.createdAt,
    }));

    return res.json(normalized);
  } catch (error) {
    console.error('Error fetching inventories:', error);
    return res.status(500).json({ error: 'Failed to fetch inventories' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, categoryId, imageUrl, isPublic, tags, customIdFormat } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
    if (!description?.trim()) return res.status(400).json({ error: 'Description required' });

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) return res.status(400).json({ error: 'Category not found' });
    }

    const inventory = await Inventory.create({
      title: title.trim(),
      description: description.trim(),
      categoryId: categoryId || null,
      imageUrl: imageUrl || null,
      isPublic: Boolean(isPublic),
      customIdFormat: customIdFormat || '[{"type":"text","value":"INV-"},{"type":"r6"}]',
      ownerId: req.user.id,
      version: 1,
    });

    const safeTags = Array.isArray(tags)
      ? [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))]
      : [];

    if (safeTags.length > 0) {
      const existingTags = await Tag.findAll({ where: { name: { [Op.in]: safeTags } } });
      const existingTagNames = new Set(existingTags.map((tag) => tag.name));
      const missingTagNames = safeTags.filter((tagName) => !existingTagNames.has(tagName));

      if (missingTagNames.length > 0) {
        await Tag.bulkCreate(missingTagNames.map((tagName) => ({ name: tagName })), {
          ignoreDuplicates: true,
        });
      }

      const allTags = await Tag.findAll({ where: { name: { [Op.in]: safeTags } } });
      await inventory.addTags(allTags);
    }

    const createdInventory = await Inventory.findByPk(inventory.id, {
      include: [
        { model: Tag, through: { attributes: [] } },
        { model: User, attributes: ['id', 'name'] },
      ],
    });

    return res.status(201).json(createdInventory);
  } catch (error) {
    console.error('Error creating inventory:', error);
    return res.status(500).json({ error: 'Failed to create inventory' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await Inventory.findByPk(id, {
      include: [
        { model: Tag, through: { attributes: [] } },
        { model: User, attributes: ['id', 'name'] },
      ],
    });

    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });

    const userAccess = await getAccessFlags(inventory, req.user);

    return res.json({ inventory, userAccess });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Настройки инвентаря редактируют только owner и admin.
// Пользователи с write access не управляют полями, доступами и форматом ID.
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isPublic, imageUrl, categoryId, customIdFormat, version } = req.body;

    const inventory = await Inventory.findByPk(id);
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });

    const access = await getAccessFlags(inventory, req.user);
    if (!access.isOwner && !access.isAdmin) return res.status(403).json({ error: 'Forbidden' });

    if (version && Number(version) !== inventory.version) {
      return res.status(409).json({ error: 'Version conflict', currentVersion: inventory.version });
    }

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) return res.status(400).json({ error: 'Category not found' });
    }

    await inventory.update({
      title: title ?? inventory.title ,
      description: description ?? inventory.description,
      isPublic: typeof isPublic === 'boolean' ? isPublic : inventory.isPublic,
      imageUrl: imageUrl ?? inventory.imageUrl,
      categoryId: categoryId ?? inventory.categoryId,
      customIdFormat: customIdFormat ?? inventory.customIdFormat,
      version: inventory.version + 1,
    });

    return res.json(inventory);
  } catch (error) {
    console.error('Error updating inventory:', error);
    return res.status(500).json({ error: 'Failed to update inventory' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await Inventory.findByPk(id);
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });

    const access = await getAccessFlags(inventory, req.user);
    if (!access.isOwner && !access.isAdmin) return res.status(403).json({ error: 'Forbidden' });

    await inventory.destroy();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    return res.status(500).json({ error: 'Failed to delete inventory' });
  }
});

router.get('/:id/items', async (req, res) => {
  try {
    const inventoryId = req.params.id;

    const items = await Item.findAll({
      where: { inventoryId },
      include: [{ model: User, attributes: ['id', 'name'], foreignKey: 'createdBy' }],
      order: [['createdAt', 'DESC']],
    });

    const itemIds = items.map((item) => item.id);

    // Лайки считаются одним агрегирующим запросом, чтобы не делать N+1 по таблице ItemLike.
    const likeRows = itemIds.length
      ? await ItemLike.findAll({
          attributes: ['itemId', [fn('COUNT', col('id')), 'count']],
          where: { itemId: { [Op.in]: itemIds } },
          group: ['itemId'],
        })
      : [];

    const likeMap = new Map(likeRows.map((row) => [row.itemId, Number(row.get('count')) || 0]));

    // Состояние likedByMe тоже загружается пачкой для всех строк таблицы.
    let myLikeSet = new Set();
    if (req.user) {
      const myLikes = await ItemLike.findAll({
        attributes: ['itemId'],
        where: { itemId: { [Op.in]: itemIds }, userId: req.user.id },
      });
      myLikeSet = new Set(myLikes.map((row) => row.itemId));
    }

    const itemsWithLikes = items.map((item) => ({
      ...item.toJSON(),
      likesCount: likeMap.get(item.id) || 0,
      likedByMe: myLikeSet.has(item.id),
    }));

    const fields = await InventoryField.findAll({
      where: { inventoryId },
      order: [['order', 'ASC']],
    });

    return res.json({ items: itemsWithLikes, fields });
  } catch (error) {
    console.error('Error fetching items:', error);
    return res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// При создании item custom ID может прийти вручную или быть сгенерирован на сервере.
// Уникальность внутри инвентаря дополнительно контролируется индексом в БД.
router.post('/:id/items', requireAuth, async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const inventory = await Inventory.findByPk(inventoryId);
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });

    const access = await getAccessFlags(inventory, req.user);
    if (!access.canEdit) return res.status(403).json({ error: 'Forbidden' });

    const payload = { ...req.body };
    const generatedCustomId = await generateCustomId(inventory);
    const customId = String(payload.customId || generatedCustomId).trim();

    if (!customId || /\s/.test(customId)) {
      return res.status(400).json({ error: 'Invalid customId' });
    }

    const created = await Item.create({
      ...payload,
      inventoryId,
      customId,
      createdBy: req.user.id,
      version: 1,
    });

    return res.status(201).json(created);
  } catch (error) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Duplicate customId in this inventory' });
    }
    console.error('Error creating item:', error);
    return res.status(500).json({ error: 'Failed to create item' });
  }
});

// Optimistic locking для item защищает от silent overwrite,
// когда несколько пользователей редактируют одну и ту же запись параллельно.
router.put('/:id/items/:itemId', requireAuth, async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const { itemId } = req.params;
    const payload = { ...req.body };

    const inventory = await Inventory.findByPk(inventoryId);
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });

    const access = await getAccessFlags(inventory, req.user);
    if (!access.canEdit) return res.status(403).json({ error: 'Forbidden' });

    const item = await Item.findOne({ where: { id: itemId, inventoryId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (payload.version && Number(payload.version) !== item.version) {
      return res.status(409).json({ error: 'Version conflict', currentVersion: item.version });
    }

    if (payload.customId) {
      const customId = String(payload.customId).trim();
      if (!customId || /\s/.test(customId)) {
        return res.status(400).json({ error: 'Invalid customId' });
      }
    }

    await item.update({
      ...payload,
      version: item.version + 1,
    });

    return res.json(item);
  } catch (error) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Duplicate customId in this inventory' });
    }
    console.error('Error updating item:', error);
    return res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id/items/:itemId', requireAuth, async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const { itemId } = req.params;

    const inventory = await Inventory.findByPk(inventoryId);
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });

    const access = await getAccessFlags(inventory, req.user);
    if (!access.canEdit) return res.status(403).json({ error: 'Forbidden' });

    const item = await Item.findOne({ where: { id: itemId, inventoryId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    await item.destroy();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return res.status(500).json({ error: 'Failed to delete item' });
  }
});

router.get('/:id/fields', async (req, res) => {
  try {
    const fields = await InventoryField.findAll({
      where: { inventoryId: req.params.id },
      order: [['order', 'ASC']],
    });

    return res.json(fields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    return res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Поля инвентаря описывают отображение фиксированных колонок Item,
// а не создают новую схему таблицы на лету.
router.post('/:id/fields', requireAuth, async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const { fieldType, title, description, showInTable } = req.body;

    const inventory = await Inventory.findByPk(inventoryId);
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });

    const access = await getAccessFlags(inventory, req.user);
    if (!access.isOwner && !access.isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const typeCount = await InventoryField.count({ where: { inventoryId, fieldType } });
    if (typeCount >= 3) {
      return res.status(400).json({ error: `Limit reached for field type: ${fieldType}` });
    }

    // Ищем свободный slot по индексу, потому что после удаления count уже не отражает занятые позиции.
    const existingFields = await InventoryField.findAll({
      where: { inventoryId, fieldType },
      attributes: ['fieldIndex'],
    });
    const usedIndices = new Set(existingFields.map((f) => f.fieldIndex));
    const fieldIndex = [0, 1, 2].find((i) => !usedIndices.has(i));
    if (fieldIndex === undefined) {
      return res.status(400).json({ error: `Limit reached for field type: ${fieldType}` });
    }
    // order хранится отдельно и определяет порядок в форме и таблице.
    const totalCount = await InventoryField.count({ where: { inventoryId } });
    const order = totalCount + 1;

    const created = await InventoryField.create({
      inventoryId,
      fieldType,
      fieldIndex,
      order,
      title,
      description,
      showInTable: showInTable !== undefined ? Boolean(showInTable) : true,
    });

    return res.status(201).json(created);
  } catch (error) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Field with this type/index already exists' });
    }
    console.error('Error creating field:', error);
    return res.status(500).json({ error: 'Failed to create field' });
  }
});

router.put('/:id/fields/:fieldId', requireAuth, async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const { fieldId } = req.params;

    const inventory = await Inventory.findByPk(inventoryId);
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });

    const access = await getAccessFlags(inventory, req.user);
    if (!access.isOwner && !access.isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const field = await InventoryField.findOne({ where: { id: fieldId, inventoryId } });
    if (!field) return res.status(404).json({ error: 'Field not found' });

    await field.update({ ...req.body });
    return res.json(field);
  } catch (error) {
    console.error('Error updating field:', error);
    return res.status(500).json({ error: 'Failed to update field' });
  }
});

router.delete('/:id/fields/:fieldId', requireAuth, async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const { fieldId } = req.params;

    const inventory = await Inventory.findByPk(inventoryId);
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });

    const access = await getAccessFlags(inventory, req.user);
    if (!access.isOwner && !access.isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const field = await InventoryField.findOne({ where: { id: fieldId, inventoryId } });
    if (!field) return res.status(404).json({ error: 'Field not found' });

    await field.destroy();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting field:', error);
    return res.status(500).json({ error: 'Failed to delete field' });
  }
});

router.get('/:id/access', requireAuth, async (req, res) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id);
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });

    const access = await getAccessFlags(inventory, req.user);
    if (!access.isOwner && !access.isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const users = await User.findAll({
      include: [{
        model: Inventory,
        through: { attributes: [] },
        where: { id: inventory.id },
      }],
      attributes: ['id', 'name', 'email'],
      order: [['name', 'ASC']],
    });

    return res.json(users);
  } catch (error) {
    console.error('Error fetching access list:', error);
    return res.status(500).json({ error: 'Failed to fetch access list' });
  }
});

// Access list заменяется целиком, чтобы клиент мог отправлять финальное состояние списка.
router.put('/:id/access', requireAuth, async (req, res) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id);
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });

    const access = await getAccessFlags(inventory, req.user);
    if (!access.isOwner && !access.isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const userIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];

    await InventoryAccess.destroy({ where: { inventoryId: inventory.id } });

    if (userIds.length > 0) {
      await InventoryAccess.bulkCreate(
        userIds
          .filter((userId) => userId !== inventory.ownerId)
          .map((userId) => ({ inventoryId: inventory.id, userId }))
      );
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating access list:', error);
    return res.status(500).json({ error: 'Failed to update access list' });
  }
});

router.get('/:id/discussions', async (req, res) => {
  try {
    const comments = await Discussion.findAll({
      where: { inventoryId: req.params.id },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']],
    });

    return res.json(comments);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return res.status(500).json({ error: 'Failed to fetch discussions' });
  }
});

// Discussion поддерживает и обычный HTTP POST, и доставку через Socket.IO.
// Это позволяет сохранить работоспособность даже без активного сокет-соединения.
router.post('/:id/discussions', requireAuth, async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Text required' });

    const created = await Discussion.create({
      inventoryId: req.params.id,
      userId: req.user.id,
      text,
    });

    const payload = await Discussion.findByPk(created.id, {
      include: [{ model: User, attributes: ['id', 'name'] }],
    });

    return res.status(201).json(payload);
  } catch (error) {
    console.error('Error creating discussion comment:', error);
    return res.status(500).json({ error: 'Failed to create discussion comment' });
  }
});

router.get('/:id/items/:itemId/likes', async (req, res) => {
  try {
    const { itemId } = req.params;
    const count = await ItemLike.count({ where: { itemId } });

    let likedByMe = false;
    if (req.user) {
      const mine = await ItemLike.findOne({ where: { itemId, userId: req.user.id } });
      likedByMe = Boolean(mine);
    }

    return res.json({ count, likedByMe });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

// Один пользователь может иметь не более одного лайка на item.
// Повторный POST работает как toggle.
router.post('/:id/items/:itemId/likes', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;

    const existing = await ItemLike.findOne({ where: { itemId, userId: req.user.id } });
    if (existing) {
      await existing.destroy();
      const count = await ItemLike.count({ where: { itemId } });
      return res.json({ count, likedByMe: false });
    }

    await ItemLike.create({ itemId, userId: req.user.id });
    const count = await ItemLike.count({ where: { itemId } });

    return res.status(201).json({ count, likedByMe: true });
  } catch (error) {
    console.error('Error toggling like:', error);
    return res.status(500).json({ error: 'Failed to toggle like' });
  }
});

module.exports = router;
