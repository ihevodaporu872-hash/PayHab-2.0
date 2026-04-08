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

export type RequestType = 'by_estimate' | 'urgent' | 'by_specification' | 'over_estimate';

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  by_estimate: 'По смете',
  urgent: 'Авральная',
  by_specification: 'По спецификации СМ',
  over_estimate: 'Превышение сметы',
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  sent: 'На согласовании',
  approved: 'Согласована',
  rejected: 'Отклонена',
};

export interface IMaterialRequest {
  id: string;
  request_number: number;
  created_at: string;
  sent_at?: string;
  project_id?: string;
  request_type: RequestType;
  estimate_section_id?: string;
  manual_estimate_section?: string;
  cost_type_id?: string;
  justification?: string;
  status: string;
  created_by?: string;
  updated_at?: string;
  projects?: { name: string };
  cost_types?: { name: string };
  estimate_sections?: { name: string };
}

export interface IMaterialRequestItem {
  id?: string;
  request_id?: string;
  sort_order: number;
  material?: string;
  unit?: string;
  volume?: number;
  consumption_rate?: number;
  total_consumption?: number;
  price?: number;
  cost?: number;
  new_volume?: number;
  new_consumption_rate?: number;
  new_total_consumption?: number;
  new_price?: number;
  new_cost?: number;
}

export interface IMaterialRequestComment {
  id: string;
  request_id: string;
  user_id?: string;
  username?: string;
  text: string;
  created_at: string;
}
