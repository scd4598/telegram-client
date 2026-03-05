import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Send, RefreshCw, Search, MessageCircle, Loader2 } from 'lucide-react';
import MessageList from './MessageList';
import { api } from '../api/client';
import { cn } from '../lib/utils';
import type { TelegramAccount, Chat, Message, NewMessageEvent } from '../types';

interface Props {
  socket: Socket | null;
  account: TelegramAccount;
}

export default function ChatPanel({ socket, account }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedChat(null);
    setChats([]);
    setMessages([]);
    if (!account) return;
    setLoadingChats(true);
    api.getChats(account.id)
      .then(setChats)
      .catch(console.error)
      .finally(() => setLoadingChats(false));
  }, [account]);

  useEffect(() => {
    if (!selectedChat) return;
    setLoadingMessages(true);
    api.getMessages(selectedChat.id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }, [selectedChat]);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: NewMessageEvent) => {
      if (payload.accountId === account.id) {
        // Update chat list
        setChats((prev) =>
          prev.map((c) =>
            c.id === payload.chatId
              ? { ...c, lastMessageText: payload.message.text, lastMessageAt: payload.message.sentAt }
              : c
          )
        );
        // Add message to current chat
        if (selectedChat && payload.chatId === selectedChat.id) {
          setMessages((prev) => [...prev, payload.message]);
        }
      }
    };
    socket.on('new_message', handler);
    return () => {
      socket.off('new_message', handler);
    };
  }, [socket, account, selectedChat]);

  const send = async () => {
    if (!selectedChat || !text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await api.sendMessage(selectedChat.id, account.id, text);
      setMessages((prev) => [...prev, msg]);
      setText('');
      inputRef.current?.focus();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const syncDialogs = async () => {
    setSyncing(true);
    try {
      await api.syncDialogs(account.id);
      const updatedChats = await api.getChats(account.id);
      setChats(updatedChats);
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const filteredChats = search
    ? chats.filter(
        (c) =>
          c.title?.toLowerCase().includes(search.toLowerCase()) ||
          c.chatId.includes(search)
      )
    : chats;

  const statusBadge = (status: Chat['chatStatus']) => {
    const colors = {
      not_contacted: 'bg-gray-200 text-gray-700',
      first_sent: 'bg-yellow-100 text-yellow-700',
      responded: 'bg-green-100 text-green-700',
    };
    return (
      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', colors[status])}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="flex h-full">
      {/* Chat list */}
      <div className="w-72 border-r flex flex-col">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Chats</h3>
            <button
              onClick={syncDialogs}
              disabled={syncing}
              className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
              title="Sync from Telegram"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-7 pr-3 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No chats yet. Sync from Telegram.
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  'w-full text-left px-3 py-2.5 border-b transition-colors',
                  selectedChat?.id === chat.id ? 'bg-accent' : 'hover:bg-muted/50'
                )}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium truncate">
                    {chat.title || chat.chatId}
                  </span>
                  {statusBadge(chat.chatStatus)}
                </div>
                {chat.lastMessageText && (
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMessageText}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">{selectedChat.title || selectedChat.chatId}</h3>
                <span className="text-xs text-muted-foreground">
                  {selectedChat.isPrivate ? 'Private chat' : 'Group'}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <MessageList messages={messages} />
              )}
            </div>
            <div className="px-4 py-3 border-t">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send)"
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={send}
                  disabled={!text.trim() || sending}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <MessageCircle className="w-10 h-10" />
            <p className="text-sm">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
