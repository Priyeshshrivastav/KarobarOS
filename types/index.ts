export type Role = 'owner' | 'staff';

export interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  phone?: string;
  working_hours?: Record<string, any>;
  currency: string;
  timezone: string;
  created_by?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone?: string;
  email?: string;
  tags?: string[];
  total_spent: number;
  last_visit_at?: string;
  created_at?: string;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  business_id: string;
  note: string;
  created_by?: string;
  created_at?: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  price: number;
  active: boolean;
  created_at?: string;
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  service_id?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  business_id: string;
  customer_id?: string;
  total_amount: number;
  status: 'completed' | 'pending' | 'refunded';
  created_by?: string;
  created_at?: string;
  customers?: Customer;
  sale_items?: SaleItem[];
}

export interface Payment {
  id: string;
  business_id: string;
  sale_id?: string;
  customer_id?: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  method?: 'cash' | 'upi' | 'card';
  paid_at?: string;
  created_at?: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  customer_id?: string;
  title?: string;
  starts_at: string;
  ends_at?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  created_by?: string;
  created_at?: string;
  customers?: Customer;
}

export interface Task {
  id: string;
  business_id: string;
  title: string;
  due_at?: string;
  status: 'pending' | 'completed';
  related_customer_id?: string;
  created_by?: string;
  created_at?: string;
  customers?: Customer;
}

export interface AiAction {
  id: string;
  business_id: string;
  conversation_id?: string;
  tool_name: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  status: 'success' | 'failed' | 'needs_confirmation';
  requires_confirmation: boolean;
  confirmed_at?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  business_id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}
