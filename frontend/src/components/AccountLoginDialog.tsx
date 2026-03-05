import { useState } from 'react';
import { X, Loader2, Phone, KeyRound, Lock } from 'lucide-react';
import { api } from '../api/client';
import type { TelegramAccount } from '../types';

interface Props {
  account: TelegramAccount;
  onClose: () => void;
  onSuccess: (accountId: number) => void;
}

type Step = 'idle' | 'code_sent' | 'needs_password';

export default function AccountLoginDialog({ account, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    setError('');
    setLoading(true);
    try {
      await api.sendCode(account.id);
      setStep('code_sent');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await api.confirmCode(account.id, code);
      if (result.needsPassword) {
        setStep('needs_password');
      } else {
        onSuccess(account.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const confirmPasswordStep = async () => {
    setError('');
    setLoading(true);
    try {
      await api.confirmPassword(account.id, password);
      onSuccess(account.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-semibold">Login Telegram Account</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{account.phone}</span>
            <span className="text-muted-foreground">
              {account.displayName && `(${account.displayName})`}
            </span>
          </div>

          {step === 'idle' && (
            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Send verification code
            </button>
          )}

          {step === 'code_sent' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                A code has been sent to your Telegram app. Enter it below.
              </p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code"
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <button
                onClick={confirmCode}
                disabled={loading || !code.trim()}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm code
              </button>
            </div>
          )}

          {step === 'needs_password' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                This account has two-factor authentication. Enter your cloud password.
              </p>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Cloud password"
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
              <button
                onClick={confirmPasswordStep}
                disabled={loading || !password.trim()}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm password
              </button>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
