'use client';

import React, { useState, useEffect } from 'react';
import { Trade } from '../types/trade';
import { Search, Calendar, Eye, Trash2, Edit3, Filter, ChevronDown } from 'lucide-react';

interface TradeTableProps {
  trades: Trade[];
  onSelect: (t: Trade) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Trade) => void;
}

export const TradeTable = ({ trades, onSelect, onDelete, onEdit }: TradeTableProps) => {
  const [searchPair, setSearchPair] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const container = document.querySelector('.custom-scrollbar');
    const handleScroll = () => {
      if (container) {
        setIsScrolled(container.scrollTop > 50);
      }
    };
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredTrades = trades.filter((t) => {
    const matchesPair = t.pair.toLowerCase().includes(searchPair.toLowerCase());
    const matchesDate = filterDate ? t.date.startsWith(filterDate) : true;
    const matchesStatus = filterStatus === 'ALL' ? true : (t.status as string) === filterStatus;
    return matchesPair && matchesDate && matchesStatus;
  });

  // Function mibaiko ny loko isaky ny status
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Win':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'BE':
        return 'bg-white/5 text-white/60 border-white/10';
      case 'Loss':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Pending':
        return 'bg-[#a67c52]/10 text-[#a67c52]/60 border-[#a67c52]/20';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  // Function mibaiko ny lokon'ny PnL ($)
  const getPnLClass = (status: string, pnlValue: any) => {
    if ((status as string) === 'Pending') return 'text-slate-600';
    if ((status as string) === 'BE') return 'text-white/60'; // Loko neutre rehefa Break Even
    
    // Raha tsy Pending na BE dia miankina amin'ny sanda (Win na Loss)
    const pnlNum = Number(pnlValue);
    return pnlNum >= 0 ? 'text-cyan-400' : 'text-rose-400';
  };

  return (
    <div className="space-y-6 relative">
      {/* Bar de Recherche - Fade out on scroll */}
      <div className={`flex flex-wrap gap-4 items-center bg-[#0f172a]/95 p-3 rounded-2xl border border-white/10 backdrop-blur-xl sticky top-0 z-30 transition-all duration-500 ease-in-out ${
        isScrolled 
          ? 'opacity-0 -translate-y-4 pointer-events-none' 
          : 'opacity-100 translate-y-0 shadow-2xl shadow-black/50'
      }`}>
        
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a67c52]" size={16} />
          <input
            type="text"
            placeholder="Rechercher une paire..."
            className="w-full bg-transparent border-none py-2 pl-10 pr-4 text-white text-sm outline-none placeholder:text-slate-600 font-medium"
            value={searchPair}
            onChange={(e) => setSearchPair(e.target.value)}
          />
        </div>

        <div className="relative flex items-center bg-slate-800/50 rounded-xl px-3 border border-white/10">
          <Filter className="mr-2 text-[#a67c52]" size={14} />
          <select 
            className="bg-transparent border-none text-white text-[11px] font-black uppercase py-2.5 outline-none cursor-pointer appearance-none pr-6"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL" className="bg-[#0f172a]">TOUS LES STATUS</option>
            <option value="Pending" className="bg-[#0f172a]">PENDING ONLY</option>
            <option value="Win" className="bg-[#0f172a]">WIN ONLY</option>
            <option value="Loss" className="bg-[#0f172a]">LOSS ONLY</option>
            <option value="BE" className="bg-[#0f172a]">BE ONLY</option>
          </select>
          <ChevronDown className="absolute right-2 text-[#a67c52] pointer-events-none" size={14} />
        </div>

        <div className="relative flex items-center bg-slate-800/50 rounded-xl px-3 border border-white/10">
          <Calendar className="mr-2 text-[#a67c52]" size={14} />
          <input
            type="date"
            className="bg-transparent border-none text-[#a67c52] text-xs outline-none font-bold [color-scheme:dark] py-2"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="history-header px-2">
           <h2 className="text-sm font-black text-white tracking-widest uppercase italic flex items-center gap-3">
             <div className="w-8 h-[2px] bg-[#a67c52]"></div>
             Historique des Trades 
             <span className="text-[10px] text-slate-500 not-italic font-medium">({filteredTrades.length})</span>
           </h2>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-2 min-w-[850px]">
            <thead>
              <tr className="text-[#a67c52] text-[10px] font-black uppercase tracking-widest opacity-50">
                <th className="pb-2 px-6">Date</th>
                <th className="pb-2 px-4">Paire</th>
                <th className="pb-2 px-4 text-center">Type</th>
                <th className="pb-2 px-4 text-center">Lots</th>
                <th className="pb-2 px-4 text-center">Statut</th>
                <th className="pb-2 px-4 text-right">PnL ($)</th>
                <th className="pb-2 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((t) => (
                <tr key={t.id} className="trade-row group">
                  <td className="py-4 px-6 text-[11px] text-slate-500 font-mono italic">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                  <td className="py-4 px-4 font-black text-white text-lg tracking-tighter uppercase">{t.pair}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${t.type === 'Long' ? 'text-cyan-400 border-cyan-500/20' : 'text-rose-400 border-rose-500/20'}`}>{t.type.toUpperCase()}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-slate-300 font-mono text-sm font-bold">{t.lots}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-black border uppercase transition-all ${getStatusClass(t.status)}`}>
                      {t.status}
                    </div>
                  </td>
                  {/* Voahitsy eto ny t.status mba hampiasa as string */}
                  <td className={`py-4 px-4 text-right font-black font-mono text-xl ${getPnLClass(t.status, t.pnl)}`}>
                    {((t.status as string) === 'Pending') ? '---' : `${Number(t.pnl) > 0 ? `+${t.pnl}` : t.pnl}$`}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onSelect(t)} className="p-2 hover:bg-[#a67c52] rounded-lg text-slate-400 hover:text-white transition-all"><Eye size={16}/></button>
                      <button onClick={() => onEdit(t)} className="p-2 hover:bg-blue-600 rounded-lg text-slate-400 hover:text-white transition-all"><Edit3 size={16}/></button>
                      <button onClick={() => onDelete(t.id)} className="p-2 hover:bg-rose-600 rounded-lg text-slate-400 hover:text-white transition-all"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};