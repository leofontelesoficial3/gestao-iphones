export type ProdutoStatus = 'EM_ESTOQUE' | 'VENDIDO';
export type EstadoProduto = 'NOVO' | 'SEMINOVO';
export type FormaPagamento = 'DINHEIRO' | 'DEBITO' | 'PIX' | 'CREDITO' | 'PRODUTO_RECEBIDO';

export interface Produto {
  id: string;
  dataEntrada: string;
  codigo: number;
  modelo: string;
  linha: string;
  imei: string;
  possuiNota: 'SIM' | 'NÃO';
  gb: string;
  compTrocado: string;
  cor: string;
  estado: EstadoProduto;
  bateria: string;
  valorCompra: number;
  status: ProdutoStatus;
  fotos?: string[]; // base64
  fornecedorId?: number;
  descricao?: string;
  // Campos preenchidos quando VENDIDO
  dataVenda?: string;
  valorVenda?: number;
  custos?: number;
  cliente?: string;
  contato?: string;
  lucro?: number;
  formasPagamento?: FormaPagamento[];
  parcelasCredito?: number; // 1-18
  acrescimo?: number; // valor total do acréscimo em R$
  // Endereço do cliente
  enderecoCep?: string;
  enderecoLogradouro?: string;
  enderecoNumero?: string;
  enderecoBairro?: string;
  enderecoCidade?: string;
  enderecoUf?: string;
  enderecoComplemento?: string;
}

export interface Fornecedor {
  id: number;
  nome: string;
  telefone: string;
  endereco: string;
  /** Calculado via join quando a rota é chamada com ?stats=1 */
  totalProdutos?: number;
  valorTotal?: number;
}

export interface Stats {
  totalFaturamento: number;
  totalLucro: number;
  qtdEmEstoque: number;
  valorEmEstoque: number;
  qtdVendidos: number;
}
