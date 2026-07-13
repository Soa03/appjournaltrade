// app/api/account/route.ts
import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

// Alaina ny account miaraka amin'ny accounttransaction rehetra
export async function GET() {
  try {
    // Ampiasaina ny 'any' mba hialana amin'ny blockage-n'ny TypeScript type generation ao amin'ny Vercel
    const client = prisma as any;

    let account = await client.useraccount.findUnique({ 
      where: { id: 1 },
      include: { accounttransaction: true }
    });

    if (!account) {
      account = await client.useraccount.create({
        data: { id: 1, initialCapital: 1000 },
        include: { accounttransaction: true }
      });
    }
    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json({ error: "Error Account" }, { status: 500 });
  }
}

// Manova Capital INITIAL NA Manampy DEPOT/RETRAIT vaovao
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const client = prisma as any;
    
    // CAS 1: Fanovana ny Capital Initial tsotra
    if (body.action === 'UPDATE_CAPITAL') {
      const updated = await client.useraccount.update({
        where: { id: 1 },
        data: { initialCapital: parseFloat(body.amount) },
        include: { accounttransaction: true }
      });
      return NextResponse.json(updated);
    }

    // CAS 2: Fampidirana Transaction vaovao (DEPOT na RETRAIT)
    if (body.action === 'ADD_TRANSACTION') {
      await client.accounttransaction.create({
        data: {
          accountId: 1,
          type: body.type, // "DEPOT" na "RETRAIT"
          amount: parseFloat(body.amount)
        }
      });

      const updatedAccount = await client.useraccount.findUnique({
        where: { id: 1 },
        include: { accounttransaction: true }
      });

      return NextResponse.json(updatedAccount);
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Error updating account data" }, { status: 500 });
  }
}