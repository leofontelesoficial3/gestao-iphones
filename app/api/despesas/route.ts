import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Criar tabela na primeira chamada
async function ensureTable(sql: ReturnType<typeof getDb>) {
  await sql`
    CREATE TABLE IF NOT EXISTS despesas (
      id SERIAL PRIMARY KEY,
      conta VARCHAR(100) NOT NULL,
      tipo VARCHAR(10) NOT NULL DEFAULT 'variavel',
      descricao VARCHAR(300) NOT NULL,
      valor DECIMAL(10,2) NOT NULL,
      data_vencimento VARCHAR(20) NOT NULL,
      data_fim VARCHAR(20),
      frequencia VARCHAR(20) DEFAULT 'mensal',
      pago BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function GET(req: NextRequest) {
  const conta = req.nextUrl.searchParams.get('conta') || 'default';
  const sql = getDb();
  await ensureTable(sql);

  const despesas = await sql`
    SELECT * FROM despesas WHERE conta = ${conta} ORDER BY data_vencimento ASC
  `;

  return NextResponse.json({ despesas });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conta, tipo, descricao, valor, data_vencimento, data_fim } = body;

  if (!descricao || !valor || !data_vencimento) {
    return NextResponse.json({ error: 'Campos obrigatórios: descrição, valor, data de vencimento.' }, { status: 400 });
  }

  const sql = getDb();
  await ensureTable(sql);

  await sql`
    INSERT INTO despesas (conta, tipo, descricao, valor, data_vencimento, data_fim)
    VALUES (${conta || 'default'}, ${tipo || 'variavel'}, ${descricao}, ${valor}, ${data_vencimento}, ${data_fim || null})
  `;

  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, pago, descricao, valor, tipo, data_vencimento, data_fim } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
  }

  const sql = getDb();

  // Edição completa
  if (descricao !== undefined) {
    await sql`
      UPDATE despesas
      SET descricao = ${descricao},
          valor = ${valor},
          tipo = ${tipo},
          data_vencimento = ${data_vencimento},
          data_fim = ${data_fim || null}
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  }

  // Toggle pago
  await sql`UPDATE despesas SET pago = ${!!pago} WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
  }

  const sql = getDb();
  await sql`DELETE FROM despesas WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
