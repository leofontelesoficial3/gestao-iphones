import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const LIMITE_VENDEDORES: Record<string, number> = {
  gratuito: 0,
  profissional: 2,
  empresarial: 5,
};

export async function GET(req: NextRequest) {
  const sql = getDb();
  const conta = req.nextUrl.searchParams.get('conta') || 'default';

  const vendedores = await sql`SELECT usuario, nome, perfil FROM users WHERE conta = ${conta} AND perfil = 'vendedor'`;
  const contaInfo = await sql`SELECT plano FROM contas WHERE conta = ${conta}`;
  const plano = contaInfo[0]?.plano || 'gratuito';

  return NextResponse.json({
    vendedores,
    plano,
    limite: LIMITE_VENDEDORES[plano] || 0,
    atual: vendedores.length,
  });
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const { conta, usuario, nome, senha } = await req.json();

  const existing = await sql`SELECT id FROM users WHERE usuario = ${usuario}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Esse nome de usuário já está em uso.' }, { status: 400 });
  }

  const contaInfo = await sql`SELECT plano FROM contas WHERE conta = ${conta}`;
  const plano = contaInfo[0]?.plano || 'gratuito';
  const limite = LIMITE_VENDEDORES[plano] || 0;
  const atual = await sql`SELECT COUNT(*) as total FROM users WHERE conta = ${conta} AND perfil = 'vendedor'`;

  if (Number(atual[0].total) >= limite) {
    const msg = plano === 'gratuito'
      ? 'O plano Gratuito não permite vendedores. Faça upgrade para o Profissional.'
      : `Limite de ${limite} vendedores atingido no plano ${plano}.`;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await sql`INSERT INTO users (usuario, nome, senha, perfil, conta) VALUES (${usuario}, ${nome}, ${senha}, 'vendedor', ${conta})`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const sql = getDb();
  const usuario = req.nextUrl.searchParams.get('usuario');
  const conta = req.nextUrl.searchParams.get('conta');

  await sql`DELETE FROM users WHERE usuario = ${usuario} AND conta = ${conta} AND perfil = 'vendedor'`;
  return NextResponse.json({ deleted: true });
}
