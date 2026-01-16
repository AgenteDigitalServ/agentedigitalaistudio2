
import React, { useState, useCallback, useEffect } from 'react';
import { LeftPanel } from './components/LeftPanel.tsx';
import { RightPanel } from './components/RightPanel.tsx';
import { generateImageApi } from './services/geminiService.ts';
import { loadHistory, saveHistory } from './services/localStorageService.ts';
import { AppState, GeneratedImage } from './types.ts';

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

  const [activeTab, setActiveTab] = useState<'controls' | 'result'>('controls');

  useEffect(() => {
    loadHistory().then(history => {
        setAppState(prev => ({ ...prev, history }));
    });
  }, []);

  const handleOpenKeySelector = useCallback(async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Resetar erro após tentativa de troca de chave
      setAppState(prev => ({ ...prev, error: null }));
    }
  }, []);

  const setPrompt = useCallback((prompt: string) => {
    setAppState(prev => ({ ...prev, prompt }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (appState.mode === 'create' && !appState.image1 && !appState.prompt.trim()) {
      setAppState(prev => ({ ...prev, error: 'Por favor, descreva o que você deseja criar.' }));
      return;
    }

    if (appState.mode === 'edit' && !appState.image1) {
      setAppState(prev => ({ ...prev, error: 'Selecione uma imagem para editar.' }));
      return;
    }

    setAppState(prev => ({ ...prev, isLoading: true, error: null, generatedImage: null }));
    
    if (window.innerWidth < 1024) {
      setActiveTab('result');
    }

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
        prompt: appState.prompt.trim() || 'Nova Criação IA',
      };
      
      setAppState(prev => {
        const newHistory = [newImage, ...prev.history].slice(0, 8);
        saveHistory(newHistory);
        return { ...prev, generatedImage: newImage, history: newHistory };
      });

    } catch (err: any) {
      console.error("Erro capturado no App:", err);
      
      const isAuthError = err.message?.includes("AUTH_ERROR") || err.message?.includes("API key");
      
      if (isAuthError && window.aistudio?.openSelectKey) {
          handleOpenKeySelector();
      }

      setAppState(prev => ({ 
        ...prev, 
        error: isAuthError 
          ? 'Sua conexão com a IA falhou. Clique em "Tentar Novamente" para reautenticar.' 
          : err.message || 'Erro de conexão inesperado.' 
      }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }, [appState.prompt, appState.mode, appState.activeCreateFn, appState.activeEditFn, appState.image1, appState.image2, appState.resolution, handleOpenKeySelector]);
  
  const handleApplyStyle = useCallback(async (style: string) => {
    if (!appState.generatedImage) return;
    setAppState(prev => ({ ...prev, isLoading: true, error: null }));

    let stylePrompt = '';
    switch (style) {
        case 'advertising': stylePrompt = 'Professional advertising render, high quality, vibrant colors, 8k.'; break;
        case 'cinema': stylePrompt = 'Cinematic film style, high contrast, dramatic lighting, realistic.'; break;
        case 'perfection': stylePrompt = 'Enhance every detail and artistic quality to the maximum level.'; break;
        default: stylePrompt = 'Enhance this image.';
    }

    try {
      const generatedData = await generateImageApi({
        prompt: stylePrompt,
        mode: 'edit',
        activeCreateFn: appState.activeCreateFn,
        activeEditFn: 'style',
        image1: new File([appState.generatedImage.blob], "base.png", { type: appState.generatedImage.blob.type }),
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
        const newHistory = [newImage, ...prev.history].slice(0, 8);
        saveHistory(newHistory);
        return { ...prev, generatedImage: newImage, history: newHistory };
      });
    } catch (err: any) {
      setAppState(prev => ({ ...prev, error: 'Erro ao aplicar estilo: ' + err.message }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }, [appState.generatedImage, appState.activeCreateFn, appState.resolution]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black text-white overflow-hidden relative">
      <div className={`flex-col h-full lg:flex ${activeTab === 'controls' ? 'flex' : 'hidden'} lg:w-auto`}>
        <LeftPanel 
          appState={appState}
          setPrompt={setPrompt}
          setMode={(mode) => setAppState(prev => ({ ...prev, mode }))}
          setActiveCreateFn={(fn) => setAppState(prev => ({ ...prev, activeCreateFn: fn }))}
          setActiveEditFn={(fn) => setAppState(prev => ({ ...prev, activeEditFn: fn }))}
          setImage1={(file) => setAppState(prev => ({ ...prev, image1: file }))}
          setImage2={(file) => setAppState(prev => ({ ...prev, image2: file }))}
          onGenerate={handleGenerate}
          setResolution={(res) => setAppState(prev => ({ ...prev, resolution: res }))}
          onSelectHistoryItem={(image) => {
            setAppState(prev => ({ ...prev, generatedImage: image, error: null }));
            if (window.innerWidth < 1024) setActiveTab('result');
          }}
          onDeleteHistoryItem={(id) => {
            setAppState(prev => {
              const newHistory = prev.history.filter(item => item.id !== id);
              saveHistory(newHistory);
              return { ...prev, history: newHistory };
            });
          }}
        />
      </div>

      <div className={`flex-1 flex flex-col h-full ${activeTab === 'result' ? 'flex' : 'hidden'} lg:flex`}>
        <RightPanel 
          generatedImage={appState.generatedImage}
          isLoading={appState.isLoading}
          error={appState.error}
          onEdit={() => {
            if (appState.generatedImage) {
               setAppState(prev => ({ 
                 ...prev, 
                 mode: 'edit', 
                 image1: { file: new File([appState.generatedImage!.blob], "edit.png"), previewUrl: appState.generatedImage!.url } 
               }));
               setActiveTab('controls');
            }
          }}
          onApplyStyle={handleApplyStyle}
          onRetry={handleGenerate}
        />
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex p-2 z-50">
        <button onClick={() => setActiveTab('controls')} className={`flex-1 py-3 font-black text-[10px] uppercase rounded-xl transition-colors ${activeTab === 'controls' ? 'bg-lime-500 text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}>Estúdio</button>
        <button onClick={() => setActiveTab('result')} className={`flex-1 py-3 font-black text-[10px] uppercase rounded-xl transition-colors ${activeTab === 'result' ? 'bg-lime-500 text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}>Resultado</button>
      </div>
    </div>
  );
};

export default App;
