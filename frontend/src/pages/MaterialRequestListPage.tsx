import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Table, Button, Typography, Tag, Space, message } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_LABELS } from '../types';
import type { IMaterialRequest, RequestType } from '../types';
import dayjs from 'dayjs';

const statusColors: Record<string, string> = {
  draft: 'default',
  sent: 'processing',
  approved: 'success',
  rejected: 'error',
};

export const MaterialRequestListPage: FC = () => {
  const [requests, setRequests] = useState<IMaterialRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/v1/material-requests');
      setRequests(data);
    } catch { message.error('Ошибка загрузки'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { title: '№ запроса', dataIndex: 'request_number', key: 'request_number', width: 110 },
    {
      title: 'Дата создания', dataIndex: 'created_at', key: 'created_at', width: 140,
      render: (v: string) => v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—',
    },
    {
      title: 'Дата отправки', dataIndex: 'sent_at', key: 'sent_at', width: 140,
      render: (v: string) => v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—',
    },
    {
      title: 'Проект', key: 'project', render: (_: unknown, r: IMaterialRequest) => r.projects?.name || '—',
    },
    {
      title: 'Вид заявки', dataIndex: 'request_type', key: 'request_type', width: 180,
      render: (v: RequestType) => REQUEST_TYPE_LABELS[v] || v,
    },
    {
      title: 'Статус', dataIndex: 'status', key: 'status', width: 140,
      render: (v: string) => <Tag color={statusColors[v]}>{REQUEST_STATUS_LABELS[v] || v}</Tag>,
    },
    {
      title: 'Действия', key: 'actions', width: 80,
      render: (_: unknown, r: IMaterialRequest) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/requests/${r.id}`)} />
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Запрос на материалы</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/requests/new')}>
          Новая заявка
        </Button>
      </div>
      <Table
        dataSource={requests}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{ pageSize: 20 }}
      />
    </>
  );
};
