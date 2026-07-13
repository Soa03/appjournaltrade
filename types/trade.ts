// types/trade.ts

export interface Trade {
  id: string;
  date: string;
  pair: string;
  type: 'Long' | 'Short';
  status: 'Win' | 'Loss' | 'BE';
  pnl: number;
  lots: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  dailyBias?: string; // TENA ILAINA ITY MIHITSY MBA HITEHIRIZANA AZY!
  analysisH1?: string;
  analysisLTF?: string; 
  imgH1?: string;
  imgLTF?: string;
  imgM1?: string;
  imgExtra1?: string;
  imgExtra2?: string;
  error?: string;
  comment?: string;
}