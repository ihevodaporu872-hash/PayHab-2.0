export interface IUser {
  id: string;
  username: string;
  full_name?: string;
}

export interface IProject {
  id: string;
  code?: string;
  name: string;
  related_names?: string;
  description?: string;
  status: string;
  created_at?: string;
}

export interface IEstimateSection {
  id: string;
  project_id: string;
  name: string;
  created_at?: string;
}

export interface ICostType {
  id: string;
  name: string;
  status: string;
  created_at?: string;
}

export type RequestModule = 'object' | 'material';

export const MODULE_LABELS: Record<RequestModule, string> = {
  object: 'Заявка-Объект',
  material: 'Заявка-Материал',
};

export type RequestType = 'by_estimate' | 'urgent' | 'by_specification';

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  by_estimate: 'По смете',
  urgent: 'Авральная',
  by_specification: 'По спецификации СМ',
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  sent: 'На согласовании',
  approved: 'Согласована',
  rejected: 'Отклонена',
};

export type ApprovalStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'returned';

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Ожидает',
  in_progress: 'На рассмотрении',
  approved: 'Согласовано',
  rejected: 'Отклонено',
  returned: 'Возвращено',
};

export interface IApprovalStage {
  id?: string;
  request_id?: string;
  stage_order: number;
  stage_name: string;
  approver_id?: string;
  approver_name?: string;
  status: ApprovalStatus;
  comment?: string;
  decided_at?: string;
  created_at?: string;
}

export interface IWarehouse {
  id: string;
  name: string;
  created_at?: string;
}

export interface IMaterialRequest {
  id: string;
  request_number: number;
  created_at: string;
  sent_at?: string;
  project_id?: string;
  request_type: RequestType;
  module: RequestModule;
  estimate_section_id?: string;
  manual_estimate_section?: string;
  cost_type_id?: string;
  warehouse_id?: string;
  order_date_from?: string;
  order_date_to?: string;
  justification?: string;
  status: string;
  created_by?: string;
  updated_at?: string;
  projects?: { name: string };
  cost_types?: { name: string };
  estimate_sections?: { name: string };
  warehouses?: { name: string };
  current_stage?: IApprovalStage | null;
}

export interface IMaterialRequestItem {
  id?: string;
  request_id?: string;
  sort_order: number;
  material?: string;
  manufacturer?: string;
  manager?: string;
  unit?: string;
  quantity?: number;
}

export interface IMaterialRequestFile {
  id: string;
  request_id: string;
  filename: string;
  storage_path: string;
  content_type?: string;
  size_bytes?: number;
  annotations?: string;
  created_at: string;
}

export interface IMaterialRequestComment {
  id: string;
  request_id: string;
  user_id?: string;
  username?: string;
  addressed_to?: string;
  addressed_to_name?: string;
  text: string;
  created_at: string;
}
