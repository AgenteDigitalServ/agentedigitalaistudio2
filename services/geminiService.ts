
import { GoogleGenAI, Part } from "@google/genai";
import { blobToBase64 } from '../utils/fileUtils.ts';

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
    
    if (!cleanPrompt) {
        if (mode === 'create') {
            switch(func) {
                case 'sticker': return "a high quality sticker, die-cut, white background, masterpiece";
                case 'text': return "a minimalist vector logo design, professional, white background";
                case 'comic': return "professional comic book art, vibrant colors, detailed";
                case '3d-mascot': return "cute 3D character mascot, Pixar style, high quality render, white background";
                case 'thumbnail': return "eye-catching YouTube thumbnail background, high contrast, cinematic";
                default: return "professional digital art, high resolution, cinematic lighting";
            }
        } else {
            switch(func) {
                case 'retouch': return "Retouch and enhance this image, improve lighting and details";
                case 'style': return "Apply a modern artistic style to this image";
                case 'add-remove': return "Modify the details of this image realistically";
                case 'compose': return "Merge these two images together artistically";
                default: return "Enhance this image";
            }
        }
    }

    switch(func) {
        case 'sticker': return `sticker of ${cleanPrompt}, die-cut, vector style, white background`;
        case 'text': return `minimalist logo of ${cleanPrompt}, white background, high resolution`;
        case 'comic': return `${cleanPrompt}, comic book style illustration, vibrant`;
        case '3d-mascot': return `${cleanPrompt}, 3D mascot, modern render, white background`;
        case 'thumbnail': return `YouTube thumbnail about ${cleanPrompt}, dynamic composition, vibrant`;
        case 'compose': return `Combine these images: ${cleanPrompt}`;
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
  
  // SEMPRE criar uma nova instância antes da chamada para garantir o uso da chave atualizada
  const apiKey = process.env.API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  const activeFn = mode === 'create' ? activeCreateFn : activeEditFn;
  const fullPrompt = getFullPrompt(prompt, activeFn, mode);

  const parts: Part[] = [];

  if (image1) {
    const base64Image = await blobToBase64(image1);
    parts.push({ inlineData: { mimeType: image1.type, data: base64Image } });
  }

  if (image2) {
    const base64Image = await blobToBase64(image2);
    parts.push({ inlineData: { mimeType: image2.type, data: base64Image } });
  }

  parts.push({ text: fullPrompt });

  try {
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
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

    if (!imagePart || !imagePart.inlineData) {
      // Verifica se houve retorno de texto explicando erro (ex: conteúdo bloqueado)
      const textError = candidate?.content?.parts?.find(p => p.text)?.text;
      throw new Error(textError || "A IA não conseguiu gerar esta imagem. Tente mudar o prompt.");
    }
    
    const base64ImageBytes = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType;
    const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
    
    const responseData = await fetch(imageUrl);
    const blob = await responseData.blob();
    
    return { url: imageUrl, blob };
  } catch (err: any) {
    console.error("Erro detalhado da API:", err);
    
    // Tratamento de erros específicos para orientar o usuário
    const errorMessage = err.message || "";
    
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      throw new Error("Limite de cota excedido. Aguarde um minuto ou troque sua chave de API.");
    }
    
    if (errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("API key")) {
      throw new Error("AUTH_ERROR: Falha na autenticação da Chave de API.");
    }

    if (errorMessage.includes("safety") || errorMessage.includes("blocked")) {
      throw new Error("A imagem solicitada foi bloqueada pelos filtros de segurança da IA.");
    }

    throw new Error("Falha na conexão com o servidor de imagens. Verifique sua internet.");
  }
};
