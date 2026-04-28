import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Migration one-shot: renomeia o nome_loja da conta default para JOAO IPHONES.
// Idempotente.
export async function POST() {
  const sql = getDb();
  const result = await sql`
    UPDATE contas
    SET nome_loja = 'JOAO IPHONES'
    WHERE conta = 'default'
    RETURNING conta, nome_loja
  `;
  return NextResponse.json({ updated: result.length, rows: result });
}
