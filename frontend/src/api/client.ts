import axios from 'axios';

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
    return res.data;
  }
}
