import { GeneratedImage } from '../types';
import { blobToBase64, base64ToBlob } from '../utils/fileUtils';

const HISTORY_KEY = 'imageGeneratorHistory';
const MAX_HISTORY_ITEMS = 20;

interface StoredImage {
  id: string;
  prompt: string;
  base64: string;
  mimeType: string;
}

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
    localStorage.setItem(HISTORY_KEY, JSON.stringify(storableHistory));
  } catch (error) {
    console.error("Failed to save history to localStorage", error);
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
        const blob = await base64ToBlob(item.base64, item.mimeType);
        return {
          id: item.id,
          prompt: item.prompt,
          blob,
          url: URL.createObjectURL(blob),
        };
      })
    );
    return history;
  } catch (error) {
    console.error("Failed to load history from localStorage", error);
    // If parsing fails, clear the corrupted history
    localStorage.removeItem(HISTORY_KEY);
    return [];
  }
};
