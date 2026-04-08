import { useEffect, useRef, useState, useCallback } from 'react';
import type { FC } from 'react';
import { Modal, Button, Space, Tooltip, ColorPicker, Segmented, Slider, message } from 'antd';
import {
  ZoomInOutlined, ZoomOutOutlined, RotateRightOutlined, RotateLeftOutlined,
  HighlightOutlined, EditOutlined, FontSizeOutlined, SaveOutlined,
  PrinterOutlined, UndoOutlined, DeleteOutlined, DragOutlined,
} from '@ant-design/icons';
import { Canvas, Rect, IText, PencilBrush, FabricImage } from 'fabric';
import type { IMaterialRequestFile } from '../types';

const API_BASE = 'http://localhost:8001';

type ToolMode = 'select' | 'draw' | 'highlight' | 'text';

interface IDocumentViewerProps {
  file: IMaterialRequestFile | null;
  open: boolean;
  onClose: () => void;
}

export const DocumentViewer: FC<IDocumentViewerProps> = ({ file, open, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [tool, setTool] = useState<ToolMode>('select');
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushWidth, setBrushWidth] = useState(3);
  const [saving, setSaving] = useState(false);

  const initCanvas = useCallback(() => {
    if (!canvasRef.current || !file || !open) return;

    const wrapper = canvasRef.current.parentElement;
    const w = wrapper ? wrapper.clientWidth - 2 : 800;
    const h = 600;

    if (fabricRef.current) {
      fabricRef.current.dispose();
      fabricRef.current = null;
    }

    const canvas = new Canvas(canvasRef.current, {
      width: w,
      height: h,
      backgroundColor: '#f5f5f5',
      selection: true,
    });
    fabricRef.current = canvas;

    const imgUrl = `${API_BASE}/api/v1/files/${file.id}/view`;

    if (file.content_type?.includes('image')) {
      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      imgEl.onload = () => {
        const fabricImage = new FabricImage(imgEl);
        const scale = Math.min(w / imgEl.width, h / imgEl.height, 1);
        fabricImage.set({
          scaleX: scale,
          scaleY: scale,
          left: (w - imgEl.width * scale) / 2,
          top: (h - imgEl.height * scale) / 2,
          selectable: false,
          evented: false,
          hasControls: false,
        });
        canvas.insertAt(0, fabricImage);
        canvas.renderAll();

        if (file.annotations) {
          try {
            canvas.loadFromJSON(file.annotations).then(() => {
              canvas.renderAll();
            });
          } catch { /* ignore */ }
        }
      };
      imgEl.src = imgUrl;
    } else if (file.content_type?.includes('pdf')) {
      const text = new IText('PDF-документ: используйте скачивание для просмотра PDF', {
        left: 50,
        top: h / 2 - 20,
        fontSize: 16,
        fill: '#666',
        selectable: false,
      });
      canvas.add(text);
      canvas.renderAll();
    }

    setZoom(1);
    setRotation(0);
    setTool('select');
  }, [file, open]);

  useEffect(() => {
    if (open && file) {
      setTimeout(initCanvas, 100);
    }
    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [open, file, initCanvas]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (tool === 'draw' || tool === 'highlight') {
      canvas.isDrawingMode = true;
      const brush = new PencilBrush(canvas);
      brush.color = tool === 'highlight'
        ? `${brushColor}66`
        : brushColor;
      brush.width = tool === 'highlight' ? brushWidth * 8 : brushWidth;
      canvas.freeDrawingBrush = brush;
      canvas.selection = false;
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = tool === 'select';
    }
  }, [tool, brushColor, brushWidth]);

  const handleZoom = (delta: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const newZoom = Math.max(0.2, Math.min(5, zoom + delta));
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const handleRotate = (deg: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const newRot = (rotation + deg) % 360;
    setRotation(newRot);
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      const angle = (obj.angle || 0) + deg;
      obj.set({ angle });
      obj.setCoords();
    });
    canvas.renderAll();
  };

  const handleAddText = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new IText('Текст', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: brushColor,
      fontFamily: 'Arial',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setTool('select');
  };

  const handleAddHighlightRect = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 50,
      fill: `${brushColor}33`,
      stroke: brushColor,
      strokeWidth: 1,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    setTool('select');
  };

  const handleDeleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    active.forEach((obj) => {
      if (obj.selectable !== false) canvas.remove(obj);
    });
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const handleUndo = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    for (let i = objects.length - 1; i >= 0; i--) {
      if (objects[i].selectable !== false) {
        canvas.remove(objects[i]);
        canvas.renderAll();
        return;
      }
    }
  };

  const handleSave = async () => {
    if (!fabricRef.current || !file) return;
    setSaving(true);
    try {
      const json = JSON.stringify(fabricRef.current.toJSON());
      await fetch(`${API_BASE}/api/v1/files/${file.id}/annotations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations: json }),
      });
      message.success('Изменения сохранены');
    } catch {
      message.error('Ошибка сохранения');
    }
    setSaving(false);
  };

  const handlePrint = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Печать - ${file?.filename}</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; }
          img { max-width: 100%; height: auto; }
          @media print { body { margin: 0; } }
        </style></head>
        <body><img src="${dataUrl}" onload="window.print();window.close();" /></body></html>
      `);
      printWindow.document.close();
    }
  };

  const toolOptions = [
    { value: 'select', icon: <DragOutlined />, label: 'Выбор' },
    { value: 'draw', icon: <EditOutlined />, label: 'Рисование' },
    { value: 'highlight', icon: <HighlightOutlined />, label: 'Маркер' },
  ];

  return (
    <Modal
      title={file?.filename || 'Просмотр документа'}
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ top: 20 }}
      styles={{ body: { padding: 12, overflow: 'auto' } }}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <Segmented
          value={tool}
          onChange={(v) => setTool(v as ToolMode)}
          options={toolOptions.map((o) => ({
            value: o.value,
            label: <Tooltip title={o.label}>{o.icon}</Tooltip>,
          }))}
        />

        <Tooltip title="Добавить текст">
          <Button icon={<FontSizeOutlined />} onClick={handleAddText} />
        </Tooltip>
        <Tooltip title="Выделить область">
          <Button icon={<HighlightOutlined />} onClick={handleAddHighlightRect} />
        </Tooltip>

        <div style={{ borderLeft: '1px solid #d9d9d9', height: 24, margin: '0 4px' }} />

        <Tooltip title="Увеличить">
          <Button icon={<ZoomInOutlined />} onClick={() => handleZoom(0.2)} />
        </Tooltip>
        <Tooltip title="Уменьшить">
          <Button icon={<ZoomOutOutlined />} onClick={() => handleZoom(-0.2)} />
        </Tooltip>
        <span style={{ fontSize: 12, minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>

        <div style={{ borderLeft: '1px solid #d9d9d9', height: 24, margin: '0 4px' }} />

        <Tooltip title="Повернуть влево">
          <Button icon={<RotateLeftOutlined />} onClick={() => handleRotate(-90)} />
        </Tooltip>
        <Tooltip title="Повернуть вправо">
          <Button icon={<RotateRightOutlined />} onClick={() => handleRotate(90)} />
        </Tooltip>

        <div style={{ borderLeft: '1px solid #d9d9d9', height: 24, margin: '0 4px' }} />

        <ColorPicker value={brushColor} onChange={(_, hex) => setBrushColor(hex)} size="small" />
        <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>Толщина:</span>
        <Slider
          min={1} max={20} value={brushWidth}
          onChange={setBrushWidth}
          style={{ width: 80, margin: 0 }}
        />

        <div style={{ borderLeft: '1px solid #d9d9d9', height: 24, margin: '0 4px' }} />

        <Tooltip title="Отменить">
          <Button icon={<UndoOutlined />} onClick={handleUndo} />
        </Tooltip>
        <Tooltip title="Удалить выбранное">
          <Button icon={<DeleteOutlined />} danger onClick={handleDeleteSelected} />
        </Tooltip>
      </div>

      <Space style={{ marginBottom: 8 }}>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          Сохранить изменения
        </Button>
        <Button icon={<PrinterOutlined />} onClick={handlePrint}>
          Печать
        </Button>
      </Space>

      <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'auto', background: '#fafafa' }}>
        <canvas ref={canvasRef} />
      </div>
    </Modal>
  );
};
