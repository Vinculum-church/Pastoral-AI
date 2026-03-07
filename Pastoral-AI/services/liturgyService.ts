import { LiturgicalColor } from '../types';

export interface LiturgyInfo {
  data: string;
  cor: LiturgicalColor;
  tempo: string;
  santo_ou_solenidade: string;
  leituras: string;
  descricao: string;
}

// Helper to check if date is Sunday
const isSunday = (date: Date) => date.getDay() === 0;

// Mock database of fixed feasts and saints (Exemplo simplificado para demonstração)
const FIXED_FEASTS: Record<string, Partial<LiturgyInfo>> = {
  '01-01': { santo_ou_solenidade: 'Santa Maria, Mãe de Deus', cor: LiturgicalColor.WHITE, descricao: 'Solenidade' },
  '03-19': { santo_ou_solenidade: 'São José, Esposo de Maria', cor: LiturgicalColor.WHITE, descricao: 'Solenidade' },
  '06-24': { santo_ou_solenidade: 'Natividade de São João Batista', cor: LiturgicalColor.WHITE, descricao: 'Solenidade' },
  '06-29': { santo_ou_solenidade: 'São Pedro e São Paulo', cor: LiturgicalColor.RED, descricao: 'Solenidade' },
  '08-15': { santo_ou_solenidade: 'Assunção de Nossa Senhora', cor: LiturgicalColor.WHITE, descricao: 'Solenidade' },
  '10-04': { santo_ou_solenidade: 'São Francisco de Assis', cor: LiturgicalColor.WHITE, descricao: 'Memória' },
  '10-12': { santo_ou_solenidade: 'Nossa Senhora Aparecida', cor: LiturgicalColor.WHITE, descricao: 'Padroeira do Brasil' },
  '11-01': { santo_ou_solenidade: 'Todos os Santos', cor: LiturgicalColor.WHITE, descricao: 'Solenidade' },
  '11-02': { santo_ou_solenidade: 'Fiéis Defuntos', cor: LiturgicalColor.PURPLE, descricao: 'Comemoração' },
  '12-08': { santo_ou_solenidade: 'Imaculada Conceição', cor: LiturgicalColor.WHITE, descricao: 'Solenidade' },
  '12-25': { santo_ou_solenidade: 'Natal do Senhor', cor: LiturgicalColor.WHITE, descricao: 'Solenidade' },
};

export const getLiturgicalDetails = (dateString: string): LiturgyInfo => {
  const date = new Date(dateString + 'T12:00:00'); // Force noon to avoid timezone issues
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate(); // 1-31
  const key = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  // 1. Check Fixed Feasts first
  if (FIXED_FEASTS[key]) {
    return {
      data: dateString,
      tempo: 'Sanctoral',
      leituras: 'Leituras Próprias da Solenidade',
      ...FIXED_FEASTS[key]
    } as LiturgyInfo;
  }

  // 2. Determine Season (Tempo Litúrgico) - Simplified Logic for Demo
  let cor = LiturgicalColor.GREEN;
  let tempo = 'Tempo Comum';
  let santo = 'Dia Ferial';
  let leituras = 'Leituras do Dia';
  let descricao = 'Semana do Tempo Comum';

  // Logic for Seasons (Approximate dates for logic)
  if (month === 12) {
    if (day < 25) {
      cor = LiturgicalColor.PURPLE;
      tempo = 'Advento';
      descricao = 'Tempo de espera e preparação.';
    } else {
      cor = LiturgicalColor.WHITE;
      tempo = 'Tempo do Natal';
      descricao = 'Oitava de Natal';
    }
  } else if (month === 3 || (month === 2 && day > 14)) { // Rough Quaresma check
    cor = LiturgicalColor.PURPLE;
    tempo = 'Quaresma';
    descricao = 'Tempo de penitência e conversão.';
  } else if (month === 4 || month === 5) { // Rough Easter check
    cor = LiturgicalColor.WHITE;
    tempo = 'Tempo Pascal';
    descricao = 'Celebração da Ressurreição.';
    if (month === 5 && day > 18) { // Rough Pentecostes check
        cor = LiturgicalColor.RED;
        tempo = 'Pentecostes';
    }
  }

  // Sunday Override (Dominica)
  if (isSunday(date)) {
    santo = `Domingo do ${tempo}`;
    leituras = 'Leituras Dominicais (Ciclo B)'; // Mock cycle
    if (tempo === 'Tempo Comum') {
        cor = LiturgicalColor.GREEN;
    }
  } else {
      // If it's not a special feast and simple day
      if (cor === LiturgicalColor.GREEN) {
          santo = "Dia Ferial (Semana do Tempo Comum)";
      }
  }

  return {
    data: dateString,
    cor,
    tempo,
    santo_ou_solenidade: santo,
    leituras,
    descricao
  };
};