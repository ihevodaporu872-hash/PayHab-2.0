import { useEffect, useState, useCallback } from 'react';
import type { FC } from 'react';
import {
  Form, Input, Select, Button, Table, InputNumber, Typography, message, Space,
  Divider, List, Switch, Card, DatePicker,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_LABELS } from '../types';
import type { IUser, IProject, IEstimateSection, ICostType, IWarehouse, IMaterialRequestItem, IMaterialRequestComment, IMaterialRequestFile, IApprovalStage, RequestType } from '../types';
import { FileManager } from '../components/FileManager';
import { DocumentViewer } from '../components/DocumentViewer';
import { ApprovalTimeline } from '../components/ApprovalTimeline';
import dayjs from 'dayjs';

import type { RequestModule } from '../types';

const requestTypeOptions = Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({ value, label }));

interface IFormProps {
  module: RequestModule;
  basePath: string;
}

export const MaterialRequestFormPage: FC<IFormProps> = ({ module, basePath }) => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [projects, setProjects] = useState<IProject[]>([]);
  const [sections, setSections] = useState<IEstimateSection[]>([]);
  const [costTypes, setCostTypes] = useState<ICostType[]>([]);
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [items, setItems] = useState<IMaterialRequestItem[]>([{ sort_order: 0 }]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [files, setFiles] = useState<IMaterialRequestFile[]>([]);
  const [viewerFile, setViewerFile] = useState<IMaterialRequestFile | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [stages, setStages] = useState<IApprovalStage[]>([]);
  const [comments, setComments] = useState<IMaterialRequestComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState<string | undefined>();
  const [commentAddressee, setCommentAddressee] = useState<string | undefined>();
  const [manualEstimate, setManualEstimate] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('by_estimate');
  const [saving, setSaving] = useState(false);
  const [requestNumber, setRequestNumber] = useState<number | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [status, setStatus] = useState('draft');

  const loadReferences = useCallback(async () => {
    try {
      const [p, ct, u, w] = await Promise.all([
        api.get('/api/v1/projects'),
        api.get('/api/v1/cost-types'),
        api.get('/api/v1/users'),
        api.get('/api/v1/warehouses'),
      ]);
      setProjects(p);
      setCostTypes(ct);
      setUsers(u);
      setWarehouses(w);
    } catch { message.error('Ошибка загрузки справочников'); }
  }, []);

  const loadSections = async (projectId: string) => {
    try {
      const data = await api.get(`/api/v1/estimate-sections?project_id=${projectId}`);
      setSections(data);
    } catch { setSections([]); }
  };

  const loadRequest = useCallback(async () => {
    if (isNew) return;
    try {
      const [req, reqItems, reqComments, reqFiles, reqStages] = await Promise.all([
        api.get(`/api/v1/material-requests/${id}`),
        api.get(`/api/v1/material-requests/${id}/items`),
        api.get(`/api/v1/material-requests/${id}/comments`),
        api.get(`/api/v1/material-requests/${id}/files`),
        api.get(`/api/v1/material-requests/${id}/stages`),
      ]);
      form.setFieldsValue({
        project_id: req.project_id,
        request_type: req.request_type,
        estimate_section_id: req.estimate_section_id,
        manual_estimate_section: req.manual_estimate_section,
        cost_type_id: req.cost_type_id,
        warehouse_id: req.warehouse_id,
        order_dates: req.order_date_from && req.order_date_to
          ? [dayjs(req.order_date_from), dayjs(req.order_date_to)]
          : undefined,
        justification: req.justification,
      });
      setRequestType(req.request_type);
      setRequestNumber(req.request_number);
      setCreatedAt(req.created_at);
      setSentAt(req.sent_at);
      setStatus(req.status);
      setManualEstimate(!!req.manual_estimate_section);
      if (req.project_id) loadSections(req.project_id);
      setItems(reqItems.length > 0 ? reqItems : [{ sort_order: 0 }]);
      setFiles(reqFiles);
      setStages(reqStages);
      setComments(reqComments);
    } catch { message.error('Ошибка загрузки заявки'); }
  }, [id, isNew, form]);

  useEffect(() => { loadReferences(); }, [loadReferences]);
  useEffect(() => { loadRequest(); }, [loadRequest]);

  const handleProjectChange = (projectId: string) => {
    form.setFieldValue('estimate_section_id', undefined);
    loadSections(projectId);
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addRow = () => setItems([...items, { sort_order: items.length }]);
  const removeRow = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const orderDates = values.order_dates;
      const payload = {
        ...values,
        module,
        request_type: requestType,
        order_dates: undefined,
        order_date_from: orderDates?.[0]?.format('YYYY-MM-DD') || null,
        order_date_to: orderDates?.[1]?.format('YYYY-MM-DD') || null,
        ...(manualEstimate
          ? { manual_estimate_section: values.manual_estimate_section, estimate_section_id: null }
          : { estimate_section_id: values.estimate_section_id, manual_estimate_section: null }),
      };

      let requestId = id;
      if (isNew) {
        const created = await api.post('/api/v1/material-requests', payload);
        requestId = created.id;
      } else {
        await api.put(`/api/v1/material-requests/${id}`, payload);
      }

      await api.post(`/api/v1/material-requests/${requestId}/items`, items);

      // Сохраняем локальные комментарии при создании новой заявки
      if (isNew && comments.length > 0) {
        for (const c of comments) {
          await api.post(`/api/v1/material-requests/${requestId}/comments`, {
            request_id: requestId,
            text: c.text,
            user_id: c.user_id,
            username: c.username,
            addressed_to: c.addressed_to || null,
            addressed_to_name: c.addressed_to_name || null,
          });
        }
      }

      message.success('Сохранено');
      if (isNew) navigate(`${basePath}/${requestId}`, { replace: true });
      else loadRequest();
    } catch { message.error('Ошибка сохранения'); }
    setSaving(false);
  };

  const handleSend = async () => {
    await handleSave();
    if (!id && isNew) return;
    try {
      await api.post(`/api/v1/material-requests/${id}/send`);
      message.success('Заявка отправлена на согласование');
      loadRequest();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Ошибка отправки');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !commentAuthor) return;
    const author = users.find((u) => u.id === commentAuthor);
    const addressee = users.find((u) => u.id === commentAddressee);
    const newComment: IMaterialRequestComment = {
      id: `local-${Date.now()}`,
      request_id: id || '',
      text: commentText,
      user_id: commentAuthor,
      username: author?.full_name || author?.username,
      addressed_to: commentAddressee,
      addressed_to_name: addressee?.full_name || addressee?.username,
      created_at: new Date().toISOString(),
    };

    if (!isNew && id) {
      try {
        await api.post(`/api/v1/material-requests/${id}/comments`, {
          request_id: id,
          text: commentText,
          user_id: commentAuthor,
          username: newComment.username,
          addressed_to: commentAddressee || null,
          addressed_to_name: newComment.addressed_to_name || null,
        });
        setCommentText('');
        setCommentAddressee(undefined);
        const data = await api.get(`/api/v1/material-requests/${id}/comments`);
        setComments(data);
      } catch { message.error('Ошибка добавления комментария'); }
    } else {
      setComments([...comments, newComment]);
      setCommentText('');
      setCommentAddressee(undefined);
    }
  };

  const tableColumns = [
    {
      title: '№ п/п', key: 'index', width: 60, fixed: 'left' as const,
      render: (_: unknown, __: unknown, i: number) => i + 1,
    },
    {
      title: 'Материал', key: 'material', width: 200,
      render: (_: unknown, __: unknown, i: number) => (
        <Input value={items[i]?.material || ''} onChange={(e) => updateItem(i, 'material', e.target.value)} />
      ),
    },
    {
      title: 'Наименование производителя', key: 'manufacturer', width: 220,
      render: (_: unknown, __: unknown, i: number) => (
        <Input value={items[i]?.manufacturer || ''} onChange={(e) => updateItem(i, 'manufacturer', e.target.value)} />
      ),
    },
    {
      title: 'Менеджер', key: 'manager', width: 180,
      render: (_: unknown, __: unknown, i: number) => (
        <Input value={items[i]?.manager || ''} onChange={(e) => updateItem(i, 'manager', e.target.value)} />
      ),
    },
    {
      title: 'Единица мат.', key: 'unit', width: 120,
      render: (_: unknown, __: unknown, i: number) => (
        <Input value={items[i]?.unit || ''} onChange={(e) => updateItem(i, 'unit', e.target.value)} />
      ),
    },
    {
      title: 'Кол-во', key: 'quantity', width: 120,
      render: (_: unknown, __: unknown, i: number) => (
        <InputNumber value={items[i]?.quantity} onChange={(v) => updateItem(i, 'quantity', v)} style={{ width: '100%' }} />
      ),
    },
    {
      title: '', key: 'actions', width: 50, fixed: 'right' as const,
      render: (_: unknown, __: unknown, i: number) => (
        items.length > 1 ? <Button type="link" danger icon={<DeleteOutlined />} onClick={() => removeRow(i)} /> : null
      ),
    },
  ];

  return (
    <>
      <Typography.Title level={4}>
        {isNew ? 'Новый запрос на материалы' : `Запрос на материалы №${requestNumber}`}
      </Typography.Title>

      {!isNew && (
        <Space style={{ marginBottom: 16 }} wrap>
          <Typography.Text type="secondary">Статус: {REQUEST_STATUS_LABELS[status] || status}</Typography.Text>
          {createdAt && <Typography.Text type="secondary">Дата создания: {dayjs(createdAt).format('DD.MM.YYYY HH:mm')}</Typography.Text>}
          {sentAt && <Typography.Text type="secondary">Дата отправки: {dayjs(sentAt).format('DD.MM.YYYY HH:mm')}</Typography.Text>}
        </Space>
      )}

      <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
        <Form.Item name="project_id" label="Проект" rules={[{ required: true, message: 'Выберите проект' }]}>
          <Select
            placeholder="Выберите проект"
            showSearch
            optionFilterProp="label"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            onChange={handleProjectChange}
          />
        </Form.Item>

        <Form.Item name="warehouse_id" label="Склад">
          <Select
            placeholder="Выберите склад"
            showSearch
            optionFilterProp="label"
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            allowClear
          />
        </Form.Item>

        <Form.Item name="order_dates" label="Заказ на">
          <DatePicker.RangePicker
            picker="week"
            format="DD.MM.YYYY"
            style={{ width: '100%' }}
            placeholder={['с', 'по']}
          />
        </Form.Item>

        <Form.Item name="request_type" label="Вид заявки" initialValue="by_estimate" rules={[{ required: true }]}>
          <Select
            options={requestTypeOptions}
            onChange={(v) => setRequestType(v as RequestType)}
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {!manualEstimate ? (
            <Form.Item name="estimate_section_id" label="Раздел сметы" style={{ flex: 1, minWidth: 200 }}>
              <Select
                placeholder="Выберите раздел"
                showSearch
                optionFilterProp="label"
                options={sections.map((s) => ({ value: s.id, label: s.name }))}
                allowClear
              />
            </Form.Item>
          ) : (
            <Form.Item name="manual_estimate_section" label="Раздел сметы (вручную)" style={{ flex: 1, minWidth: 200 }}>
              <Input placeholder="Введите раздел сметы" />
            </Form.Item>
          )}
          <Form.Item label="Без сметы">
            <Switch checked={manualEstimate} onChange={setManualEstimate} />
          </Form.Item>
        </div>

        <Form.Item name="cost_type_id" label="Вид затрат">
          <Select
            placeholder="Выберите вид затрат"
            showSearch
            optionFilterProp="label"
            options={costTypes.map((c) => ({ value: c.id, label: c.name }))}
            allowClear
          />
        </Form.Item>
      </Form>

      <Divider>Материалы</Divider>

      <Table
        dataSource={items}
        columns={tableColumns}
        rowKey={(_, i) => String(i)}
        pagination={false}
        scroll={{ x: 1000 }}
        size="small"
        footer={() => (
          <Button type="dashed" block icon={<PlusOutlined />} onClick={addRow}>
            Добавить строку
          </Button>
        )}
      />

      <Space style={{ marginTop: 16 }}>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>Сохранить</Button>
        {!isNew && status === 'draft' && (
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend} style={{ background: '#52c41a' }}>
            Отправить на согласование
          </Button>
        )}
      </Space>

      <Divider>Этапы согласования</Divider>
      <ApprovalTimeline
        requestId={isNew ? undefined : id}
        stages={stages}
        users={users}
        isNew={isNew}
        onStagesChange={loadRequest}
      />

      <Divider>Документы</Divider>
      <Card size="small" style={{ maxWidth: 800 }}>
        <FileManager
          requestId={isNew ? undefined : id}
          files={files}
          onFilesChange={loadRequest}
          onViewFile={(f) => { setViewerFile(f); setViewerOpen(true); }}
        />
      </Card>

      <DocumentViewer
        file={viewerFile}
        open={viewerOpen}
        onClose={() => { setViewerOpen(false); setViewerFile(null); }}
      />

      <Divider>Комментарии</Divider>
      <Card size="small" style={{ maxWidth: 800 }}>
        <List
          dataSource={comments}
          locale={{ emptyText: 'Нет комментариев' }}
          renderItem={(c) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space size={4} wrap>
                    <Typography.Text strong>{c.username || 'Пользователь'}</Typography.Text>
                    {c.addressed_to_name && (
                      <Typography.Text type="secondary">
                        &rarr; {c.addressed_to_name}
                      </Typography.Text>
                    )}
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(c.created_at).format('DD.MM.YYYY HH:mm')}
                    </Typography.Text>
                  </Space>
                }
                description={<div style={{ whiteSpace: 'pre-wrap' }}>{c.text}</div>}
              />
            </List.Item>
          )}
        />
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            placeholder="От кого"
            value={commentAuthor}
            onChange={setCommentAuthor}
            showSearch
            optionFilterProp="label"
            options={users.map((u) => ({ value: u.id, label: u.full_name || u.username }))}
            style={{ minWidth: 180 }}
          />
          <Select
            placeholder="Кому (адресат)"
            value={commentAddressee}
            onChange={setCommentAddressee}
            showSearch
            optionFilterProp="label"
            options={users.map((u) => ({ value: u.id, label: u.full_name || u.username }))}
            style={{ minWidth: 180 }}
            allowClear
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Input.TextArea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Введите комментарий..."
            rows={2}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            onClick={handleAddComment}
            disabled={!commentText.trim() || !commentAuthor}
          >
            Отправить
          </Button>
        </div>
      </Card>
    </>
  );
};
