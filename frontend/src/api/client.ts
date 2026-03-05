import axios, { AxiosInstance } from 'axios';
import type { LoginResponse, Cabinet, TelegramAccount, Chat, Message } from '../types';

const TOKEN_KEY = 'tg_access_token';
const REFRESH_KEY = 'tg_refresh_token';

export class ApiClient {
  baseURL = '/api';
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: this.baseURL });

    // Auto-attach token
    this.client.interceptors.request.use((cfg) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        cfg.headers.Authorization = `Bearer ${token}`;
      }
      return cfg;
    });

    // Auto-refresh on 401
    this.client.interceptors.response.use(
      (res) => res,
      async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
          original._retry = true;
          const refreshToken = localStorage.getItem(REFRESH_KEY);
          if (refreshToken) {
            try {
              const res = await axios.post(`${this.baseURL}/auth/refresh`, { refreshToken });
              this.saveTokens(res.data.accessToken, res.data.refreshToken);
              original.headers.Authorization = `Bearer ${res.data.accessToken}`;
              return this.client(original);
            } catch {
              this.clearTokens();
            }
          }
        }
        return Promise.reject(err);
      }
    );
  }

  saveTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }

  clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await this.client.post('/auth/login', { email, password });
    this.saveTokens(res.data.accessToken, res.data.refreshToken);
    return res.data;
  }

  async register(email: string, password: string) {
    const res = await this.client.post('/auth/register', { email, password });
    return res.data;
  }

  async getCabinets(): Promise<Cabinet[]> {
    const res = await this.client.get('/cabinets');
    return res.data;
  }

  async createCabinet(name: string): Promise<Cabinet> {
    const res = await this.client.post('/cabinets', { name });
    return res.data;
  }

  async assignUserToCabinet(cabinetId: number, userId: number) {
    const res = await this.client.post(`/cabinets/${cabinetId}/users`, { userId });
    return res.data;
  }

  async getAccounts(): Promise<TelegramAccount[]> {
    const res = await this.client.get('/telegram/accounts');
    return res.data;
  }

  async createAccount(phone: string, cabinetId: number, displayName?: string): Promise<TelegramAccount> {
    const res = await this.client.post('/telegram/accounts', { phone, cabinetId, displayName });
    return res.data;
  }

  async sendCode(accountId: number): Promise<{ codeSent: boolean; phone: string }> {
    const res = await this.client.post(`/telegram/accounts/${accountId}/send-code`);
    return res.data;
  }

  async confirmCode(accountId: number, code: string): Promise<{ success?: boolean; needsPassword?: boolean }> {
    const res = await this.client.post(`/telegram/accounts/${accountId}/confirm-code`, { code });
    return res.data;
  }

  async confirmPassword(accountId: number, password: string): Promise<{ success: boolean }> {
    const res = await this.client.post(`/telegram/accounts/${accountId}/confirm-password`, { password });
    return res.data;
  }

  async syncDialogs(accountId: number): Promise<{ synced: number }> {
    const res = await this.client.post(`/telegram/accounts/${accountId}/sync-dialogs`);
    return res.data;
  }

  async getChats(accountId: number): Promise<Chat[]> {
    const res = await this.client.get('/chats', { params: { accountId } });
    return res.data;
  }

  async getMessages(chatId: number): Promise<Message[]> {
    const res = await this.client.get(`/chats/${chatId}/messages`);
    return res.data;
  }

  async sendMessage(chatId: number, accountId: number, text: string): Promise<Message> {
    const res = await this.client.post(`/chats/${chatId}/messages`, { accountId, text });
    return res.data;
  }

  async syncMessages(chatId: number): Promise<Message[]> {
    const res = await this.client.post(`/chats/${chatId}/sync-messages`);
    return res.data;
  }
}

export const api = new ApiClient();
