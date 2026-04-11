import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function rowToProduto(r: any) {
  return {
    id: r.id,
    dataEntrada: r.data_entrada,
    codigo: Number(r.codigo),
    modelo: r.modelo,
    linha: r.linha || '',
    imei: r.imei || '',
    possuiNota: r.possui_nota || 'NÃO',
    gb: r.gb || '',
    compTrocado: r.comp_trocado || '',
    cor: r.cor || '',
    estado: r.estado || 'SEMINOVO',
    bateria: r.bateria || '',
    valorCompra: Number(r.valor_compra),
    status: r.status,
    fotos: r.fotos ? JSON.parse(r.fotos) : undefined,
    dataVenda: r.data_venda || undefined,
    valorVenda: r.valor_venda ? Number(r.valor_venda) : undefined,
    custos: r.custos ? Number(r.custos) : undefined,
    cliente: r.cliente || undefined,
    contato: r.contato || undefined,
    lucro: r.lucro ? Number(r.lucro) : undefined,
    formasPagamento: r.formas_pagamento ? JSON.parse(r.formas_pagamento) : undefined,
    parcelasCredito: r.parcelas_credito ? Number(r.parcelas_credito) : undefined,
    acrescimo: r.acrescimo ? Number(r.acrescimo) : undefined,
    fornecedorId: r.fornecedor_id ? Number(r.fornecedor_id) : undefined,
  };
}

export async function GET(req: NextRequest) {
  const sql = getDb();
  const conta = req.nextUrl.searchParams.get('conta') || 'default';

  const rows = await sql`SELECT * FROM produtos WHERE conta = ${conta} ORDER BY codigo DESC`;
  return NextResponse.json(rows.map(rowToProduto));
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  const id = crypto.randomUUID();

  await sql`
    INSERT INTO produtos (id, conta, data_entrada, codigo, modelo, linha, imei, possui_nota, gb, comp_trocado, cor, estado, bateria, valor_compra, status, fotos, fornecedor_id)
    VALUES (${id}, ${body.conta || 'default'}, ${body.dataEntrada}, ${body.codigo}, ${body.modelo}, ${body.linha}, ${body.imei}, ${body.possuiNota}, ${body.gb}, ${body.compTrocado}, ${body.cor}, ${body.estado}, ${body.bateria}, ${body.valorCompra}, 'EM_ESTOQUE', ${body.fotos ? JSON.stringify(body.fotos) : null}, ${body.fornecedorId ?? null})
  `;

  const rows = await sql`SELECT * FROM produtos WHERE id = ${id}`;
  return NextResponse.json(rowToProduto(rows[0]), { status: 201 });
}

export async function PUT(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  const { id, ...updates } = body;

  await sql`
    UPDATE produtos SET
      data_entrada = COALESCE(${updates.dataEntrada ?? null}, data_entrada),
      codigo = COALESCE(${updates.codigo ?? null}, codigo),
      modelo = COALESCE(${updates.modelo ?? null}, modelo),
      linha = COALESCE(${updates.linha ?? null}, linha),
      imei = COALESCE(${updates.imei ?? null}, imei),
      possui_nota = COALESCE(${updates.possuiNota ?? null}, possui_nota),
      gb = COALESCE(${updates.gb ?? null}, gb),
      comp_trocado = COALESCE(${updates.compTrocado ?? null}, comp_trocado),
      cor = COALESCE(${updates.cor ?? null}, cor),
      estado = COALESCE(${updates.estado ?? null}, estado),
      bateria = COALESCE(${updates.bateria ?? null}, bateria),
      valor_compra = COALESCE(${updates.valorCompra ?? null}, valor_compra),
      status = COALESCE(${updates.status ?? null}, status),
      fotos = COALESCE(${updates.fotos ? JSON.stringify(updates.fotos) : null}, fotos),
      data_venda = ${updates.dataVenda ?? null},
      valor_venda = ${updates.valorVenda ?? null},
      custos = ${updates.custos ?? null},
      cliente = ${updates.cliente ?? null},
      contato = ${updates.contato ?? null},
      lucro = ${updates.lucro ?? null},
      formas_pagamento = ${updates.formasPagamento ? JSON.stringify(updates.formasPagamento) : null},
      parcelas_credito = ${updates.parcelasCredito ?? null},
      acrescimo = ${updates.acrescimo ?? null},
      fornecedor_id = COALESCE(${updates.fornecedorId ?? null}, fornecedor_id),
      updated_at = NOW()
    WHERE id = ${id}
  `;

  const rows = await sql`SELECT * FROM produtos WHERE id = ${id}`;
  return NextResponse.json(rowToProduto(rows[0]));
}

export async function DELETE(req: NextRequest) {
  const sql = getDb();
  const id = req.nextUrl.searchParams.get('id');

  await sql`DELETE FROM produtos WHERE id = ${id}`;
  return NextResponse.json({ deleted: true });
}
