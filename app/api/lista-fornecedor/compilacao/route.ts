import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const sql = getDb();
  const conta = req.nextUrl.searchParams.get('conta') || 'default';
  const rows = await sql`SELECT lista_compilacao_at FROM contas WHERE conta = ${conta} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ at: null });
  const r = rows[0] as { lista_compilacao_at: string | Date | null };
  return NextResponse.json({ at: r.lista_compilacao_at ?? null });
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const { conta = 'default' } = await req.json().catch(() => ({}));
  await sql`UPDATE contas SET lista_compilacao_at = NOW() WHERE conta = ${conta}`;
  const rows = await sql`SELECT lista_compilacao_at FROM contas WHERE conta = ${conta} LIMIT 1`;
  const r = rows[0] as { lista_compilacao_at: string | Date | null } | undefined;
  return NextResponse.json({ at: r?.lista_compilacao_at ?? null });
}
