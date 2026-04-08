import { useState } from 'react';
import type { FC } from 'react';
import {
  Steps, Button, Select, Input, Space, Typography, message, Card, Popconfirm, Tag,
} from 'antd';
import {
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined,
  RollbackOutlined, DeleteOutlined, UserOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';
import { APPROVAL_STATUS_LABELS } from '../types';
import type { IApprovalStage, IUser, ApprovalStatus } from '../types';
import dayjs from 'dayjs';

const statusStepStatus = (s: ApprovalStatus): 'wait' | 'process' | 'finish' | 'error' => {
  switch (s) {
    case 'approved': return 'finish';
    case 'rejected': return 'error';
    case 'in_progress': return 'process';
    case 'returned': return 'error';
    default: return 'wait';
  }
};

const statusTagColor: Record<ApprovalStatus, string> = {
  pending: 'default',
  in_progress: 'processing',
  approved: 'success',
  rejected: 'error',
  returned: 'warning',
};

interface IApprovalTimelineProps {
  requestId: string | undefined;
  stages: IApprovalStage[];
  users: IUser[];
  isNew: boolean;
  onStagesChange: () => void;
}

export const ApprovalTimeline: FC<IApprovalTimelineProps> = ({
  requestId, stages, users, isNew, onStagesChange,
}) => {
  const [adding, setAdding] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newApprover, setNewApprover] = useState<string | undefined>();
  const [decisionComment, setDecisionComment] = useState('');
  const [decidingStageId, setDecidingStageId] = useState<string | null>(null);

  const defaultStageNames = [
    'Сметный отдел',
    'Руководитель проекта',
    'Финансовый отдел',
    'Директор',
  ];

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    const approver = users.find((u) => u.id === newApprover);
    const newStage: IApprovalStage = {
      stage_order: stages.length,
      stage_name: newStageName,
      approver_id: newApprover,
      approver_name: approver?.full_name || approver?.username,
      status: 'pending',
    };

    if (!isNew && requestId) {
      try {
        await api.post(`/api/v1/material-requests/${requestId}/stages`, [...stages, newStage]);
        onStagesChange();
      } catch { message.error('Ошибка добавления этапа'); }
    }
    setNewStageName('');
    setNewApprover(undefined);
    setAdding(false);
  };

  const handleDecision = async (stageId: string, decision: ApprovalStatus) => {
    if (!requestId) return;
    try {
      const stage = stages.find((s) => s.id === stageId);
      if (!stage) return;
      await api.put(`/api/v1/material-requests/${requestId}/stages/${stageId}`, {
        ...stage,
        status: decision,
        comment: decisionComment || undefined,
      });
      setDecidingStageId(null);
      setDecisionComment('');
      message.success('Решение сохранено');
      onStagesChange();
    } catch { message.error('Ошибка'); }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!requestId) return;
    const filtered = stages.filter((s) => s.id !== stageId);
    try {
      await api.post(`/api/v1/material-requests/${requestId}/stages`, filtered);
      onStagesChange();
    } catch { message.error('Ошибка удаления'); }
  };

  const currentStepIndex = stages.findIndex((s) => s.status === 'pending' || s.status === 'in_progress');

  return (
    <Card size="small" style={{ maxWidth: 800 }}>
      {stages.length > 0 ? (
        <Steps
          direction="vertical"
          size="small"
          current={currentStepIndex >= 0 ? currentStepIndex : stages.length}
          items={stages.map((stage) => ({
            title: (
              <Space wrap>
                <Typography.Text strong>{stage.stage_name}</Typography.Text>
                <Tag color={statusTagColor[stage.status]}>
                  {APPROVAL_STATUS_LABELS[stage.status]}
                </Tag>
              </Space>
            ),
            description: (
              <div style={{ paddingBottom: 8 }}>
                {stage.approver_name && (
                  <Typography.Text type="secondary">
                    <UserOutlined /> {stage.approver_name}
                  </Typography.Text>
                )}
                {stage.decided_at && (
                  <Typography.Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
                    {dayjs(stage.decided_at).format('DD.MM.YYYY HH:mm')}
                  </Typography.Text>
                )}
                {stage.comment && (
                  <div style={{ marginTop: 4 }}>
                    <Typography.Text italic>"{stage.comment}"</Typography.Text>
                  </div>
                )}

                {/* Кнопки принятия решения */}
                {(stage.status === 'pending' || stage.status === 'in_progress') && !isNew && (
                  <div style={{ marginTop: 8 }}>
                    {decidingStageId === stage.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
                        <Input.TextArea
                          value={decisionComment}
                          onChange={(e) => setDecisionComment(e.target.value)}
                          placeholder="Комментарий к решению (необязательно)"
                          rows={2}
                        />
                        <Space wrap>
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleDecision(stage.id!, 'approved')}
                          >
                            Согласовать
                          </Button>
                          <Button
                            danger
                            size="small"
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleDecision(stage.id!, 'rejected')}
                          >
                            Отклонить
                          </Button>
                          <Button
                            size="small"
                            icon={<RollbackOutlined />}
                            onClick={() => handleDecision(stage.id!, 'returned')}
                          >
                            Вернуть
                          </Button>
                          <Button size="small" onClick={() => setDecidingStageId(null)}>Отмена</Button>
                        </Space>
                      </div>
                    ) : (
                      <Space>
                        <Button size="small" type="primary" ghost onClick={() => setDecidingStageId(stage.id!)}>
                          Принять решение
                        </Button>
                        <Popconfirm title="Удалить этап?" onConfirm={() => handleDeleteStage(stage.id!)}>
                          <Button size="small" danger type="text" icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    )}
                  </div>
                )}
              </div>
            ),
            status: statusStepStatus(stage.status),
          }))}
        />
      ) : (
        <Typography.Text type="secondary">Этапы согласования не назначены</Typography.Text>
      )}

      {!isNew && (
        <div style={{ marginTop: 12 }}>
          {adding ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
              <Select
                placeholder="Название этапа"
                value={newStageName || undefined}
                onChange={setNewStageName}
                showSearch
                allowClear
                options={defaultStageNames.map((n) => ({ value: n, label: n }))}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Input
                      placeholder="Или введите своё..."
                      style={{ margin: 4 }}
                      onPressEnter={(e) => {
                        const val = (e.target as HTMLInputElement).value;
                        if (val) setNewStageName(val);
                      }}
                    />
                  </>
                )}
              />
              <Select
                placeholder="Согласующий"
                value={newApprover}
                onChange={setNewApprover}
                showSearch
                optionFilterProp="label"
                options={users.map((u) => ({ value: u.id, label: u.full_name || u.username }))}
                allowClear
              />
              <Space>
                <Button type="primary" size="small" onClick={handleAddStage} disabled={!newStageName.trim()}>
                  Добавить
                </Button>
                <Button size="small" onClick={() => setAdding(false)}>Отмена</Button>
              </Space>
            </div>
          ) : (
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => setAdding(true)}>
              Добавить этап согласования
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
