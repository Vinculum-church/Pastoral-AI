import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_MODEL_FLASH = "gemini-2.5-flash";
const GEMINI_MODEL_PRO = "gemini-2.5-pro";

const getAi = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("VITE_GEMINI_API_KEY não está configurada. Adicione no arquivo .env da pasta Pastoral-AI.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateCatecheticalPlan = async (
  etapa: string,
  tempo: string,
  userPrompt: string
): Promise<string> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FLASH,
      contents: `Atue como um catequista católico experiente e fiel ao magistério.
      Crie um plano de encontro detalhado com a seguinte estrutura:
      1. Tema e Objetivo
      2. Acolhida e Oração Inicial
      3. Leitura Bíblica (indicar passagem apropriada)
      4. Desenvolvimento do Tema (Dinâmica ou Explicação)
      5. Atividade Prática
      6. Oração Final

      Contexto do Encontro:
      - Etapa Catequética: ${etapa}
      - Tempo Litúrgico: ${tempo}
      - Solicitação Específica: ${userPrompt}
      
      Utilize uma linguagem acolhedora e adequada à faixa etária da etapa informada.`,
      config: {
        systemInstruction: "Você é um assistente pastoral especializado em catequese católica.",
      },
    });

    return response.text || "Não foi possível gerar o plano neste momento.";
  } catch (error) {
    console.error("Erro ao gerar plano:", error);
    return "Ocorreu um erro ao comunicar com o assistente IA. Por favor, verifique a chave de API.";
  }
};

export interface LiturgySuggestion {
  santo: string;
  vida_breve: string;
  cor: string;
  leituras: string;
  tema_sugerido: string;
  ideia_dinamica: string;
}

export const getLiturgicalSuggestions = async (date: string, etapaContext: string): Promise<LiturgySuggestion | null> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FLASH,
      contents: `Para a data ${date} e uma turma de catequese da etapa '${etapaContext}', forneça sugestões litúrgicas e pastorais.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            santo: { 
              type: Type.STRING,
              description: "O Santo do dia ou Solenidade litúrgica católica."
            },
            vida_breve: {
              type: Type.STRING,
              description: "Uma frase curta e inspiradora sobre quem foi este santo ou o significado da solenidade (máx 20 palavras)."
            },
            cor: { 
              type: Type.STRING,
              description: "A cor litúrgica (Verde, Branco, Vermelho, Roxo ou Rosa)."
            },
            leituras: { 
              type: Type.STRING,
              description: "As referências bíblicas da liturgia diária (1ª Leitura, Salmo, Evangelho)."
            },
            tema_sugerido: { 
              type: Type.STRING,
              description: "Um tema curto para o encontro baseado na liturgia ou no santo."
            },
            ideia_dinamica: { 
              type: Type.STRING,
              description: "Uma sugestão muito breve (1 frase) de atividade prática."
            }
          },
          required: ["santo", "vida_breve", "cor", "leituras", "tema_sugerido", "ideia_dinamica"]
        }
      },
    });

    const text = response.text;
    if (!text) return null;
    
    // Clean potential markdown formatting if present
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as LiturgySuggestion;
  } catch (error) {
    console.error("Erro ao buscar sugestão litúrgica:", error);
    return null;
  }
};

export const generateMeetingScript = async (
  date: string, 
  etapa: string, 
  liturgyInfo: LiturgySuggestion | null, 
  userCustomRequest: string
): Promise<string> => {
  try {
    const ai = getAi();
    const liturgyContext = liturgyInfo 
      ? `Liturgia do dia: ${liturgyInfo.santo} (${liturgyInfo.vida_breve}). Leituras: ${liturgyInfo.leituras}.` 
      : `Data: ${date}.`;

    const prompt = `
      Crie um Roteiro de Encontro de Catequese detalhado e pronto para uso.
      
      Informações:
      - Data: ${date}
      - Turma/Etapa: ${etapa}
      - ${liturgyContext}
      - PEDIDO ESPECIAL DO CATEQUISTA: "${userCustomRequest}"

      O roteiro deve conectar a liturgia do dia com o pedido do catequista.
      Estrutura do Roteiro (Use Markdown):
      1. 🎯 Objetivo do Encontro
      2. 🙏 Oração Inicial (Sugira uma oração específica)
      3. 📖 Aprofundamento (Como explicar o tema para esta idade)
      4. 🎨 Dinâmica/Atividade (Passo a passo breve)
      5. ✨ Encerramento
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_PRO,
      contents: prompt,
      config: {
        systemInstruction: "Você é um coordenador de catequese sábio e prático. Suas respostas são estruturadas para serem lidas e aplicadas diretamente na sala.",
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Erro ao gerar roteiro:", error);
    return "Erro ao gerar roteiro. Tente novamente.";
  }
};
