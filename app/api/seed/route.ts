import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedProdutos } from '@/lib/seedData';

export async function GET() {
  const sql = getDb();

  // Criar tabelas
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      usuario VARCHAR(100) UNIQUE NOT NULL,
      nome VARCHAR(200) NOT NULL,
      senha VARCHAR(200) NOT NULL,
      perfil VARCHAR(20) NOT NULL DEFAULT 'admin',
      conta VARCHAR(100) NOT NULL DEFAULT 'default',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS contas (
      id SERIAL PRIMARY KEY,
      conta VARCHAR(100) UNIQUE NOT NULL,
      nome_loja VARCHAR(200) NOT NULL DEFAULT 'Minha Loja',
      plano VARCHAR(20) NOT NULL DEFAULT 'gratuito',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS produtos (
      id VARCHAR(100) PRIMARY KEY,
      conta VARCHAR(100) NOT NULL DEFAULT 'default',
      data_entrada VARCHAR(20),
      codigo INTEGER NOT NULL,
      modelo VARCHAR(100) NOT NULL,
      linha VARCHAR(50),
      imei VARCHAR(50),
      possui_nota VARCHAR(10) DEFAULT 'NÃO',
      gb VARCHAR(20),
      comp_trocado VARCHAR(200),
      cor VARCHAR(50),
      estado VARCHAR(20) DEFAULT 'SEMINOVO',
      bateria VARCHAR(10),
      valor_compra DECIMAL(10,2) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'EM_ESTOQUE',
      fotos TEXT,
      data_venda VARCHAR(20),
      valor_venda DECIMAL(10,2),
      custos DECIMAL(10,2),
      cliente VARCHAR(200),
      contato VARCHAR(100),
      lucro DECIMAL(10,2),
      formas_pagamento TEXT,
      parcelas_credito INTEGER,
      acrescimo DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Tabela de fornecedores
  await sql`
    CREATE TABLE IF NOT EXISTS fornecedores (
      id SERIAL PRIMARY KEY,
      conta VARCHAR(100) NOT NULL DEFAULT 'default',
      nome VARCHAR(200) NOT NULL,
      telefone VARCHAR(30),
      endereco TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Adiciona coluna fornecedor_id em produtos (migration idempotente)
  await sql`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS fornecedor_id INTEGER`;
  // Descrição do aparelho
  await sql`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS descricao TEXT`;
  // Endereço do cliente
  await sql`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS endereco_cep VARCHAR(20)`;
  await sql`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS endereco_logradouro VARCHAR(300)`;
  await sql`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS endereco_numero VARCHAR(30)`;
  await sql`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS endereco_bairro VARCHAR(150)`;
  await sql`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS endereco_cidade VARCHAR(150)`;
  await sql`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS endereco_uf VARCHAR(5)`;
  await sql`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS endereco_complemento VARCHAR(200)`;

  // Preço público para a loja online (opcional, definido pelo admin)
  await sql`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS preco_publico DECIMAL(10,2)`;

  // Lista de fornecedor — segundo "estoque" com aparelhos disponíveis no fornecedor
  await sql`
    CREATE TABLE IF NOT EXISTS lista_fornecedor (
      id SERIAL PRIMARY KEY,
      conta VARCHAR(100) NOT NULL DEFAULT 'default',
      aparelho VARCHAR(50) NOT NULL,
      linha VARCHAR(30) NOT NULL,
      capacidade VARCHAR(20) NOT NULL,
      cores TEXT,
      baterias TEXT,
      margem_lucro DECIMAL(5,2) DEFAULT 0,
      observacao TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  // Suporta lucro por valor fixo em R$ — coluna margem_lucro precisa de mais dígitos
  await sql`ALTER TABLE lista_fornecedor ALTER COLUMN margem_lucro TYPE DECIMAL(10,2)`;
  await sql`ALTER TABLE lista_fornecedor ADD COLUMN IF NOT EXISTS tipo_lucro VARCHAR(20) DEFAULT 'percentual'`;
  // Valor de fornecedor — base sobre a qual o lucro é calculado
  await sql`ALTER TABLE lista_fornecedor ADD COLUMN IF NOT EXISTS valor_fornecedor DECIMAL(10,2) DEFAULT 0`;

  // Tema da conta (estilo da página)
  await sql`ALTER TABLE contas ADD COLUMN IF NOT EXISTS tema_cor VARCHAR(20) DEFAULT 'azul'`;
  await sql`ALTER TABLE contas ADD COLUMN IF NOT EXISTS tema_logo TEXT`;
  await sql`ALTER TABLE contas ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30)`;

  // Seed users padrão
  const existingUsers = await sql`SELECT COUNT(*) as total FROM users`;
  if (Number(existingUsers[0].total) === 0) {
    await sql`INSERT INTO users (usuario, nome, senha, perfil, conta) VALUES ('admin', 'Administrador', 'admin', 'admin', 'default')`;
    await sql`INSERT INTO users (usuario, nome, senha, perfil, conta) VALUES ('vendedor', 'Vendedor', 'vendedor', 'vendedor', 'default')`;
    await sql`INSERT INTO contas (conta, nome_loja, plano) VALUES ('default', 'iPhones Fortaleza', 'empresarial')`;
  }

  // Seed produtos padrão
  const existingProdutos = await sql`SELECT COUNT(*) as total FROM produtos WHERE conta = 'default'`;
  if (Number(existingProdutos[0].total) === 0) {
    for (const p of seedProdutos) {
      await sql`
        INSERT INTO produtos (id, conta, data_entrada, codigo, modelo, linha, imei, possui_nota, gb, comp_trocado, cor, estado, bateria, valor_compra, status, data_venda, valor_venda, custos, cliente, contato, lucro, formas_pagamento, parcelas_credito, acrescimo)
        VALUES (${p.id}, 'default', ${p.dataEntrada}, ${p.codigo}, ${p.modelo}, ${p.linha}, ${p.imei}, ${p.possuiNota}, ${p.gb}, ${p.compTrocado}, ${p.cor}, ${p.estado}, ${p.bateria}, ${p.valorCompra}, ${p.status}, ${p.dataVenda || null}, ${p.valorVenda || null}, ${p.custos || null}, ${p.cliente || null}, ${p.contato || null}, ${p.lucro || null}, ${p.formasPagamento ? JSON.stringify(p.formasPagamento) : null}, ${p.parcelasCredito || null}, ${p.acrescimo || null})
      `;
    }
  }

  return NextResponse.json({ message: 'Banco configurado com sucesso', usuarios: 2, produtos: seedProdutos.length });
}
