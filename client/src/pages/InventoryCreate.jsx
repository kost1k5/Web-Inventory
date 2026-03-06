import { Form, Input, Select, Switch, Button, Card, Row, Col, Space, Upload, App as AntApp, theme } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MDEditor from '@uiw/react-md-editor';
import { UploadOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export function InventoryCreate() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    api.categories.getAll()
      .then((cats) => setCategories(cats.map((c) => ({ value: c.id, label: c.name }))))
      .catch(() => {});
    api.tags.suggest('')
      .then((names) => setTagOptions(names.map((n) => ({ value: n, label: n }))))
      .catch(() => {});
  }, []);

  const handleTagSearch = async (q) => {
    try {
      const names = await api.tags.suggest(q);
      setTagOptions(names.map((n) => ({ value: n, label: n })));
    } catch { /* ignore */ }
  };

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', import.meta.env.VITE_IMGBB_API_KEY);
      const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      const url = data.data.url;
      form.setFieldValue('imageUrl', url);
      setImageUrl(url);
      message.success(t('create.uploadSuccess'));
    } catch {
      message.error(t('create.uploadError'));
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await api.inventories.create(values);
      message.success(t('create.success'));
      navigate('/dashboard');
    } catch {
      message.error(t('create.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Card variant="borderless" title={t('create.pageTitle')} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ isPublic: false }}>
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Form.Item
                label={t('create.name')} name="title"
                rules={[
                  { required: true, message: t('create.nameRequired') },
                  { min: 3, message: t('create.nameMin') },
                  { max: 100, message: t('create.nameMax') },
                ]}
              >
                <Input placeholder={t('create.namePlaceholder')} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item
                label={t('create.category')} name="categoryId"
                rules={[{ required: true, message: t('create.categoryRequired') }]}
              >
                <Select placeholder={t('create.categoryPlaceholder')} size="large" options={categories} loading={categories.length === 0} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={t('create.description')} name="description"
            rules={[{ required: true, message: t('create.descriptionRequired') }, { max: 2000 }]}
          >
            <MDEditor preview="edit" height={240} textareaProps={{ placeholder: t('create.descriptionPlaceholder') }} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item label={t('create.tags')} name="tags" tooltip={t('create.tagsHint')}>
                <Select
                  mode="tags"
                  placeholder={t('create.tagsPlaceholder')}
                  size="large"
                  style={{ width: '100%' }}
                  options={tagOptions}
                  onSearch={handleTagSearch}
                  filterOption={false}
                  tokenSeparators={[',']}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('create.isPublic')} name="isPublic" valuePropName="checked" tooltip={t('create.isPublicHint')}>
                <Switch checkedChildren={t('col.yes')} unCheckedChildren={t('col.no')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t('create.image')} tooltip={t('create.imageHint')}>
            <Upload beforeUpload={handleImageUpload} showUploadList={false} accept="image/*">
              <Button icon={<UploadOutlined />} loading={uploading}>{t('create.uploadBtn')}</Button>
            </Upload>
            {imageUrl && (
              <img src={imageUrl} alt="Preview"
                style={{ marginTop: 12, maxWidth: 220, maxHeight: 160, borderRadius: 8, objectFit: 'cover',
                  border: `1px solid ${token.colorBorderSecondary}` }} />
            )}
          </Form.Item>

          <Form.Item name="imageUrl" hidden><Input /></Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} size="large">{t('create.submit')}</Button>
              <Button size="large" onClick={() => navigate('/dashboard')}>{t('btn.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
