import { useEffect, useState } from 'react';
import { Alert, Card, Col, Flex, Row, Table, Tag, Tooltip, Typography } from 'antd';
import { TagsOutlined, TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

// Цвета тегов в облаке — циклически
const TAG_COLORS = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'];

export function Home() {
  const { t } = useTranslation();
  const [inventories, setInventories] = useState([]);
  const [tagCloud, setTagCloud] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const fetchInventories = async () => {
      try {
        const [data, tags] = await Promise.all([
          query ? api.inventories.search(query) : api.inventories.getAll(),
          api.inventories.getTagCloud(),
        ]);
        setInventories(data);
        setTagCloud(tags || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventories();
  }, [query]);

  const latest = inventories.slice(0, 10);
  const topFive = [...inventories]
    .sort((a, b) => (b.itemsCount || 0) - (a.itemsCount || 0))
    .slice(0, 5);

  // Нормализуем размер шрифта тегов от min до max usageCount
  const maxCount = Math.max(...tagCloud.map((t2) => Number(t2.usageCount || 1)), 1);
  const tagFontSize = (count) => 12 + Math.round((Number(count) / maxCount) * 14);

  const columns = [
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
    {
      title: t('col.author'),
      dataIndex: ['owner', 'name'],
      key: 'owner',
      width: 150,
    },
    {
      title: t('col.items'),
      dataIndex: 'itemsCount',
      key: 'itemsCount',
      align: 'center',
      width: 80,
      sorter: (a, b) => (a.itemsCount || 0) - (b.itemsCount || 0),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {query && (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          title={t('home.searchResults', { query })}
          description={t('home.foundCount', { count: inventories.length })}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Flex vertical gap={16}>
            <Card
              title={
                <Flex align="center" gap={8}>
                  <ClockCircleOutlined style={{ color: '#1677ff' }} />
                  <span>{t('home.latest')}</span>
                </Flex>
              }
              loading={loading}
            >
              <Table
                columns={columns}
                dataSource={latest}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => t('col.total', { count: total }) }}
              />
            </Card>

            <Card
              title={
                <Flex align="center" gap={8}>
                  <TrophyOutlined style={{ color: '#faad14' }} />
                  <span>{t('home.top5')}</span>
                </Flex>
              }
            >
              <Table
                columns={columns}
                dataSource={topFive}
                rowKey="id"
                size="small"
                pagination={false}
              />
            </Card>
          </Flex>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <TagsOutlined style={{ color: '#52c41a' }} />
                <span>{t('home.tagCloud')}</span>
              </Flex>
            }
            style={{ height: '100%' }}
          >
            {tagCloud.length === 0 ? (
              <Typography.Text type="secondary">{t('home.noTags')}</Typography.Text>
            ) : (
              <Flex wrap="wrap" gap="small">
                {tagCloud.map((tag, index) => (
                  <Tooltip key={tag.id} title={`${tag.usageCount}`}>
                    <Tag
                      color={TAG_COLORS[index % TAG_COLORS.length]}
                      style={{
                        cursor: 'pointer',
                        fontSize: tagFontSize(tag.usageCount),
                        lineHeight: '1.8',
                        padding: '2px 10px',
                        marginBottom: 4,
                        userSelect: 'none',
                      }}
                      onClick={() => navigate(`/home?q=${encodeURIComponent(tag.name)}`)}
                    >
                      {tag.name}
                    </Tag>
                  </Tooltip>
                ))}
              </Flex>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
