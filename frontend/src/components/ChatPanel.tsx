import { useEffect, useMemo, useState } from 'react';
import { Socket } from 'socket.io-client';
import MessageList from './MessageList';
import { ApiClient } from '../api/client';
import { Chat, Message, TelegramAccount } from '../types';

interface Props {
  api: ApiClient;
  socket: Socket | null;
  account: TelegramAccount;
}

export default function ChatPanel({ api, socket, account }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!account) return;
    api.fetchChats(account.id).then((data) => setChats(data));
  }, [account, api]);

  useEffect(() => {
    if (!selectedChat) return;
    api.fetchMessages(selectedChat.id).then((data) => setMessages(data));
  }, [selectedChat, api]);

  useEffect(() => {
    if (!socket) return;
    const onNewMessage = (payload: any) => {
      if (payload.accountId !== account.id) return;
      if (selectedChat && payload.chatId === selectedChat.id) {
        setMessages((prev) => [...prev, payload.message]);
      }
      setChats((prev) => {
        const updated = prev.map((c) =>
          c.id === payload.chatId
            ? { ...c, lastMessageText: payload.message.text, lastMessageAt: payload.message.sentAt }
            : c,
        );
        return updated;
      });
    };
    socket.on('new_message', onNewMessage);
    return () => {
      socket.off('new_message', onNewMessage);
    };
  }, [socket, account, selectedChat]);

  const send = async () => {
    if (!selectedChat || !text.trim()) return;
    const message = await api.sendMessage(selectedChat.id, account.id, text.trim());
    setMessages((prev) => [...prev, message]);
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChat.id
          ? { ...c, lastMessageText: message.text, lastMessageAt: message.sentAt }
          : c,
      ),
    );
    setText('');
  };

  const sortedChats = useMemo(
    () => chats.slice().sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '')),
    [chats],
  );

  return (
    <div style={{ flex: 1, display: 'flex' }}>
      <div style={{ width: 280, borderRight: '1px solid #eee', padding: 12 }}>
        <h3>Chats</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sortedChats.map((chat) => (
            <li key={chat.id}>
              <button
                style={{
                  background: selectedChat?.id === chat.id ? '#007bff' : '#f6f6f6',
                  color: selectedChat?.id === chat.id ? '#fff' : '#000',
                  width: '100%',
                  textAlign: 'left',
                  padding: 8,
                  marginBottom: 6,
                  borderRadius: 6,
                  border: '1px solid #ddd',
                }}
                onClick={() => setSelectedChat(chat)}
              >
                <div style={{ fontWeight: 600 }}>{chat.title || chat.chatId}</div>
                <div style={{ fontSize: 12 }}>{chat.lastMessageText || 'No messages yet'}</div>
                <div style={{ fontSize: 11, color: '#666' }}>Status: {chat.chatStatus}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {selectedChat ? <MessageList messages={messages} /> : <div>Select a chat</div>}
        </div>
        {selectedChat && (
          <div style={{ padding: 12, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ flex: 1 }}
              placeholder="Message"
            />
            <button onClick={send}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
}
