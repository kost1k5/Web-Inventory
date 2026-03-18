import { useMemo, useRef, useState } from 'react';
import { Alert, App, Button, Card, Flex, Input, InputNumber, Space, Tag, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const palette = [
  { type: 'text', label: 'Text', defaultValue: 'INV-' },
  { type: 'r6', label: 'Random 6 digits' },
  { type: 'r9', label: 'Random 9 digits' },
  { type: 'rand20', label: 'Random 20-bit' },
  { type: 'rand32', label: 'Random 32-bit' },
  { type: 'guid', label: 'GUID' },
  { type: 'datetime', label: 'Date/Time' },
  { type: 'seq', label: 'Sequence' },
];

// Элемент формата ID редактируется локально и сериализуется в JSON только при сохранении.
function SortableElement({ element, onRemove, onChange, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: element.id, disabled });
  const { token } = theme.useToken();
  const { t } = useTranslation();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 8,
    padding: 8,
    background: token.colorBgContainer,
    minWidth: 140,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Flex vertical gap={6}>
        <Typography.Text strong>{element.type}</Typography.Text>

        {element.type === 'text' && (
          <Input
            size="small"
            value={element.value || ''}
            onChange={(event) => onChange(element.id, { value: event.target.value })}
            disabled={disabled}
          />
        )}

        {element.type === 'seq' && (
          <InputNumber
            size="small"
            min={0}
            max={12}
            value={Number(element.width || 0)}
            onChange={(value) => onChange(element.id, { width: Number(value || 0) })}
            disabled={disabled}
          />
        )}

        {!disabled && (
          <Button danger size="small" onClick={() => onRemove(element.id)}>
            {t('customId.remove')}
          </Button>
        )}
      </Flex>
    </div>
  );
}

// Preview показывает будущую структуру ID без обращения к серверу.
function buildPreview(elements) {
  const now = new Date();
  let seq = 12;

  return elements
    .map((element) => {
      switch (element.type) {
        case 'text':
          return String(element.value || '');
        case 'r6':
          return '123456';
        case 'r9':
          return '123456789';
        case 'rand20':
          return '000524287';
        case 'rand32':
          return '2147483647';
        case 'guid':
          return '550e8400-e29b-41d4-a716-446655440000';
        case 'datetime':
          return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        case 'seq':
          return Number(element.width || 0) > 0 ? String(seq).padStart(Number(element.width), '0') : String(seq);
        default:
          return '';
      }
    })
    .join('');
}

export function CustomIdTab({ inventory, onSave, readOnly = false }) {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  // В UI храним служебный id для drag-and-drop.

  const [elements, setElements] = useState(() => {
    try {
      const parsed = JSON.parse(inventory?.customIdFormat || '[]');
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((element, index) => ({ ...element, id: `el-${index}-${element.type}` }));
      }
    } catch {
      //формат невалидный, начинаем с дефолтного шаблона.
    }
    return [{ id: 'default-1', type: 'text', value: 'INV-' }, { id: 'default-2', type: 'r6' }];
  });
  const nextIdRef = useRef(1);

  const preview = useMemo(() => buildPreview(elements), [elements]);

  // Палитра задаёт допустимые типы сегментов custom ID.
  const addElement = (descriptor) => {
    if (readOnly) return;

    const next = {
      id: `el-${nextIdRef.current++}`,
      type: descriptor.type,
      ...(descriptor.type === 'text' ? { value: descriptor.defaultValue || '' } : {}),
      ...(descriptor.type === 'seq' ? { width: 0 } : {}),
    };

    setElements((prev) => [...prev, next]);
  };

  const removeElement = (id) => {
    if (readOnly) return;
    setElements((prev) => prev.filter((element) => element.id !== id));
  };

  const updateElement = (id, patch) => {
    if (readOnly) return;
    setElements((prev) => prev.map((element) => (element.id === id ? { ...element, ...patch } : element)));
  };

 
  const onDragEnd = (event) => {
    if (readOnly) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setElements((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  
  const saveFormat = async () => {
    try {
      const payload = elements.map((element) => {
        const copy = { ...element };
        delete copy.id;
        return copy;
      });
      await onSave({ customIdFormat: JSON.stringify(payload) });
      message.success(t('customId.saved') || 'Custom ID format saved');
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <Card title="Custom ID Format">
      <Flex vertical gap="middle">
        <Alert
          type="info"
          showIcon
          description={t('customId.hint') || 'Add elements, reorder via drag-and-drop, then save the format.'}
        />

        <Space wrap>
          {palette.map((descriptor) => (
            <Tag
              key={descriptor.type}
              color="blue"
              style={{ cursor: readOnly ? 'not-allowed' : 'pointer', marginBottom: 8 }}
              onClick={() => addElement(descriptor)}
            >
              + {descriptor.label}
            </Tag>
          ))}
        </Space>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={elements.map((element) => element.id)} strategy={horizontalListSortingStrategy}>
            <Space wrap style={{ width: '100%' }}>
              {elements.map((element) => (
                <SortableElement
                  key={element.id}
                  element={element}
                  onRemove={removeElement}
                  onChange={updateElement}
                  disabled={readOnly}
                />
              ))}
            </Space>
          </SortableContext>
        </DndContext>

        <Typography.Text strong>Preview: {preview || '-'}</Typography.Text>

        {!readOnly && (
          <Button type="primary" onClick={saveFormat}>
            {t('customId.save') || 'Save Format'}
          </Button>
        )}
      </Flex>
    </Card>
  );
}
