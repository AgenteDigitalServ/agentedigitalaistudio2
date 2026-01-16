
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
    className={`active-scale flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer transition-all duration-300 ${isActive ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] scale-105 z-10' : 'bg-slate-900/40 hover:bg-slate-800 border-slate-800 text-slate-400'} border`}
  >
    <div className={`icon mb-1 transition-transform ${isActive ? 'scale-110 text-emerald-400' : ''}`}>{data.icon}</div>
    <div className="name text-[9px] font-black uppercase text-center truncate w-full tracking-tighter">{data.name}</div>
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
      <label htmlFor={id} className="cursor-pointer group">
        <div className="relative w-full h-24 bg-slate-950 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-2 group-hover:border-cyan-500/50 transition-all overflow-hidden shadow-inner">
          {image ? (
            <img src={image.previewUrl} alt="Prévia" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" />
          ) : (
            <>
              <svg className="w-5 h-5 text-slate-700 mb-1 group-hover:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">{title}</span>
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

  const showTwoImages = useMemo(() => {
    return mode === 'edit' && EDIT_FUNCTIONS.find(fn => fn.id === activeEditFn)?.requiresTwo;
  }, [mode, activeEditFn]);

  return (
    <aside className="w-full lg:w-[360px] bg-slate-950 h-full flex flex-col futuristic-scrollbar overflow-y-auto shrink-0 border-r border-slate-900 z-20">
      <div className="p-5 flex flex-col gap-6 pb-24 lg:pb-8">
        <header className="flex justify-between items-start pt-2 lg:pt-0">
          <div>
            <h1 className="text-xl font-black text-gradient tracking-tighter italic leading-none">AI STUDIO</h1>
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">PRO-VISUAL v2.5.0</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-[8px] font-black text-emerald-400 uppercase">Live_Link</span>
          </div>
        </header>
        
        <section>
          <div className="flex justify-between mb-2">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Prompt de Criação</label>
            <span className={`text-[9px] font-bold ${prompt.length > 400 ? 'text-amber-500' : 'text-slate-700'}`}>{prompt.length}/500</span>
          </div>
          <textarea
            className="w-full h-24 p-4 bg-slate-900/50 border border-slate-800 rounded-xl focus:border-cyan-500/50 transition-all text-sm placeholder-slate-800 outline-none resize-none futuristic-scrollbar text-cyan-50"
            placeholder="Descreva a obra visual aqui..."
            value={prompt}
            maxLength={500}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </section>

        <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-1 rounded-xl border border-slate-900">
          <button onClick={() => setMode('create')} className={`py-2 rounded-lg font-black text-[10px] uppercase transition-all duration-300 ${mode === 'create' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}>Estúdio</button>
          <button onClick={() => setMode('edit')} className={`py-2 rounded-lg font-black text-[10px] uppercase transition-all duration-300 ${mode === 'edit' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}>Editor</button>
        </div>

        {mode === 'create' ? (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-2">
              {CREATE_FUNCTIONS.map(fn => <FunctionCard key={fn.id} data={fn} isActive={activeCreateFn === fn.id} onClick={() => setActiveCreateFn(fn.id)} />)}
            </div>
            <ImageUploadArea id="createRef" image={image1} onUpload={setImage1} title="Upload de Referência" />
            
            <section>
              <label className="text-[9px] font-black uppercase text-slate-600 mb-2 block tracking-widest text-center">Proporção do Canvas</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-900">
                {['1:1', '9:16', '16:9'].map(res => (
                  <button key={res} onClick={() => setResolution(res)} className={`py-1.5 rounded-lg font-black text-[9px] uppercase transition-all duration-300 ${resolution === res ? 'text-cyan-400 bg-slate-950 shadow-sm' : 'text-slate-700 hover:text-slate-500'}`}>
                    {res}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {EDIT_FUNCTIONS.map(fn => <FunctionCard key={fn.id} data={fn} isActive={activeEditFn === fn.id} onClick={() => setActiveEditFn(fn.id)} />)}
            </div>
            {showTwoImages ? (
              <div className="flex gap-2">
                <ImageUploadArea id="edit1" image={image1} onUpload={setImage1} title="Original" />
                <ImageUploadArea id="edit2" image={image2} onUpload={setImage2} title="Máscara/Ref" />
              </div>
            ) : (
              <ImageUploadArea id="editSolo" image={image1} onUpload={setImage1} title="Imagem para Edição" />
            )}
          </div>
        )}

        <section className="mt-auto">
          <label className="text-[9px] font-black uppercase text-slate-700 mb-3 block tracking-widest">Buffer_Local (v2.5)</label>
          <div className="flex gap-2 overflow-x-auto pb-4 futuristic-scrollbar -mx-1 px-1">
            {history.length > 0 ? history.map(item => (
              <div key={item.id} className="relative shrink-0 group">
                <div 
                    className="w-14 h-14 rounded-lg border border-slate-900 overflow-hidden cursor-pointer active:scale-95 transition-all group-hover:border-cyan-500/50"
                    onClick={() => onSelectHistoryItem(item)}
                >
                    <img src={item.url} className="w-full h-full object-cover" alt="Histórico" />
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteHistoryItem(item.id); }} 
                    className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            )) : <div className="text-[9px] text-slate-800 font-bold py-4 w-full text-center border border-dashed border-slate-900 rounded-xl uppercase">Buffer Vazio</div>}
          </div>
        </section>

        <button 
          onClick={onGenerate} 
          disabled={isLoading} 
          className="active-scale w-full py-4 blue-green-gradient text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-[0_10px_30px_rgba(6,182,212,0.3)] disabled:opacity-20 disabled:cursor-not-allowed mt-2 pulse-btn transition-transform"
        >
          {isLoading ? "Processando..." : "Gerar Imagem"}
        </button>
      </div>
    </aside>
  );
};
