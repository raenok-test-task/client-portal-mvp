import axios from 'axios';
import type {
  ChatResponse,
  LoginResponse,
  Order,
  OrderStatus,
  Profile,
  SupportTicket,
} from './types';

const TOKEN_KEY = '4blanc_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/login', { email, password });
  return data;
}

export async function getProfile(): Promise<Profile> {
  const { data } = await api.get<Profile>('/profile');
  return data;
}

export async function getOrders(params: {
  search?: string;
  status?: OrderStatus | '';
}): Promise<Order[]> {
  const query: Record<string, string> = {};
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  const { data } = await api.get<Order[]>('/orders', { params: query });
  return data;
}

export async function createSupportTicket(payload: {
  subject: string;
  message: string;
}): Promise<SupportTicket> {
  const { data } = await api.post<SupportTicket>('/support-ticket', payload);
  return data;
}

export async function askAssistant(message: string): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/assistant/chat', { message });
  return data;
}

export function extractError(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}
