import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, Card, Flex, Spin, Table, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function UserProfile() {
  const { userId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Профиль пользователя пока собирается клиентом из профиля и общего списка инвентарей.
        const [userData, allInventories] = await Promise.all([
          api.users.getById(userId),
          api.inventories.getAll(),
        ]);
        setProfile(userData);
        setInventories(allInventories.filter((inv) => inv.owner?.id === userId));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) return <Flex justify="center" style={{ padding: 40 }}><Spin size="large" /></Flex>;
  if (!profile) return <Typography.Text type="danger">User not found</Typography.Text>;

  const columns = [
    {
      title: t('col.title'),
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Typography.Link onClick={() => navigate(`/inventories/${record.id}`)}>
          {text}
        </Typography.Link>
      ),
    },
    {
      title: t('col.items'),
      dataIndex: 'itemsCount',
      key: 'itemsCount',
      width: 80,
      align: 'center',
    },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Card style={{ marginBottom: 24 }}>
        <Flex gap="large" align="center">
          <Avatar size={72} icon={<UserOutlined />} />
          <Flex vertical>
            <Typography.Title level={3} style={{ margin: 0 }}>{profile.name}</Typography.Title>
            {profile.email && (
              <Typography.Text type="secondary">{profile.email}</Typography.Text>
            )}
          </Flex>
        </Flex>
      </Card>

      <Card title={t('profile.inventories')}>
        <Table
          columns={columns}
          dataSource={inventories}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: t('profile.noInventories') }}
        />
      </Card>
    </div>
  );
}
