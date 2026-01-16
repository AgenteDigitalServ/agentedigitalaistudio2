import React, { useState, useMemo } from 'react';
import type { AppState, ImageFile, Mode, GeneratedImage } from '../types';
import { CREATE_FUNCTIONS, EDIT_FUNCTIONS, FunctionCardData } from '../constants';

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
    className={`function-card flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${isActive ? 'bg-lime-500/20 border-lime-500 text-lime-400' : 'bg-gray-700/50 hover:bg-gray-700 border-transparent'} border`}
  >
    <div className="icon mb-2">{data.icon}</div>
    <div className="name text-xs font-semibold text-center">{data.name}</div>
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
        <div className="upload-area-dual relative w-full h-32 bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-center p-2 hover:border-lime-500 transition-colors">
          {image ? (
            <img src={image.previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h.586a1 1 0 01.707.293l2 2a1 1 0 00.707.293H12a2 2 0 012 2v2m-6 6h.01M6 16h12a2 2 0 002-2v-5a2 2 0 00-2-2h-2.586a1 1 0 00-.707.293l-2 2a1 1 0 01-.707.293H6a2 2 0 00-2 2v5a2 2 0 002 2z"></path></svg>
              <span className="font-semibold">{title}</span>
              <span className="upload-text text-xs text-gray-400">Clique para selecionar</span>
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
    if (fn.requiresTwo) {
      setShowTwoImages(true);
    } else {
      setShowTwoImages(false);
    }
  };

  return (
    <aside className="w-full lg:w-[400px] bg-gray-800 p-6 flex flex-col gap-6 futuristic-scrollbar overflow-y-auto shrink-0">
      <header>
        <h1 className="panel-title text-2xl font-bold lime-accent">AGENTE DIGITAL AI STUDIO</h1>
        <p className="panel-subtitle text-sm text-gray-400">Gerador profissional de imagens</p>
      </header>
      
      <section className="prompt-section">
        <h2 className="section-title mb-2 font-semibold text-gray-300">Qual a sua ideia:</h2>
        <textarea
          id="prompt"
          className="prompt-input w-full h-24 p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-colors"
          placeholder="Ex: Um mestre da IA demitindo 30 empregados..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </section>

      <div className="mode-toggle grid grid-cols-2 gap-2 bg-gray-900 p-1 rounded-lg">
        <button onClick={() => setMode('create')} className={`mode-btn uppercase font-bold py-2 rounded-md transition-colors text-sm ${mode === 'create' ? 'bg-lime-500 text-gray-900' : 'hover:bg-gray-700'}`}>CRIAR</button>
        <button onClick={() => setMode('edit')} className={`mode-btn uppercase font-bold py-2 rounded-md transition-colors text-sm ${mode === 'edit' ? 'bg-lime-500 text-gray-900' : 'hover:bg-gray-700'}`}>EDITAR</button>
      </div>

      {mode === 'create' && (
        <div className="flex flex-col gap-6">
          <section id="createFunctions" className="functions-section">
            <h2 className="section-title mb-2 font-semibold text-gray-300">Função de Criação</h2>
            <div className="functions-grid grid grid-cols-4 gap-2">
              {CREATE_FUNCTIONS.map(fn => <FunctionCard key={fn.id} data={fn} isActive={activeCreateFn === fn.id} onClick={() => setActiveCreateFn(fn.id)} />)}
            </div>
          </section>
          <section className="reference-image-section">
            <h2 className="section-title mb-2 font-semibold text-gray-300">
              Imagem de Referência <span className="text-gray-400 font-normal">(Opcional)</span>
            </h2>
            <ImageUploadArea
              id="imageUploadCreate"
              image={image1}
              onUpload={setImage1}
              title="Clique para enviar uma referência"
            />
          </section>
          <section className="resolution-section">
            <h2 className="section-title mb-2 font-semibold text-gray-300">Resolução da Imagem</h2>
            <div className="resolution-toggle grid grid-cols-3 gap-2 bg-gray-900 p-1 rounded-lg">
              <button onClick={() => setResolution('1:1')} className={`resolution-btn uppercase font-bold py-2 rounded-md transition-colors text-xs ${resolution === '1:1' ? 'bg-lime-500 text-gray-900' : 'hover:bg-gray-700'}`}>Quadrado</button>
              <button onClick={() => setResolution('9:16')} className={`resolution-btn uppercase font-bold py-2 rounded-md transition-colors text-xs ${resolution === '9:16' ? 'bg-lime-500 text-gray-900' : 'hover:bg-gray-700'}`}>Retrato</button>
              <button onClick={() => setResolution('16:9')} className={`resolution-btn uppercase font-bold py-2 rounded-md transition-colors text-xs ${resolution === '16:9' ? 'bg-lime-500 text-gray-900' : 'hover:bg-gray-700'}`}>Paisagem</button>
            </div>
          </section>
        </div>
      )}
      
      {mode === 'edit' && (
        <>
        {showTwoImages ? (
            <div id="twoImagesSection" className="functions-section flex flex-col gap-4">
                 <h2 className="section-title font-semibold text-center text-gray-300">Duas Imagens Necessárias</h2>
                 <div className="flex gap-4">
                     <ImageUploadArea id="imageUpload1" image={image1} onUpload={setImage1} title="Primeira Imagem" />
                     <ImageUploadArea id="imageUpload2" image={image2} onUpload={setImage2} title="Segunda Imagem" />
                 </div>
                 <button onClick={() => setShowTwoImages(false)} className="back-btn text-sm text-lime-400 hover:text-lime-300">← Voltar para Edição</button>
            </div>
        ) : (
            <div id="editFunctions" className="functions-section">
                <div className="functions-grid grid grid-cols-4 gap-2">
                    {EDIT_FUNCTIONS.map(fn => <FunctionCard key={fn.id} data={fn} isActive={activeEditFn === fn.id} onClick={() => handleEditFnClick(fn)} />)}
                </div>
                {!activeFunctionData?.requiresTwo && <div className="mt-4"><ImageUploadArea id="imageUpload" image={image1} onUpload={setImage1} title="Clique ou arraste uma imagem"/></div>}
            </div>
        )}
        </>
      )}

      <section className="history-section">
        <h2 className="section-title mb-2 font-semibold text-gray-300">Histórico</h2>
        <div className="history-grid futuristic-scrollbar flex overflow-x-auto gap-2 pb-2 -mx-6 px-6">
          {history && history.length > 0 ? (
            history.map(item => (
              <div key={item.id} className="history-item relative shrink-0 group" title={item.prompt}>
                <img 
                    src={item.url} 
                    alt={item.prompt} 
                    className="w-20 h-20 object-cover rounded-md border-2 border-gray-700 group-hover:border-lime-500 transition-colors cursor-pointer"
                    onClick={() => onSelectHistoryItem(item)}
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHistoryItem(item.id);
                    }}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-red-500/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Deletar do histórico"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 w-full text-center bg-gray-900/50 rounded-lg py-6">Nenhuma imagem no histórico.</p>
          )}
        </div>
      </section>

      <div className="mt-auto">
        <button id="generateBtn" onClick={onGenerate} disabled={isLoading} className="generate-btn w-full h-12 bg-lime-500 text-gray-900 font-bold rounded-lg flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? <div className="spinner w-6 h-6 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div> : <span className="btn-text">Gerar Imagem</span>}
        </button>
      </div>
    </aside>
  );
};