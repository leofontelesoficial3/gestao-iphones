/**
 * Mapa de cores suaves (pastel claríssimo) para destacar linhas/cards
 * de acordo com a cor do produto. Todas em torno de 97-98% de luminosidade
 * para serem sutis e não brigar com o conteúdo.
 */
const MAPA_CORES_SUAVES: Record<string, string> = {
  // Pretos e grafites
  PRETO: '#f5f5f5',
  GRAFITE: '#f4f4f5',
  'SPACE GRAY': '#f3f4f6',
  'JET BLACK': '#f5f5f5',
  'BLACK TITANIUM': '#f5f5f5',
  MIDNIGHT: '#eef2ff',

  // Brancos, prata e titânio
  BRANCO: '#fafafa',
  SILVER: '#f8fafc',
  STARLIGHT: '#fefce8',
  'WHITE TITANIUM': '#fafafa',
  NATURAL: '#fafaf9',

  // Vermelhos e rosas
  RED: '#fef2f2',
  VERMELHO: '#fef2f2',
  CORAL: '#fff1f2',
  ROSA: '#fdf2f8',
  ROSE: '#fdf2f8',
  'ROSE GOLD': '#fdf2f8',
  CINZA: '#f3f4f6',

  // Verdes
  VERDE: '#f0fdf4',
  'ALPINE GREEN': '#f0fdf4',
  'MIDNIGHT GREEN': '#ecfdf5',

  // Azuis
  AZUL: '#eff6ff',
  'SIERRA BLUE': '#eff6ff',
  'PACIFIC BLUE': '#dbeafe',

  // Amarelos e dourados
  GOLD: '#fefce8',
  AMARELO: '#fefce8',

  // Laranjas
  LARANJA: '#fff7ed',
  'DESERT TITANIUM': '#fffbeb',
  DESERT: '#fffbeb',

  // Roxos
  ROXO: '#faf5ff',
  'DEEP PURPLE': '#f5f3ff',
};

/**
 * Retorna um hex de fundo suave para a cor de um produto.
 * Se a cor não estiver mapeada, retorna branco (sem destaque).
 */
export function corSuave(cor: string | null | undefined): string {
  if (!cor) return '#ffffff';
  return MAPA_CORES_SUAVES[cor.toUpperCase()] ?? '#ffffff';
}
