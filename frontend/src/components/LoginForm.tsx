import { useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import type { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

export default function LoginForm({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.login(email, password);
      onLogin(result.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <div className="w-full max-w-sm">
        <div className="bg-card border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">Telegram Client</h1>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="admin@local.dev"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter password"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
