import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import LoginForm from './components/LoginForm';
import CabinetSelector from './components/CabinetSelector';
import ChatPanel from './components/ChatPanel';
import { ApiClient } from './api/client';
import { Cabinet, TelegramAccount } from './types';

const api = new ApiClient();

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [auth, setAuth] = useState<{ token: string; user: any } | null>(null);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<TelegramAccount | null>(null);

  useEffect(() => {
    if (!auth) return;
    api.setToken(auth.token);
    api
      .fetchCabinets()
      .then((data) => setCabinets(data))
      .catch(console.error);
    api
      .fetchAccounts()
      .then((data) => setAccounts(data))
      .catch(console.error);
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    const s = io(api.baseURL.replace(/\/api$/, ''), {
      auth: { token: auth.token },
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [auth]);

  const handleLoggedIn = (token: string, user: any) => {
    setAuth({ token, user });
  };

  const filteredAccounts = useMemo(() => {
    if (!selectedCabinet) return accounts;
    return accounts.filter((acc) => acc.cabinetId === selectedCabinet.id);
  }, [accounts, selectedCabinet]);

  if (!auth) {
    return <LoginForm onLogin={handleLoggedIn} api={api} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, Arial, sans-serif' }}>
      <CabinetSelector
        cabinets={cabinets}
        accounts={filteredAccounts}
        onSelectCabinet={(cab) => {
          setSelectedCabinet(cab);
          setSelectedAccount(null);
        }}
        onSelectAccount={setSelectedAccount}
        selectedAccount={selectedAccount}
      />
      {selectedAccount && <ChatPanel api={api} socket={socket} account={selectedAccount} />}
      {!selectedAccount && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
          <div>Select an account to view chats.</div>
        </div>
      )}
    </div>
  );
}

export default App;
