'use client';
import { useEffect, useState, useCallback } from 'react';
import { ItemListaFornecedor, TipoLucro, Fornecedor } from '@/types';
import {
  getListaFornecedor, addItemListaFornecedor, updateItemListaFornecedor, deleteItemListaFornecedor,
  getFornecedores, getCompilacaoLista, marcarCompilacaoLista,
} from '@/lib/storage';
import { useAuth } from '@/components/AuthProvider';
import { corSuave } from '@/lib/cores';
import { mascaraMoedaDigitada, parseCentavos } from '@/lib/format';

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const APARELHOS = ['IPHONE 11','IPHONE 12','IPHONE 13','IPHONE 14','IPHONE 15','IPHONE 16','IPHONE 17','IPHONE SE'];
const LINHAS = ['NORMAL','PLUS','PRO','PRO MAX','AIR','MINI'];
const CAPACIDADES = ['64 GB','128 GB','256 GB','512 GB','1 TB','2 TB'];
const CORES = ['BRANCO','PRETO','AZUL','VERDE','ROSA','CINZA','GOLD','AMARELO','ROSE','ROXO','NATURAL','DESERT','VERMELHO','SILVER','LARANJA'];
const BATERIAS_SUGERIDAS = ['80%','85%','90%','95%','100%'];

interface FormState {
  aparelho: string;
  linha: string;
  capacidade: string;
  cores: string[];
  baterias: string[];
  valorFornecedor: number;
  tipoLucro: TipoLucro;
  margemLucro: number;
  fornecedorId?: number;
  observacao: string;
}

const empty = (): FormState => ({
  aparelho: 'IPHONE 16',
  linha: 'NORMAL',
  capacidade: '128 GB',
  cores: [],
  baterias: [],
  valorFornecedor: 0,
  tipoLucro: 'percentual',
  margemLucro: 15,
  fornecedorId: undefined,
  observacao: '',
});

function calcularLucro(valorFornecedor: number, tipoLucro: TipoLucro, margemLucro: number) {
  if (tipoLucro === 'fixo') return margemLucro;
  return (valorFornecedor * margemLucro) / 100;
}

// ──────────── Agrupamento por aparelho + linha + capacidade ────────────

interface GrupoItens {
  chave: string;
  aparelho: string;
  linha: string;
  itens: ItemListaFornecedor[];
  capacidades: string[];
  cores: string[];
  baterias: string[]; // união de todas
  precoMin: number;
  precoMax: number;
}

const ORDEM_LINHA: Record<string, number> = {
  'PRO MAX': 1, 'PRO': 2, 'PLUS': 3, 'AIR': 4, 'NORMAL': 5, 'MINI': 6, 'SE': 7,
};

// Converte "1 TB" / "256 GB" para um número comparável
function capacidadeEmGB(cap: string): number {
  const m = cap.match(/(\d+)\s*(GB|TB)/i);
  if (!m) return 0;
  const n = parseInt(m[1]);
  return m[2].toUpperCase() === 'TB' ? n * 1024 : n;
}

function ordenarCapacidades(caps: string[]): string[] {
  return [...caps].sort((a, b) => capacidadeEmGB(a) - capacidadeEmGB(b));
}

function agruparItens(itens: ItemListaFornecedor[]): GrupoItens[] {
  const map = new Map<string, GrupoItens>();
  for (const item of itens) {
    const chave = `${item.aparelho}|${item.linha}`;
    let g = map.get(chave);
    if (!g) {
      g = {
        chave,
        aparelho: item.aparelho,
        linha: item.linha,
        itens: [],
        capacidades: [],
        cores: [],
        baterias: [],
        precoMin: Infinity,
        precoMax: 0,
      };
      map.set(chave, g);
    }
    g.itens.push(item);
    if (!g.capacidades.includes(item.capacidade)) g.capacidades.push(item.capacidade);
    item.cores.forEach(c => { if (!g!.cores.includes(c)) g!.cores.push(c); });
    item.baterias.forEach(b => { if (!g!.baterias.includes(b)) g!.baterias.push(b); });
    if (item.valorFornecedor > 0) {
      g.precoMin = Math.min(g.precoMin, item.valorFornecedor);
      g.precoMax = Math.max(g.precoMax, item.valorFornecedor);
    }
  }
  // Ordena as capacidades dentro de cada grupo
  for (const g of map.values()) {
    g.capacidades = ordenarCapacidades(g.capacidades);
  }
  return Array.from(map.values()).sort((a, b) => {
    const na = parseInt(a.aparelho.replace(/\D/g, '')) || 0;
    const nb = parseInt(b.aparelho.replace(/\D/g, '')) || 0;
    if (na !== nb) return nb - na; // 17 antes do 11
    return (ORDEM_LINHA[a.linha] ?? 99) - (ORDEM_LINHA[b.linha] ?? 99);
  });
}

function ordenarBaterias(bats: string[]): string[] {
  return [...bats].sort((a, b) => parseInt(a) - parseInt(b));
}

// Limpa telefone para WhatsApp: retorna apenas dígitos com 55 na frente
function whatsappUrl(telefone: string, texto: string): string {
  const digits = telefone.replace(/\D/g, '');
  const num = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}

// ────────────────────────────────────────────────────────────────
// PARSER da lista colada (formato multi-linha por bloco)
//
// Formato esperado:
//   12 pro 128gb           <- modelo (sticky até aparecer outro)
//   Azul💙                  <- cor (inicia uma seção)
//   🔋90% 100%             <- baterias da cor anterior
//   Branco🤍
//   🔋100% 100%
//   $1900.                 <- preço (fecha o bloco)
// ────────────────────────────────────────────────────────────────

interface ParsedItem {
  ok: boolean;
  raw: string;
  aparelho: string;
  linha: string;
  capacidade: string;
  cores: string[];
  baterias: string[];
  valorFornecedor: number;
  motivo?: string;
}

interface ModeloInfo {
  aparelho: string;
  linha: string;
  capacidade: string;
}

const COLOR_PATTERNS: Array<[RegExp, string]> = [
  [/\bbranco\b/i, 'BRANCO'],
  [/\bpreto\b/i, 'PRETO'],
  [/\bazul\b/i, 'AZUL'],
  [/\bverde\b/i, 'VERDE'],
  [/\bvermelho\b/i, 'VERMELHO'],
  [/\bamarelo\b/i, 'AMARELO'],
  [/\blaranja\b/i, 'LARANJA'],
  [/\bdesert\b/i, 'DESERT'],
  [/\bnatural\b/i, 'NATURAL'],
  [/\bsilver\b/i, 'SILVER'],
  [/\bgold\b/i, 'GOLD'],
  [/\brose\b/i, 'ROSE'],
  [/\brosa\b/i, 'ROSA'],
  [/\broxo\b/i, 'ROXO'],
  [/\bcinza\b/i, 'CINZA'],
];

function parseModeloLinha(linha: string): ModeloInfo | null {
  // Tenta casar "12 pro 128gb", "13 256gb", "16 pro max 256gb", "17 Pro 256gb", "iphone se 64gb"...
  const cleaned = linha.replace(/[^\w\s]/g, ' ').trim();
  const re = /^(?:iphone\s*)?(11|12|13|14|15|16|17|se)\s*(pro\s*max|pro|plus|air|mini|normal)?\s*(\d+)\s*(gb|tb)$/i;
  const m = cleaned.match(re);
  if (!m) return null;

  const numero = m[1].toUpperCase();
  const lin = m[2] ? m[2].toUpperCase().replace(/\s+/g, ' ').trim() : 'NORMAL';
  const cap = `${m[3]} ${m[4].toUpperCase()}`;

  return {
    aparelho: `IPHONE ${numero}`,
    linha: lin,
    capacidade: cap,
  };
}

function detectColorInLine(linha: string): string | null {
  for (const [re, nome] of COLOR_PATTERNS) {
    if (re.test(linha)) return nome;
  }
  return null;
}

function parsePrecoLinha(linha: string): number | null {
  // "$1900.", "1900", "R$ 1.900", "$2400. "
  const m = linha.replace(/\s+/g, '').match(/^r?\$?([\d.,]+)\.?$/i);
  if (!m) return null;
  const cleaned = m[1].replace(/\./g, '').replace(',', '.');
  const v = parseFloat(cleaned);
  if (isNaN(v) || v < 100) return null;
  return Math.round(v);
}

function extrairBaterias(linha: string): string[] {
  const matches = Array.from(linha.matchAll(/(\d{2,3})\s*%/g));
  const ns = matches
    .map(m => parseInt(m[1]))
    .filter(n => n >= 50 && n <= 100)
    .map(n => `${n}%`);
  return ns;
}

function processarBloco(
  modelo: ModeloInfo,
  bodyLines: string[],
  valorFornecedor: number,
  rawBlock: string,
): ParsedItem[] {
  // Dentro do bloco, agrupa: cor → baterias seguintes
  interface Section { cor: string | null; baterias: string[]; }
  const sections: Section[] = [];
  let currentCor: string | null = null;
  let currentBat: string[] = [];
  let pendingBat: string[] = []; // baterias que aparecem antes de qualquer cor

  const flush = () => {
    if (currentCor) {
      sections.push({ cor: currentCor, baterias: currentBat });
      currentCor = null;
      currentBat = [];
    }
  };

  for (const linha of bodyLines) {
    const cor = detectColorInLine(linha);
    if (cor) {
      flush();
      currentCor = cor;
      // Se tinha baterias órfãs antes da primeira cor, adota nesta
      if (pendingBat.length > 0) {
        currentBat.push(...pendingBat);
        pendingBat = [];
      }
      continue;
    }
    const bs = extrairBaterias(linha);
    if (bs.length > 0) {
      if (currentCor) currentBat.push(...bs);
      else pendingBat.push(...bs);
    }
  }
  flush();

  // Se não detectou nenhuma cor mas tem baterias, cria uma seção sem cor
  if (sections.length === 0 && pendingBat.length > 0) {
    sections.push({ cor: null, baterias: pendingBat });
  }

  // Se não tem nem cor nem bateria mas tem o modelo e preço, ainda gera 1 item
  if (sections.length === 0) {
    sections.push({ cor: null, baterias: [] });
  }

  return sections.map(sec => ({
    ok: true,
    raw: rawBlock,
    aparelho: modelo.aparelho,
    linha: modelo.linha,
    capacidade: modelo.capacidade,
    cores: sec.cor ? [sec.cor] : [],
    baterias: Array.from(new Set(sec.baterias)),
    valorFornecedor,
  }));
}

function parseListaCompleta(texto: string): ParsedItem[] {
  const linhas = texto.split(/\r?\n/).map(l => l.trim());
  const resultado: ParsedItem[] = [];

  let modeloAtual: ModeloInfo | null = null;
  let bodyAtual: string[] = [];
  let rawAtual: string[] = [];

  for (const linha of linhas) {
    if (!linha) continue;

    // Tenta interpretar como modelo
    const novoModelo = parseModeloLinha(linha);
    if (novoModelo) {
      modeloAtual = novoModelo;
      bodyAtual = [];
      rawAtual = [linha];
      continue;
    }

    // Tenta interpretar como preço (fecha o bloco)
    const preco = parsePrecoLinha(linha);
    if (preco !== null) {
      rawAtual.push(linha);
      if (!modeloAtual) {
        resultado.push({
          ok: false,
          raw: rawAtual.join('\n'),
          aparelho: '', linha: 'NORMAL', capacidade: '128 GB',
          cores: [], baterias: [], valorFornecedor: 0,
          motivo: 'Preço encontrado sem modelo definido acima.',
        });
        bodyAtual = [];
        rawAtual = [];
        continue;
      }
      const itens = processarBloco(modeloAtual, bodyAtual, preco, rawAtual.join('\n'));
      resultado.push(...itens);
      bodyAtual = [];
      rawAtual = [];
      continue;
    }

    // Senão é parte do corpo (cor, bateria ou ruído)
    bodyAtual.push(linha);
    rawAtual.push(linha);
  }

  // Se sobrou body sem preço final, marca como erro
  if (bodyAtual.length > 0 && rawAtual.length > 0) {
    resultado.push({
      ok: false,
      raw: rawAtual.join('\n'),
      aparelho: '', linha: 'NORMAL', capacidade: '128 GB',
      cores: [], baterias: [], valorFornecedor: 0,
      motivo: 'Bloco sem preço no final.',
    });
  }

  return resultado;
}

// ────────────────────────────────────────────────────────────────

export default function ListaFornecedorPage() {
  const { isAdmin } = useAuth();
  const [itens, setItens] = useState<ItemListaFornecedor[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(empty());
  const [bateriaInput, setBateriaInput] = useState('');
  const [lucroFixoTxt, setLucroFixoTxt] = useState('');
  const [valorFornecedorTxt, setValorFornecedorTxt] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [filtroAparelho, setFiltroAparelho] = useState('');
  const [filtroFornecedorId, setFiltroFornecedorId] = useState<number | null>(null);
  const [compilacaoAt, setCompilacaoAt] = useState<string | null>(null);
  // Cor e capacidade selecionadas por grupo (para filtrar dentro do card)
  const [coresSelecionadas, setCoresSelecionadas] = useState<Record<string, string | null>>({});
  const [capacidadesSelecionadas, setCapacidadesSelecionadas] = useState<Record<string, string | null>>({});

  const selecionarCor = (chave: string, cor: string | null) => {
    setCoresSelecionadas(prev => ({ ...prev, [chave]: cor }));
  };
  const selecionarCapacidade = (chave: string, cap: string | null) => {
    setCapacidadesSelecionadas(prev => ({ ...prev, [chave]: cap }));
    // Ao mudar de capacidade, limpa a cor selecionada (cores podem variar)
    setCoresSelecionadas(prev => ({ ...prev, [chave]: null }));
  };

  // Importador
  const [showImport, setShowImport] = useState(false);
  const [textoImport, setTextoImport] = useState('');
  const [parsedItens, setParsedItens] = useState<ParsedItem[]>([]);
  const [importTipoLucro, setImportTipoLucro] = useState<TipoLucro>('percentual');
  const [importMargem, setImportMargem] = useState(15);
  const [importMargemFixoTxt, setImportMargemFixoTxt] = useState('');
  const [importFornecedorId, setImportFornecedorId] = useState<number | ''>('');
  const [importando, setImportando] = useState(false);

  const load = useCallback(async () => {
    const [lista, fs, comp] = await Promise.all([
      getListaFornecedor(),
      getFornecedores(),
      getCompilacaoLista(),
    ]);
    setItens(lista);
    setFornecedores(fs);
    setCompilacaoAt(comp.at);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!isAdmin) return null;

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleCor = (c: string) => {
    const lista = form.cores.includes(c) ? form.cores.filter(x => x !== c) : [...form.cores, c];
    set('cores', lista);
  };

  const toggleBateria = (b: string) => {
    const lista = form.baterias.includes(b) ? form.baterias.filter(x => x !== b) : [...form.baterias, b];
    set('baterias', lista);
  };

  const addBateriaCustom = () => {
    const v = bateriaInput.trim().replace(/\D/g, '');
    if (!v) return;
    const formatted = `${v}%`;
    if (!form.baterias.includes(formatted)) set('baterias', [...form.baterias, formatted]);
    setBateriaInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (form.cores.length === 0) { setErro('Selecione ao menos uma cor.'); return; }
    setSalvando(true);
    try {
      const payload = {
        aparelho: form.aparelho,
        linha: form.linha,
        capacidade: form.capacidade,
        cores: form.cores,
        baterias: form.baterias,
        valorFornecedor: form.valorFornecedor,
        tipoLucro: form.tipoLucro,
        margemLucro: form.margemLucro,
        fornecedorId: form.fornecedorId,
        observacao: form.observacao || undefined,
      };
      if (editandoId) {
        await updateItemListaFornecedor(editandoId, payload);
      } else {
        await addItemListaFornecedor(payload);
      }
      await load();
      setForm(empty());
      setValorFornecedorTxt('');
      setLucroFixoTxt('');
      setEditandoId(null);
      setShowForm(false);
    } catch {
      setErro('Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const handleEdit = (item: ItemListaFornecedor) => {
    setForm({
      aparelho: item.aparelho,
      linha: item.linha,
      capacidade: item.capacidade,
      cores: [...item.cores],
      baterias: [...item.baterias],
      valorFornecedor: item.valorFornecedor,
      tipoLucro: item.tipoLucro,
      margemLucro: item.margemLucro,
      fornecedorId: item.fornecedorId,
      observacao: item.observacao || '',
    });
    setValorFornecedorTxt(
      item.valorFornecedor > 0 ? mascaraMoedaDigitada(String(Math.round(item.valorFornecedor * 100))) : ''
    );
    setLucroFixoTxt(
      item.tipoLucro === 'fixo' && item.margemLucro > 0
        ? mascaraMoedaDigitada(String(Math.round(item.margemLucro * 100)))
        : ''
    );
    setEditandoId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este item da lista do fornecedor?')) return;
    await deleteItemListaFornecedor(id);
    await load();
  };

  // ── Importador ──
  const analisar = () => {
    const itens = parseListaCompleta(textoImport);
    setParsedItens(itens);
  };

  const removerParseado = (idx: number) => {
    setParsedItens(prev => prev.filter((_, i) => i !== idx));
  };

  const importarTudo = async () => {
    const validItems = parsedItens.filter(p => p.ok);
    if (validItems.length === 0) {
      alert('Nada para importar. Cole uma lista e clique em "Analisar".');
      return;
    }
    setImportando(true);
    try {
      // Se o fornecedor selecionado já tem itens, atualiza (substitui) a lista anterior
      if (importFornecedorId) {
        const fornecedorIdNum = Number(importFornecedorId);
        const existentes = itens.filter(i => i.fornecedorId === fornecedorIdNum);
        if (existentes.length > 0) {
          const f = fornecedores.find(x => x.id === fornecedorIdNum);
          const nome = f?.nome ?? 'este fornecedor';
          const confirma = confirm(
            `🔄 Atualizar lista de "${nome}"?\n\n` +
            `Já existem ${existentes.length} item(ns) cadastrados deste fornecedor. ` +
            `A lista atual será SUBSTITUÍDA pela nova (${validItems.length} item(ns)).\n\n` +
            `OK = atualizar (apaga antigos e cadastra os novos)\n` +
            `Cancelar = não importar nada`
          );
          if (!confirma) {
            setImportando(false);
            return;
          }
          // Apaga os existentes vinculados a esse fornecedor
          for (const item of existentes) {
            await deleteItemListaFornecedor(item.id);
          }
        }
      }

      const margemFixo = parseCentavos(importMargemFixoTxt);
      const margemUsada = importTipoLucro === 'fixo' ? margemFixo : importMargem;
      for (const p of validItems) {
        await addItemListaFornecedor({
          aparelho: p.aparelho,
          linha: p.linha,
          capacidade: p.capacidade,
          cores: p.cores.length ? p.cores : ['PRETO'], // fallback se não detectou cor
          baterias: p.baterias,
          valorFornecedor: p.valorFornecedor,
          tipoLucro: importTipoLucro,
          margemLucro: margemUsada,
          fornecedorId: importFornecedorId ? Number(importFornecedorId) : undefined,
          observacao: undefined,
        });
      }
      await marcarCompilacaoLista();
      await load();
      setShowImport(false);
      setTextoImport('');
      setParsedItens([]);
    } catch {
      alert('Erro ao importar a lista.');
    } finally {
      setImportando(false);
    }
  };

  const itensFiltrados = itens.filter(i =>
    (!filtroAparelho || i.aparelho === filtroAparelho) &&
    (!filtroFornecedorId || i.fornecedorId === filtroFornecedorId),
  );
  // Aparelhos disponíveis dependem do filtro de fornecedor (para não mostrar opções vazias)
  const itensParaAparelhos = filtroFornecedorId
    ? itens.filter(i => i.fornecedorId === filtroFornecedorId)
    : itens;
  const aparelhosDisponiveis = Array.from(new Set(itensParaAparelhos.map(i => i.aparelho)));
  // Fornecedores que aparecem em pelo menos um item da lista (para botões de filtro)
  const fornecedoresEmUso = Array.from(
    new Map(
      itens
        .filter(i => i.fornecedorId)
        .map(i => [i.fornecedorId!, fornecedores.find(f => f.id === i.fornecedorId)])
        .filter((entry): entry is [number, Fornecedor] => entry[1] !== undefined),
    ).values(),
  );
  const grupos = agruparItens(itensFiltrados);

  // Helpers
  const fornecedorDoItem = (item: ItemListaFornecedor) =>
    item.fornecedorId ? fornecedores.find(f => f.id === item.fornecedorId) : undefined;

  const enviarWhatsAppFornecedor = (item: ItemListaFornecedor) => {
    const f = fornecedorDoItem(item);
    if (!f || !f.telefone) {
      alert('Este item não tem fornecedor com telefone cadastrado.');
      return;
    }
    const total = item.valorFornecedor + calcularLucro(item.valorFornecedor, item.tipoLucro, item.margemLucro);
    const texto = [
      `Olá, ${f.nome}!`,
      `Tenho interesse no produto:`,
      ``,
      `📱 *${item.aparelho} ${item.linha}* — ${item.capacidade}`,
      item.cores.length ? `Cores: ${item.cores.join(', ')}` : '',
      item.baterias.length ? `Bateria: ${item.baterias.join(', ')}` : '',
      item.valorFornecedor > 0 ? `\nValor: ${fmtMoeda(item.valorFornecedor)}` : '',
      item.valorFornecedor > 0 ? `Preço sugerido de venda: ${fmtMoeda(total)}` : '',
    ].filter(Boolean).join('\n');
    window.open(whatsappUrl(f.telefone, texto), '_blank');
  };

  // Filtra os itens do grupo conforme capacidade/cor selecionadas
  const filtrarItens = (
    grupo: GrupoItens,
    capSel: string | null,
    corSel: string | null,
  ): ItemListaFornecedor[] => {
    return grupo.itens.filter(it =>
      (!capSel || it.capacidade === capSel) &&
      (!corSel || it.cores.includes(corSel)),
    );
  };

  // WhatsApp baseado no grupo + filtros
  const enviarWhatsAppGrupo = (
    grupo: GrupoItens,
    capSel: string | null,
    corSel: string | null,
  ) => {
    const visiveis = filtrarItens(grupo, capSel, corSel);
    const item = visiveis[0] ?? grupo.itens[0];

    const f = fornecedorDoItem(item);
    if (!f || !f.telefone) {
      alert('Este item não tem fornecedor com telefone cadastrado.');
      return;
    }
    const baterias = ordenarBaterias(Array.from(new Set(visiveis.flatMap(it => it.baterias))));
    const cores = corSel ? [corSel] : Array.from(new Set(visiveis.flatMap(it => it.cores)));
    const capacidades = capSel ? [capSel] : Array.from(new Set(visiveis.map(it => it.capacidade)));
    const total = item.valorFornecedor + calcularLucro(item.valorFornecedor, item.tipoLucro, item.margemLucro);

    const linhasMsg = [
      `Olá, ${f.nome}!`,
      `Tenho interesse no produto:`,
      ``,
      `📱 *${grupo.aparelho} ${grupo.linha}*`,
      capacidades.length ? `Capacidade: ${ordenarCapacidades(capacidades).join(', ')}` : '',
      cores.length ? `${corSel ? 'Cor' : 'Cores'}: ${cores.join(', ')}` : '',
      baterias.length ? `🔋 Bateria: ${baterias.join(', ')}` : '',
    ];

    // Se for específico (cap+cor) mostramos preço unitário; senão faixa
    if (capSel && corSel && item.valorFornecedor > 0) {
      linhasMsg.push(``, `Valor: ${fmtMoeda(item.valorFornecedor)}`, `Preço sugerido de venda: ${fmtMoeda(total)}`);
    } else if (visiveis.length > 0) {
      const valores = visiveis.map(it => it.valorFornecedor).filter(v => v > 0);
      if (valores.length > 0) {
        const min = Math.min(...valores);
        const max = Math.max(...valores);
        linhasMsg.push(``, min === max ? `Valor: ${fmtMoeda(min)}` : `Faixa de valor: ${fmtMoeda(min)} – ${fmtMoeda(max)}`);
      }
    }

    const texto = linhasMsg.filter(Boolean).join('\n');
    window.open(whatsappUrl(f.telefone, texto), '_blank');
  };

  // Excluir baseado no grupo (capacidade+cor específicas ou em massa)
  const handleDeleteGrupo = async (
    grupo: GrupoItens,
    capSel: string | null,
    corSel: string | null,
  ) => {
    const alvos = filtrarItens(grupo, capSel, corSel);
    if (alvos.length === 0) return;

    let descricao = `${grupo.aparelho} ${grupo.linha}`;
    if (capSel) descricao += ` ${capSel}`;
    if (corSel) descricao += ` (${corSel})`;
    const msg = alvos.length === grupo.itens.length
      ? `Remover TODAS as ${grupo.itens.length} variações de "${descricao}"?`
      : `Remover ${alvos.length} variação(ões) de "${descricao}"?`;

    if (!confirm(msg)) return;
    for (const item of alvos) {
      await deleteItemListaFornecedor(item.id);
    }
    selecionarCor(grupo.chave, null);
    selecionarCapacidade(grupo.chave, null);
    await load();
  };

  const formatarCompilacao = (at: string | null): string => {
    if (!at) return 'Nenhuma compilação ainda';
    const d = new Date(at);
    return d.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo', // BRT (GMT-3)
    }) + ' (BRT)';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 Lista do Fornecedor</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Catálogo de aparelhos disponíveis no fornecedor (segundo estoque) com margem de lucro desejada.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            🕒 Última compilação: <span className="font-semibold text-gray-600">{formatarCompilacao(compilacaoAt)}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setShowImport(true); setTextoImport(''); setParsedItens([]); }}
            className="px-4 py-2 rounded-lg border-2 font-semibold text-sm"
            style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}
          >
            📥 Importar Lista
          </button>
          <button
            onClick={() => { setEditandoId(null); setForm(empty()); setValorFornecedorTxt(''); setLucroFixoTxt(''); setShowForm(s => !s); }}
            className="px-4 py-2 rounded-lg text-white font-semibold text-sm"
            style={{ background: 'var(--brand-primary)' }}
          >
            {showForm ? '✕ Fechar' : '+ Novo item'}
          </button>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Aparelho</label>
              <select className="input" value={form.aparelho} onChange={e => set('aparelho', e.target.value)}>
                {APARELHOS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Linha</label>
              <select className="input" value={form.linha} onChange={e => set('linha', e.target.value)}>
                {LINHAS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Capacidade</label>
              <select className="input" value={form.capacidade} onChange={e => set('capacidade', e.target.value)}>
                {CAPACIDADES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Cores disponíveis <span className="text-gray-400 text-xs font-normal">(selecione uma ou mais)</span></label>
            <div className="flex flex-wrap gap-2">
              {CORES.map(c => {
                const sel = form.cores.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCor(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                      sel ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                    style={sel ? {} : { background: corSuave(c) }}
                  >
                    {sel && '✓ '}{c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">% de Bateria <span className="text-gray-400 text-xs font-normal">(selecione ou adicione)</span></label>
            <div className="flex flex-wrap gap-2 mb-2">
              {BATERIAS_SUGERIDAS.map(b => {
                const sel = form.baterias.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBateria(b)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${
                      sel ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {sel && '✓ '}🔋 {b}
                  </button>
                );
              })}
              {form.baterias.filter(b => !BATERIAS_SUGERIDAS.includes(b)).map(b => (
                <span key={b} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border-2 border-green-600 flex items-center gap-1">
                  ✓ 🔋 {b}
                  <button type="button" onClick={() => toggleBateria(b)} className="ml-1 text-green-700 hover:text-red-600">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={bateriaInput}
                onChange={e => setBateriaInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBateriaCustom(); } }}
                placeholder="Outra %, ex: 87"
                className="input !w-auto text-sm"
                maxLength={3}
              />
              <button
                type="button"
                onClick={addBateriaCustom}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Adicionar %
              </button>
            </div>
          </div>

          <div>
            <label className="label">Valor cobrado pelo Fornecedor (R$)</label>
            <input
              type="text"
              inputMode="numeric"
              className="input !font-bold"
              value={valorFornecedorTxt}
              placeholder="R$ 0,00"
              onChange={e => {
                const txt = mascaraMoedaDigitada(e.target.value);
                setValorFornecedorTxt(txt);
                set('valorFornecedor', parseCentavos(txt));
              }}
            />
            <p className="text-[10px] text-gray-400 mt-1">Base sobre a qual o lucro será calculado.</p>
          </div>

          <div>
            <label className="label">Lucro Desejado</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => set('tipoLucro', 'percentual')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 ${
                  form.tipoLucro === 'percentual' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                % Percentual
              </button>
              <button
                type="button"
                onClick={() => set('tipoLucro', 'fixo')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 ${
                  form.tipoLucro === 'fixo' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                R$ Valor fixo
              </button>
            </div>

            {form.tipoLucro === 'percentual' ? (
              <input
                type="number"
                step="0.5"
                className="input !font-bold"
                value={form.margemLucro}
                onChange={e => set('margemLucro', Number(e.target.value))}
                placeholder="15"
              />
            ) : (
              <input
                type="text"
                inputMode="numeric"
                className="input !font-bold"
                value={lucroFixoTxt}
                placeholder="R$ 0,00"
                onChange={e => {
                  const txt = mascaraMoedaDigitada(e.target.value);
                  setLucroFixoTxt(txt);
                  set('margemLucro', parseCentavos(txt));
                }}
              />
            )}

            {form.valorFornecedor > 0 && form.margemLucro > 0 && (
              <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Custo fornecedor</span>
                  <span className="font-semibold">{fmtMoeda(form.valorFornecedor)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>+ Lucro {form.tipoLucro === 'percentual' ? `(${form.margemLucro}%)` : '(fixo)'}</span>
                  <span className="font-semibold">+{fmtMoeda(calcularLucro(form.valorFornecedor, form.tipoLucro, form.margemLucro))}</span>
                </div>
                <div className="flex justify-between text-gray-800 font-bold pt-1 border-t border-green-300 mt-1">
                  <span>Preço de venda sugerido</span>
                  <span>{fmtMoeda(form.valorFornecedor + calcularLucro(form.valorFornecedor, form.tipoLucro, form.margemLucro))}</span>
                </div>
              </div>
            )}
          </div>

          {/* Fornecedor */}
          <div>
            <label className="label">Fornecedor <span className="text-gray-400 text-xs font-normal">(opcional, com WhatsApp para pedido)</span></label>
            <select
              className="input"
              value={form.fornecedorId ?? ''}
              onChange={e => set('fornecedorId', e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">— Sem fornecedor vinculado —</option>
              {fornecedores.map(f => (
                <option key={f.id} value={f.id}>
                  {f.nome}{f.telefone ? ` · ${f.telefone}` : ''}
                </option>
              ))}
            </select>
            {fornecedores.length === 0 && (
              <p className="text-[10px] text-gray-400 mt-1">Cadastre fornecedores em Fornecedores no menu.</p>
            )}
          </div>

          <div>
            <label className="label">Observação <span className="text-gray-400 text-xs font-normal">(opcional)</span></label>
            <input
              type="text"
              className="input"
              value={form.observacao}
              onChange={e => set('observacao', e.target.value)}
              placeholder="Ex: lacrado, anatel, etc."
            />
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditandoId(null); setForm(empty()); setValorFornecedorTxt(''); setLucroFixoTxt(''); }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-60"
              style={{ background: 'var(--brand-primary)' }}
            >
              {salvando ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Adicionar à Lista'}
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      {itens.length > 0 && (
        <div className="space-y-2">
          {/* Filtro de Fornecedor */}
          {fornecedoresEmUso.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">
                🚚 Fornecedor
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { setFiltroFornecedorId(null); setFiltroAparelho(''); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    filtroFornecedorId === null
                      ? 'bg-orange-600 text-white'
                      : 'bg-white border border-orange-200 text-orange-700 hover:bg-orange-50'
                  }`}
                >
                  Todos ({itens.length})
                </button>
                {fornecedoresEmUso.map(f => {
                  const total = itens.filter(i => i.fornecedorId === f.id).length;
                  const sel = filtroFornecedorId === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => { setFiltroFornecedorId(f.id); setFiltroAparelho(''); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        sel
                          ? 'bg-orange-600 text-white'
                          : 'bg-white border border-orange-200 text-orange-700 hover:bg-orange-50'
                      }`}
                    >
                      {f.nome} ({total})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtro de Aparelho */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">
              📱 Aparelho
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFiltroAparelho('')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  filtroAparelho === '' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Todos ({itensParaAparelhos.length})
              </button>
              {aparelhosDisponiveis.map(a => {
                const total = itensParaAparelhos.filter(i => i.aparelho === a).length;
                return (
                  <button
                    key={a}
                    onClick={() => setFiltroAparelho(a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      filtroAparelho === a ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {a} ({total})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Listagem agrupada por aparelho+linha+capacidade */}
      {itens.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-lg font-bold text-gray-700">Lista vazia</p>
          <p className="text-sm text-gray-500 mt-1">
            Adicione manualmente ou cole uma lista pronta no botão "Importar Lista".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {grupos.map(grupo => {
            const capSel = capacidadesSelecionadas[grupo.chave] ?? null;
            const corSel = coresSelecionadas[grupo.chave] ?? null;
            const itensFiltradosCap = capSel
              ? grupo.itens.filter(it => it.capacidade === capSel)
              : grupo.itens;
            const itensVisiveis = corSel
              ? itensFiltradosCap.filter(it => it.cores.includes(corSel))
              : itensFiltradosCap;
            // Cores que aparecem após filtro de capacidade
            const coresDisponiveis = Array.from(
              new Set(itensFiltradosCap.flatMap(it => it.cores)),
            );
            const bateriasVisiveis = ordenarBaterias(
              Array.from(new Set(itensVisiveis.flatMap(it => it.baterias))),
            );
            const itemAtivo = itensVisiveis[0] ?? grupo.itens[0];
            const fornecedor = fornecedorDoItem(itemAtivo);
            const margemBadge =
              itemAtivo.tipoLucro === 'fixo'
                ? `+${fmtMoeda(itemAtivo.margemLucro)}`
                : `+${itemAtivo.margemLucro}%`;
            const lucroAtivo = calcularLucro(itemAtivo.valorFornecedor, itemAtivo.tipoLucro, itemAtivo.margemLucro);
            const totalAtivo = itemAtivo.valorFornecedor + lucroAtivo;

            // Faixa de preço dos itens visíveis
            const valoresVisiveis = itensVisiveis.map(it => it.valorFornecedor).filter(v => v > 0);
            const precoMinVis = valoresVisiveis.length ? Math.min(...valoresVisiveis) : 0;
            const precoMaxVis = valoresVisiveis.length ? Math.max(...valoresVisiveis) : 0;
            const filtroCompleto = capSel && corSel; // mostra preço unitário
            const subtitulo = [
              capSel ? `${capSel}` : `${grupo.capacidades.length} cap(s)`,
              `${grupo.cores.length} cor(es)`,
              `${grupo.itens.length} variação(ões)`,
            ].join(' · ');

            return (
              <div key={grupo.chave} className="bg-white rounded-2xl shadow p-4 space-y-3">
                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-gray-800 text-base">
                      {grupo.aparelho} <span className="font-normal text-gray-500">{grupo.linha}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{subtitulo}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary-dark)' }}
                  >
                    {margemBadge}
                  </span>
                </div>

                {/* Fornecedor */}
                {fornecedor && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5">
                    <p className="text-[10px] text-orange-700 uppercase tracking-wide font-semibold">Fornecedor</p>
                    <p className="text-sm font-bold text-gray-800 truncate">🚚 {fornecedor.nome}</p>
                    {fornecedor.telefone && (
                      <p className="text-[11px] text-gray-500 truncate">{fornecedor.telefone}</p>
                    )}
                  </div>
                )}

                {/* Preço — exato quando cap+cor; senão faixa */}
                {valoresVisiveis.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-2.5 text-xs space-y-1">
                    {filtroCompleto ? (
                      <>
                        <div className="flex justify-between text-gray-500">
                          <span>Custo {capSel} · {corSel}</span>
                          <span className="font-semibold">{fmtMoeda(itemAtivo.valorFornecedor)}</span>
                        </div>
                        <div className="flex justify-between text-green-700">
                          <span>+ Lucro</span>
                          <span className="font-semibold">+{fmtMoeda(lucroAtivo)}</span>
                        </div>
                        <div className="flex justify-between text-gray-800 font-bold pt-1 border-t border-gray-200">
                          <span>Preço sugerido</span>
                          <span>{fmtMoeda(totalAtivo)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-gray-700">
                        <span>{capSel ? `Custo ${capSel}` : corSel ? `Custo ${corSel}` : 'Faixa de custo'}</span>
                        <span className="font-bold">
                          {precoMinVis === precoMaxVis
                            ? fmtMoeda(precoMinVis)
                            : `${fmtMoeda(precoMinVis)} – ${fmtMoeda(precoMaxVis)}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Capacidades — chips clicáveis */}
                {grupo.capacidades.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Capacidade · clique para filtrar
                      </p>
                      {capSel && (
                        <button
                          onClick={() => selecionarCapacidade(grupo.chave, null)}
                          className="text-[10px] text-purple-600 hover:underline font-semibold"
                        >
                          ✕ Limpar
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {grupo.capacidades.map(c => {
                        const sel = c === capSel;
                        return (
                          <button
                            key={c}
                            onClick={() => selecionarCapacidade(grupo.chave, sel ? null : c)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border-2 transition-all ${
                              sel
                                ? 'border-purple-600 bg-purple-100 text-purple-800 ring-2 ring-purple-200'
                                : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                            }`}
                          >
                            {sel && '✓ '}{c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cores — chips clicáveis (filtradas por capacidade selecionada) */}
                {coresDisponiveis.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Cores · clique para filtrar baterias
                      </p>
                      {corSel && (
                        <button
                          onClick={() => selecionarCor(grupo.chave, null)}
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          ✕ Limpar
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {coresDisponiveis.map(c => {
                        const sel = c === corSel;
                        return (
                          <button
                            key={c}
                            onClick={() => selecionarCor(grupo.chave, sel ? null : c)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border-2 transition-all ${
                              sel
                                ? 'border-blue-600 bg-blue-100 text-blue-800 ring-2 ring-blue-200'
                                : 'border-gray-200 text-gray-700 hover:border-gray-400'
                            }`}
                            style={!sel ? { background: corSuave(c) } : {}}
                          >
                            {sel && '✓ '}{c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Baterias — filtradas pelos dois seletores */}
                {bateriasVisiveis.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                      Bateria
                      {capSel || corSel
                        ? ` · ${[capSel, corSel].filter(Boolean).join(' · ')}`
                        : ' · todas'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {bateriasVisiveis.map(b => (
                        <span
                          key={b}
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200"
                        >
                          🔋 {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {itemAtivo.observacao && (
                  <p className="text-xs text-gray-500 italic">📝 {itemAtivo.observacao}</p>
                )}

                {/* Ações: WhatsApp · Editar · Excluir */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => enviarWhatsAppGrupo(grupo, capSel, corSel)}
                    className="flex-1 py-1.5 text-xs rounded-lg font-bold text-white flex items-center justify-center gap-1"
                    style={{ background: '#25D366' }}
                    title="Pedir pelo WhatsApp do fornecedor"
                  >
                    💬 Pedir no WhatsApp
                  </button>
                  <button
                    onClick={() => handleEdit(itemAtivo)}
                    className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteGrupo(grupo, capSel, corSel)}
                    className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 rounded-lg text-red-600 font-semibold"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Importar Lista */}
      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
          onClick={() => setShowImport(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 z-10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">📥 Importar Lista do Fornecedor</h2>
                <p className="text-xs text-gray-500">Cole a lista (uma linha por aparelho) e o sistema cadastra tudo de uma vez.</p>
              </div>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="label">Cole a lista aqui</label>
                <textarea
                  rows={6}
                  className="input font-mono text-xs"
                  value={textoImport}
                  onChange={e => setTextoImport(e.target.value)}
                  placeholder={'Exemplo:\niPhone 14 Pro Max 256gb - preto, branco - 100% - R$ 5500\niPhone 14 Pro 128gb - azul - 95% - 4800\niPhone 13 256GB - dourado - R$ 3200'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Lucro padrão a aplicar</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setImportTipoLucro('percentual')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border-2 ${
                        importTipoLucro === 'percentual' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      % Percentual
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportTipoLucro('fixo')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border-2 ${
                        importTipoLucro === 'fixo' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      R$ Fixo
                    </button>
                  </div>
                  {importTipoLucro === 'percentual' ? (
                    <input
                      type="number"
                      step="0.5"
                      className="input"
                      value={importMargem}
                      onChange={e => setImportMargem(Number(e.target.value))}
                      placeholder="15"
                    />
                  ) : (
                    <input
                      type="text"
                      inputMode="numeric"
                      className="input"
                      value={importMargemFixoTxt}
                      placeholder="R$ 0,00"
                      onChange={e => setImportMargemFixoTxt(mascaraMoedaDigitada(e.target.value))}
                    />
                  )}
                </div>

                <div>
                  <label className="label">Fornecedor a vincular <span className="text-gray-400 text-xs font-normal">(opcional)</span></label>
                  <select
                    className="input"
                    value={importFornecedorId}
                    onChange={e => setImportFornecedorId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">— Nenhum —</option>
                    {fornecedores.map(f => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                  {importFornecedorId !== '' && (() => {
                    const total = itens.filter(i => i.fornecedorId === Number(importFornecedorId)).length;
                    if (total === 0) return null;
                    return (
                      <div className="mt-2 px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-[11px] text-yellow-800">
                        ⚠ Este fornecedor já tem <strong>{total} item(ns)</strong>. Ao importar, a lista será <strong>substituída</strong> pela nova.
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={analisar}
                  className="flex-1 py-2 rounded-lg font-semibold text-sm border-2"
                  style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}
                >
                  🔍 Analisar lista
                </button>
                <button
                  type="button"
                  onClick={importarTudo}
                  disabled={parsedItens.filter(p => p.ok).length === 0 || importando}
                  className="flex-1 py-2 rounded-lg font-bold text-sm text-white disabled:opacity-50"
                  style={{ background: 'var(--brand-primary)' }}
                >
                  {importando ? 'Importando...' : `✓ Importar ${parsedItens.filter(p => p.ok).length} itens`}
                </button>
              </div>

              {/* Pré-visualização */}
              {parsedItens.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600">
                    Itens detectados ({parsedItens.filter(p => p.ok).length} de {parsedItens.length}):
                  </p>
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {parsedItens.map((p, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-2 rounded-lg border flex items-center justify-between gap-2 ${
                          p.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          {p.ok ? (
                            <p className="font-semibold text-gray-800">
                              <span className="inline-block min-w-[170px]">
                                {p.aparelho} {p.linha} {p.capacidade}
                              </span>
                              {' · '}
                              <span className="text-gray-700">
                                {p.cores.length ? p.cores.join(', ') : '⚠ sem cor'}
                              </span>
                              {p.baterias.length > 0 && (
                                <span className="text-gray-500"> · 🔋 {p.baterias.join(' ')}</span>
                              )}
                              {p.valorFornecedor > 0 && (
                                <span className="ml-2 font-bold text-green-700">{fmtMoeda(p.valorFornecedor)}</span>
                              )}
                            </p>
                          ) : (
                            <>
                              <p className="font-bold text-red-700">✕ {p.motivo}</p>
                              <p className="text-[10px] text-gray-500 italic line-clamp-2">{p.raw}</p>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => removerParseado(idx)}
                          className="text-gray-400 hover:text-red-600 text-xs flex-shrink-0"
                          title="Remover este item"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
