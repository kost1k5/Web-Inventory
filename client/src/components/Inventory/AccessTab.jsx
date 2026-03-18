import { useEffect, useState } from 'react';
import { App, AutoComplete, Button, Card, Flex, Select, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, SaveOutlined, UserAddOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

export function AccessTab({ inventoryId, canManage }) {
  const { message } = App.useApp();
  const [users, setUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('name');
  const [selectedUser, setSelectedUser] = useState(null);

  // Access list доступен только owner/admin.
  // Пользователь с write access не меняет состав списка.
  useEffect(() => {
    let active = true;

    if (!canManage) return;

    (async () => {
      try {
        const data = await api.access.getByInventoryId(inventoryId);
        if (active) setUsers(data);
      } catch (error) {
        if (active) message.error(error.message);
      }
    })();

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryId, canManage]);

  // Autocomplete ищет и по имени, и по email
  const handleSuggest = async (value) => {
    setSearch(value);
    if (!value || !canManage) {
      setSuggestions([]);
      return;
    }

    try {
      const data = await api.inventories.suggestUsers(value);
      setSuggestions(
        data.map((user) => ({ value: user.id, label: `${user.name} (${user.email})`, user }))
      );
    } catch {
      setSuggestions([]);
    }
  };

  const addUser = () => {
    if (!selectedUser) return;
    if (users.some((u) => u.id === selectedUser.id)) return;
    setUsers((prev) => [...prev, selectedUser]);
    setSelectedUser(null);
    setSearch('');
  };

  const removeUser = (id) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  // Сохранение отправляет на сервер полный список userId,
  // чтобы клиент не зависел от частичных add/remove операций.
  const save = async () => {
    try {
      await api.access.update(inventoryId, users.map((user) => user.id));
      const updated = await api.access.getByInventoryId(inventoryId);
      setUsers(updated);
      message.success('Доступы сохранены');
    } catch (error) {
      message.error(error.message);
    }
  };

  if (!canManage) {
    return <Typography.Text type="secondary">Изменение доступа доступно только owner/admin.</Typography.Text>;
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (sortMode === 'email') return a.email.localeCompare(b.email);
    return a.name.localeCompare(b.name);
  });

  return (
    <Card title="Управление доступом">
      <Flex vertical gap="middle">
        <Flex wrap gap="small">
          <AutoComplete
            style={{ width: 360 }}
            value={search}
            options={suggestions}
            onSearch={handleSuggest}
            onSelect={(value) => {
              const option = suggestions.find((item) => item.value === value);
              setSelectedUser(option?.user || null);
              setSearch(option?.label || '');
            }}
            placeholder="Найти пользователя по имени или email"
          />
          <Button icon={<UserAddOutlined />} onClick={addUser}>Добавить</Button>
          <Select
            value={sortMode}
            style={{ width: 200 }}
            onChange={setSortMode}
            options={[
              { value: 'name', label: 'Сорт: по имени' },
              { value: 'email', label: 'Сорт: по email' },
            ]}
          />
          <Button type="primary" icon={<SaveOutlined />} onClick={save}>Сохранить</Button>
        </Flex>

        <Table
          dataSource={sortedUsers}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: 'Нет пользователей с доступом' }}
          columns={[
            {
              title: 'Имя',
              dataIndex: 'name',
              key: 'name',
              render: (name) => <Typography.Text strong>{name}</Typography.Text>,
            },
            { title: 'Email', dataIndex: 'email', key: 'email' },
            {
              title: '',
              key: 'actions',
              width: 100,
              align: 'right',
              render: (_, record) => (
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeUser(record.id)}
                >Убрать</Button>
              ),
            },
          ]}
        />
      </Flex>
    </Card>
  );
}
