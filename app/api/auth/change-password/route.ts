import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const sql = getDb();
  const { usuario, senhaAtual, novaSenha } = await req.json();

  const result = await sql`UPDATE users SET senha = ${novaSenha} WHERE usuario = ${usuario} AND senha = ${senhaAtual}`;

  if (result.length === 0) {
    return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
