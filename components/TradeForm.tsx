'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, AlertCircle, MessageSquare, Trash2 } from 'lucide-react';
import { Trade } from '../types/trade';
import { motion } from 'framer-motion';

interface TradeFormProps {
  onSave: (data: any) => void;
  onClose: () => void;
  initialData?: Trade | null;
}

const SUGGESTED_PAIRS = [
  'EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 
  'USDCAD', 'USDCHF', 'USDJPY', 'EURGBP', 
  'EURJPY', 'GBPJPY', 'XAUUSD', 'BTCUSD'
];

const SUGGESTED_LOTS = ['0.01', '0.02', '0.05', '0.10', '0.25', '0.50', '1.00', '2.00'];

export const TradeForm = ({ onSave, onClose, initialData }: TradeFormProps) => {
  const [f, setF] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    session: 'London',
    pair: '',
    type: 'Long',
    status: 'Pending',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    pnl: '',
    lots: '',
    dailyBias: '', // Tehirizina eto ny vontoatiny
    analysisH1: '',
    analysisLTF: '',
    imgH1: '',
    imgLTF: '',
    imgM1: '',
    imgExtra1: '',
    imgExtra2: '',
    error: '',
    comment: ''
  });

  useEffect(() => {
    if (!initialData) {
      const currentHour = new Date().getHours();
      if (currentHour >= 13 && currentHour <= 23) {
        setF(prev => ({ ...prev, session: 'New York', status: 'Pending' }));
      } else {
        setF(prev => ({ ...prev, session: 'London', status: 'Pending' }));
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      const formatInitialDate = (dateVal: any) => {
        if (!dateVal) return new Date().toISOString().split('T')[0];
        try {
          if (typeof dateVal === 'string' && dateVal.includes('/')) {
            const parts = dateVal.split('/');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              let year = parts[2];
              if (year.length === 2) year = `20${year}`;
              return `${year}-${month}-${day}`;
            }
          }
          const parsedDate = new Date(dateVal);
          if (!isNaN(parsedDate.getTime())) {
            const yyyy = parsedDate.getFullYear();
            const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const dd = String(parsedDate.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          }
        } catch (e) {
          console.error("Error formatting date:", e);
        }
        return new Date().toISOString().split('T')[0];
      };

      setF({
        id: initialData.id || '',
        date: formatInitialDate(initialData.date),
        session: (initialData as any).session || 'London', 
        pair: initialData.pair || '',
        type: initialData.type || 'Long',
        status: (initialData.status as any) || 'Pending',
        entryPrice: initialData.entryPrice !== undefined && initialData.entryPrice !== null ? String(initialData.entryPrice).trim() : '',
        stopLoss: initialData.stopLoss !== undefined && initialData.stopLoss !== null ? String(initialData.stopLoss).trim() : '',
        takeProfit: initialData.takeProfit !== undefined && initialData.takeProfit !== null ? String(initialData.takeProfit).trim() : '',
        pnl: initialData.pnl !== undefined && initialData.pnl !== null ? String(initialData.pnl).trim() : '',
        lots: initialData.lots !== undefined && initialData.lots !== null ? String(initialData.lots).trim() : '',
        dailyBias: initialData.dailyBias || '', // FANITSIANA: Alaina tsara ny avy amin'ny tsindry Edit
        analysisH1: initialData.analysisH1 || '',
        analysisLTF: initialData.analysisLTF || '',
        imgH1: initialData.imgH1 || '',
        imgLTF: initialData.imgLTF || '',
        imgM1: initialData.imgM1 || '',
        imgExtra1: (initialData as any).imgExtra1 || '',
        imgExtra2: (initialData as any).imgExtra2 || '',
        error: initialData.error || '',
        comment: initialData.comment || ''
      });
    }
  }, [initialData]);

  const getStatusStyle = () => {
    if (f.status === 'Win') return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
    if (f.status === 'Loss') return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    if (f.status === 'BE') return 'bg-slate-500/10 border-slate-500/40 text-slate-400';
    return 'bg-[#a67c52]/10 border-[#a67c52]/30 text-[#a67c52]'; 
  };

  const handleStatusChange = (newStatus: string) => {
    let updatedPnL = f.pnl;

    if (newStatus === 'Loss' && f.pnl) {
      const numericValue = Math.abs(parseFloat(f.pnl.replace(/[^0-9.]/g, '')));
      updatedPnL = isNaN(numericValue) ? '-' : `-${numericValue}`;
    } else if (newStatus === 'BE') {
      updatedPnL = '0';
    } else if (newStatus === 'Win' && f.pnl) {
      const numericValue = Math.abs(parseFloat(f.pnl.replace(/[^0-9.]/g, '')));
      updatedPnL = isNaN(numericValue) ? '' : `${numericValue}`;
    }

    setF({ ...f, status: newStatus, pnl: updatedPnL });
  };

  const handlePnLChange = (value: string) => {
    if (f.status === 'BE') {
      setF({ ...f, pnl: '0' }); 
      return;
    }

    let cleanedValue = value;
    if (f.status === 'Loss') {
      const rawDigits = value.replace(/-/g, '');
      cleanedValue = rawDigits ? `-${rawDigits}` : '-';
    } else if (f.status === 'Win') {
      cleanedValue = value.replace(/-/g, '');
    }

    setF({ ...f, pnl: cleanedValue });
  };

  const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setF(prev => ({ ...prev, [key]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (key: string) => {
    setF(prev => ({ ...prev, [key]: '' }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(f); // Mandefa ny `f` manontolo miaraka amin'ny dailyBias
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative rounded-none sm:rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-[#0a0a0b] w-full max-w-5xl h-full sm:h-auto max-h-full sm:max-h-[92vh] border-0 sm:border border-white/10 shadow-2xl flex flex-col"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-5 md:p-8 border-b border-white/5 flex-shrink-0">
          <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase italic">
            {initialData ? 'Update' : 'New'} <span className="text-[#a67c52]">Position</span>
          </h2>
          <button type="button" onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-full transition text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* FORM BODY */}
        <form className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar space-y-8 pb-24 sm:pb-8" onSubmit={handleSave}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[#a67c52] uppercase tracking-[0.2em] block">Configuration</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  
                  {/* Date Input */}
                  <div className="w-full">
                    <label className="block text-[9px] text-[#a67c52] uppercase mb-1 font-black">Date d'Exécution</label>
                    <input 
                      type="date" 
                      value={f.date} 
                      className="w-full bg-white/5 p-3.5 rounded-xl border border-white/10 text-white outline-none focus:border-cyan-500/50 font-bold text-xs uppercase cursor-pointer"
                      onChange={e => setF({...f, date: e.target.value})}
                    />
                  </div>

                  {/* Session */}
                  <select 
                    value={f.session} 
                    className="w-full bg-white/5 p-3.5 rounded-xl border border-white/10 text-white font-bold outline-none text-xs cursor-pointer focus:border-cyan-500/50" 
                    onChange={e => setF({...f, session: e.target.value})}
                  >
                    <option value="London">🇬🇧 LONDON</option>
                    <option value="New York">🇺🇸 NEW YORK</option>
                  </select>

                  {/* Pair */}
                  <div className="relative w-full">
                    <input 
                      required 
                      list="pairs-list"
                      value={f.pair} 
                      className="w-full bg-white/5 p-3.5 rounded-xl border border-white/10 text-white outline-none focus:border-cyan-500/50 font-bold uppercase text-xs" 
                      placeholder="PAIRE" 
                      onChange={e => setF({...f, pair: e.target.value.toUpperCase()})} 
                    />
                    <datalist id="pairs-list">
                      {SUGGESTED_PAIRS.map((pair) => (
                        <option key={pair} value={pair} />
                      ))}
                    </datalist>
                  </div>
                  
                  {/* Type */}
                  <select value={f.type} className="w-full bg-white/5 p-3.5 rounded-xl border border-white/10 text-white font-bold outline-none text-xs cursor-pointer" onChange={e => setF({...f, type: e.target.value})}>
                    <option value="Long">📈 LONG</option>
                    <option value="Short">📉 SHORT</option>
                  </select>

                  {/* Status */}
                  <div className="w-full">
                    <select 
                      value={f.status} 
                      disabled={!initialData} 
                      className={`w-full p-3.5 rounded-xl border font-bold outline-none text-xs transition-all ${
                        !initialData ? 'bg-white/5 border-white/10 text-slate-400 cursor-not-allowed opacity-75' : getStatusStyle() + ' cursor-pointer'
                      }`} 
                      onChange={e => handleStatusChange(e.target.value)}
                    >
                      <option value="Pending">⌛ PENDING</option>
                      <option value="Win">✅ WIN</option>
                      <option value="Loss">❌ LOSS</option>
                      <option value="BE">⚖️ BE</option>
                    </select>
                  </div>

                  {/* Lots */}
                  <div className="relative w-full">
                    <input 
                      required 
                      type="text" 
                      list="lots-list"
                      value={f.lots} 
                      className="w-full bg-white/5 p-3.5 rounded-xl border border-white/10 text-white outline-none focus:border-cyan-500/50 font-mono text-xs font-bold" 
                      placeholder="LOTS (Ex: 0.01)" 
                      onChange={e => setF({...f, lots: e.target.value})} 
                    />
                    <datalist id="lots-list">
                      {SUGGESTED_LOTS.map((lot) => (
                        <option key={lot} value={lot} />
                      ))}
                    </datalist>
                  </div>

                </div>
              </div>

              {/* Textareas Analysis */}
              <div className="space-y-4">
                {/* DAILY BIAS (D1) */}
                <textarea 
                  value={f.dailyBias} 
                  className="w-full bg-white/5 p-4 rounded-xl border border-[#a67c52]/30 min-h-[70px] text-white outline-none focus:border-[#a67c52] text-xs italic resize-none" 
                  placeholder="Daily Bias (D1 Directionality)..." 
                  onChange={e => setF({...f, dailyBias: e.target.value})} 
                />
                <textarea value={f.analysisH1} className="w-full bg-white/5 p-4 rounded-xl border border-white/10 min-h-[100px] text-white outline-none focus:border-[#a67c52]/50 text-xs italic resize-none" placeholder="Context H1 / Day Analysis..." onChange={e => setF({...f, analysisH1: e.target.value})} />
                <textarea value={f.analysisLTF} className="w-full bg-white/5 p-4 rounded-xl border border-white/10 min-h-[100px] text-white outline-none focus:border-[#a67c52]/50 text-xs italic resize-none" placeholder="LTF Confirmation (M15/M5)..." onChange={e => setF({...f, analysisLTF: e.target.value})} />
              </div>

              {/* Commentaire */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em]">
                  <MessageSquare size={12} /> Commentaire
                </label>
                <textarea value={f.comment} className="w-full bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/20 text-white outline-none focus:border-cyan-500/50 text-xs italic resize-none" placeholder="Note personnelle sur le ressenti..." onChange={e => setF({...f, comment: e.target.value})} />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[#a67c52] uppercase tracking-[0.2em] block">Levels & PnL</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <label className="block text-[8px] text-[#a67c52] uppercase mb-0.5 font-black">Entry</label>
                    <input type="text" placeholder="0.00000" value={f.entryPrice} className="bg-transparent w-full text-white outline-none font-mono text-xs" onChange={e => setF({...f, entryPrice: e.target.value})} />
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <label className="block text-[8px] text-[#a67c52] uppercase mb-0.5 font-black">SL</label>
                    <input type="text" placeholder="0.00000" value={f.stopLoss} className="bg-transparent w-full text-white outline-none font-mono text-xs" onChange={e => setF({...f, stopLoss: e.target.value})} />
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <label className="block text-[8px] text-[#a67c52] uppercase mb-0.5 font-black">TP</label>
                    <input type="text" placeholder="0.00000" value={f.takeProfit} className="bg-transparent w-full text-white outline-none font-mono text-xs" onChange={e => setF({...f, takeProfit: e.target.value})} />
                  </div>
                  <div className={`p-2.5 rounded-xl border transition-all col-span-2 sm:col-span-1 ${getStatusStyle()}`}>
                    <label className="block text-[8px] uppercase mb-0.5 font-black">PnL ($)</label>
                    <input 
                      type="text" 
                      value={f.pnl} 
                      placeholder="0.00"
                      className="bg-transparent w-full outline-none font-mono font-black text-xs" 
                      onChange={e => handlePnLChange(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* Error log */}
              {initialData && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
                    <AlertCircle size={12} /> Erreur de trade
                  </label>
                  <textarea value={f.error} className="w-full bg-rose-500/5 p-4 rounded-xl border border-rose-500/20 text-rose-200 outline-none focus:border-rose-500/50 text-xs italic resize-none" placeholder="Ex: FOMO, Entry trop tôt..." onChange={e => setF({...f, error: e.target.value})} />
                </div>
              )}

              {/* Screenshots list */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[#a67c52] uppercase tracking-[0.2em] block">Screenshots</label>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                  {['imgH1', 'imgLTF', 'imgM1', 'imgExtra1', 'imgExtra2'].map((key) => (
                    <div key={key} className="flex gap-2 bg-white/5 p-2 rounded-xl border border-white/10 items-center">
                      <div className="flex-1 flex items-center gap-2 bg-black/20 px-2.5 rounded-lg border border-white/5 overflow-hidden">
                        <LinkIcon size={12} className={(f as any)[key] ? "text-cyan-400 flex-shrink-0" : "text-[#a67c52] flex-shrink-0"} />
                        <input className="bg-transparent outline-none text-[10px] w-full text-white py-2 truncate" placeholder={`Capture ${key.replace('img', '')}`} value={(f as any)[key]} onChange={e => setF({...f, [key]: e.target.value})} />
                      </div>
                      
                      {(f as any)[key] && (
                        <button type="button" onClick={() => removeImage(key)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition flex-shrink-0">
                          <Trash2 size={12} />
                        </button>
                      )}

                      <label className="p-2 bg-[#a67c52] rounded-lg cursor-pointer hover:bg-[#8e663f] transition flex-shrink-0">
                        <Upload size={12} className="text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(key, e)} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON FOR PC */}
          <div className="hidden sm:block pt-4">
            <button type="submit" className="w-full bg-[#a67c52] py-4 rounded-xl font-black text-white transition-all uppercase tracking-[0.3em] text-xs shadow-xl hover:bg-[#8e663f] active:scale-[0.98]">
              {initialData ? 'Mettre à jour le Trade' : 'Enregistrer le Trade'}
            </button>
          </div>
        </form>

        {/* FLOATING SAVE BUTTON FOR MOBILE */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0b]/90 backdrop-blur-md border-t border-white/5 z-50">
          <button onClick={handleSave} type="submit" className="w-full bg-[#a67c52] py-4 rounded-xl font-black text-white transition-all uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 text-center block">
            {initialData ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>

      </motion.div>
    </div>
  );
};