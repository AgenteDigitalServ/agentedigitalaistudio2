
import React, { useState, useCallback, useEffect } from 'react';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { generateImageApi } from './services/geminiService';
import { loadHistory, saveHistory } from './services/localStorageService';
import { AppState, ImageFile, Mode, GeneratedImage } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    prompt: '',
    mode: 'create',
    activeCreateFn: 'free',
    activeEditFn: 'add-remove',
    image1: null,
    image2: null,
    generatedImage: null,
    isLoading: false,
    error: null,
    resolution: '1:1',
    history: [],
  });
  
  useEffect(() => {
    loadHistory().then(history => {
        setAppState(prev => ({ ...prev, history }));
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    // Validação básica: Modo Criar sem imagem de referência exige prompt
    if (appState.mode === 'create' && !appState.image1 && !appState.prompt.trim()) {
      setAppState(prev => ({ ...prev, error: 'Por favor, descreva a imagem que deseja criar ou envie uma referência.' }));
      return;
    }

    // Modo Editar exige pelo menos uma imagem
    if (appState.mode === 'edit' && !appState.image1) {
      setAppState(prev => ({ ...prev, error: 'Selecione uma imagem para editar.' }));
      return;
    }

    setAppState(prev => ({ ...prev, isLoading: true, error: null, generatedImage: null }));
    try {
      const generatedData = await generateImageApi({
        prompt: appState.prompt,
        mode: appState.mode,
        activeCreateFn: appState.activeCreateFn,
        activeEditFn: appState.activeEditFn,
        image1: appState.image1?.file || null,
        image2: appState.image2?.file || null,
        resolution: appState.resolution,
      });

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: generatedData.url,
        blob: generatedData.blob,
        prompt: appState.prompt.trim() || 'Processamento sem prompt',
      };
      
      setAppState(prev => {
        const newHistory = [newImage, ...prev.history];
        saveHistory(newHistory);
        return { ...prev, generatedImage: newImage, history: newHistory };
      });

    } catch (err: any) {
      console.error("Erro na geração:", err);
      let errorMessage = 'Ocorreu um erro ao gerar a imagem.';
      
      // Tentar extrair mensagem de erro amigável se for JSON
      try {
        if (err.message && err.message.includes('{')) {
          const parsed = JSON.parse(err.message.substring(err.message.indexOf('{')));
          errorMessage = parsed.message || errorMessage;
        } else {
          errorMessage = err.message || errorMessage;
        }
      } catch(e) {
        errorMessage = err.message || errorMessage;
      }

      setAppState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }, [appState.prompt, appState.mode, appState.activeCreateFn, appState.activeEditFn, appState.image1, appState.image2, appState.resolution]);
  
  const handleApplyStyle = useCallback(async (style: string) => {
    if (!appState.generatedImage) return;

    setAppState(prev => ({ ...prev, isLoading: true, error: null }));

    let stylePrompt = '';
    switch (style) {
        case 'advertising':
            stylePrompt = 'Aprimore esta imagem para parecer um anúncio profissional. Torne as cores mais vibrantes, a iluminação mais dramática e a composição geral mais atraente.';
            break;
        case 'cinema':
            stylePrompt = 'Transforme esta imagem para ter uma aparência cinematográfica com iluminação dramática e gradação de cor profissional.';
            break;
        case 'perfection':
            stylePrompt = 'Aprimore esta imagem com perfeição, melhorando detalhes, nitidez e cores para um visual hiper-realista.';
            break;
        case 'cartoon':
            stylePrompt = 'Re-imagine esta imagem em um estilo de desenho animado vibrante com contornos marcantes.';
            break;
        case 'watercolor':
            stylePrompt = 'Transforme esta imagem em uma pintura de aquarela suave e artística.';
            break;
        case 'oil-painting':
            stylePrompt = 'Recrie esta imagem como uma pintura a óleo clássica com pinceladas visíveis.';
            break;
        default:
            setAppState(prev => ({ ...prev, isLoading: false, error: 'Estilo desconhecido.'}));
            return;
    }

    try {
      const imageFile = new File([appState.generatedImage.blob], "current-image.png", { type: appState.generatedImage.blob.type });
      const generatedData = await generateImageApi({
        prompt: stylePrompt,
        mode: 'edit',
        activeCreateFn: appState.activeCreateFn,
        activeEditFn: 'style',
        image1: imageFile,
        image2: null,
        resolution: appState.resolution,
      });

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: generatedData.url,
        blob: generatedData.blob,
        prompt: stylePrompt,
      };

      setAppState(prev => {
        const newHistory = [newImage, ...prev.history];
        saveHistory(newHistory);
        return { ...prev, generatedImage: newImage, history: newHistory, prompt: '' };
      });

    } catch (err: any) {
      setAppState(prev => ({ ...prev, error: err.message || 'Ocorreu um erro ao aplicar o estilo.' }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }, [appState.generatedImage, appState.activeCreateFn, appState.resolution]);


  const setMode = (mode: Mode) => {
    setAppState(prev => ({ ...prev, mode, image1: null, image2: null, generatedImage: null, prompt: '' }));
  };
  
  const setPrompt = (prompt: string) => setAppState(prev => ({ ...prev, prompt }));
  const setActiveCreateFn = (fn: string) => setAppState(prev => ({ ...prev, activeCreateFn: fn }));
  const setActiveEditFn = (fn: string) => setAppState(prev => ({ ...prev, activeEditFn: fn }));
  const setImage1 = (img: ImageFile | null) => setAppState(prev => ({ ...prev, image1: img }));
  const setImage2 = (img: ImageFile | null) => setAppState(prev => ({ ...prev, image2: img }));
  const setResolution = (resolution: string) => setAppState(prev => ({ ...prev, resolution }));
  
  const handleEditCurrentImage = useCallback(() => {
    if (appState.generatedImage) {
        const newFile = new File([appState.generatedImage.blob], "edited-image.png", { type: "image/png" });
        setAppState(prev => ({
            ...prev,
            mode: 'edit',
            activeEditFn: 'add-remove',
            image1: { file: newFile, previewUrl: appState.generatedImage!.url },
            image2: null,
            generatedImage: null,
            prompt: '',
        }));
    }
  }, [appState.generatedImage]);

  const handleSelectHistoryItem = useCallback((image: GeneratedImage) => {
    const historyFile = new File([image.blob], "history-image.png", { type: image.blob.type });
    setAppState(prev => ({
        ...prev,
        generatedImage: image,
        prompt: image.prompt,
        mode: 'edit',
        activeEditFn: 'add-remove',
        image1: { file: historyFile, previewUrl: image.url },
        image2: null,
    }));
  }, []);

  const handleDeleteHistoryItem = useCallback((id: string) => {
    setAppState(prev => {
      const newHistory = prev.history.filter(item => item.id !== id);
      saveHistory(newHistory);
      
      if (prev.generatedImage?.id === id) {
          return {
              ...prev,
              history: newHistory,
              generatedImage: null,
              prompt: '',
              image1: null,
          };
      }

      return { ...prev, history: newHistory };
    });
  }, []);


  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-200 flex flex-col lg:flex-row">
      <LeftPanel
        appState={appState}
        setPrompt={setPrompt}
        setMode={setMode}
        setActiveCreateFn={setActiveCreateFn}
        setActiveEditFn={setActiveEditFn}
        setImage1={setImage1}
        setImage2={setImage2}
        onGenerate={handleGenerate}
        setResolution={setResolution}
        onSelectHistoryItem={handleSelectHistoryItem}
        onDeleteHistoryItem={handleDeleteHistoryItem}
      />
      <RightPanel
        generatedImage={appState.generatedImage}
        isLoading={appState.isLoading}
        error={appState.error}
        onEdit={handleEditCurrentImage}
        onApplyStyle={handleApplyStyle}
      />
    </div>
  );
};

export default App;
