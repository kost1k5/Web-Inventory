import { Card, Col, Row, Statistic, Table } from 'antd';

function getFieldName(fieldType, fieldIndex) {
  const typeMap = {
    text: 'textField',
    multiline: 'textareaField',
    number: 'numberField',
    document: 'documentField',
    checkbox: 'booleanField',
  };
  return `${typeMap[fieldType]}${fieldIndex + 1}`;
}

export function StatsTab({ items, fields }) {
  const numberFields = fields.filter((field) => field.fieldType === 'number');

  const rows = numberFields.map((field) => {
    const fieldName = getFieldName(field.fieldType, field.fieldIndex);
    const values = items
      .map((item) => item[fieldName])
      .filter((value) => typeof value === 'number');

    if (!values.length) {
      return {
        key: field.id,
        title: field.title,
        avg: '-',
        min: '-',
        max: '-',
      };
    }

    const sum = values.reduce((acc, value) => acc + value, 0);

    return {
      key: field.id,
      title: field.title,
      avg: (sum / values.length).toFixed(2),
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });

  return (
    <Row gutter={16}>
      <Col xs={24} md={8}>
        <Card><Statistic title="Items total" value={items.length} /></Card>
      </Col>
      <Col xs={24} md={16}>
        <Card title="Numeric fields aggregation">
          <Table
            rowKey="key"
            pagination={false}
            dataSource={rows}
            columns={[
              { title: 'Field', dataIndex: 'title', key: 'title' },
              { title: 'Average', dataIndex: 'avg', key: 'avg' },
              { title: 'Min', dataIndex: 'min', key: 'min' },
              { title: 'Max', dataIndex: 'max', key: 'max' },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}
