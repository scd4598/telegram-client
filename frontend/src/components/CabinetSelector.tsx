import { useState } from 'react';
import { ChevronDown, ChevronRight, Phone, Plus, KeyRound, CircleDot } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Cabinet, TelegramAccount } from '../types';

interface Props {
  cabinets: Cabinet[];
  accounts: TelegramAccount[];
  selectedAccount: TelegramAccount | null;
  isAdmin: boolean;
  onSelectAccount: (account: TelegramAccount) => void;
  onLoginAccount: (account: TelegramAccount) => void;
  onAddAccount: (cabinet: Cabinet) => void;
}

const statusColors: Record<string, string> = {
  active: 'text-green-500',
  paused: 'text-yellow-500',
  risk: 'text-orange-500',
  error: 'text-red-500',
};

export default function CabinetSelector({
  cabinets,
  accounts,
  selectedAccount,
  isAdmin,
  onSelectAccount,
  onLoginAccount,
  onAddAccount,
}: Props) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleCabinet = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getAccountsForCabinet = (cabinetId: number) =>
    accounts.filter((a) => a.cabinetId === cabinetId);

  return (
    <div className="w-72 border-r bg-sidebar overflow-y-auto flex-shrink-0">
      <div className="p-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Cabinets
        </h2>
        <div className="space-y-1">
          {cabinets.map((cab) => {
            const cabAccounts = getAccountsForCabinet(cab.id);
            const isExpanded = expanded[cab.id] !== false; // default open

            return (
              <div key={cab.id}>
                <button
                  onClick={() => toggleCabinet(cab.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className="font-medium truncate">{cab.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{cabAccounts.length}</span>
                </button>

                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {cabAccounts.map((acc) => (
                      <div key={acc.id} className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            acc.status === 'active'
                              ? onSelectAccount(acc)
                              : onLoginAccount(acc)
                          }
                          className={cn(
                            'flex-1 flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left',
                            selectedAccount?.id === acc.id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          )}
                        >
                          <CircleDot className={cn('w-3 h-3 flex-shrink-0', statusColors[acc.status])} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium">
                              {acc.displayName || acc.phone}
                            </div>
                            <div className={cn(
                              'text-[10px]',
                              selectedAccount?.id === acc.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}>
                              {acc.status}
                            </div>
                          </div>
                        </button>
                        {isAdmin && acc.status !== 'active' && (
                          <button
                            onClick={() => onLoginAccount(acc)}
                            className="p-1 rounded hover:bg-accent text-muted-foreground"
                            title="Login account"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {isAdmin && (
                      <button
                        onClick={() => onAddAccount(cab)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent rounded-md transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add account
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
