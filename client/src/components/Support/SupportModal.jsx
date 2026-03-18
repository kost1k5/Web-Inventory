
import { Modal, Button, Form, Input, Select, App } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';



export default function SupportModal({ open, onClose }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const location = useLocation();
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const priorities = [
      { value: 'High', label: t('support.priorityHigh') },
      { value: 'Average', label: t('support.priorityAverage') },
      { value: 'Low', label: t('support.priorityLow') },
    ];

    const handleFinish = async (values) => {
      if (!user) {
        message.warning(t('support.loginRequired'));
        return;
      }

      // Достаём inventoryId из URL если открыта страница инвентаря
      const match = location.pathname.match(/^\/inventories\/([^/]+)/);
      const inventoryId = match ? match[1] : undefined;

      try {
        await api.support.createTicket({
          summary: values.summary,
          priority: values.priority,
          link: window.location.href,
          inventoryId,
        });
        message.success(t('support.success'));
        form.resetFields();
        onClose();
      } catch (e) {
        message.error(e.message);
      }
    };

   return(
    <Modal title={t('support.modalTitle')} open={open} onCancel={onClose} footer={null} destroyOnClose>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ priority: 'Average' }}
          onFinish={handleFinish}
        >
          <Form.Item label={t('support.summary')} name="summary" rules={[{ required: true, message: 'Опишите вашу проблему' }]}>
            <Input placeholder={t('support.summaryPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('support.priority')} name="priority" rules={[{ required: true }]}>
            <Select options={priorities} />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button onClick={onClose}>{t('support.cancel')}</Button>
            <Button type="primary" htmlType="submit">{t('support.submit')}</Button>
          </div>
        </Form>
      </Modal>)
        }
