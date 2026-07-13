'use client';

import { useState, useEffect } from 'react';
import { Trade } from '../types/trade';
import { TradeTable } from '../components/TradeTable';
import { TradeForm } from '../components/TradeForm';
import { TradeDetails } from '../components/TradeDetails';
import { StatsCard } from '../components/StatsCard';
import { Plus, TrendingUp, Target, BarChart3, Wallet, Settings2, X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'DEPOT' | 'RETRAIT';
  amount: number;
  date: string;
}

export default function TradingJournal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [initialCapital, setInitialCapital] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Sivana vanim-potoana vaovao (Default: MOIS)
  const [periodFilter, setPeriodFilter] = useState<'MOIS' | 'SEMAINE' | 'ALL'>('MOIS');
  
  // State ho an'ny Inputs ao amin'ny Modal
  const [txType, setTxType] = useState<'DEPOT' | 'RETRAIT'>('DEPOT');
  const [txAmount, setTxAmount] = useState<string>('');

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fakana ny data rehetra rehefa manomboka
  const loadData = async () => {
    try {
      setLoading(true);
      const [resAcc, resTrades] = await Promise.all([
        fetch('/api/account'),
        fetch('/api/trades')
      ]);
      const dataAcc = await resAcc.json();
      const dataTrades = await resTrades.json();
      
      setInitialCapital(dataAcc.initialCapital || 0);
      setTransactions(dataAcc.transactions || []);
      setTrades(dataTrades);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Fitahirizana Trade (Save na Update)
  const onSaveTrade = async (data: any) => {
    try {
      const isEditing = !!tradeToEdit; 
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/trades/${tradeToEdit.id}` : '/api/trades';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (isEditing) {
          setTrades((prevTrades) => prevTrades.map((t) => (t.id === result.id ? result : t)));
          if (selectedTrade?.id === result.id) setSelectedTrade(result);
        } else {
          setTrades((prevTrades) => [result, ...prevTrades]);
        }
        setTradeToEdit(null);
        setIsFormOpen(false);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // 3. Famafana trade tokana
  const handleDeleteTrade = async (id: string) => {
    if (confirm('Voulez-vous supprimer ce trade ?')) {
      try {
        const response = await fetch(`/api/trades/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setTrades(prev => prev.filter(t => t.id !== id));
          if (selectedTrade?.id === id) setSelectedTrade(null);
        }
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setTradeToEdit(trade);
    setIsFormOpen(true);
  };

  // 4. Hanampiana Dépôt na Retrait vaovao
  const handleAddTransaction = async () => {
    if (!txAmount || isNaN(parseFloat(txAmount)) || parseFloat(txAmount) <= 0) {
      alert("Ampidiro dika sandam-bola marina");
      return;
    }

    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'ADD_TRANSACTION', 
          type: txType, 
          amount: parseFloat(txAmount) 
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setTransactions(updated.transactions || []);
        setTxAmount('');
        alert(`Opération ${txType === 'DEPOT' ? 'Dépôt' : 'Retrait'} vita soa aman-tsara!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- LOJIKA SIVANA VANIM-POTOANA (PÉRIODE FILTER) ---
  const filteredTrades = trades.filter((t) => {
    if (periodFilter === 'ALL') return true;

    // Famakiana ny daty (raha String na Date avy amin'ny DB)
    const tradeDate = new Date(t.date || (t as any).createdAt);
    const now = new Date();

    if (periodFilter === 'MOIS') {
      return tradeDate.getMonth() === now.getMonth() && tradeDate.getFullYear() === now.getFullYear();
    }

    if (periodFilter === 'SEMAINE') {
      const oneDay = 24 * 60 * 60 * 1000;
      const diffInTime = now.getTime() - tradeDate.getTime();
      return diffInTime >= 0 && diffInTime / oneDay <= 7;
    }

    return true;
  });

  // --- KAJY MIANKINA AMIN'NY SIVANA VOAFIDY ---
  const totalPnL = filteredTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
  
  // Kajy Net Deposits = Dépôts - Retraits
  const totalDepots = transactions.filter(t => t.type === 'DEPOT').reduce((acc, t) => acc + t.amount, 0);
  const totalRetraits = transactions.filter(t => t.type === 'RETRAIT').reduce((acc, t) => acc + t.amount, 0);
  const netDeposits = totalDepots - totalRetraits;

  // Balance feno = Capital Initial + Net Deposits + PNL Total voasivana
  const currentBalance = initialCapital + netDeposits + totalPnL;

  const winRate = filteredTrades.length > 0 
    ? ((filteredTrades.filter(t => t.status === 'Win').length / filteredTrades.length) * 100).toFixed(1) 
    : "0";

  if (loading) return (
    <div className="h-screen bg-[#0a0a0b] flex items-center justify-center">
      <div className="animate-pulse text-[#a67c52] font-black tracking-widest uppercase italic">Chargement...</div>
    </div>
  );

  return (
    <div className="h-screen w-full font-sans relative overflow-hidden text-slate-200 flex flex-col bg-[#0a0a0b]">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-4 flex flex-col h-full w-full">
        
        {/* HEADER */}
        <header className="flex flex-row justify-between items-center mb-6 shrink-0">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              Journal <span className="text-[#a67c52] italic">Scalping</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold tracking-[0.4em] uppercase">Analytics v2.0</p>
          </div>
          <button 
            onClick={() => { setTradeToEdit(null); setIsFormOpen(true); }} 
            className="px-6 py-3 rounded-xl bg-[#a67c52] text-white font-black hover:scale-105 transition-all shadow-lg shadow-[#a67c52]/20 flex items-center gap-2"
          >
            <Plus size={20} strokeWidth={3}/> NOUVEAU
          </button>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
          <StatsCard 
            title="BALANCE" 
            value={`${currentBalance.toFixed(2)}$`} 
            icon={Wallet} 
            color="text-cyan-400" 
            isEditable 
            onEdit={() => setIsSettingsOpen(true)} 
            hasCalculator={true} 
          />
          
          <StatsCard title="WIN RATE" value={`${winRate}%`} icon={Target} color="text-[#a67c52]" />
          <StatsCard title="TRADES" value={filteredTrades.length} icon={BarChart3} color="text-slate-300" />
          
          <div className={totalPnL > 0 ? "pnl-glow-positive rounded-3xl transition-all" : ""}>
             <StatsCard title="PnL TOTAL" value={`${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}$`} icon={TrendingUp} color={totalPnL >= 0 ? "text-cyan-400" : "text-rose-500"} />
          </div>
        </div>

        {/* SIVANA VANIM-POTOANA (BOKOTRA SELECTOR) */}
        <div className="flex flex-row items-center gap-2 mb-4 shrink-0 bg-white/[0.02] border border-white/5 p-2 rounded-2xl max-w-md">
          <button
            onClick={() => setPeriodFilter('MOIS')}
            className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${periodFilter === 'MOIS' ? 'bg-[#a67c52] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Ce Mois
          </button>
          <button
            onClick={() => setPeriodFilter('SEMAINE')}
            className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${periodFilter === 'SEMAINE' ? 'bg-[#a67c52] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Semaine
          </button>
          <button
            onClick={() => setPeriodFilter('ALL')}
            className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${periodFilter === 'ALL' ? 'bg-[#a67c52] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Global
          </button>
        </div>

        {/* TABLE CONTENT */}
        <div className="flex-1 min-h-0 bg-white/[0.02] rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <TradeTable 
              trades={filteredTrades} // filteredTrades sisa no ampidirina eto
              onSelect={setSelectedTrade} 
              onDelete={handleDeleteTrade} 
              onEdit={handleEditTrade} 
            />
          </div>
        </div>

        {/* MODAL MODERNE : DÉPÔT / RETRAIT IHANY */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#121214] border border-white/10 rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl">
              
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Settings2 size={20} className="text-[#a67c52]" />
                  <h3 className="font-black text-sm tracking-wider uppercase">Gestion des Fonds</h3>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col gap-6">
                
                {/* SECTION: DÉPÔT / RETRAIT BROKER */}
                <div className="flex flex-col gap-3 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <label className="text-[11px] font-bold text-[#a67c52] tracking-wider uppercase">Opération Compte Réel</label>
                  
                  {/* Selector Dépôt / Retrait */}
                  <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                    <button 
                      type="button"
                      onClick={() => setTxType('DEPOT')}
                      className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${txType === 'DEPOT' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
                    >
                      <ArrowUpCircle size={14} /> DÉPÔT
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTxType('RETRAIT')}
                      className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${txType === 'RETRAIT' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white'}`}
                    >
                      <ArrowDownCircle size={14} /> RETRAIT
                    </button>
                  </div>

                  {/* Input Montant */}
                  <div className="relative mt-1">
                    <input 
                      type="number" 
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-[#a67c52]"
                      placeholder="Montant ($)"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                  </div>

                  <button 
                    onClick={handleAddTransaction}
                    className={`w-full py-2.5 rounded-xl text-white font-black text-xs tracking-wider uppercase transition-all ${txType === 'DEPOT' ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-rose-600 hover:bg-rose-500'}`}
                  >
                    Valider l'opération ({txType})
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Modal: Add/Edit Trade */}
        {isFormOpen && (
          <TradeForm 
            onSave={onSaveTrade} 
            onClose={() => { setIsFormOpen(false); setTradeToEdit(null); }} 
            initialData={tradeToEdit} 
          />
        )}
        
        {/* Modal: View Details */}
        {selectedTrade && (
          <TradeDetails 
            trade={selectedTrade} 
            onClose={() => setSelectedTrade(null)} 
            onUpdateImage={(field, newValue) => {
              setTrades(prev => prev.map(t => t.id === selectedTrade.id ? { ...t, [field]: newValue } : t));
              setSelectedTrade(prev => prev ? { ...prev, [field]: newValue } : null);
            }} 
          />
        )}
      </div>
    </div>
  );
}