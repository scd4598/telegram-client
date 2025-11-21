interface Props {
  cabinets: any[];
  accounts: any[];
  onSelectCabinet: (cabinet: any) => void;
  onSelectAccount: (account: any) => void;
  selectedAccount: any | null;
}

export default function CabinetSelector({ cabinets, accounts, onSelectCabinet, onSelectAccount, selectedAccount }: Props) {
  return (
    <div style={{ width: 280, borderRight: '1px solid #eee', padding: 12 }}>
      <h3>Cabinets</h3>
      <ul>
        {cabinets.map((cab) => (
          <li key={cab.id}>
            <button onClick={() => onSelectCabinet(cab)}>{cab.name}</button>
          </li>
        ))}
      </ul>
      <h3>Accounts</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {accounts.map((acc) => (
          <li key={acc.id}>
            <button
              style={{
                background: selectedAccount?.id === acc.id ? '#007bff' : '#f6f6f6',
                color: selectedAccount?.id === acc.id ? '#fff' : '#000',
                width: '100%',
                textAlign: 'left',
                padding: 8,
                marginBottom: 6,
              }}
              onClick={() => onSelectAccount(acc)}
            >
              <div>{acc.displayName || acc.phone}</div>
              <small>Status: {acc.status}</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
