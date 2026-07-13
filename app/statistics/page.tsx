'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, ShieldCheck, Brain, BarChart3, 
  ArrowLeft, ArrowUpRight, DollarSign, Percent, 
  TrendingDown, CalendarRange, Zap, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function GlobalStatisticsDashboard() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('All'); 

  // Capital initial mifanaraka amin'ny journal ($15.00)
  const [startingCapital, setStartingCapital] = useState(15.00); 

  // 1. MAKA NY DATA AVY AMIN'NY API
  useEffect(() => {
    async function loadTrades() {
      try {
        const res = await fetch('/api/trades');
        const data = await res.json();
        if (Array.isArray(data)) {
          setTrades(data);
        }
      } catch (error) {
        console.error("Error fetching trades:", error);
      } finally {
        setLoading(false);
      }
    }
    loadTrades();
  }, []);

  // 2. SIVANA FOTOANA & FILAHARANA CHRONOLOGIQUE
  const filteredTrades = useMemo(() => {
    const now = new Date();
    
    const cleanedTrades = trades.filter(trade => trade.status?.toLowerCase() !== 'pending');

    // Alahatra: Tranainy indrindra -> Vaovao indrindra
    const sortedTrades = [...cleanedTrades].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return sortedTrades.filter((trade) => {
      if (timeFilter === 'All') return true;
      if (!trade.date) return false;
      
      const tradeDate = new Date(trade.date);
      const diffTime = Math.abs(now.getTime() - tradeDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (timeFilter === '7D') return diffDays <= 7;
      if (timeFilter === '30D') return diffDays <= 30;
      if (timeFilter === '90D') return diffDays <= 90;
      
      return true;
    });
  }, [trades, timeFilter]);

  // 3. KAJY STRATEGIC METRICS
  const metrics = useMemo(() => {
    const totalTrades = filteredTrades.length;
    
    let currentBalance = startingCapital;
    let peak = startingCapital;
    let maxDD = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    let profitToday = 0;
    let lossToday = 0;

    const lossesByDate: Record<string, number> = {};

    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    filteredTrades.forEach((t) => {
      const pnlValue = Number(t.pnl || 0);
      const statusClean = t.status?.toLowerCase();
      const isWin = statusClean === 'win' || pnlValue > 0;
      const isLoss = statusClean === 'loss' || pnlValue < 0;

      // Kajy Balance & Drawdown
      currentBalance += pnlValue;
      if (currentBalance > peak) {
        peak = currentBalance;
      }
      const currentDD = peak === 0 ? 0 : ((peak - currentBalance) / peak) * 100;
      if (currentDD > maxDD) {
        maxDD = currentDD;
      }

      // Kajy ny androany
      if (t.date) {
        const tradeDateStr = new Date(t.date).toISOString().split('T')[0];
        
        if (tradeDateStr === todayStr) {
          if (pnlValue > 0) profitToday += pnlValue;
          else if (pnlValue < 0) lossToday += Math.abs(pnlValue);
        }

        if (pnlValue < 0) {
          lossesByDate[tradeDateStr] = (lossesByDate[tradeDateStr] || 0) + Math.abs(pnlValue);
        }
      }

      // STREAKS ALGORITHM
      if (isWin) {
        currentWinStreak++;
        currentLossStreak = 0; 
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else if (isLoss) {
        currentLossStreak++;
        currentWinStreak = 0; 
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    });

    const tradingDaysWithLosses = Object.keys(lossesByDate).length;
    const avgDailyLoss = tradingDaysWithLosses === 0 
      ? 0 
      : Object.values(lossesByDate).reduce((sum, val) => sum + val, 0) / tradingDaysWithLosses;

    const totalPnLValue = currentBalance - startingCapital;
    const profitPercentage = startingCapital === 0 ? 0 : (totalPnLValue / startingCapital) * 100;

    const wins = filteredTrades.filter(t => t.status?.toLowerCase() === 'win' || Number(t.pnl || 0) > 0);
    const losses = filteredTrades.filter(t => t.status?.toLowerCase() === 'loss' || Number(t.pnl || 0) < 0);
    
    const winRate = totalTrades === 0 ? 0 : Math.round((wins.length / totalTrades) * 100);

    const totalWinVola = wins.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
    const totalLossVola = Math.abs(losses.reduce((sum, t) => sum + Number(t.pnl || 0), 0));
    
    const profitFactor = totalLossVola === 0 ? (totalWinVola > 0 ? totalWinVola : 0) : Number((totalWinVola / totalLossVola).toFixed(2));

    const avgWin = wins.length === 0 ? 0 : totalWinVola / wins.length;
    const avgLoss = losses.length === 0 ? 0 : totalLossVola / losses.length;
    const expectancy = Number(((winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss).toFixed(2));

    // Badges 
    let winrateBadge = "Faible";
    let winrateBadgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (winRate >= 40 && winRate < 55) {
      winrateBadge = "Correct";
      winrateBadgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    } else if (winRate >= 55) {
      winrateBadge = "Excellent";
      winrateBadgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }

    let pfBadge = "Moyen";
    let pfBadgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (profitFactor >= 2) {
      pfBadge = "Excellent";
      pfBadgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    } else if (profitFactor < 1) {
      pfBadge = "Danger";
      pfBadgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }

    let drawdownBadge = "Excellent";
    let drawdownBadgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (maxDD > 5 && maxDD <= 10) {
      drawdownBadge = "Sous contrôle";
      drawdownBadgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    } else if (maxDD > 10) {
      drawdownBadge = "Attention";
      drawdownBadgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }

    return {
      currentBalance,
      maxDrawdown: Number(maxDD.toFixed(1)),
      profitPercentage: Number(profitPercentage.toFixed(1)),
      winRate,
      profitFactor,
      totalPnLValue,
      avgWin: Number(avgWin.toFixed(2)),
      avgLoss: Number(avgLoss.toFixed(2)),
      expectancy,
      profitToday: Number(profitToday.toFixed(2)),
      lossToday: Number(lossToday.toFixed(2)),
      avgDailyLoss: Number(avgDailyLoss.toFixed(2)),
      maxWinStreak,
      maxLossStreak,
      winrateBadge,
      winrateBadgeColor,
      pfBadge,
      pfBadgeColor,
      drawdownBadge,
      drawdownBadgeColor
    };
  }, [filteredTrades, startingCapital]);

  // 4. DATA HO AN'NY CHART
  const chartData = useMemo(() => {
    let runningBalance = startingCapital;

    const points = filteredTrades.map((trade, index) => {
      const pnlVal = Number(trade.pnl || 0);
      runningBalance += pnlVal;

      const tradeDate = trade.date ? new Date(trade.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) : 'Pas de date';

      return {
        name: `T${index + 1}`,
        balance: Number(runningBalance.toFixed(2)),
        pnl: pnlVal,
        date: tradeDate, 
      };
    });

    const initialPoint = { 
      name: '0', 
      balance: startingCapital, 
      pnl: 0,
      date: 'Initial' 
    };

    if (points.length === 0) return [initialPoint];
    return [initialPoint, ...points];
  }, [filteredTrades, startingCapital]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-[#a67c52] font-mono text-xs uppercase tracking-widest">
        Connexion à la base de données...
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0b] text-slate-200 font-sans p-4 sm:p-6 overflow-y-auto global-scrollbar relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        .global-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .global-scrollbar::-webkit-scrollbar-track { background: #0a0a0b; }
        .global-scrollbar::-webkit-scrollbar-thumb { background: #a67c52; border-radius: 10px; }
        .global-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbb080; }
        .global-scrollbar { scrollbar-width: thin; scrollbar-color: #a67c52 #0a0a0b; }
      `}} />

      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#a67c52]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* HEADER */}
      <header className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6 relative z-10">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link href="/">
            <button className="p-3 bg-white/5 hover:bg-white/10 text-[#a67c52] border border-white/5 rounded-2xl transition-all shrink-0">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-2 sm:gap-3 flex-wrap">
              <BarChart3 className="text-[#a67c52] shrink-0" size={24} /> 
              TABLEAU DE BORD <span className="text-[#a67c52] italic">ANALYTICS</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">EQUITY TRACKER • PERFORMANCE LIVE MANAGEMENT</p>
          </div>
        </div>

        <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl w-full md:w-auto justify-between gap-1">
          {[
            { id: '7D', label: '7J' },
            { id: '30D', label: '30J' },
            { id: '90D', label: '90J' },
            { id: 'All', label: 'Tout' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id)}
              className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-wider transition-all flex-1 md:flex-none text-center ${
                timeFilter === tab.id ? 'bg-[#a67c52] text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8 relative z-10 pt-6 pb-12">
        
        {/* METRICS GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-[#141416] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg text-[#a67c52]">
              <DollarSign size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">BALANCE ACTUELLE</p>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              ${metrics.currentBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 italic">Capital disponible en direct</p>
          </div>

          <div className="bg-[#141416] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg text-emerald-400">
              <ArrowUpRight size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">PROFIT TOTAL (%)</p>
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight mt-2 ${metrics.profitPercentage >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {metrics.profitPercentage >= 0 ? `+${metrics.profitPercentage}%` : `${metrics.profitPercentage}%`}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 italic">Rendement sur investissement initial</p>
          </div>

          <div className="bg-[#141416] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg text-rose-500">
              <ShieldCheck size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">PERTE MAX (%)</p>
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight mt-2 ${metrics.maxDrawdown > 10 ? 'text-rose-500' : 'text-emerald-400'}`}>
              {metrics.maxDrawdown}%
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 italic">Chute historique maximale subie</p>
          </div>

          <div className="bg-[#141416] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-4 right-4 p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <TrendingUp size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">PROFIT AUJOURD'HUI</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight mt-2">
              +${metrics.profitToday.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 italic">Gains générés ce jour</p>
          </div>

          <div className="bg-[#141416] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-4 right-4 p-2 bg-rose-500/10 rounded-lg text-rose-500">
              <TrendingDown size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">PERTE TOTAL AUJOURD'HUI</p>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight mt-2">
              ${metrics.lossToday.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 italic">Pertes subies ce jour</p>
          </div>

          <div className="bg-[#141416] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg text-amber-400">
              <CalendarRange size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">PERTE AU QUOTIDIEN</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-300 tracking-tight mt-2">
              ${metrics.avgDailyLoss.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 italic">Perte moyenne par jour</p>
          </div>
        </section>

        {/* SECTION CIRCULAR TRADES & DRAWDOWN */}
        <section className="bg-[#111214] border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div className="flex items-center justify-between space-y-2 md:border-r md:border-white/5 pr-6">
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <div className="p-1.5 bg-cyan-500/10 rounded-full text-cyan-400">
                  <Zap size={14} />
                </div>
                <p>Trades analysés</p>
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight pt-1">
                  {filteredTrades.length}
                </h2>
                <p className="text-[10px] text-slate-500 font-mono mt-1">100% de votre historique</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-white/5" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={metrics.winRate >= 50 ? "text-emerald-400" : "text-rose-400"} strokeWidth="3" strokeDasharray={`${metrics.winRate}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-sm font-black text-white">{metrics.winRate}%</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">Winrate</span>
            </div>
          </div>

          <div className="flex items-center justify-between space-y-2 pl-0 md:pl-4">
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <div className="p-1.5 bg-amber-500/10 rounded-full text-amber-400">
                  <ShieldAlert size={14} />
                </div>
                Perte max
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight pt-1">
                  {metrics.maxDrawdown}%
                </h2>
                <div className="mt-2">
                  <span className={`text-[10px] font-bold uppercase border px-2 py-0.5 rounded-full ${metrics.drawdownBadgeColor}`}>
                    {metrics.drawdownBadge}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-white/5" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={metrics.maxDrawdown > 10 ? "text-rose-500" : metrics.maxDrawdown > 5 ? "text-cyan-400" : "text-emerald-400"} strokeWidth="3" strokeDasharray={`${Math.min(metrics.maxDrawdown, 100)}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xs font-black text-slate-300">-{metrics.maxDrawdown}%</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">Drawdown</span>
            </div>
          </div>
        </section>

        {/* CHART SECTION + STABILITÉ & RÉGULARITÉ */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Tabilao Evolisiona */}
          <div className="lg:col-span-2 bg-white/[0.01] border border-white/5 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-400 tracking-widest uppercase">
                <TrendingUp size={16} className="text-[#a67c52]" />
                <h3>Graphique : Évolution</h3>
              </div>
            </div>

            <div className="h-[430px] w-full bg-[#0a0a0b]/50 border border-white/5 rounded-2xl p-4 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 25, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a67c52" stopOpacity={0.25}/>
                      <stop offset="50%" stopColor="#a67c52" stopOpacity={0.05}/>
                      <stop offset="95%" stopColor="#a67c52" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} />
                  <YAxis 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={9} 
                    tickLine={false} 
                    domain={['dataMin - 2', 'dataMax + 2']} 
                    tickFormatter={(v) => `$${v}`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141416', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelFormatter={(label, items) => {
                      const tradeDate = items[0]?.payload?.date;
                      return `${label} ${tradeDate ? `• ${tradeDate}` : ''}`;
                    }}
                    formatter={(value: any, name: string, props: any) => {
                      if (name === "Balance") {
                        const pnl = props.payload.pnl;
                        const pnlText = pnl >= 0 ? ` (+${pnl})` : ` (${pnl})`;
                        return [`$${value}${pnl !== 0 ? pnlText : ''}`, "Capital Net"];
                      }
                      return [value, name];
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    name="Balance" 
                    strokeWidth={2} 
                    stroke="#a67c52" 
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                    dot={{ r: 3, stroke: '#a67c52', strokeWidth: 1, fill: '#0a0a0b' }} 
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stabilité & Régularité */}
          <div className="lg:col-span-1 bg-[#141416] border border-white/5 p-6 rounded-3xl flex flex-col justify-between">
            <div className="space-y-6">
              
              <div className="flex justify-between items-start border-b border-white/5 pb-4 gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
                    <Percent size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white tracking-tight uppercase">STABILITÉ & RÉGULARITÉ</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Analyse et qualité de performance en temps réel.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-5">
                {/* Winrate */}
                <div className="flex flex-col gap-1.5 py-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain size={14} className="text-rose-400" />
                      <p className="text-xs font-black text-white">Winrate global</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{metrics.winRate}%</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${metrics.winrateBadgeColor}`}>{metrics.winrateBadge}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                    <div className="h-full bg-rose-400 rounded-full transition-all duration-500" style={{ width: `${metrics.winRate}%` }}></div>
                  </div>
                </div>

                {/* Profit Factor */}
                <div className="flex flex-col gap-1.5 py-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-cyan-400" />
                      <p className="text-xs font-black text-white">Profit Factor</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-cyan-400">{metrics.profitFactor}</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${metrics.pfBadgeColor}`}>{metrics.pfBadge}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                    <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: `${Math.min((metrics.profitFactor / 3) * 100, 100)}%` }}></div>
                  </div>
                </div>

                {/* Gain Moyen */}
                <div className="flex flex-col gap-1.5 py-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight size={14} className="text-emerald-400" />
                      <p className="text-xs font-black text-white">Gain Moyen (Win)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-emerald-400">+${metrics.avgWin}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                    <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${metrics.avgWin > 0 ? Math.min((metrics.avgWin / (metrics.avgWin + metrics.avgLoss || 1)) * 100, 100) : 0}%` }}></div>
                  </div>
                </div>

                {/* Perte Moyenne */}
                <div className="flex flex-col gap-1.5 py-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={14} className="text-rose-400" />
                      <p className="text-xs font-black text-white">Perte Moyen (Loss)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-rose-400">-${metrics.avgLoss}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${metrics.avgLoss > 0 ? Math.min((metrics.avgLoss / (metrics.avgWin + metrics.avgLoss || 1)) * 100, 100) : 0}%` }}></div>
                  </div>
                </div>

                {/* Esperance Mathematique */}
                <div className="flex flex-col gap-1.5 py-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-400">∑</span>
                      <p className="text-xs font-black text-white">Espérance mathématique</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${metrics.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {metrics.expectancy >= 0 ? `+$${metrics.expectancy}/trade` : `-$${Math.abs(metrics.expectancy)}/trade`}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${metrics.expectancy > 0 ? Math.min((metrics.expectancy / (metrics.avgWin || 1)) * 100, 100) : 0}%` }}></div>
                  </div>
                </div>
              </div>

              {/* STREAK BLOCKS (Ilay avy eo ambany) */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-center">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Meilleure série</p>
                  <p className="text-xl font-black text-emerald-400 mt-0.5">{metrics.maxWinStreak}</p>
                  <p className="text-[8px] text-slate-400">Gagnants consécutifs</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Pire série</p>
                  <p className="text-xl font-black text-rose-500 mt-0.5">{metrics.maxLossStreak}</p>
                  <p className="text-[8px] text-slate-400">Perdants consécutifs</p>
                </div>
              </div>

            </div>
          </div>

        </section>
      </main>
    </div>
  );
}