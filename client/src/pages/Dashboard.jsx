import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Flex, Table, Spin, Typography, Tag, Empty } from 'antd';
import { PlusOutlined, UnorderedListOutlined, TeamOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

export function Dashboard() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [myInventories, setMyInventories] = useState([]);
  const [accessInventories, setAccessInventories] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Страница кабинета доступна только после авторизации.
  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Текущая реализация строит обе таблицы из общего списка инвентарей.
  // Для строгого соответствия ТЗ список с доступом должен приходить отдельным серверным запросом.
  useEffect(() => {
    const fetchInventories = async () => {
      try {
        const data = await api.inventories.getAll();
        
        const mine = data.filter(inv => inv.owner?.id === user?.id);
        const withAccess = data.filter(inv => inv.owner?.id !== user?.id);
        
        setMyInventories(mine);
        setAccessInventories(withAccess);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setDataLoading(false);
      }
    };

    if (user) {
      fetchInventories();
    }
  }, [user]);

  if (loading || dataLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const makeColumns = (showCategory = false) => [
    {
      title: t('col.title'),
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (text, record) => (
        <Typography.Link onClick={() => navigate(`/inventories/${record.id}`)}>
          {text}
        </Typography.Link>
      ),
    },
    {
      title: t('col.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text, record) => record.imageUrl
        ? <img src={record.imageUrl} alt={record.title} style={{ height: 40, width: 60, objectFit: 'cover', borderRadius: 4 }} />
        : <Typography.Text ellipsis>{text}</Typography.Text>,
    },
    showCategory && {
      title: t('col.author'),
      dataIndex: ['owner', 'name'],
      key: 'owner',
      width: 150,
    },
    {
      title: t('col.isPublic'),
      dataIndex: 'isPublic',
      key: 'isPublic',
      align: 'center',
      width: 110,
      render: (v) => v ? <Tag color="green">{t('col.yes')}</Tag> : <Tag color="default">{t('col.no')}</Tag>,
    },
    {
      title: t('col.items'),
      dataIndex: 'itemsCount',
      key: 'itemsCount',
      align: 'center',
      width: 80,
      sorter: (a, b) => (a.itemsCount || 0) - (b.itemsCount || 0),
    },
  ].filter(Boolean);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card
        style={{ marginBottom: 24 }}
        title={
          <Flex align="center" gap={8}>
            <UnorderedListOutlined style={{ color: '#1677ff' }} />
            <Typography.Text strong style={{ fontSize: 16 }}>{t('dashboard.myInventories')}</Typography.Text>
            <Tag color="blue">{myInventories.length}</Tag>
          </Flex>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/inventories/create')}>
            {t('dashboard.createNew')}
          </Button>
        }
      >
        <Table
          columns={makeColumns(false)}
          dataSource={myInventories}
          rowKey="id"
          size="middle"
          locale={{ emptyText: <Empty description={t('dashboard.emptyMine')} /> }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (n) => t('col.total', { count: n }) }}
        />
      </Card>

      <Card
        title={
          <Flex align="center" gap={8}>
            <TeamOutlined style={{ color: '#52c41a' }} />
            <Typography.Text strong style={{ fontSize: 16 }}>{t('dashboard.accessInventories')}</Typography.Text>
            <Tag color="green">{accessInventories.length}</Tag>
          </Flex>
        }
      >
        <Table
          columns={makeColumns(true)}
          dataSource={accessInventories}
          rowKey="id"
          size="middle"
          locale={{ emptyText: <Empty description={t('dashboard.emptyAccess')} /> }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (n) => t('col.total', { count: n }) }}
        />
      </Card>
    </div>
  );
}
