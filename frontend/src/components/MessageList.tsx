import { Message } from '../types';

interface Props {
  messages: Message[];
}

export default function MessageList({ messages }: Props) {
  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id} style={{ marginBottom: 8, textAlign: msg.direction === 'out' ? 'right' : 'left' }}>
          <div
            style={{
              display: 'inline-block',
              background: msg.direction === 'out' ? '#007bff' : '#f1f1f1',
              color: msg.direction === 'out' ? '#fff' : '#000',
              padding: 8,
              borderRadius: 8,
              maxWidth: '80%',
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.8 }}>{msg.fromName || msg.direction}</div>
            <div>{msg.text}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
              {new Date(msg.sentAt).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
