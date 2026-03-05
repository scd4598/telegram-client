import { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import type { Message } from '../types';

interface Props {
  messages: Message[];
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No messages yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((msg) => {
        const isOut = msg.direction === 'out';
        return (
          <div key={msg.id} className={cn('flex', isOut ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[70%] px-3 py-2 rounded-lg',
                isOut
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted rounded-bl-sm'
              )}
            >
              {!isOut && msg.fromName && (
                <div className={cn('text-[11px] font-medium mb-0.5', isOut ? 'text-primary-foreground/70' : 'text-primary')}>
                  {msg.fromName}
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap break-words">{msg.text}</div>
              <div className={cn('text-[10px] mt-0.5 text-right', isOut ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                {formatTime(msg.sentAt)}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
