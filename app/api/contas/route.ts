import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  const rows = await sql`
    SELECT
      c.conta,
      c.nome_loja,
      c.plano,
      (SELECT COUNT(*) FROM users u WHERE u.conta = c.conta) AS total_usuarios,
      (SELECT COUNT(*) FROM produtos p WHERE p.conta = c.conta) AS total_produtos
    FROM contas c
    WHERE c.conta != '*'
    ORDER BY c.conta ASC
  `;

  return NextResponse.json(
    rows.map((r) => {
      const row = r as { conta: string; nome_loja: string; plano: string; total_usuarios: string; total_produtos: string };
      return {
        conta: row.conta,
        nomeLoja: row.nome_loja,
        plano: row.plano,
        totalUsuarios: Number(row.total_usuarios),
        totalProdutos: Number(row.total_produtos),
      };
    }),
  );
}
