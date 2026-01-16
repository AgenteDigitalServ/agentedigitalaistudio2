
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
                case 'sticker': return "a high quality sticker, die-cut, white background, masterpiece, 8k";
                case 'text': return "a minimalist vector logo design, professional, clean typography, white background";
                case 'comic': return "professional comic book art, vibrant colors, detailed line art, masterpiece";
                case '3d-mascot': return "cute 3D character mascot, Pixar style, high quality render, white background, octane render";
                case 'thumbnail': return "eye-catching YouTube thumbnail background, high contrast, cinematic, vibrant";
                default: return "professional digital art, high resolution, cinematic lighting, masterpiece, detailed";
            }
        } else {
            switch(func) {
                case 'retouch': return "Retouch and enhance this image, improve lighting, skin textures and details to perfection";
                case 'style': return "Apply a modern, high-end artistic style to this image while maintaining content";
                case 'add-remove': return "Modify the details of this image realistically and seamlessly";
                case 'compose': return "Merge these two images together artistically with perfect lighting match";
                default: return "Enhance this image to professional quality";
            }
        }
    }

    switch(func) {
        case 'sticker': return `sticker of ${cleanPrompt}, die-cut, high quality vector style, white background`;
        case 'text': return `minimalist logo design of ${cleanPrompt}, professional aesthetic, high resolution`;
        case 'comic': return `${cleanPrompt}, professional comic book style illustration, masterpiece`;
        case '3d-mascot': return `${cleanPrompt}, 3D mascot character, modern 3D render, white background, 8k`;
        case 'thumbnail': return `YouTube thumbnail about ${cleanPrompt}, dynamic composition, vibrant colors, clickbait style`;
        case 'compose': return `Combine these images seamlessly: ${cleanPrompt}`;
        default: return `${cleanPrompt}, professional quality, cinematic lighting, highly detailed`;
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
  
  // Usamos a chave diretamente do ambiente. Se estiver vazia, o SDK falhará e cairemos no catch.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const activeFn = mode === 'create' ? activeCreateFn : activeEditFn;
  const fullPrompt = getFullPrompt(prompt, activeFn, mode);

  const parts: Part[] = [];

  try {
    if (image1) {
      const base64Image = await blobToBase64(image1);
      parts.push({ inlineData: { mimeType: image1.type, data: base64Image } });
    }

    if (image2) {
      const base64Image = await blobToBase64(image2);
      parts.push({ inlineData: { mimeType: image2.type, data: base64Image } });
    }

    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: {
          aspectRatio: resolution as any
        }
      },
    });
    
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

    if (!imagePart || !imagePart.inlineData) {
      if (candidate?.finishReason === 'SAFETY') {
        throw new Error("Conteúdo bloqueado pelos filtros de segurança da IA.");
      }
      throw new Error("A IA não retornou uma imagem. Tente mudar o seu comando.");
    }
    
    const base64ImageBytes = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType;
    const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
    
    const responseData = await fetch(imageUrl);
    const blob = await responseData.blob();
    
    return { url: imageUrl, blob };
  } catch (err: any) {
    console.error("NETLIFY_RUNTIME_DEBUG:", err);
    
    const errorMsg = err.message || "";
    
    // Se falhar por causa da chave (403/401) ou se ela estiver vazia
    if (errorMsg.includes("403") || errorMsg.includes("API key") || errorMsg.includes("invalid") || !process.env.API_KEY) {
      throw new Error("Erro de Configuração no Netlify: Vá em 'Site Settings > Env Variables', adicione a 'API_KEY' e use 'Clear cache and deploy'.");
    }

    if (errorMsg.includes("429")) {
      throw new Error("Limite de cota atingido. Aguarde 60 segundos.");
    }

    throw new Error(err.message || "Erro na geração. Verifique sua conexão ou tente novamente.");
  }
};
