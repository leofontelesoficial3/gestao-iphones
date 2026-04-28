import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const CORES_VALIDAS = ['branco', 'preto', 'azul', 'vermelho', 'amarelo', 'laranja'];

export async function GET(req: NextRequest) {
  const sql = getDb();
  const conta = req.nextUrl.searchParams.get('conta') || 'default';
  const rows = await sql`SELECT tema_cor, tema_logo, whatsapp FROM contas WHERE conta = ${conta} LIMIT 1`;
  if (rows.length === 0) {
    return NextResponse.json({ cor: 'azul', logo: null, whatsapp: null });
  }
  const r = rows[0] as { tema_cor: string | null; tema_logo: string | null; whatsapp: string | null };
  return NextResponse.json({
    cor: r.tema_cor || 'azul',
    logo: r.tema_logo || null,
    whatsapp: r.whatsapp || null,
  });
}

export async function PUT(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  const conta = body.conta || 'default';
  const cor = CORES_VALIDAS.includes(body.cor) ? body.cor : 'azul';
  const logo = typeof body.logo === 'string' && body.logo.length > 0 ? body.logo : null;
  const whatsapp = typeof body.whatsapp === 'string' && body.whatsapp.length > 0 ? body.whatsapp : null;

  await sql`
    INSERT INTO contas (conta, nome_loja, plano, tema_cor, tema_logo, whatsapp)
    VALUES (${conta}, 'Minha Loja', 'gratuito', ${cor}, ${logo}, ${whatsapp})
    ON CONFLICT (conta) DO UPDATE SET tema_cor = ${cor}, tema_logo = ${logo}, whatsapp = ${whatsapp}
  `;
  return NextResponse.json({ cor, logo, whatsapp });
}
