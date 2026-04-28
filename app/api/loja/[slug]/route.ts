import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface ProdutoPublico {
  id: string;
  codigo: number;
  modelo: string;
  linha: string;
  gb: string;
  cor: string;
  estado: string;
  bateria: string;
  descricao: string | null;
  fotos: string[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const sql = getDb();

  // Carrega dados da loja (tema)
  const lojaRows = await sql`
    SELECT conta, nome_loja, tema_cor, tema_logo, whatsapp
    FROM contas
    WHERE conta = ${slug} AND conta != '*'
    LIMIT 1
  `;

  if (lojaRows.length === 0) {
    return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
  }

  const loja = lojaRows[0] as {
    conta: string;
    nome_loja: string;
    tema_cor: string | null;
    tema_logo: string | null;
    whatsapp: string | null;
  };

  // Produtos disponíveis (em estoque) — apenas dados públicos, sem valorCompra/lucro
  const produtosRows = await sql`
    SELECT id, codigo, modelo, linha, gb, cor, estado, bateria, descricao, fotos
    FROM produtos
    WHERE conta = ${slug} AND status = 'EM_ESTOQUE'
    ORDER BY codigo DESC
  `;

  const produtos: ProdutoPublico[] = produtosRows.map((r) => {
    const row = r as {
      id: string;
      codigo: number;
      modelo: string;
      linha: string | null;
      gb: string | null;
      cor: string | null;
      estado: string | null;
      bateria: string | null;
      descricao: string | null;
      fotos: string | null;
    };
    return {
      id: row.id,
      codigo: Number(row.codigo),
      modelo: row.modelo,
      linha: row.linha || '',
      gb: row.gb || '',
      cor: row.cor || '',
      estado: row.estado || '',
      bateria: row.bateria || '',
      descricao: row.descricao || null,
      fotos: row.fotos ? JSON.parse(row.fotos) : [],
    };
  });

  return NextResponse.json({
    loja: {
      slug: loja.conta,
      nomeLoja: loja.nome_loja,
      cor: loja.tema_cor || 'azul',
      logo: loja.tema_logo,
      whatsapp: loja.whatsapp,
    },
    produtos,
  });
}
