import { useEffect, useState } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import LoginForm from './components/LoginForm';
import CabinetSelector from './components/CabinetSelector';
import ChatPanel from './components/ChatPanel';
import { ApiClient } from './api/client';

const api = new ApiClient();

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [auth, setAuth] = useState<{ token: string; user: any } | null>(null);
  const [cabinets, setCabinets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [selectedCabinet, setSelectedCabinet] = useState<any | null>(null);

  useEffect(() => {
    if (!auth) return;
    const s = io(api.baseURL.replace(/\/api$/, ''), { auth: { token: auth.token } });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    api.setToken(auth.token);
    axios
      .get(`${api.baseURL}/cabinets`, { headers: api.headers })
      .then((res) => setCabinets(res.data))
      .catch(console.error);
    axios
      .get(`${api.baseURL}/telegram/accounts`, { headers: api.headers })
      .then((res) => setAccounts(res.data))
      .catch(console.error);
  }, [auth]);

  const handleLoggedIn = (token: string, user: any) => {
    setAuth({ token, user });
  };

  if (!auth) {
    return <LoginForm onLogin={handleLoggedIn} api={api} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <CabinetSelector
        cabinets={cabinets}
        accounts={accounts}
        onSelectCabinet={setSelectedCabinet}
        onSelectAccount={setSelectedAccount}
        selectedAccount={selectedAccount}
      />
      {selectedAccount && (
        <ChatPanel api={api} socket={socket} account={selectedAccount} />
      )}
    </div>
  );
}

export default App;
