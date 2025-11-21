import axios from 'axios';
import { Cabinet, Chat, Message, TelegramAccount } from '../types';

export class ApiClient {
  baseURL = '/api';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  get headers() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async login(email: string, password: string) {
    const res = await axios.post(`${this.baseURL}/auth/login`, { email, password });
    return res.data as { accessToken: string; refreshToken: string; user: any };
  }

  async fetchCabinets() {
    const res = await axios.get<Cabinet[]>(`${this.baseURL}/cabinets`, { headers: this.headers });
    return res.data;
  }

  async fetchAccounts() {
    const res = await axios.get<TelegramAccount[]>(`${this.baseURL}/telegram/accounts`, { headers: this.headers });
    return res.data;
  }

  async fetchChats(accountId: number) {
    const res = await axios.get<Chat[]>(`${this.baseURL}/chats`, { params: { accountId }, headers: this.headers });
    return res.data;
  }

  async fetchMessages(chatId: number) {
    const res = await axios.get<Message[]>(`${this.baseURL}/chats/${chatId}/messages`, { headers: this.headers });
    return res.data;
  }

  async sendMessage(chatId: number, accountId: number, text: string) {
    const res = await axios.post<Message>(
      `${this.baseURL}/chats/${chatId}/messages`,
      { accountId, text },
      { headers: this.headers },
    );
    return res.data;
  }
}
