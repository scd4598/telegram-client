import { useState } from 'react';
import { ApiClient } from '../api/client';

interface Props {
  onLogin: (token: string, user: any) => void;
  api: ApiClient;
}

export default function LoginForm({ onLogin, api }: Props) {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await api.login(email, password);
      onLogin(result.accessToken, result.user);
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <form onSubmit={submit} style={{ border: '1px solid #ddd', padding: 24, borderRadius: 8, width: 320 }}>
        <h3>Login</h3>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
