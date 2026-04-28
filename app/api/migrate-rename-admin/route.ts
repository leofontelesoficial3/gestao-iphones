import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Migration one-shot: renomeia o usuário admin padrão para joaoiphone.
// Após rodar uma vez, futuras chamadas viram no-op (WHERE não casa mais).
export async function POST() {
  const sql = getDb();

  const result = await sql`
    UPDATE users
    SET usuario = 'joaoiphone', senha = '0426', nome = 'João'
    WHERE usuario = 'admin' AND conta = 'default' AND perfil = 'admin'
    RETURNING id, usuario
  `;

  return NextResponse.json({
    migrated: result.length,
    rows: result,
  });
}
