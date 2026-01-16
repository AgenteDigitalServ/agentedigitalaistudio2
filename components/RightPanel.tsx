
import React from 'react';
import type { GeneratedImage } from '../types.ts';
import { logoBase64 } from '../constants.tsx';

interface RightPanelProps {
  generatedImage: GeneratedImage | null;
  isLoading: boolean;
  error: string | null;
  onEdit: () => void;
  onApplyStyle: (style: string) => void;
  onRetry: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ generatedImage, isLoading, error, onEdit, onApplyStyle, onRetry }) => {
  
  const handleDownload = () => {
    if (generatedImage) {
      const a = document.createElement('a');
      a.href = generatedImage.url;
      a.download = `ia-art-${Date.now()}.png`;
      a.click();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-emerald-400 rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(6,182,212,0.3)]"></div>
            <div className="absolute inset-0 bg-cyan-400/20 blur-xl animate-pulse rounded-full"></div>
        </div>
        <h2 className="text-xl font-black text-gradient uppercase italic tracking-tighter">Sincronizando Rede...</h2>
        <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-[0.2em]">Otimizando Pixels via Gemini Flash</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
        <div className="bg-rose-500/10 p-6 rounded-3xl mb-6 border border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.1)]">
          <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h2 className="text-xl font-black text-rose-500 uppercase italic tracking-tight">STATUS: FALHA NO PROCESSAMENTO</h2>
        <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl max-w-sm">
            <p className="text-slate-400 text-xs font-medium leading-relaxed">{error}</p>
        </div>
        
        <button 
          onClick={onRetry} 
          className="active-scale mt-8 px-10 py-4 bg-white text-slate-950 font-black uppercase text-[10px] rounded-2xl shadow-xl hover:bg-cyan-50 transition-colors tracking-widest"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent)] pointer-events-none"></div>
      
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12 z-10">
        {generatedImage ? (
          <div className="relative group max-w-full max-h-full flex flex-col items-center">
            <div className="relative p-1 rounded-3xl bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                <img 
                src={generatedImage.url} 
                className="max-w-full max-h-[65vh] rounded-2xl border border-slate-800/50 object-contain bg-black" 
                alt="Resultado"
                />
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={onEdit} className="active-scale flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-300 hover:border-cyan-500/50 transition-colors">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                Refinar
              </button>
              <button onClick={handleDownload} className="active-scale flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-300 hover:border-emerald-500/50 transition-colors">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Exportar
              </button>
            </div>

            <div className="mt-8 flex justify-center gap-3">
               {['perfection', 'advertising', 'cinema'].map(style => (
                 <button 
                   key={style}
                   onClick={() => onApplyStyle(style)}
                   className="active-scale px-4 py-2 bg-cyan-500/5 border border-cyan-500/20 rounded-full text-[9px] font-black uppercase text-cyan-400 hover:bg-cyan-500/10 transition-all"
                 >
                   +{style === 'perfection' ? 'Otimizar' : style === 'advertising' ? 'Comercial' : 'Cinemática'}
                 </button>
               ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 flex flex-col items-center">
            <div className="relative mb-12 inline-block">
              <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full"></div>
              <div className="absolute inset-0 bg-cyan-500/5 blur-[80px] translate-x-10 rounded-full"></div>
              <img src={`data:image/jpeg;base64,${logoBase64}`} className="w-56 h-56 object-contain opacity-10 relative z-10 grayscale brightness-150" alt="Logo" />
            </div>
            <h2 className="text-3xl font-black text-slate-800/50 uppercase italic tracking-[0.6em]">ESTÚDIO V2</h2>
            <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.4em] mt-6 bg-slate-900/40 px-6 py-2 rounded-full border border-slate-800/50">Pronto para criar</p>
          </div>
        )}
      </div>
    </div>
  );
};
