import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Limite de MEMBROS ADICIONAIS da equipe (admin + vendedor) por plano.
// O admin criador da conta NÃO conta no limite.
const LIMITE_MEMBROS: Record<string, number> = {
  gratuito: 0,
  profissional: 2,
  empresarial: 5,
};

/**
 * Retorna o ID do admin "criador" da conta (o primeiro admin inserido).
 * Esse usuário nunca conta no limite de membros adicionais e não pode
 * ser removido pela página /vendedores.
 */
async function getCriadorId(sql: ReturnType<typeof getDb>, conta: string): Promise<number | null> {
  const rows = await sql`
    SELECT id FROM users
    WHERE conta = ${conta} AND perfil = 'admin'
    ORDER BY id ASC
    LIMIT 1
  `;
  return rows.length > 0 ? Number((rows[0] as { id: number }).id) : null;
}

export async function GET(req: NextRequest) {
  const sql = getDb();
  const conta = req.nextUrl.searchParams.get('conta') || 'default';

  const criadorId = await getCriadorId(sql, conta);

  // Todos os membros da conta (admin e vendedor), exceto o criador
  const rows = criadorId
    ? await sql`
        SELECT id, usuario, nome, perfil
        FROM users
        WHERE conta = ${conta} AND id != ${criadorId}
        ORDER BY id ASC
      `
    : await sql`
        SELECT id, usuario, nome, perfil
        FROM users
        WHERE conta = ${conta}
        ORDER BY id ASC
      `;

  const contaInfo = await sql`SELECT plano FROM contas WHERE conta = ${conta}`;
  const plano = (contaInfo[0] as { plano?: string } | undefined)?.plano || 'gratuito';
  const limite = LIMITE_MEMBROS[plano] || 0;

  // Mantém a chave `vendedores` para compatibilidade com código antigo
  return NextResponse.json({
    vendedores: rows,
    plano,
    limite,
    atual: rows.length,
  });
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  const { conta, usuario, nome, senha } = body;
  // Default: vendedor (mantém compatibilidade com chamadas antigas)
  const perfil: 'admin' | 'vendedor' = body.perfil === 'admin' ? 'admin' : 'vendedor';

  if (!usuario || !nome || !senha) {
    return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM users WHERE usuario = ${usuario}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Esse nome de usuário já está em uso.' }, { status: 400 });
  }

  const contaInfo = await sql`SELECT plano FROM contas WHERE conta = ${conta}`;
  const plano = (contaInfo[0] as { plano?: string } | undefined)?.plano || 'gratuito';
  const limite = LIMITE_MEMBROS[plano] || 0;

  // Conta membros adicionais (todos menos o criador)
  const criadorId = await getCriadorId(sql, conta);
  const total = criadorId
    ? await sql`SELECT COUNT(*)::int as total FROM users WHERE conta = ${conta} AND id != ${criadorId}`
    : await sql`SELECT COUNT(*)::int as total FROM users WHERE conta = ${conta}`;

  if (Number((total[0] as { total: number }).total) >= limite) {
    const msg = plano === 'gratuito'
      ? 'O plano Gratuito não permite membros de equipe. Faça upgrade para o Profissional.'
      : `Limite de ${limite} membros atingido no plano ${plano}. Faça upgrade para adicionar mais.`;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await sql`
    INSERT INTO users (usuario, nome, senha, perfil, conta)
    VALUES (${usuario}, ${nome}, ${senha}, ${perfil}, ${conta})
  `;
  return NextResponse.json({ ok: true, perfil });
}

export async function DELETE(req: NextRequest) {
  const sql = getDb();
  const usuario = req.nextUrl.searchParams.get('usuario');
  const conta = req.nextUrl.searchParams.get('conta');

  if (!usuario || !conta) {
    return NextResponse.json({ error: 'Parâmetros faltando.' }, { status: 400 });
  }

  // Bloqueia remoção do criador da conta
  const criadorId = await getCriadorId(sql, conta);
  if (criadorId) {
    const alvo = await sql`SELECT id FROM users WHERE usuario = ${usuario} AND conta = ${conta}`;
    if (alvo.length > 0 && Number((alvo[0] as { id: number }).id) === criadorId) {
      return NextResponse.json(
        { error: 'O criador da conta não pode ser removido pela página de equipe.' },
        { status: 400 }
      );
    }
  }

  await sql`DELETE FROM users WHERE usuario = ${usuario} AND conta = ${conta}`;
  return NextResponse.json({ deleted: true });
}
