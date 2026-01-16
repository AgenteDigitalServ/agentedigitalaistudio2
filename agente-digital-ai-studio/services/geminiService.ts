
import { GoogleGenAI, Part } from "@google/genai";
import { blobToBase64 } from '../utils/fileUtils';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

interface GenerateParams {
  prompt: string;
  mode: 'create' | 'edit';
  activeCreateFn: string;
  activeEditFn: string;
  image1: File | null;
  image2: File | null;
  resolution: string;
}

function getFullPrompt(prompt: string, func: string, mode: string): string {
    const cleanPrompt = prompt.trim();
    
    // Se o prompt estiver vazio, fornecemos um padrão baseado na função selecionada
    if (!cleanPrompt) {
        if (mode === 'create') {
            switch(func) {
                case 'sticker': return "a beautiful high quality sticker, die-cut, white background";
                case 'text': return "a professional minimalist logo design";
                case 'comic': return "a professional comic book illustration, vibrant colors";
                case '3d-mascot': return "a cute 3D character mascot, high quality render";
                case 'thumbnail': return "an eye-catching YouTube thumbnail background, high contrast";
                default: return "a beautiful professional digital art piece, high resolution, detailed";
            }
        } else {
            switch(func) {
                case 'retouch': return "Enhance and professionally retouch this image, improving lighting and details";
                case 'style': return "Apply a beautiful artistic style to this image";
                case 'add-remove': return "Enhance the details of this image";
                case 'compose': return "Merge these two images together seamlessly and artistically";
                default: return "Enhance and improve this image";
            }
        }
    }

    switch(func) {
        case 'sticker': return `a sticker of ${cleanPrompt}, die-cut, vector, white background, high quality`;
        case 'text': return `a minimalist vector logo of ${cleanPrompt}, on a white background, typography, high resolution`;
        case 'comic': return `${cleanPrompt}, comic book style, vibrant colors, detailed line art, professional comic illustration`;
        case '3d-mascot': return `${cleanPrompt}, personagem mascote 3d, visual amigável e atraente, estilo de renderização 3d moderno, adequado para uma marca, fundo branco`;
        case 'thumbnail': return `Crie uma thumbnail vibrante e chamativa para o YouTube sobre ${cleanPrompt}, alto contraste, composição dinâmica, espaço para sobreposição de texto, fotorrealista.`;
        case 'add-remove':
        case 'retouch':
        case 'style':
            return cleanPrompt; 
        case 'compose':
            return `Compose the two images together with the following instruction: ${cleanPrompt}`;
        default: return cleanPrompt;
    }
}

export const generateImageApi = async ({
  prompt,
  mode,
  activeCreateFn,
  activeEditFn,
  image1,
  image2,
  resolution,
}: GenerateParams): Promise<{ url: string, blob: Blob }> => {

  const activeFn = mode === 'create' ? activeCreateFn : activeEditFn;
  const fullPrompt = getFullPrompt(prompt, activeFn, mode);

  // For edits or for creation with a reference image, use gemini-2.5-flash-image
  if (mode === 'edit' || (mode === 'create' && image1)) {
    const parts: Part[] = [];

    if (image1) {
      parts.push({ inlineData: { mimeType: image1.type, data: await blobToBase64(image1) } });
    }

    if (image2) {
      parts.push({ inlineData: { mimeType: image2.type, data: await blobToBase64(image2) } });
    }

    // O Gemini sempre exige uma parte de texto não vazia
    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: parts },
      config: { 
        imageConfig: {
          aspectRatio: resolution as any
        }
      },
    });
    
    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
       throw new Error("A API não retornou conteúdo válido.");
    }

    const imagePart = candidate.content.parts.find(p => p.inlineData);

    if (!imagePart || !imagePart.inlineData) {
      // Se não houver imagem, mas houver texto, pode ser uma resposta puramente textual por erro do modelo
      const textPart = candidate.content.parts.find(p => p.text);
      throw new Error(textPart?.text || "A API não conseguiu processar a imagem. Tente um prompt mais específico.");
    }
    
    const base64ImageBytes = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType;
    const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
    const blob = await (await fetch(imageUrl)).blob();
    return { url: imageUrl, blob };
  } 
  // For standard text-to-image creation, use imagen-4.0-generate-001
  else {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: { 
        numberOfImages: 1, 
        aspectRatio: resolution as any 
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("A API não retornou nenhuma imagem. Tente outro prompt.");
    }
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
    const blob = await (await fetch(imageUrl)).blob();
    return { url: imageUrl, blob: blob };
  }
};
