
import { GeneratedImage } from '../types.ts';
import { blobToBase64, base64ToBlob } from '../utils/fileUtils.ts';

const HISTORY_KEY = 'imageGeneratorHistory_v2';
const MAX_HISTORY_ITEMS = 8;

interface StoredImage {
  id: string;
  prompt: string;
  base64: string;
  mimeType: string;
}

const retrySave = (data: string): void => {
  try {
    localStorage.setItem(HISTORY_KEY, data);
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      const currentData: StoredImage[] = JSON.parse(data);
      if (currentData.length > 1) {
        currentData.pop();
        retrySave(JSON.stringify(currentData));
      } else {
        localStorage.removeItem(HISTORY_KEY);
      }
    }
  }
};

export const saveHistory = async (history: GeneratedImage[]): Promise<void> => {
  try {
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
    console.error("Erro ao salvar histórico:", error);
  }
};

export const loadHistory = async (): Promise<GeneratedImage[]> => {
  try {
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (!storedHistory) return [];

    const parsedHistory: StoredImage[] = JSON.parse(storedHistory);
    return await Promise.all(
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
          return null as any;
        }
      })
    ).then(res => res.filter(i => i !== null));
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    localStorage.removeItem(HISTORY_KEY);
    return [];
  }
};
