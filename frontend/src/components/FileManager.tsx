import { useState } from 'react';
import type { FC } from 'react';
import { Upload, List, Button, Typography, message, Popconfirm } from 'antd';
import {
  UploadOutlined, DownloadOutlined, DeleteOutlined, EyeOutlined, FileOutlined,
  FilePdfOutlined, FileImageOutlined, FileExcelOutlined, FileWordOutlined,
} from '@ant-design/icons';
import type { IMaterialRequestFile } from '../types';

const API_BASE = 'http://localhost:8001';

const fileIcon = (contentType?: string) => {
  if (!contentType) return <FileOutlined />;
  if (contentType.includes('pdf')) return <FilePdfOutlined style={{ color: '#f5222d' }} />;
  if (contentType.includes('image')) return <FileImageOutlined style={{ color: '#1890ff' }} />;
  if (contentType.includes('sheet') || contentType.includes('excel')) return <FileExcelOutlined style={{ color: '#52c41a' }} />;
  if (contentType.includes('word') || contentType.includes('document')) return <FileWordOutlined style={{ color: '#2f54eb' }} />;
  return <FileOutlined />;
};

const formatSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

interface IFileManagerProps {
  requestId: string | undefined;
  files: IMaterialRequestFile[];
  onFilesChange: () => void;
  onViewFile: (file: IMaterialRequestFile) => void;
}

export const FileManager: FC<IFileManagerProps> = ({ requestId, files, onFilesChange, onViewFile }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!requestId) {
      message.warning('Сначала сохраните заявку');
      return false;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/api/v1/material-requests/${requestId}/files`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      message.success(`${file.name} загружен`);
      onFilesChange();
    } catch {
      message.error('Ошибка загрузки файла');
    }
    setUploading(false);
    return false;
  };

  const handleDownload = (fileRecord: IMaterialRequestFile) => {
    const link = document.createElement('a');
    link.href = `${API_BASE}/api/v1/files/${fileRecord.id}/download`;
    link.download = fileRecord.filename;
    link.click();
  };

  const handleDelete = async (fileId: string) => {
    try {
      await fetch(`${API_BASE}/api/v1/files/${fileId}`, { method: 'DELETE' });
      onFilesChange();
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const canView = (contentType?: string) =>
    contentType?.includes('image') || contentType?.includes('pdf');

  return (
    <div>
      <Upload
        beforeUpload={handleUpload}
        showUploadList={false}
        multiple
        disabled={!requestId}
      >
        <Button icon={<UploadOutlined />} loading={uploading} disabled={!requestId}>
          Загрузить документ
        </Button>
      </Upload>
      {!requestId && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
          Сохраните заявку, чтобы загрузить файлы
        </Typography.Text>
      )}

      {files.length > 0 && (
        <List
          style={{ marginTop: 12 }}
          size="small"
          dataSource={files}
          renderItem={(f) => (
            <List.Item
              actions={[
                canView(f.content_type) && (
                  <Button key="view" type="link" size="small" icon={<EyeOutlined />} onClick={() => onViewFile(f)}>
                    Просмотр
                  </Button>
                ),
                <Button key="dl" type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(f)}>
                  Скачать
                </Button>,
                <Popconfirm key="del" title="Удалить файл?" onConfirm={() => handleDelete(f.id)}>
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={fileIcon(f.content_type)}
                title={f.filename}
                description={formatSize(f.size_bytes)}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};
