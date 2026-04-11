import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const sql = getDb();
  const conta = req.nextUrl.searchParams.get('conta') || 'default';

  const rows = await sql`SELECT COALESCE(MAX(codigo), 10000) + 1 as next_codigo FROM produtos WHERE conta = ${conta}`;
  return NextResponse.json({ codigo: Number(rows[0].next_codigo) });
}
