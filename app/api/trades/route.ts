// app/api/trades/route.ts
import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

// 1. GET : Maka ny trade rehetra avy ao amin'ny Database
export async function GET() {
  try {
    const databaseTrades = await prisma.trade.findMany({ 
      orderBy: { date: 'desc' } 
    });

    const trades = databaseTrades.map(trade => ({
      ...trade,
      entryPrice: trade.entryPrice || '',
      stopLoss: trade.stopLoss || '',
      takeProfit: trade.takeProfit || '',
      pnl: trade.pnl || '',
      lots: trade.lots || '',
      dailyBias: trade.dailyBias || '', // FANITSIANA: Ampidirina amin'ny mapping
    }));

    return NextResponse.json(trades);
  } catch (error) {
    console.error("Erreur GET:", error);
    return NextResponse.json({ error: "Error GET" }, { status: 500 });
  }
}

// 2. POST : Mandray sy mitahiry ny trade vaovao avy amin'ny Formulaire
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const currentStatus = body.status || "Pending";
    let rawPnL = body.pnl ? String(body.pnl).trim() : '0';

    // Fikarakarana ny marika amin'ny PnL nefa amin'ny alalan'ny String fotsiny
    if (currentStatus === 'Loss') {
      const cleanDigits = rawPnL.replace(/-/g, '');
      rawPnL = cleanDigits ? `-${cleanDigits}` : '-';
    } else if (currentStatus === 'BE') {
      rawPnL = '0';                 
    } else if (currentStatus === 'Win') {
      rawPnL = rawPnL.replace(/-/g, '');  
    }
    
    const newTrade = await prisma.trade.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        session: body.session || "London", 
        pair: body.pair,
        type: body.type,
        status: currentStatus,
        entryPrice: body.entryPrice ? String(body.entryPrice).trim() : null,
        stopLoss: body.stopLoss ? String(body.stopLoss).trim() : null,
        takeProfit: body.takeProfit ? String(body.takeProfit).trim() : null,
        lots: body.lots ? String(body.lots).trim() : '0',
        pnl: rawPnL, 
        dailyBias: body.dailyBias || "", // FANITSIANA: Tehirizina ato
        analysisH1: body.analysisH1 || "",
        analysisLTF: body.analysisLTF || "",
        imgH1: body.imgH1 || "",
        imgLTF: body.imgLTF || "",
        imgM1: body.imgM1 || "",
        imgExtra1: body.imgExtra1 || "",
        imgExtra2: body.imgExtra2 || "",
        error: body.error || "",      
        comment: body.comment || ""     
      },
    });

    return NextResponse.json(newTrade);
  } catch (error) {
    console.error("Erreur POST:", error);
    return NextResponse.json({ error: "Error POST" }, { status: 500 });
  }
}