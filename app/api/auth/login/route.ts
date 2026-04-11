import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const sql = getDb();
  const { usuario, senha } = await req.json();

  const rows = await sql`SELECT usuario, nome, perfil, conta FROM users WHERE usuario = ${usuario} AND senha = ${senha}`;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 });
  }

  return NextResponse.json(rows[0]);
}
