import { Cabinet, TelegramAccount } from '../types';

interface Props {
  cabinets: Cabinet[];
  accounts: TelegramAccount[];
  onSelectCabinet: (cabinet: Cabinet | null) => void;
  onSelectAccount: (account: TelegramAccount) => void;
  selectedAccount: TelegramAccount | null;
}

export default function CabinetSelector({ cabinets, accounts, onSelectCabinet, onSelectAccount, selectedAccount }: Props) {
  return (
    <div style={{ width: 300, borderRight: '1px solid #eee', padding: 12, overflowY: 'auto' }}>
      <h3>Cabinets</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>
          <button onClick={() => onSelectCabinet(null)} style={{ marginBottom: 6 }}>All</button>
        </li>
        {cabinets.map((cab) => (
          <li key={cab.id}>
            <button onClick={() => onSelectCabinet(cab)} style={{ marginBottom: 6 }}>
              {cab.name}
            </button>
          </li>
        ))}
      </ul>
      <h3>Accounts</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {accounts.map((acc) => {
          const usage = acc.accountDailyLimits?.[0];
          return (
            <li key={acc.id}>
              <button
                style={{
                  background: selectedAccount?.id === acc.id ? '#007bff' : '#f6f6f6',
                  color: selectedAccount?.id === acc.id ? '#fff' : '#000',
                  width: '100%',
                  textAlign: 'left',
                  padding: 8,
                  marginBottom: 6,
                  borderRadius: 6,
                  border: '1px solid #ddd',
                }}
                onClick={() => onSelectAccount(acc)}
              >
                <div style={{ fontWeight: 600 }}>{acc.displayName || acc.phone}</div>
                <div style={{ fontSize: 12 }}>
                  Status: {acc.status} {usage ? `· first messages ${usage.firstMessagesSent}/${usage.maxFirstPerDay}` : ''}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
