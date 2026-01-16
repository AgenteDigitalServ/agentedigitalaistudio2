
import { GeneratedImage } from '../types.ts';
import { blobToBase64, base64ToBlob } from '../utils/fileUtils.ts';

const HISTORY_KEY = 'imageGeneratorHistory';
// Reduzimos para 8 itens para garantir que caibam no limite de 5MB do localStorage
const MAX_HISTORY_ITEMS = 8;

interface StoredImage {
  id: string;
  prompt: string;
  base64: string;
  mimeType: string;
}

/**
 * Tenta salvar o histórico. Se a cota do localStorage for excedida, 
 * remove o item mais antigo e tenta novamente recursivamente.
 */
const retrySave = (data: string): void => {
  try {
    localStorage.setItem(HISTORY_KEY, data);
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      const currentData: StoredImage[] = JSON.parse(data);
      if (currentData.length > 1) {
        // Remove o mais antigo (último da lista) e tenta de novo
        currentData.pop();
        retrySave(JSON.stringify(currentData));
      } else {
        // Se nem com 1 item cabe, limpa tudo
        localStorage.removeItem(HISTORY_KEY);
      }
    } else {
      console.error("Erro crítico ao acessar localStorage", error);
    }
  }
};

export const saveHistory = async (history: GeneratedImage[]): Promise<void> => {
  try {
    // Pegamos apenas os itens mais recentes dentro do limite definido
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    
    const storableHistory: StoredImage[] = await Promise.all(
      limitedHistory.map(async (img) => ({
        id: img.id,
        prompt: img.prompt,
        base64: await blobToBase64(img.blob),
        mimeType: img.blob.type,
      }))
    );
    
    retrySave(JSON.stringify(storableHistory));
  } catch (error) {
    console.error("Falhou ao converter imagens para salvamento", error);
  }
};

export const loadHistory = async (): Promise<GeneratedImage[]> => {
  try {
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (!storedHistory) {
      return [];
    }

    const parsedHistory: StoredImage[] = JSON.parse(storedHistory);

    const history: GeneratedImage[] = await Promise.all(
      parsedHistory.map(async (item) => {
        try {
          const blob = await base64ToBlob(item.base64, item.mimeType);
          return {
            id: item.id,
            prompt: item.prompt,
            blob,
            url: URL.createObjectURL(blob),
          };
        } catch (e) {
          // Se um item específico falhar (dados corrompidos), retornamos null e filtramos depois
          return null as any;
        }
      })
    );
    
    return history.filter(item => item !== null);
  } catch (error) {
    console.error("Falhou ao carregar histórico do localStorage", error);
    // Em caso de erro de parsing, limpamos para evitar loops de erro
    localStorage.removeItem(HISTORY_KEY);
    return [];
  }
};
