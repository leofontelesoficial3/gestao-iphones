import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Migration one-shot: cria o usuário superadmin global (admin/troni102).
// Idempotente — se já existe, faz UPDATE para garantir credenciais corretas.
export async function POST() {
  const sql = getDb();

  const existente = await sql`SELECT id FROM users WHERE usuario = 'admin' AND perfil = 'superadmin'`;

  if (existente.length === 0) {
    await sql`
      INSERT INTO users (usuario, nome, senha, perfil, conta)
      VALUES ('admin', 'Super Admin', 'troni102', 'superadmin', '*')
    `;
    return NextResponse.json({ created: true });
  }

  await sql`
    UPDATE users
    SET senha = 'troni102', perfil = 'superadmin', conta = '*'
    WHERE usuario = 'admin' AND perfil = 'superadmin'
  `;
  return NextResponse.json({ updated: true });
}
