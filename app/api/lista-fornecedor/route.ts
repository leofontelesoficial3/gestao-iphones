import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface DbRow {
  id: number;
  aparelho: string;
  linha: string;
  capacidade: string;
  cores: string | null;
  baterias: string | null;
  margem_lucro: string | number | null;
  observacao: string | null;
}

function rowToItem(r: DbRow) {
  return {
    id: Number(r.id),
    aparelho: r.aparelho,
    linha: r.linha,
    capacidade: r.capacidade,
    cores: r.cores ? JSON.parse(r.cores) : [],
    baterias: r.baterias ? JSON.parse(r.baterias) : [],
    margemLucro: r.margem_lucro !== null && r.margem_lucro !== undefined ? Number(r.margem_lucro) : 0,
    observacao: r.observacao || undefined,
  };
}

export async function GET(req: NextRequest) {
  const sql = getDb();
  const conta = req.nextUrl.searchParams.get('conta') || 'default';
  const rows = await sql`
    SELECT id, aparelho, linha, capacidade, cores, baterias, margem_lucro, observacao
    FROM lista_fornecedor
    WHERE conta = ${conta}
    ORDER BY id DESC
  `;
  return NextResponse.json(rows.map(r => rowToItem(r as DbRow)));
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  const conta = body.conta || 'default';
  const cores = JSON.stringify(Array.isArray(body.cores) ? body.cores : []);
  const baterias = JSON.stringify(Array.isArray(body.baterias) ? body.baterias : []);
  const margem = Number(body.margemLucro) || 0;

  const rows = await sql`
    INSERT INTO lista_fornecedor (conta, aparelho, linha, capacidade, cores, baterias, margem_lucro, observacao)
    VALUES (${conta}, ${body.aparelho}, ${body.linha}, ${body.capacidade}, ${cores}, ${baterias}, ${margem}, ${body.observacao ?? null})
    RETURNING id, aparelho, linha, capacidade, cores, baterias, margem_lucro, observacao
  `;
  return NextResponse.json(rowToItem(rows[0] as DbRow), { status: 201 });
}

export async function PUT(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: 'id inválido' }, { status: 400 });

  const cores = JSON.stringify(Array.isArray(body.cores) ? body.cores : []);
  const baterias = JSON.stringify(Array.isArray(body.baterias) ? body.baterias : []);
  const margem = Number(body.margemLucro) || 0;

  const rows = await sql`
    UPDATE lista_fornecedor SET
      aparelho = ${body.aparelho},
      linha = ${body.linha},
      capacidade = ${body.capacidade},
      cores = ${cores},
      baterias = ${baterias},
      margem_lucro = ${margem},
      observacao = ${body.observacao ?? null},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, aparelho, linha, capacidade, cores, baterias, margem_lucro, observacao
  `;
  return NextResponse.json(rowToItem(rows[0] as DbRow));
}

export async function DELETE(req: NextRequest) {
  const sql = getDb();
  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  await sql`DELETE FROM lista_fornecedor WHERE id = ${id}`;
  return NextResponse.json({ deleted: true });
}
