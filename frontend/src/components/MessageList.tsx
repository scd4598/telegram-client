interface Props {
  messages: any[];
}

export default function MessageList({ messages }: Props) {
  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id} style={{ marginBottom: 8, textAlign: msg.direction === 'out' ? 'right' : 'left' }}>
          <div style={{ display: 'inline-block', background: msg.direction === 'out' ? '#007bff' : '#f1f1f1', color: msg.direction === 'out' ? '#fff' : '#000', padding: 8, borderRadius: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{msg.fromName || msg.direction}</div>
            <div>{msg.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
