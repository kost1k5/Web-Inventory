import { useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Flex, Table, Tag, Tooltip, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, CrownOutlined, DeleteOutlined, LockOutlined, UnlockOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const selectedUsers = useMemo(
    () => users.filter((candidate) => selectedRowKeys.includes(candidate.id)),
    [users, selectedRowKeys]
  );

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getUsers();
      setUsers(data);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user?.isAdmin) {
      navigate('/home');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Bulk-операции удобны для админки и укладываются в требование про toolbar,
  // потому что действия вынесены из строк таблицы.
  const bulkUpdate = async (patch) => {
    if (!selectedUsers.length) return;
    try {
      await Promise.all(selectedUsers.map((candidate) => api.admin.updateUser(candidate.id, patch)));
      await loadUsers();
      message.success('Изменения применены');
    } catch (error) {
      message.error(error.message);
    }
  };

  const bulkDelete = async () => {
    if (!selectedUsers.length) return;
    try {
      await Promise.all(selectedUsers.map((candidate) => api.admin.deleteUser(candidate.id)));
      setSelectedRowKeys([]);
      await loadUsers();
      message.success('Пользователи удалены');
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <Card title={<Typography.Title level={4} style={{ margin: 0 }}>Управление пользователями</Typography.Title>}>
      <Flex vertical gap="middle">
        <Flex wrap gap="small">
          <Tooltip title="Заблокировать выбранных">
            <Button
              icon={<LockOutlined />}
              disabled={!selectedUsers.length}
              onClick={() => bulkUpdate({ isBlocked: true })}
            >Заблокировать</Button>
          </Tooltip>
          <Tooltip title="Разблокировать выбранных">
            <Button
              icon={<UnlockOutlined />}
              disabled={!selectedUsers.length}
              onClick={() => bulkUpdate({ isBlocked: false })}
            >Разблокировать</Button>
          </Tooltip>
          <Tooltip title="Выдать права администратора">
            <Button
              icon={<CrownOutlined />}
              disabled={!selectedUsers.length}
              onClick={() => bulkUpdate({ isAdmin: true })}
            >Сделать Admin</Button>
          </Tooltip>
          <Tooltip title="Отозвать права администратора">
            <Button
              icon={<UserSwitchOutlined />}
              disabled={!selectedUsers.length}
              onClick={() => bulkUpdate({ isAdmin: false })}
            >Снять Admin</Button>
          </Tooltip>
          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={!selectedUsers.length}
            onClick={bulkDelete}
          >Удалить</Button>
          {selectedUsers.length > 0 && (
            <Typography.Text type="secondary" style={{ alignSelf: 'center' }}>
              Выбрано: {selectedUsers.length}
            </Typography.Text>
          )}
        </Flex>

        <Table
          loading={loading}
          rowKey="id"
          dataSource={users}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={[
            { title: 'Имя', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
            { title: 'Email', dataIndex: 'email', key: 'email', sorter: (a, b) => a.email.localeCompare(b.email) },
            {
              title: 'Роль',
              dataIndex: 'isAdmin',
              key: 'isAdmin',
              render: (value) => value
                ? <Tag icon={<CrownOutlined />} color="gold">Admin</Tag>
                : <Tag color="default">User</Tag>,
            },
            {
              title: 'Статус',
              dataIndex: 'isBlocked',
              key: 'isBlocked',
              render: (value) => value
                ? <Tag icon={<CloseCircleOutlined />} color="red">Заблокирован</Tag>
                : <Tag icon={<CheckCircleOutlined />} color="green">Активен</Tag>,
            },
            {
              title: 'Зарегистрирован',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (value) => new Date(value).toLocaleString('ru-RU'),
              sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            },
          ]}
          pagination={{ pageSize: 20, showTotal: (total) => `Всего: ${total}` }}
        />
      </Flex>
    </Card>
  );
}
