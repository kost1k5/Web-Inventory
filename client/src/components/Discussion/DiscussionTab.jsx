import { useState, useEffect } from 'react';
import { Input, Button, Typography, Avatar, Card, Flex, Space } from 'antd';
import { UserOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import io from 'socket.io-client';
import { api } from '../../services/api';

const { TextArea } = Input;

export function DiscussionTab({ inventoryId, user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  
  // Сокет создаётся только на время открытой вкладки discussion.
  useEffect(() => {
    const SERVER_URL = (import.meta.env.VITE_API_URL || 'https://web-inventory.onrender.com/api').replace('/api', '');
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);
    
    // Комната изолирует поток комментариев конкретного инвентаря.
    newSocket.emit('joinInventory', inventoryId);
    
    newSocket.on('newComment', (comment) => {
      setComments((prev) => [...prev, comment]);
    });
    
    return () => {
      newSocket.emit('leaveInventory', inventoryId);
      newSocket.disconnect();
    };
  }, [inventoryId]);
  
  // История обсуждения всегда подтягивается HTTP-запросом,
  // а сокет отвечает только за догрузку новых сообщений.
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await api.discussions.getByInventoryId(inventoryId);
        setComments(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    fetchComments();
  }, [inventoryId]);
  
  // Если сокет активен, комментарий публикуется через него;
  // иначе остаётся запасной HTTP-сценарий.
  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      if (socket && user?.id) {
        socket.emit('sendComment', {
          inventoryId,
          text: newComment,
          userId: user?.id,
        });
      } else {
        await api.discussions.create(inventoryId, newComment);
      }
      
      setNewComment('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Flex vertical gap="middle">
      <Flex vertical gap="small">
        {comments.length === 0 && (
          <Typography.Text type="secondary">Нет комментариев. Будьте первым!</Typography.Text>
        )}
        {comments.map((comment) => (
          <Card
            key={comment.id}
            size="small"
            styles={{ body: { padding: '12px 16px' } }}
          >
            <Flex gap="small" align="flex-start">
              <Avatar icon={<UserOutlined />} size={36} />
              <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                <Flex gap="small" align="center" wrap>
                  <Typography.Link
                    onClick={() => navigate(`/users/${comment.user?.id || comment.User?.id}`)}
                  >
                    {comment.user?.name || comment.User?.name || 'User'}
                  </Typography.Link>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(comment.createdAt).toLocaleString('ru-RU')}
                  </Typography.Text>
                </Flex>
                <div style={{ marginTop: 4 }}>
                  <ReactMarkdown>{comment.text}</ReactMarkdown>
                </div>
              </Flex>
            </Flex>
          </Card>
        ))}
      </Flex>
      
      {user && (
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Написать комментарий (поддерживается Markdown)..."
            rows={3}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={handleSubmit}
          >
            Отправить
          </Button>
        </Space.Compact>
      )}
    </Flex>
  );
}