'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PerformanceChart({ trades }: { trades: any[] }) {
  // SYNCHRONISATION: Novaina ho 15.00 koa ny balance fototra eto
  let cumulative = 15.00; 

  const data = trades.slice().reverse().map((t, index) => {
    cumulative += Number(t.pnl || 0);
    return {
      index: index + 1,
      balance: Number(cumulative.toFixed(2)),
      pnl: t.pnl
    };
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
          <XAxis dataKey="index" stroke="rgba(255,255,255,0.2)" fontSize={10} />
          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#141416', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
            itemStyle={{ color: '#f43f5e' }}
          />
          
          {/* NESORINA ILAY LABEL STATIC MIFANANDRINA BE ETSY AMBONY */}
          <Line 
            type="monotone" 
            dataKey="balance" 
            stroke="#f43f5e" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} 
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}