import {Form, Input, Switch, Button} from 'antd'; 
import { useEffect, useState } from 'react';  

export function InventorySetting({ inventory, onSave, onDraftChange, readOnly = false }) 
{
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Форма редактирует только базовые настройки.
    // Доступы, поля и custom ID вынесены в отдельные вкладки.
    useEffect(()=>{
        form.setFieldsValue({
            title: inventory.title,
            description: inventory.description,
            isPublic: inventory.isPublic,
        })
    }, [inventory, form]);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await onSave(values);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
            } }

    return(
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={(_, allValues) => onDraftChange?.(allValues)}
        >
            <Form.Item label="Название" name="title" rules={[{ required: true, message: 'Введите название' }]}>
                <Input disabled={readOnly} />
            </Form.Item>
            <Form.Item label="Описание" name="description">
                <Input.TextArea rows={4} disabled={readOnly} />
            </Form.Item>
            <Form.Item label="Публичный" name="isPublic" valuePropName="checked">
                <Switch disabled={readOnly} />
            </Form.Item>
            {!readOnly && <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                    Сохранить
                </Button>
            </Form.Item>}
                </Form>
    )
}