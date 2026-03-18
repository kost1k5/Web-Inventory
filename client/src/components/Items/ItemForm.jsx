
import { Form, Input, Button, InputNumber, Checkbox, Typography } from 'antd';

export function ItemForm({ fields = [], onSubmit, initialValues }) {
  const [form] = Form.useForm();
  
  const handleSubmit = (values) => {
    onSubmit(values);
  };

  // fieldType/fieldIndex определяют, в какую фиксированную колонку Item попадёт значение.
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

      {/* customId относится к фиксированным системным полям item. */}
      <Form.Item
        label="Custom ID"
        name="customId"
        tooltip="Оставьте пустым — ID сгенерируется автоматически"
      >
        <Input placeholder="Будет сгенерирован автоматически" />
      </Form.Item>

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
          valuePropName={field.fieldType === 'checkbox' ? 'checked' : 'value'}
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