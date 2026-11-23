// Tempo litúrgico do dia (calendário romano), para dar a cor do momento ao app.
// Cálculo simples e local: não depende de internet.

export type Tempo = {
  nome: string;
  cor: 'verde' | 'roxo' | 'branco' | 'vermelho';
  /** Aviso curto opcional, ex.: "Advento começa domingo, 29/11". */
  aviso?: string;
};

const dia = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
const somaDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function pascoa(y: number): Date {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const d2 = ((h + l - 7 * m + 114) % 31) + 1;
  return dia(y, mes, d2);
}

/** 1º Domingo do Advento: o domingo entre 27/11 e 03/12. */
export function inicioAdvento(y: number): Date {
  const natal = dia(y, 12, 25);
  return somaDias(natal, -(natal.getDay() === 0 ? 7 : natal.getDay()) - 21);
}

/** Batismo do Senhor: domingo depois de 06/01 (fim do Tempo do Natal). */
function batismo(y: number): Date {
  const epif = dia(y, 1, 6);
  return somaDias(epif, 7 - epif.getDay());
}

export function tempoLiturgico(hoje = new Date()): Tempo {
  const t = dia(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate());
  const y = t.getFullYear();
  const pas = pascoa(y);
  const cinzas = somaDias(pas, -46);
  const pentecostes = somaDias(pas, 49);
  const advento = inicioAdvento(y);
  const natal = dia(y, 12, 25);

  if (t >= natal || t <= batismo(y)) return { nome: 'Tempo do Natal', cor: 'branco' };
  if (t >= advento) return { nome: 'Advento', cor: 'roxo' };
  if (t >= cinzas && t < somaDias(pas, -3)) return { nome: 'Quaresma', cor: 'roxo' };
  if (t >= somaDias(pas, -3) && t < pas) return { nome: 'Tríduo Pascal', cor: 'vermelho' };
  if (+t === +pentecostes) return { nome: 'Pentecostes', cor: 'vermelho' };
  if (t >= pas && t < pentecostes) return { nome: 'Tempo Pascal', cor: 'branco' };

  const tempo: Tempo = { nome: 'Tempo Comum', cor: 'verde' };
  const faltaAdvento = Math.round((+advento - +t) / 86_400_000);
  if (faltaAdvento > 0 && faltaAdvento <= 7) tempo.aviso = `Advento começa domingo, ${fmt(advento)}`;
  const faltaCinzas = Math.round((+cinzas - +t) / 86_400_000);
  if (faltaCinzas > 0 && faltaCinzas <= 7) tempo.aviso = `Quarta-feira de Cinzas em ${fmt(cinzas)}`;
  return tempo;
}

/** Classes de cor para o selo do tempo litúrgico. */
export const COR_TEMPO: Record<Tempo['cor'], { dot: string; chip: string }> = {
  verde: { dot: 'bg-liturgical-green', chip: 'text-emerald-100' },
  roxo: { dot: 'bg-liturgical-purple', chip: 'text-purple-100' },
  branco: { dot: 'bg-gold-300', chip: 'text-gold-100' },
  vermelho: { dot: 'bg-liturgical-red', chip: 'text-rose-100' },
};
