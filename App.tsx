
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

  const handleGenerate = useCallback(async () => {
    if (appState.mode === 'create' && !appState.image1 && !appState.prompt.trim()) {
      setAppState(prev => ({ ...prev, error: 'Descreva sua ideia para começar.' }));
      return;
    }

    setAppState(prev => ({ ...prev, isLoading: true, error: null }));
    
    if (window.innerWidth < 1024) setActiveTab('result');

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
        prompt: appState.prompt.trim() || 'Criação Digital',
      };
      
      setAppState(prev => {
        const newHistory = [newImage, ...prev.history].slice(0, 8);
        saveHistory(newHistory);
        return { ...prev, generatedImage: newImage, history: newHistory, error: null };
      });

    } catch (err: any) {
      setAppState(prev => ({ 
        ...prev, 
        error: err.message || 'Erro inesperado na geração.' 
      }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }, [appState]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black text-white overflow-hidden relative">
      <div className={`flex-col h-full lg:flex ${activeTab === 'controls' ? 'flex' : 'hidden'} lg:w-auto`}>
        <LeftPanel 
          appState={appState}
          setPrompt={(p) => setAppState(prev => ({ ...prev, prompt: p }))}
          setMode={(m) => setAppState(prev => ({ ...prev, mode: m }))}
          setActiveCreateFn={(f) => setAppState(prev => ({ ...prev, activeCreateFn: f }))}
          setActiveEditFn={(f) => setAppState(prev => ({ ...prev, activeEditFn: f }))}
          setImage1={(i) => setAppState(prev => ({ ...prev, image1: i }))}
          setImage2={(i) => setAppState(prev => ({ ...prev, image2: i }))}
          onGenerate={handleGenerate}
          setResolution={(r) => setAppState(prev => ({ ...prev, resolution: r }))}
          onSelectHistoryItem={(img) => {
            setAppState(prev => ({ ...prev, generatedImage: img, error: null }));
            if (window.innerWidth < 1024) setActiveTab('result');
          }}
          onDeleteHistoryItem={(id) => {
            setAppState(prev => {
              const newHistory = prev.history.filter(i => i.id !== id);
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
          onApplyStyle={async (style) => {
             // Simulamos um prompt de estilo mantendo o prompt original
             setAppState(prev => ({ ...prev, prompt: `${prev.prompt}, style ${style}` }));
             await handleGenerate();
          }}
          onRetry={handleGenerate}
        />
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex p-2 z-50">
        <button onClick={() => setActiveTab('controls')} className={`flex-1 py-3 font-black text-[10px] uppercase rounded-xl transition-colors ${activeTab === 'controls' ? 'bg-lime-500 text-black' : 'text-gray-500'}`}>Estúdio</button>
        <button onClick={() => setActiveTab('result')} className={`flex-1 py-3 font-black text-[10px] uppercase rounded-xl transition-colors ${activeTab === 'result' ? 'bg-lime-500 text-black' : 'text-gray-500'}`}>Resultado</button>
      </div>
    </div>
  );
};

export default App;
