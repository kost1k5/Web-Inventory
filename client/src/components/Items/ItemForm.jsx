
import { Form, Input, Button, InputNumber, Checkbox, Typography } from 'antd';

export function ItemForm({ fields = [], onSubmit, initialValues }) {
  const [form] = Form.useForm();
  
  const handleSubmit = (values) => {
    onSubmit(values);
  };

  // Маппинг fieldType в название столбца БД
  // Например: type='text', index=0 → 'textField1'
  const getFieldName = (fieldType, fieldIndex) => {
  const typeMap = {
    'text': 'textField',
    'multiline': 'textareaField',
    'number': 'numberField',
    'document': 'documentField',
    'checkbox': 'booleanField',
  };
  return `${typeMap[fieldType]}${fieldIndex + 1}`;
};

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={initialValues}>

      {/* customId — всегда присутствует, редактируемый */}
      <Form.Item
        label="Custom ID"
        name="customId"
        tooltip="Оставьте пустым — ID сгенерируется автоматически"
      >
        <Input placeholder="Будет сгенерирован автоматически" />
      </Form.Item>

      {/* Кастомные поля, заданные во вкладке Fields */}
      {fields.length === 0 && (
        <Typography.Text type="secondary">
          Нет кастомных полей. Добавьте поля во вкладке «Fields».
        </Typography.Text>
      )}

      {fields.map(field => (
        <Form.Item
          key={field.id}
          label={field.title}
          name={getFieldName(field.fieldType, field.fieldIndex)}
          tooltip={field.description || undefined}
        >
          {field.fieldType === 'text' && <Input />}
          {field.fieldType === 'multiline' && <Input.TextArea rows={3} />}
          {field.fieldType === 'number' && <InputNumber style={{ width: '100%' }} />}
          {field.fieldType === 'document' && <Input placeholder="URL документа" />}
          {field.fieldType === 'checkbox' && <Checkbox />}
        </Form.Item>
      ))}

      <Button type="primary" htmlType="submit" style={{ marginTop: 8 }}>
        Сохранить
      </Button>
    </Form>
  );
}