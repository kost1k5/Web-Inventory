import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Flex,
  Modal,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  App,
} from 'antd';
import { CheckOutlined, CloseOutlined, HeartFilled, HeartOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ItemsToolbar } from '../components/Items/ItemsToolbar';
import { ItemForm } from '../components/Items/ItemForm';
import { InventorySetting } from '../components/Inventory/InventorySetting';
import { DiscussionTab } from '../components/Discussion/DiscussionTab';
import { AccessTab } from '../components/Inventory/AccessTab';
import { FieldsTab } from '../components/Inventory/FieldsTab';
import { StatsTab } from '../components/Inventory/StatsTab';
import { CustomIdTab } from '../components/Inventory/CustomIdTab';

export function InventoryDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const [inventory, setInventory] = useState(null);
  const [userAccess, setUserAccess] = useState(null);
  const [items, setItems] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [settingsDraft, setSettingsDraft] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const autosaveTimerRef = useRef(null);

  // Управление инвентарём шире, чем обычный write access:
  // owner/admin редактируют настройки, поля, доступы и custom ID.
  const canManageInventory = Boolean(userAccess?.isOwner || userAccess?.isAdmin || user?.isAdmin);

  // Поля используются и в таблице items, и в форме редактирования элемента.
  const loadFields = useCallback(async () => {
    try {
      const data = await api.fields.getByInventoryId(id);
      setFields(data || []);
    } catch (error) {
      message.error(error.message);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      // Страница собирается из двух источников: metadata инвентаря и списка item'ов.
      const inventoryData = await api.inventories.getById(id);
      setInventory(inventoryData.inventory);
      setUserAccess(inventoryData.userAccess);

      const itemsData = await api.items.getByInventoryId(id);
      setItems(itemsData.items || []);
      setFields(itemsData.fields || []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  // message is stable from App.useApp()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleAddItem = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleDeleteItems = async () => {
    if (!selectedRowKeys.length) return;

    try {
      await Promise.all(selectedRowKeys.map((itemId) => api.items.delete(id, itemId)));
      const itemsData = await api.items.getByInventoryId(id);
      setItems(itemsData.items || []);
      setSelectedRowKeys([]);
      message.success('Элементы удалены');
    } catch (error) {
      message.error(error.message);
    }
  };

  // Лайк обновляется локально без полного reload таблицы.
  const handleToggleLike = useCallback(async (itemId) => {
    if (!user) return;
    try {
      const result = await api.items.toggleLike(id, itemId);
      setItems((prev) => prev.map((item) =>
        item.id === itemId
          ? { ...item, likesCount: result.count, likedByMe: result.likedByMe }
          : item
      ));
    } catch (error) {
      message.error(error.message);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // Форма item работает в двух режимах: create и edit.
  const handleSaveItem = async (values) => {
    try {
      if (editingItem) {
        await api.items.update(id, editingItem.id, {
          ...values,
          version: editingItem.version,
        });
      } else {
        await api.items.create(id, values);
      }

      const itemsData = await api.items.getByInventoryId(id);
      setItems(itemsData.items || []);
      setModalOpen(false);
      message.success('Элемент сохранён');
    } catch (error) {
      message.error(error.message);
    }
  };

  // Настройки инвентаря сохраняются через optimistic locking.
  const handleSaveSettings = useCallback(async (values, silent = false) => {
    if (!inventory) return;

    try {
      const updated = await api.inventories.update(id, values, inventory.version);
      setInventory(updated);
      setSettingsDraft(values);
      setIsDirty(false);
      if (!silent) message.success('Инвентарь обновлён');
    } catch (error) {
      if (error.message.includes('Version conflict')) {
        message.error('Конфликт версий. Данные обновлены с сервера.');
        await loadPage();
      } else {
        message.error(error.message);
      }
    }
  }, 
  // message is stable from App.useApp()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [id, inventory, loadPage]);

  // Автосохранение запускается только для управляемых настроек инвентаря.
  // Для item'ов по ТЗ достаточно явного сохранения.
  useEffect(() => {
    if (!canManageInventory) return;
    if (!isDirty || !settingsDraft) return;

    autosaveTimerRef.current = setInterval(async () => {
      if (isAutosaving) return;
      setIsAutosaving(true);
      await handleSaveSettings(settingsDraft, true);
      setIsAutosaving(false);
    }, 8000);

    return () => clearInterval(autosaveTimerRef.current);
  }, [isDirty, settingsDraft, canManageInventory, isAutosaving, handleSaveSettings]);

  // Колонки таблицы строятся динамически из конфигурации InventoryField.
  const columns = useMemo(() => {
    const typeMap = {
      text: 'textField',
      multiline: 'textareaField',
      number: 'numberField',
      document: 'documentField',
      checkbox: 'booleanField',
    };

    const fieldColumns = fields
      .filter((f) => f.showInTable)
      .sort((a, b) => a.order - b.order)
      .map((field) => ({
        title: field.title,
        key: `${field.fieldType}-${field.fieldIndex}`,
        dataIndex: `${typeMap[field.fieldType]}${field.fieldIndex + 1}`,
        ellipsis: true,
        render: (value) => {
          if (field.fieldType === 'checkbox')
            return value
              ? <CheckOutlined style={{ color: '#52c41a' }} />
              : <CloseOutlined style={{ color: '#ff4d4f' }} />;
          if (field.fieldType === 'document' && value)
            return <a href={value} target="_blank" rel="noreferrer">Ссылка</a>;
          return value ?? <Typography.Text type="secondary">—</Typography.Text>;
        },
      }));

    return [
      {
        title: t('items.customId'),
        dataIndex: 'customId',
        key: 'customId',
        width: 160,
        sorter: (a, b) => (a.customId || '').localeCompare(b.customId || ''),
        render: (text) => <Typography.Text code>{text}</Typography.Text>,
      },
      ...fieldColumns,
      {
        title: t('col.author'),
        dataIndex: ['User', 'name'],
        key: 'createdBy',
        width: 150,
        ellipsis: true,
      },
      {
        title: <HeartFilled style={{ color: '#ff4d4f' }} />,
        key: 'likes',
        align: 'center',
        width: 80,
        sorter: (a, b) => (a.likesCount || 0) - (b.likesCount || 0),
        render: (_, record) => (
          <Button
            type="text"
            size="small"
            icon={
              record.likedByMe
                ? <HeartFilled style={{ color: '#ff4d4f' }} />
                : <HeartOutlined style={{ color: '#ff7875' }} />
            }
            onClick={(e) => { e.stopPropagation(); handleToggleLike(record.id); }}
            disabled={!user}
            style={{ padding: '0 4px' }}
          >
            {record.likesCount > 0 && (
              <Typography.Text style={{ fontSize: 12 }}>{record.likesCount}</Typography.Text>
            )}
          </Button>
        ),
      },
      {
        title: t('items.addedAt'),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 120,
        render: (date) => new Date(date).toLocaleDateString('ru-RU'),
        sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      },
    ];
  }, [fields, handleToggleLike, user, t]);

  if (loading) return <Flex justify="center" align="center" style={{ minHeight: 300 }}><Spin indicator={<LoadingOutlined spin />} size="large" /></Flex>;
  if (!inventory) return <Typography.Text type="secondary">{t('items.empty')}</Typography.Text>;

  // Набор вкладок зависит от роли пользователя, но структура страницы остаётся единой.
  const tabs = [
    {
      key: 'items',
      label: t('tab.items'),
      children: (
        <>
          <ItemsToolbar
            userAccess={userAccess}
            onAddItem={handleAddItem}
            selectedItems={selectedRowKeys}
            items={items}
            onDeleteSelected={handleDeleteItems}
            onSelectAll={() => setSelectedRowKeys(items.map((i) => i.id))}
            onDeselectAll={() => setSelectedRowKeys([])}
          />

          <Table
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            dataSource={items}
            rowKey="id"
            columns={columns}
            size="middle"
            pagination={{ pageSize: 20, showTotal: (total) => t('col.total', { count: total }) }}
            locale={{ emptyText: t('items.empty') }}
            footer={userAccess?.canEdit ? () => (
              <Typography.Text type="secondary">{t('items.editHint')}</Typography.Text>
            ) : undefined}
            onRow={(record) => ({
              onDoubleClick: () => {
                if (!userAccess?.canEdit) return;
                setEditingItem(record);
                setModalOpen(true);
              },
              style: userAccess?.canEdit ? { cursor: 'pointer' } : undefined,
            })}
          />
        </>
      ),
    },
    {
      key: 'discussion',
      label: t('tab.discussion'),
      children: <DiscussionTab inventoryId={id} user={user} />,
    },
    {
      key: 'settings',
      label: t('tab.settings'),
      children: (
        <InventorySetting
          inventory={inventory}
          onSave={(values) => handleSaveSettings(values, false)}
          onDraftChange={(draft) => {
            setSettingsDraft(draft);
            setIsDirty(true);
          }}
          readOnly={!canManageInventory}
        />
      ),
    },
    {
      key: 'stats',
      label: t('tab.stats'),
      children: <StatsTab items={items} fields={fields} />,
    },
  ];

  if (canManageInventory) {
    tabs.splice(3, 0, {
      key: 'customIds',
      label: t('tab.customIds'),
      children: (
        <CustomIdTab
          key={`custom-id-${inventory.id}-${inventory.version}`}
          inventory={inventory}
          onSave={(values) => handleSaveSettings(values, false)}
          readOnly={!canManageInventory}
        />
      ),
    });

    tabs.splice(4, 0, {
      key: 'access',
      label: t('tab.access'),
      children: <AccessTab inventoryId={id} canManage={canManageInventory} />,
    });

    tabs.splice(5, 0, {
      key: 'fields',
      label: t('tab.fields'),
      children: <FieldsTab inventoryId={id} canManage={canManageInventory} onFieldsChange={loadFields} />
    });
  }

  return (
    <div>
      <Typography.Title level={2}>{inventory.title}</Typography.Title>

      <Card style={{ marginBottom: 24 }}>
        <Flex gap="large" align="flex-start">
          {inventory.imageUrl && (
            <img
              src={inventory.imageUrl}
              alt={inventory.title}
              style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
            />
          )}
        <Flex vertical gap="small" style={{ flex: 1 }}>
          {inventory.description && (
            <div>
              <Typography.Text strong>{t('col.description')}:</Typography.Text>
              <p style={{ margin: '4px 0 0' }}>{inventory.description}</p>
            </div>
          )}

          {inventory.Tags?.length > 0 && (
            <div>
              <Typography.Text strong>{t('settings.tags')}: </Typography.Text>
              {inventory.Tags.map((tag) => <Tag key={tag.id} color="blue">{tag.name}</Tag>)}
            </div>
          )}

          {inventory.User && (
            <Typography.Text>
              <strong>{t('col.author')}:</strong> {inventory.User.name}
            </Typography.Text>
          )}

          {isAutosaving && <Typography.Text type="secondary">{t('settings.saving')}</Typography.Text>}
          {!isAutosaving && isDirty && canManageInventory && (
            <Typography.Text type="warning">{t('settings.saved')} — autosave in 8s</Typography.Text>
          )}
        </Flex>
        </Flex>
      </Card>

      <Modal
        title={editingItem ? t('items.editItem') : t('items.addItem')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <ItemForm fields={fields} onSubmit={handleSaveItem} initialValues={editingItem || {}} />
      </Modal>

      <Tabs items={tabs} />
    </div>
  );
}
