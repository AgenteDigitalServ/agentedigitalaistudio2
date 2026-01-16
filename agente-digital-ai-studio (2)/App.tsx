
import React, { useState, useCallback, useEffect } from 'react';
import { LeftPanel } from './components/LeftPanel.tsx';
import { RightPanel } from './components/RightPanel.tsx';
import { generateImageApi } from './services/geminiService.ts';
import { loadHistory, saveHistory } from './services/localStorageService.ts';
import { AppState, ImageFile, Mode, GeneratedImage } from './types.ts';

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

  // Estado para controle de aba no mobile
  const [activeTab, setActiveTab] = useState<'controls' | 'result'>('controls');
  
  useEffect(() => {
    loadHistory().then(history => {
        setAppState(prev => ({ ...prev, history }));
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (appState.mode === 'create' && !appState.image1 && !appState.prompt.trim()) {
      setAppState(prev => ({ ...prev, error: 'Descreva a imagem ou envie uma referência.' }));
      return;
    }

    if (appState.mode === 'edit' && !appState.image1) {
      setAppState(prev => ({ ...prev, error: 'Selecione uma imagem para editar.' }));
      return;
    }

    setAppState(prev => ({ ...prev, isLoading: true, error: null, generatedImage: null }));
    
    // No mobile, muda para a aba de resultado ao iniciar a geração
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
        prompt: appState.prompt.trim() || 'Processamento sem prompt',
      };
      
      setAppState(prev => {
        const newHistory = [newImage, ...prev.history];
        saveHistory(newHistory);
        return { ...prev, generatedImage: newImage, history: newHistory };
      });

    } catch (err: any) {
      setAppState(prev => ({ ...prev, error: err.message || 'Erro na geração.' }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }, [appState.prompt, appState.mode, appState.activeCreateFn, appState.activeEditFn, appState.image1, appState.image2, appState.resolution]);
  
  const handleApplyStyle = useCallback(async (style: string) => {
    if (!appState.generatedImage) return;
    setAppState(prev => ({ ...prev, isLoading: true, error: null }));

    let stylePrompt = '';
    switch (style) {
        case 'advertising': stylePrompt = 'Aprimore para anúncio profissional, cores vibrantes.'; break;
        case 'cinema': stylePrompt = 'Aparência cinematográfica, iluminação dramática.'; break;
        case 'perfection': stylePrompt = 'Melhore detalhes e nitidez para visual hiper-realista.'; break;
        default: return;
    }

    try {
      const imageFile = new File([appState.generatedImage.blob], "current.png", { type: "image/png" });
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
        return { ...prev, generatedImage: newImage, history: newHistory };
      });
    } catch (err: any) {
      setAppState(prev => ({ ...prev, error: err.message }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }, [appState.generatedImage, appState.activeCreateFn, appState.resolution]);

  const setMode = (mode: Mode) => setAppState(prev => ({ ...prev, mode, image1: null, image2: null, generatedImage: null, prompt: '' }));
  const setPrompt = (prompt: string) => setAppState(prev => ({ ...prev, prompt }));
  const setActiveCreateFn = (fn: string) => setAppState(prev => ({ ...prev, activeCreateFn: fn }));
  const setActiveEditFn = (fn: string) => setAppState(prev => ({ ...prev, activeEditFn: fn }));
  const setImage1 = (img: ImageFile | null) => setAppState(prev => ({ ...prev, image1: img }));
  const setImage2 = (img: ImageFile | null) => setAppState(prev => ({ ...prev, image2: img }));
  const setResolution = (resolution: string) => setAppState(prev => ({ ...prev, resolution }));
  
  const handleSelectHistoryItem = (image: GeneratedImage) => {
    const file = new File([image.blob], "hist.png", { type: image.blob.type });
    setAppState(prev => ({ ...prev, generatedImage: image, prompt: image.prompt, mode: 'edit', image1: { file, previewUrl: image.url } }));
    if (window.innerWidth < 1024) setActiveTab('result');
  };

  const handleDeleteHistoryItem = (id: string) => {
    setAppState(prev => {
      const newHistory = prev.history.filter(item => item.id !== id);
      saveHistory(newHistory);
      return { ...prev, history: newHistory };
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-gray-950">
      {/* Mobile Tab View Logic */}
      <div className={`flex-1 flex flex-col lg:flex-row h-full w-full ${activeTab === 'controls' ? 'flex' : 'hidden lg:flex'}`}>
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
      </div>

      <div className={`flex-1 flex flex-col h-full w-full ${activeTab === 'result' ? 'flex' : 'hidden lg:flex'}`}>
        <RightPanel
          generatedImage={appState.generatedImage}
          isLoading={appState.isLoading}
          error={appState.error}
          onEdit={() => {
            if(appState.generatedImage) {
              const f = new File([appState.generatedImage.blob], "edit.png");
              setAppState(prev => ({ ...prev, mode: 'edit', image1: { file: f, previewUrl: appState.generatedImage!.url } }));
              setActiveTab('controls');
            }
          }}
          onApplyStyle={handleApplyStyle}
        />
      </div>

      {/* Mobile Navigation Bar */}
      <nav className="lg:hidden flex border-t border-gray-800 bg-gray-900/80 backdrop-blur-md p-2 justify-around items-center">
        <button 
          onClick={() => setActiveTab('controls')}
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'controls' ? 'text-lime-400 bg-lime-500/10' : 'text-gray-500'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          <span className="text-[10px] font-bold mt-1 uppercase">Estúdio</span>
        </button>
        <button 
          onClick={() => setActiveTab('result')}
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'result' ? 'text-lime-400 bg-lime-500/10' : 'text-gray-500'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span className="text-[10px] font-bold mt-1 uppercase">Resultado</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
