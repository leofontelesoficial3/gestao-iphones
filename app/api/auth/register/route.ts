import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const sql = getDb();
  const { nomeLoja, nomeAdmin, usuario, senha } = await req.json();

  const existing = await sql`SELECT id FROM users WHERE usuario = ${usuario}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Esse nome de usuário já está em uso.' }, { status: 400 });
  }

  const conta = 'conta_' + Date.now().toString(36);

  await sql`INSERT INTO contas (conta, nome_loja, plano) VALUES (${conta}, ${nomeLoja}, 'gratuito')`;
  await sql`INSERT INTO users (usuario, nome, senha, perfil, conta) VALUES (${usuario}, ${nomeAdmin}, ${senha}, 'admin', ${conta})`;

  return NextResponse.json({ usuario, nome: nomeAdmin, perfil: 'admin', conta });
}
