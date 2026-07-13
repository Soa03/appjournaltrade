// app/api/trades/[id]/route.ts
import { prisma } from '../../../../lib/prisma'; 
import { NextResponse } from 'next/server';

// 1. HANAFANA TRADE (DELETE)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    await prisma.trade.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Trade voafafa soa aman-tsara" });
  } catch (error: any) {
    console.error("DELETE ERROR:", error.message);
    return NextResponse.json({ error: "Tsy nahomby ny famafana" }, { status: 500 });
  }
}

// 2. HANAVAOZANA TRADE (PUT)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params; 
    const body = await req.json();

    const updatedTrade = await prisma.trade.update({
      where: { id: id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        session: body.session || "London",
        pair: body.pair,
        type: body.type,
        status: body.status,
        lots: body.lots ? String(body.lots).trim() : '0',
        pnl: body.pnl ? String(body.pnl).trim() : '0',
        entryPrice: body.entryPrice ? String(body.entryPrice).trim() : null,
        stopLoss: body.stopLoss ? String(body.stopLoss).trim() : null,
        takeProfit: body.takeProfit ? String(body.takeProfit).trim() : null,
        dailyBias: body.dailyBias || "", // FANITSIANA: Avaozina ato koa rehefa edit
        analysisH1: body.analysisH1 || "",
        analysisLTF: body.analysisLTF || "",
        imgH1: body.imgH1 || "",
        imgLTF: body.imgLTF || "",
        imgM1: body.imgM1 || "",
        imgExtra1: body.imgExtra1 || "",
        imgExtra2: body.imgExtra2 || "",
        error: body.error || "",
        comment: body.comment || "",
      },
    });

    return NextResponse.json(updatedTrade);
  } catch (error: any) {
    console.error("PRISMA UPDATE ERROR:", error.message);
    return NextResponse.json({ 
      error: "Tsy nahomby ny fanovana", 
      details: error.message 
    }, { status: 500 });
  }
}