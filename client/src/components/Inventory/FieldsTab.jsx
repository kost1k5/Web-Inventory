import { useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Flex, Form, Input, Modal, Select, Switch, Tag, Tooltip, Typography, theme } from 'antd';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeleteOutlined, HolderOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';

const fieldTypes = ['text', 'multiline', 'number', 'document', 'checkbox'];

const fieldTypeColor = {
  text: 'blue',
  multiline: 'cyan',
  number: 'green',
  document: 'orange',
  checkbox: 'purple',
};

function SortableField({ field, disabled, onToggle, onRemove }) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id, disabled });

  const containerStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    padding: '10px 16px',
    background: token.colorBgContainer,
    marginBottom: 8,
    cursor: disabled ? 'default' : 'grab',
  };



  return (
    <div ref={setNodeRef} style={containerStyle}>
      <Flex justify="space-between" align="center" wrap="wrap" gap="small">
        <Flex align="center" gap="small">
          <HolderOutlined
            {...attributes}
            {...listeners}
            style={{ color: token.colorTextTertiary, fontSize: 16, cursor: disabled ? 'not-allowed' : 'grab' }}
          />
          <Tag color={fieldTypeColor[field.fieldType] || 'default'}>
            {t(`fieldType.${field.fieldType}`) || field.fieldType}
          </Tag>
          <Typography.Text strong>{field.title}</Typography.Text>
          {field.description && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>— {field.description}</Typography.Text>
          )}
        </Flex>

        <Flex align="center" gap="small">
          <Tooltip title={field.showInTable ? t('fields.showTooltip') : t('fields.hideTooltip')}>
            <Switch
              checked={field.showInTable}
              onChange={() => onToggle(field)}
              disabled={disabled}
              checkedChildren={<EyeOutlined />}
              unCheckedChildren={<EyeInvisibleOutlined />}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t('fields.deleteTooltip')}>
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              onClick={(e) => { e.stopPropagation(); onRemove(field.id); }}
              disabled={disabled}
            />
          </Tooltip>
        </Flex>
      </Flex>
    </div>
  );
}

export function FieldsTab({ inventoryId, canManage, onFieldsChange }) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [fields, setFields] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Вкладка читает текущее описание полей из InventoryField,
  // а не пытается восстановить его из существующих item'ов.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await api.fields.getByInventoryId(inventoryId);
        if (active) setFields(data);
      } catch (error) {
        if (active) message.error(error.message);
      }
    })();

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryId]);

  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order),
    [fields]
  );

  const reload = async () => {
    const data = await api.fields.getByInventoryId(inventoryId);
    setFields(data);
  };

  const handleCreate = async (values) => {
    try {
      await api.fields.create(inventoryId, values);
      setOpen(false);
      form.resetFields();
      await reload();
      onFieldsChange?.();
      message.success(t('fields.added'));
    } catch (error) {
      message.error(error.message);
    }
  };

  const toggleShowInTable = async (field) => {
    if (!canManage) return;
    try {
      await api.fields.update(inventoryId, field.id, { showInTable: !field.showInTable });
      await reload();
      onFieldsChange?.();
    } catch (error) {
      message.error(error.message);
    }
  };

  const removeField = async (fieldId) => {
    if (!canManage) return;
    try {
      await api.fields.delete(inventoryId, fieldId);
      await reload();
      onFieldsChange?.();
    } catch (error) {
      message.error(error.message);
    }
  };

  // reorder меняет только presentation order и не затрагивает fieldIndex.
  // Это важно: fieldIndex привязан к физической колонке Item.
  const onDragEnd = async (event) => {
    if (!canManage) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedFields.findIndex((field) => field.id === active.id);
    const newIndex = sortedFields.findIndex((field) => field.id === over.id);
    const moved = arrayMove(sortedFields, oldIndex, newIndex).map((field, index) => ({ ...field, order: index + 1 }));

    setFields(moved);

    try {
      await Promise.all(
        moved.map((field) => api.fields.update(inventoryId, field.id, { order: field.order }))
      );
      message.success(t('fields.orderSaved'));
    } catch (error) {
      message.error(error.message);
      await reload();
    }
  };

  return (
    <Card title={t('fields.title')}>
      <Flex vertical gap="middle">
        <Flex gap="small" align="center">
          <Button type="primary" disabled={!canManage} onClick={() => setOpen(true)}>
            {t('fields.add')}
          </Button>
          <Typography.Text type="secondary">{t('fields.dragHint')}</Typography.Text>
        </Flex>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sortedFields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
            {sortedFields.map((field) => (
              <SortableField
                key={field.id}
                field={field}
                disabled={!canManage}
                onToggle={toggleShowInTable}
                onRemove={removeField}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Flex>

      <Modal title={t('fields.modal.title')} open={open} onCancel={() => { setOpen(false); form.resetFields(); }} footer={null} destroyOnClose>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ fieldType: 'text', showInTable: true }}
        >
          <Form.Item label={t('fields.name')} name="title" rules={[{ required: true, message: 'Введите название' }]}>
            <Input placeholder={t('fields.namePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('fields.desc')} name="description">
            <Input.TextArea rows={2} placeholder={t('fields.descPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('fields.type')} name="fieldType" rules={[{ required: true }]}>
            <Select
              options={fieldTypes.map((value) => ({
                value,
                label: <><Tag color={fieldTypeColor[value]}>{t(`fieldType.${value}`)}</Tag></>,
              }))}
            />
          </Form.Item>
          <Form.Item label={t('fields.showInTable')} name="showInTable" valuePropName="checked">
            <Switch checkedChildren={<EyeOutlined />} unCheckedChildren={<EyeInvisibleOutlined />} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>{t('fields.addBtn')}</Button>
        </Form>
      </Modal>
    </Card>
  );
}
