'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowLeft, Wallet, Percent, Target, ShieldAlert, Coins } from 'lucide-react';
import Link from 'next/link';

export default function MoneyManagementCalculator() {
  // --- STATES HO AN'NY INPUTS ---
  const [pair, setPair] = useState('EURUSD');
  const [balance, setBalance] = useState<number>(0);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [slPrice, setSlPrice] = useState<string>('');
  const [tpPrice, setTpPrice] = useState<string>('');

  // Fakana ny balance farany avy amin'ny API ho automatique voalohany
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const [resAcc, resTrades] = await Promise.all([
          fetch('/api/account'),
          fetch('/api/trades')
        ]);
        const dataAcc = await resAcc.json();
        const dataTrades = await resTrades.json();
        const initial = dataAcc.initialCapital || 0;
        const totalPnL = dataTrades.reduce((acc: number, t: any) => acc + (Number(t.pnl) || 0), 0);
        setBalance(initial + totalPnL);
      } catch (err) {
        console.error("Error fetching balance for calculator:", err);
      }
    };
    fetchBalance();
  }, []);

  // --- KAJY LOGIQUE NY TRADING ---
  const entry = parseFloat(entryPrice) || 0;
  const sl = parseFloat(slPrice) || 0;
  const tp = parseFloat(tpPrice) || 0;

  // 1. Kajy Risk $
  const riskAmount = (balance * riskPercent) / 100;

  // 2. Kajy Pips / Distance SL sy TP (Nampiana .toUpperCase() mba tsy ho diso kajy na litera kely aza no soratany)
  const pairUpper = pair.toUpperCase();
  const isJpy = pairUpper.includes('JPY');
  const isGold = pairUpper.includes('GOLD') || pairUpper.includes('XAU');
  
  // Raha Gold dia 10 ny multiplier, raha Jpy dia 100, raha Forex tsotra dia 10000
  const pipsMultiplier = isGold ? 10 : (isJpy ? 100 : 10000);
  
  const slDistance = entry && sl ? Math.abs(entry - sl) * pipsMultiplier : 0;
  const tpDistance = entry && tp ? Math.abs(entry - tp) * pipsMultiplier : 0;

  // 3. Kajy Lot Size (Natao mifanaraka amin'ny multiplier teo ambony ihany koa)
  const lotSize = slDistance > 0 ? (riskAmount / (slDistance * (isGold ? 10 : (isJpy ? 100 : 10)))) : 0;

  // 4. Kajy fidirana TP $ sy Risk Reward (RR)
  const tpAmount = lotSize * (tpDistance * (isGold ? 10 : (isJpy ? 100 : 10)));
  const riskReward = slDistance > 0 ? (tpDistance / slDistance) : 0;

  // 5. Margin estimation (Est. Leverage 1:100 ohatra)
  const marginRequired = lotSize > 0 ? (lotSize * 100000) / 100 : 0;

  return (
    <div className="min-h-screen w-full bg-[#0a0a0b] text-slate-200 font-sans p-6 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col h-full">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-3 bg-white/5 hover:bg-white/10 text-[#a67c52] border border-white/5 rounded-2xl transition-all">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
                <Calculator className="text-[#a67c52]" /> MONEY <span className="text-[#a67c52] italic">MANAGEMENT</span>
              </h1>
              <p className="text-slate-500 text-[10px] font-bold tracking-[0.3em] uppercase">Gestion de risque pro</p>
            </div>
          </div>
        </header>

        {/* MAIN BODY: SPLIT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT SIDE: INPUTS (5 Columns) ================= */}
          <div className="lg:col-span-5 bg-[#1e1510]/40 backdrop-blur-md border border-white/5 p-6 rounded-[2rem] shadow-2xl space-y-5">
            <div className="border-b border-white/5 pb-3">
              <h2 className="text-sm font-black text-[#a67c52] tracking-widest uppercase">1. Inputs Paramètres</h2>
            </div>

            {/* PAIRE & BALANCE */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Pair / Actif</label>
                
                {/* INPUT AZO SORATANA HO AN'NY PAIRS REHETRA + DATALIST SUGGESTIONS */}
                <input 
                  type="text"
                  list="pairs-suggestions"
                  value={pair} 
                  onChange={(e) => setPair(e.target.value)}
                  placeholder="Ex: EURUSD, BTCUSD..."
                  className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#a67c52] transition-colors uppercase"
                />
                
                {/* LISITRY NY SOSO-KEVITRA (MIPOITRA REHAFA CLIQUENA NY INPUT) */}
                <datalist id="pairs-suggestions">
                  <option value="EURUSD">EURUSD (Euro / US Dollar)</option>
                  <option value="GBPUSD">GBPUSD (Pound / US Dollar)</option>
                  <option value="AUDUSD">AUDUSD (Aussie / US Dollar)</option>
                  <option value="USDJPY">USDJPY (US Dollar / Yen)</option>
                  <option value="AUDJPY">AUDJPY (Aussie / Yen)</option>
                  <option value="GOLD">XAUUSD (GOLD)</option>
                  <option value="BTCUSD">BTCUSD (Bitcoin)</option>
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Balance ($)</label>
                <div className="relative">
                  <Wallet size={14} className="absolute left-4 top-4 text-slate-500" />
                  <input 
                    type="number" 
                    value={balance || ''} 
                    onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#a67c52]" 
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* RISK % & QUICK BUTTONS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Risque (%)</label>
                <span className="text-xs font-black text-cyan-400">{riskPercent}%</span>
              </div>
              <div className="relative">
                <Percent size={14} className="absolute left-4 top-4 text-slate-500" />
                <input 
                  type="number" 
                  step="0.1"
                  value={riskPercent || ''} 
                  onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#a67c52]" 
                  placeholder="1"
                />
              </div>

              {/* QUICK RISK BUTTONS */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[0.5, 1, 2, 3].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRiskPercent(val)}
                    className={`py-2 text-xs font-black rounded-lg border transition-all ${
                      riskPercent === val 
                        ? 'bg-[#a67c52] text-white border-[#a67c52] shadow-lg shadow-[#a67c52]/20 scale-105' 
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* ENTRY, SL, TP */}
            <div className="space-y-4 pt-2 border-t border-white/5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Prix d'Entrée (Entry)</label>
                <div className="relative">
                  <Coins size={14} className="absolute left-4 top-4 text-slate-500" />
                  <input 
                    type="number" 
                    step="0.00001"
                    value={entryPrice} 
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#a67c52]" 
                    placeholder="1.08500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-rose-400 tracking-wider uppercase">Stop Loss (SL)</label>
                  <div className="relative">
                    <ShieldAlert size={14} className="absolute left-4 top-4 text-rose-500/50" />
                    <input 
                      type="number" 
                      step="0.00001"
                      value={slPrice} 
                      onChange={(e) => setSlPrice(e.target.value)}
                      className="w-full bg-[#0a0a0b] border border-rose-500/20 focus:border-rose-500 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white focus:outline-none" 
                      placeholder="1.08400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">Take Profit (TP)</label>
                  <div className="relative">
                    <Target size={14} className="absolute left-4 top-4 text-cyan-500/50" />
                    <input 
                      type="number" 
                      step="0.00001"
                      value={tpPrice} 
                      onChange={(e) => setTpPrice(e.target.value)}
                      className="w-full bg-[#0a0a0b] border border-cyan-500/20 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white focus:outline-none" 
                      placeholder="1.08700"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ================= RIGHT SIDE: RESULTATS (7 Columns) ================= */}
          <div className="lg:col-span-7 bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between self-stretch">
            
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-3">
                <h2 className="text-sm font-black text-slate-400 tracking-widest uppercase">2. Résultats de Sortie</h2>
              </div>

              {/* GRAND CHIFFRE: LOT SIZE */}
              <div className="bg-[#0a0a0b] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#a67c52]/5 rounded-full blur-3xl group-hover:bg-[#a67c52]/10 transition-all duration-500"></div>
                <p className="text-[10px] font-black text-[#a67c52] tracking-[0.2em] uppercase mb-1">LOT SIZE IDEAL</p>
                <motion.h3 
                  key={lotSize}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-black text-white tracking-tight"
                >
                  {lotSize > 0 && isFinite(lotSize) ? lotSize.toFixed(2) : '0.00'}
                  <span className="text-lg text-slate-500 font-normal ml-2">Lots</span>
                </motion.h3>
              </div>

              {/* GRID DETAILS CHIFFRES */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* RISK $ */}
                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                  <p className="text-[9px] font-bold text-rose-400 tracking-widest uppercase mb-1">RISK TOTAL ($)</p>
                  <h4 className="text-2xl font-black text-white">
                    -{riskAmount.toFixed(2)}$
                  </h4>
                </div>

                {/* TP $ */}
                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                  <p className="text-[9px] font-bold text-cyan-400 tracking-widest uppercase mb-1">GAIN ESTIMÉ TP ($)</p>
                  <h4 className="text-2xl font-black text-white">
                    {tpAmount > 0 && isFinite(tpAmount) ? `+${tpAmount.toFixed(2)}$` : '0.00$'}
                  </h4>
                </div>

                {/* RISK REWARD (RR) */}
                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                  <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1">RISK REWARD (RR)</p>
                  <h4 className={`text-2xl font-black ${riskReward >= 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    1 : {riskReward > 0 ? riskReward.toFixed(1) : '0.0'}
                  </h4>
                </div>

                {/* MARGIN REQUIRED */}
                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                  <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1">MARGIN REQUIS (EST.)</p>
                  <h4 className="text-2xl font-black text-slate-300">
                    {marginRequired > 0 ? `${marginRequired.toFixed(2)}$` : '0.00$'}
                  </h4>
                </div>

              </div>
            </div>

            {/* ADVICE FOOTER */}
            <div className="mt-8 pt-4 border-t border-white/5 text-[11px] text-slate-500 font-medium italic flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#a67c52] animate-ping"></span>
              Vous pouvez saisir librement la paire (par exemple : BTCUSD, GBPUSD), des suggestions s’affichent également.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}