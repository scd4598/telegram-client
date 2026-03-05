import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import { api } from './api/client';
import type { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Restore session from localStorage
    const token = api.getAccessToken();
    if (token) {
      // Validate token by fetching cabinets
      api.getCabinets()
        .then(() => {
          // Token is valid, but we don't have user info in localStorage
          // Decode from JWT payload
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({ id: payload.userId, email: '', role: payload.role });
          } catch {
            api.clearTokens();
          }
        })
        .catch(() => {
          api.clearTokens();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      socket?.disconnect();
      setSocket(null);
      return;
    }
    const token = api.getAccessToken();
    if (!token) return;
    const s = io('/', { auth: { token } });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [user]);

  const handleLogin = useCallback((loginUser: User) => {
    setUser(loginUser);
    navigate('/');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    api.clearTokens();
    setUser(null);
    socket?.disconnect();
    setSocket(null);
    navigate('/login');
  }, [socket, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <LoginForm onLogin={handleLogin} />}
      />
      <Route
        path="/*"
        element={
          user ? (
            <Dashboard user={user} socket={socket} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

export default App;
