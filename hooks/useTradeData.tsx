'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Trade {
  id: string;
  date: string;
  pair: string;
  type: string;
  status: 'WIN' | 'LOSS' | 'BE';
  pnl: number;
  rr: number;
  emotion: string;
  timeSession: string;
}

interface TradeContextType {
  trades: Trade[];
  loading: boolean;
  fetchTrades: () => Promise<void>;
  addTrade: (trade: any) => Promise<boolean>;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/trades');
      const data = await res.json();
      if (Array.isArray(data)) setTrades(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const addTrade = async (tradeData: any) => {
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData),
      });
      if (res.ok) {
        await fetchTrades(); // Update avy hatrany ny stats dashboard
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <TradeContext.Provider value={{ trades, loading, fetchTrades, addTrade }}>
      {children}
    </TradeContext.Provider>
  );
}

export const useTradeData = () => {
  const context = useContext(TradeContext);
  if (!context) throw new Error('useTradeData must be used within TradeProvider');
  return context;
};