export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  number: string;
  date: string;
  status: OrderStatus;
  amount: number;
  currency: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string; name: string };
}

export interface ChatResponse {
  reply: string;
  source: 'mock' | 'openai';
  data?: unknown;
}

export const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];
