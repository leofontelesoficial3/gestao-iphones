// Máscaras e formatadores compartilhados

/**
 * Aplica máscara de celular brasileiro.
 * Formatos:
 *  - até 6 dígitos: (xx) x
 *  - 7 a 10 dígitos: (xx) x xxx-xxx
 *  - 11+ dígitos: (xx) x xxxx-xxxx
 */
export function mascaraCelular(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  const len = digitos.length;
  if (len === 0) return '';
  if (len <= 2) return `(${digitos}`;
  if (len <= 3) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (len <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 3)} ${digitos.slice(3)}`;
  if (len <= 10) {
    // formato (xx) x xxx-xxx (sem último dígito)
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 3)} ${digitos.slice(3, 7)}-${digitos.slice(7)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 3)} ${digitos.slice(3, 7)}-${digitos.slice(7, 11)}`;
}

/**
 * Formata valor numérico como moeda brasileira (R$ 1.234,56)
 */
export function mascaraMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Transforma string digitada em um campo de moeda em número.
 * Aceita entrada livre como "1234,56" ou "1.234,56" ou "1234.56".
 */
export function parseMoeda(texto: string): number {
  if (!texto) return 0;
  // Remove tudo que não é dígito, vírgula ou ponto
  const limpo = texto.replace(/[^\d,.-]/g, '');
  // Se tem vírgula, assume BR: remove pontos, troca vírgula por ponto
  let normalized: string;
  if (limpo.includes(',')) {
    normalized = limpo.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = limpo;
  }
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

/**
 * Máscara monetária para input controlado.
 * Recebe o texto que o usuário digitou e retorna a string formatada "R$ x.xxx,xx"
 * trabalhando com centavos (cada dígito entra como o dígito mais à direita).
 *
 * Uso típico:
 *   const [v, setV] = useState('');
 *   <input value={v} onChange={e => setV(mascaraMoedaDigitada(e.target.value))} />
 *   // valor numérico: parseCentavos(v)
 */
export function mascaraMoedaDigitada(texto: string): string {
  const digitos = texto.replace(/\D/g, '');
  if (!digitos) return '';
  const num = parseInt(digitos, 10) / 100;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Extrai o valor numérico de uma string formatada como moeda (mascaraMoedaDigitada).
 */
export function parseCentavos(texto: string): number {
  const digitos = texto.replace(/\D/g, '');
  if (!digitos) return 0;
  return parseInt(digitos, 10) / 100;
}
