import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { LogOut, RefreshCw } from 'lucide-react';
import CabinetSelector from './CabinetSelector';
import ChatPanel from './ChatPanel';
import AccountLoginDialog from './AccountLoginDialog';
import AddAccountDialog from './AddAccountDialog';
import { api } from '../api/client';
import type { User, Cabinet, TelegramAccount } from '../types';

interface Props {
  user: User;
  socket: Socket | null;
  onLogout: () => void;
}

export default function Dashboard({ user, socket, onLogout }: Props) {
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TelegramAccount | null>(null);
  const [loginAccount, setLoginAccount] = useState<TelegramAccount | null>(null);
  const [addAccountCabinet, setAddAccountCabinet] = useState<Cabinet | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [cabs, accs] = await Promise.all([api.getCabinets(), api.getAccounts()]);
      setCabinets(cabs);
      setAccounts(accs);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAccountCreated = (account: TelegramAccount) => {
    setAccounts((prev) => [...prev, account]);
    setAddAccountCabinet(null);
  };

  const handleAccountLoggedIn = (accountId: number) => {
    setLoginAccount(null);
    // Refresh accounts to get updated status
    api.getAccounts().then(setAccounts).catch(console.error);
    // Auto-select the newly logged-in account
    const acc = accounts.find((a) => a.id === accountId);
    if (acc) setSelectedAccount({ ...acc, status: 'active' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-card border-b flex items-center justify-between px-4 z-50">
        <h1 className="text-sm font-semibold text-foreground">Telegram Client</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{user.email || user.role}</span>
          <button
            onClick={() => loadData()}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content below header */}
      <div className="flex w-full pt-12">
        <CabinetSelector
          cabinets={cabinets}
          accounts={accounts}
          selectedAccount={selectedAccount}
          isAdmin={user.role === 'admin'}
          onSelectAccount={setSelectedAccount}
          onLoginAccount={setLoginAccount}
          onAddAccount={setAddAccountCabinet}
        />

        <div className="flex-1">
          {selectedAccount ? (
            <ChatPanel socket={socket} account={selectedAccount} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select an account to view chats
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {loginAccount && (
        <AccountLoginDialog
          account={loginAccount}
          onClose={() => setLoginAccount(null)}
          onSuccess={handleAccountLoggedIn}
        />
      )}

      {addAccountCabinet && (
        <AddAccountDialog
          cabinet={addAccountCabinet}
          onClose={() => setAddAccountCabinet(null)}
          onCreated={handleAccountCreated}
        />
      )}
    </div>
  );
}
