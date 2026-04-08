import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Typography, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import type { ICostType } from '../types';

export const CostTypesPage: FC = () => {
  const [items, setItems] = useState<ICostType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/v1/cost-types');
      setItems(data);
    } catch { message.error('Ошибка загрузки'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: ICostType) => { setEditingId(record.id); form.setFieldsValue(record); setModalOpen(true); };

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editingId) await api.put(`/api/v1/cost-types/${editingId}`, values);
      else await api.post('/api/v1/cost-types', values);
      setModalOpen(false);
      load();
    } catch { message.error('Ошибка сохранения'); }
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/api/v1/cost-types/${id}`); load(); }
    catch { message.error('Ошибка удаления'); }
  };

  const columns = [
    { title: '№', key: 'index', width: 60, render: (_: unknown, __: unknown, i: number) => i + 1 },
    { title: 'Наименование', dataIndex: 'name', key: 'name' },
    {
      title: 'Статус', dataIndex: 'status', key: 'status', width: 120,
      render: (v: string) => v === 'active' ? 'Активен' : 'Неактивен',
    },
    {
      title: 'Действия', key: 'actions', width: 100,
      render: (_: unknown, record: ICostType) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Удалить?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Виды затрат</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Добавить</Button>
      </div>
      <Table dataSource={items} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
      <Modal
        title={editingId ? 'Редактировать' : 'Новый вид затрат'}
        open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        okText="Сохранить" cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Наименование" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="status" label="Статус" initialValue="active">
            <Select options={[{ value: 'active', label: 'Активен' }, { value: 'inactive', label: 'Неактивен' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
