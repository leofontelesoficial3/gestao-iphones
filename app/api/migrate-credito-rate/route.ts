import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * Migration idempotente: recalcula `acrescimo` e `lucro` das vendas
 * antigas que usaram CRÉDITO, aplicando a nova taxa (n + 2.89%)
 * em lugar da antiga (n + 2.99%).
 *
 * Regras:
 * - Só afeta produtos status=VENDIDO com parcelas_credito preenchido
 * - Se a única forma de pagamento foi CREDITO (array == ["CREDITO"]):
 *     acrescimo_novo = valor_venda * (parcelas + 2.89) / 100
 *     lucro += (acrescimo_antigo - acrescimo_novo)
 * - Se foi venda MISTA (ex: CREDITO + PIX): não é possível recalcular
 *   com precisão porque não guardamos o valor pago em cada forma.
 *   Retornamos a contagem em `mistas_skipped` para ciência do admin.
 */
export async function POST() {
  const sql = getDb();
  const TAXA_ANTIGA = 2.99;
  const TAXA_NOVA = 2.89;

  // Busca todas as vendas com parcelas_credito preenchido
  const rows = await sql`
    SELECT id, valor_venda, parcelas_credito, acrescimo, lucro, formas_pagamento
    FROM produtos
    WHERE status = 'VENDIDO'
      AND parcelas_credito IS NOT NULL
  `;

  let migrated = 0;
  let mistasSkipped = 0;
  let jaAtualizadas = 0;
  const detalhes: { id: string; delta: number }[] = [];

  for (const r of rows as unknown as Array<{
    id: string;
    valor_venda: string | number;
    parcelas_credito: number;
    acrescimo: string | number | null;
    lucro: string | number | null;
    formas_pagamento: string | null;
  }>) {
    const valorVenda = Number(r.valor_venda);
    const parcelas = Number(r.parcelas_credito);
    const acrescimoAntigo = Number(r.acrescimo ?? 0);
    const lucroAntigo = Number(r.lucro ?? 0);
    let formas: string[] = [];
    try {
      formas = r.formas_pagamento ? JSON.parse(r.formas_pagamento) : [];
    } catch {
      formas = [];
    }

    // Só migra se a única forma cash foi CREDITO.
    // Aceita ['CREDITO'] ou ['CREDITO', 'PRODUTO_RECEBIDO'] (trade-in não afeta acréscimo)
    const cashForms = formas.filter((f) => f !== 'PRODUTO_RECEBIDO');
    if (cashForms.length !== 1 || cashForms[0] !== 'CREDITO') {
      mistasSkipped++;
      continue;
    }

    // Calcula os acréscimos
    const acrescimoRecalculadoAntigo = parseFloat(
      ((valorVenda * (parcelas + TAXA_ANTIGA)) / 100).toFixed(2)
    );
    const acrescimoNovo = parseFloat(
      ((valorVenda * (parcelas + TAXA_NOVA)) / 100).toFixed(2)
    );

    // Se o acréscimo salvo já bate com a nova taxa, pula (idempotência)
    if (Math.abs(acrescimoAntigo - acrescimoNovo) < 0.01) {
      jaAtualizadas++;
      continue;
    }

    // Se o acréscimo salvo não bate nem com antigo nem com novo,
    // calculamos o delta esperado (antigo - novo) e aplicamos ao lucro
    const delta = parseFloat(
      (acrescimoRecalculadoAntigo - acrescimoNovo).toFixed(2)
    );

    const lucroNovo = parseFloat((lucroAntigo + delta).toFixed(2));

    await sql`
      UPDATE produtos SET
        acrescimo = ${acrescimoNovo},
        lucro = ${lucroNovo},
        updated_at = NOW()
      WHERE id = ${r.id}
    `;

    migrated++;
    detalhes.push({ id: r.id, delta });
  }

  return NextResponse.json({
    ok: true,
    total_vendas_com_credito: rows.length,
    migradas: migrated,
    ja_atualizadas: jaAtualizadas,
    mistas_skipped: mistasSkipped,
    taxa_antiga: `n + ${TAXA_ANTIGA}%`,
    taxa_nova: `n + ${TAXA_NOVA}%`,
    detalhes: detalhes.slice(0, 20), // primeiras 20 pra referência
  });
}
