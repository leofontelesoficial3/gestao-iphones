import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface FornecedorRow {
  id: number;
  conta: string;
  nome: string;
  telefone: string | null;
  endereco: string | null;
}

interface StatsRow {
  fornecedor_id: number;
  total_comprado: string | number;
  valor_total: string | number;
}

function rowToFornecedor(r: FornecedorRow) {
  return {
    id: r.id,
    nome: r.nome,
    telefone: r.telefone ?? '',
    endereco: r.endereco ?? '',
  };
}

export async function GET(req: NextRequest) {
  const sql = getDb();
  const conta = req.nextUrl.searchParams.get('conta') || 'default';
  const withStats = req.nextUrl.searchParams.get('stats') === '1';

  const rows = await sql`
    SELECT * FROM fornecedores WHERE conta = ${conta} ORDER BY nome ASC
  `;

  if (!withStats) {
    return NextResponse.json(rows.map((r) => rowToFornecedor(r as unknown as FornecedorRow)));
  }

  // Estatísticas: total de produtos comprados e valor total por fornecedor
  const stats = await sql`
    SELECT fornecedor_id,
           COUNT(*)::int AS total_comprado,
           COALESCE(SUM(valor_compra), 0) AS valor_total
    FROM produtos
    WHERE conta = ${conta} AND fornecedor_id IS NOT NULL
    GROUP BY fornecedor_id
  `;
  const statsMap = new Map<number, { total: number; valor: number }>();
  for (const s of stats as unknown as StatsRow[]) {
    statsMap.set(Number(s.fornecedor_id), {
      total: Number(s.total_comprado),
      valor: Number(s.valor_total),
    });
  }

  const enriched = rows.map((r) => {
    const f = rowToFornecedor(r as unknown as FornecedorRow);
    const s = statsMap.get(f.id) || { total: 0, valor: 0 };
    return { ...f, totalProdutos: s.total, valorTotal: s.valor };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  if (!body.nome?.trim()) {
    return NextResponse.json({ erro: 'Nome é obrigatório' }, { status: 400 });
  }
  const rows = await sql`
    INSERT INTO fornecedores (conta, nome, telefone, endereco)
    VALUES (${body.conta || 'default'}, ${body.nome.trim()}, ${body.telefone || null}, ${body.endereco || null})
    RETURNING *
  `;
  return NextResponse.json(rowToFornecedor(rows[0] as unknown as FornecedorRow), { status: 201 });
}

export async function PUT(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ erro: 'ID obrigatório' }, { status: 400 });

  const rows = await sql`
    UPDATE fornecedores SET
      nome = COALESCE(${body.nome ?? null}, nome),
      telefone = ${body.telefone ?? null},
      endereco = ${body.endereco ?? null}
    WHERE id = ${body.id}
    RETURNING *
  `;
  if (rows.length === 0) return NextResponse.json({ erro: 'Fornecedor não encontrado' }, { status: 404 });
  return NextResponse.json(rowToFornecedor(rows[0] as unknown as FornecedorRow));
}

export async function DELETE(req: NextRequest) {
  const sql = getDb();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ erro: 'ID obrigatório' }, { status: 400 });

  // Desvincula produtos antes de deletar
  await sql`UPDATE produtos SET fornecedor_id = NULL WHERE fornecedor_id = ${Number(id)}`;
  await sql`DELETE FROM fornecedores WHERE id = ${Number(id)}`;
  return NextResponse.json({ deleted: true });
}
