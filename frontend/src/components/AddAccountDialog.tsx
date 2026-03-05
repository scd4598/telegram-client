import { useState } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { api } from '../api/client';
import type { Cabinet, TelegramAccount } from '../types';

interface Props {
  cabinet: Cabinet;
  onClose: () => void;
  onCreated: (account: TelegramAccount) => void;
}

export default function AddAccountDialog({ cabinet, onClose, onCreated }: Props) {
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const account = await api.createAccount(phone, cabinet.id, displayName || undefined);
      onCreated(account);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-semibold">Add Account to {cabinet.name}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+380991234567"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Display name (optional)</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="My Account"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Account
          </button>
        </form>
      </div>
    </div>
  );
}
