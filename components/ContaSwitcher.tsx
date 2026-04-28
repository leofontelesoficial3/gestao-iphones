'use client';
import { useEffect, useState } from 'react';
import { ContaInfo, getContas, getContaOverride, setContaOverride } from '@/lib/storage';
import { useAuth } from './AuthProvider';

export default function ContaSwitcher() {
  const { isSuperAdmin } = useAuth();
  const [contas, setContas] = useState<ContaInfo[]>([]);
  const [contaAtiva, setContaAtiva] = useState<string>('default');

  useEffect(() => {
    if (!isSuperAdmin) return;
    getContas().then(setContas);
    setContaAtiva(getContaOverride() || 'default');
  }, [isSuperAdmin]);

  if (!isSuperAdmin) return null;

  const handleChange = (conta: string) => {
    setContaAtiva(conta);
    setContaOverride(conta);
    // Recarrega para todos os componentes pegarem a nova conta
    window.location.reload();
  };

  return (
    <select
      value={contaAtiva}
      onChange={e => handleChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors max-w-[180px]"
      style={{ backdropFilter: 'blur(4px)' }}
      title="Visualizar dados da conta"
    >
      {contas.map(c => (
        <option key={c.conta} value={c.conta} className="text-gray-800">
          🏪 {c.nomeLoja || c.conta} ({c.totalProdutos})
        </option>
      ))}
    </select>
  );
}
