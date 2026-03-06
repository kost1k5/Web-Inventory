import { Button, Flex, Tooltip, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckSquareOutlined, BorderOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export function ItemsToolbar({ userAccess, onAddItem, selectedItems = [], onDeleteSelected, items = [], onSelectAll, onDeselectAll }) {
  const { t } = useTranslation();
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  return (
    <Flex gap="small" align="center" wrap style={{ marginBottom: 16 }}>
      {userAccess?.canEdit && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAddItem}>
          {t('toolbar.addItem')}
        </Button>
      )}

      {items.length > 0 && (
        <Tooltip title={allSelected ? t('toolbar.deselectAll') : t('toolbar.selectAll')}>
          <Button
            icon={allSelected ? <CheckSquareOutlined /> : <BorderOutlined />}
            onClick={allSelected ? onDeselectAll : onSelectAll}
          >
            {allSelected ? t('toolbar.deselectAll') : t('toolbar.selectAll')}
          </Button>
        </Tooltip>
      )}

      {selectedItems.length > 0 && userAccess?.canEdit && (
        <Button danger icon={<DeleteOutlined />} onClick={onDeleteSelected}>
          {t('toolbar.delete', { count: selectedItems.length })}
        </Button>
      )}

      {selectedItems.length === 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t('toolbar.selectHint')}
        </Typography.Text>
      )}
    </Flex>
  );
}
