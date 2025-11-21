import { useEffect, useState } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import MessageList from './MessageList';
import { ApiClient } from '../api/client';

interface Props {
  api: ApiClient;
  socket: Socket | null;
  account: any;
}

export default function ChatPanel({ api, socket, account }: Props) {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!account) return;
    axios
      .get(`${api.baseURL}/chats`, { params: { accountId: account.id }, headers: api.headers })
      .then((res) => setChats(res.data));
  }, [account, api]);

  useEffect(() => {
    if (!selectedChat) return;
    axios
      .get(`${api.baseURL}/chats/${selectedChat.id}/messages`, { headers: api.headers })
      .then((res) => setMessages(res.data));
  }, [selectedChat, api]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_message', (payload: any) => {
      if (payload.accountId === account.id && selectedChat && payload.chatId === selectedChat.id) {
        setMessages((prev) => [...prev, payload.message]);
      }
    });
    return () => {
      socket.off('new_message');
    };
  }, [socket, account, selectedChat]);

  const send = async () => {
    if (!selectedChat) return;
    const res = await axios.post(
      `${api.baseURL}/chats/${selectedChat.id}/messages`,
      { accountId: account.id, text },
      { headers: api.headers }
    );
    setMessages((prev) => [...prev, res.data]);
    setText('');
  };

  return (
    <div style={{ flex: 1, display: 'flex' }}>
      <div style={{ width: 260, borderRight: '1px solid #eee', padding: 12 }}>
        <h3>Chats</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {chats.map((chat) => (
            <li key={chat.id}>
              <button
                style={{
                  background: selectedChat?.id === chat.id ? '#007bff' : '#f6f6f6',
                  color: selectedChat?.id === chat.id ? '#fff' : '#000',
                  width: '100%',
                  textAlign: 'left',
                  padding: 8,
                  marginBottom: 6,
                }}
                onClick={() => setSelectedChat(chat)}
              >
                <div>{chat.title || chat.chatId}</div>
                <small>{chat.lastMessageText}</small>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {selectedChat ? (
            <MessageList messages={messages} />
          ) : (
            <div>Select a chat</div>
          )}
        </div>
        {selectedChat && (
          <div style={{ padding: 12, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
            <input value={text} onChange={(e) => setText(e.target.value)} style={{ flex: 1 }} placeholder="Message" />
            <button onClick={send}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
}
