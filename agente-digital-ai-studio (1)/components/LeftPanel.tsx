
import React, { useState, useMemo } from 'react';
import type { AppState, ImageFile, Mode, GeneratedImage } from '../types.ts';
import { CREATE_FUNCTIONS, EDIT_FUNCTIONS, FunctionCardData } from '../constants.tsx';

interface LeftPanelProps {
  appState: AppState;
  setPrompt: (prompt: string) => void;
  setMode: (mode: Mode) => void;
  setActiveCreateFn: (fn: string) => void;
  setActiveEditFn: (fn: string) => void;
  setImage1: (file: ImageFile | null) => void;
  setImage2: (file: ImageFile | null) => void;
  onGenerate: () => void;
  setResolution: (resolution: string) => void;
  onSelectHistoryItem: (image: GeneratedImage) => void;
  onDeleteHistoryItem: (id: string) => void;
}

const FunctionCard: React.FC<{ data: FunctionCardData; isActive: boolean; onClick: () => void }> = ({ data, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`active-scale flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-lime-500/20 border-lime-500 text-lime-400' : 'bg-gray-800/50 hover:bg-gray-700 border-gray-700'} border`}
  >
    <div className="icon mb-1">{data.icon}</div>
    <div className="name text-[10px] font-bold uppercase text-center truncate w-full">{data.name}</div>
  </div>
);

const ImageUploadArea: React.FC<{ id: string; image: ImageFile | null; onUpload: (file: ImageFile | null) => void; title: string; }> = ({ id, image, onUpload, title }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      onUpload({ file, previewUrl });
    }
  };

  return (
    <div className="w-full">
      <label htmlFor={id} className="cursor-pointer">
        <div className="relative w-full h-24 bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-center p-2 hover:border-lime-500 transition-colors overflow-hidden">
          {image ? (
            <img src={image.previewUrl} alt="Prévia do upload" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <svg className="w-6 h-6 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{title}</span>
            </>
          )}
        </div>
      </label>
      <input type="file" id={id} accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
};

export const LeftPanel: React.FC<LeftPanelProps> = ({ appState, setPrompt, setMode, setActiveCreateFn, setActiveEditFn, setImage1, setImage2, onGenerate, setResolution, onSelectHistoryItem, onDeleteHistoryItem }) => {
  const { prompt, mode, activeCreateFn, activeEditFn, image1, image2, isLoading, resolution, history } = appState;
  const [showTwoImages, setShowTwoImages] = useState(false);

  const activeFunctionData = useMemo(() => {
    return EDIT_FUNCTIONS.find(fn => fn.id === activeEditFn);
  }, [activeEditFn]);
  
  const handleEditFnClick = (fn: FunctionCardData) => {
    setActiveEditFn(fn.id);
    setShowTwoImages(!!fn.requiresTwo);
  };

  const getResolutionLabel = (res: string) => {
    switch (res) {
      case '1:1': return 'QUADRADO';
      case '9:16': return 'RETRATO';
      case '16:9': return 'PAISAGEM';
      default: return res;
    }
  };

  return (
    <aside className="w-full lg:w-[380px] bg-gray-900 h-full flex flex-col futuristic-scrollbar overflow-y-auto shrink-0 border-r border-gray-800">
      <div className="p-4 flex flex-col gap-5 pb-24 lg:pb-8">
        <header className="pt-2 lg:pt-0">
          <h1 className="text-xl font-black lime-accent tracking-tighter italic">AGENTE DIGITAL</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Estúdio Mobile v2.0</p>
        </header>
        
        <section>
          <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">Prompt da Ideia</label>
          <textarea
            className="w-full h-24 p-4 bg-black border border-gray-800 rounded-xl focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all text-sm placeholder-gray-700 outline-none"
            placeholder="Descreva o que deseja criar..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </section>

        <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-xl border border-gray-800">
          <button onClick={() => setMode('create')} className={`py-2 rounded-lg font-black text-[10px] uppercase transition-all ${mode === 'create' ? 'bg-lime-500 text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'text-gray-500'}`}>CRIAR</button>
          <button onClick={() => setMode('edit')} className={`py-2 rounded-lg font-black text-[10px] uppercase transition-all ${mode === 'edit' ? 'bg-lime-500 text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'text-gray-500'}`}>EDITAR</button>
        </div>

        {mode === 'create' ? (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-2">
              {CREATE_FUNCTIONS.map(fn => <FunctionCard key={fn.id} data={fn} isActive={activeCreateFn === fn.id} onClick={() => setActiveCreateFn(fn.id)} />)}
            </div>
            <ImageUploadArea id="createRef" image={image1} onUpload={setImage1} title="Referência Opcional" />
            
            <section>
              <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest text-center">Formato de Saída</label>
              <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded-xl border border-gray-800">
                {['1:1', '9:16', '16:9'].map(res => (
                  <button key={res} onClick={() => setResolution(res)} className={`py-1.5 rounded-lg font-black text-[9px] uppercase transition-all ${resolution === res ? 'text-lime-400 bg-gray-900' : 'text-gray-600'}`}>
                    {getResolutionLabel(res)}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {EDIT_FUNCTIONS.map(fn => <FunctionCard key={fn.id} data={fn} isActive={activeEditFn === fn.id} onClick={() => handleEditFnClick(fn)} />)}
            </div>
            {showTwoImages ? (
              <div className="flex gap-2">
                <ImageUploadArea id="edit1" image={image1} onUpload={setImage1} title="Imagem Base" />
                <ImageUploadArea id="edit2" image={image2} onUpload={setImage2} title="Sobreposição" />
              </div>
            ) : (
              <ImageUploadArea id="editSolo" image={image1} onUpload={setImage1} title="Selecionar Imagem" />
            )}
          </div>
        )}

        <section>
          <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">Galeria Recente</label>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 futuristic-scrollbar">
            {history.length > 0 ? history.map(item => (
              <div key={item.id} className="relative shrink-0 group">
                <img 
                    src={item.url} 
                    alt={`Histórico: ${item.prompt}`}
                    className="w-14 h-14 object-cover rounded-lg border border-gray-800 group-active:border-lime-500"
                    onClick={() => onSelectHistoryItem(item)}
                />
                <button onClick={() => onDeleteHistoryItem(item.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-lg"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg></button>
              </div>
            )) : <div className="text-[10px] text-gray-700 italic py-4 w-full text-center">Histórico vazio</div>}
          </div>
        </section>

        <button 
          onClick={onGenerate} 
          disabled={isLoading} 
          className="active-scale w-full py-4 bg-lime-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_10px_30px_rgba(57,255,20,0.2)] disabled:opacity-50 mt-2"
        >
          {isLoading ? "Processando..." : "Renderizar Agora"}
        </button>
      </div>
    </aside>
  );
};
