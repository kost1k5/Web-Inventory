
import { Modal, Button, Form, Input, Select,Tag } from 'antd';
import { useTranslation } from 'react-i18next';



export default function SupportModal({ open, onClose }) {
    const { t } = useTranslation();
    const priorities = [
  { value: 'High', label: t('support.priorityHigh') },
  { value: 'Average', label: t('support.priorityAverage') },
  { value: 'Low', label: t('support.priorityLow') },
];
    const [form] = Form.useForm();
    
   return(<Modal title={t('support.modalTitle')} open={open} onCancel = {onClose} footer={null} destroyOnClose>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ priority: 'Average' }}
        >
          <Form.Item label={t('support.summary')} name="title" rules={[{ required: true, message: 'Опишите вашу проблему' }]}>
            <Input placeholder={t('support.summaryPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('support.priority')} name="priority" rules={[{ required: true }]}>
            <Select
              options={priorities}
            />
          </Form.Item>
          <Button type="primary" onClick={onClose} >{t('support.cancel')}</Button>
          <Button type="primary" htmlType='submit' style={{ marginLeft: 8 }}>{t('support.submit')}</Button>
        </Form>
      </Modal>)
        }
