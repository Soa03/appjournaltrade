// app/api/account/route.ts
import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

// Alaina ny account miaraka amin'ny transactions rehetra
export async function GET() {
  try {
    let account = await prisma.userAccount.findUnique({ 
      where: { id: 1 },
      include: { transactions: true } // Ampidirina ny dépôt/retrait
    });

    if (!account) {
      account = await prisma.userAccount.create({
        data: { id: 1, initialCapital: 1000 },
        include: { transactions: true }
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
    
    // CAS 1: Fanovana ny Capital Initial tsotra
    if (body.action === 'UPDATE_CAPITAL') {
      const updated = await prisma.userAccount.update({
        where: { id: 1 },
        data: { initialCapital: parseFloat(body.amount) },
        include: { transactions: true }
      });
      return NextResponse.json(updated);
    }

    // CAS 2: Fampidirana Transaction vaovao (DEPOT na RETRAIT)
    if (body.action === 'ADD_TRANSACTION') {
      // 1. Mamorona transaction vaovao
      await prisma.accountTransaction.create({
        data: {
          accountId: 1,
          type: body.type, // "DEPOT" na "RETRAIT"
          amount: parseFloat(body.amount)
        }
      });

      // 2. Alaina ny account vaovao efa nohavaozina
      const updatedAccount = await prisma.userAccount.findUnique({
        where: { id: 1 },
        include: { transactions: true }
      });

      return NextResponse.json(updatedAccount);
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Error updating account data" }, { status: 500 });
  }
}