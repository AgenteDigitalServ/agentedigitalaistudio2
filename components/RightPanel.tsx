
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
      a.download = `arte-ia-${Date.now()}.png`;
      a.click();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 p-6 text-center">
        <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-black lime-accent uppercase italic tracking-tighter">Gerando Imagem...</h2>
        <p className="text-gray-500 text-xs mt-2 font-bold uppercase tracking-widest">Processando sua solicitação via Gemini 2.5</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 p-6 text-center">
        <div className="bg-red-500/10 p-6 rounded-full mb-6">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h2 className="text-xl font-black text-red-500 uppercase italic">Erro na Geração</h2>
        <p className="text-gray-500 text-xs mt-2 max-w-xs">{error}</p>
        
        <button 
          onClick={onRetry} 
          className="active-scale mt-8 px-8 py-3 bg-white text-black font-black uppercase text-[10px] rounded-xl"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-950 relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(57,255,20,0.05),transparent)] pointer-events-none"></div>
      
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12 z-10">
        {generatedImage ? (
          <div className="relative group max-w-full max-h-full">
            <img 
              src={generatedImage.url} 
              className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl border border-gray-800 object-contain bg-black" 
              alt="Resultado da IA"
            />
            
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={onEdit} className="active-scale flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-700 rounded-2xl text-[10px] font-black uppercase text-gray-300">
                <svg className="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                Editar
              </button>
              <button onClick={handleDownload} className="active-scale flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-700 rounded-2xl text-[10px] font-black uppercase text-gray-300">
                <svg className="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Salvar
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'Minha Arte IA', text: generatedImage.prompt, url: window.location.href });
                  }
                }} 
                className="active-scale p-3 bg-gray-900 border border-gray-700 rounded-2xl text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
              </button>
            </div>

            <div className="mt-8 flex justify-center gap-2">
               {['perfection', 'advertising', 'cinema'].map(style => (
                 <button 
                   key={style}
                   onClick={() => onApplyStyle(style)}
                   className="active-scale px-3 py-1.5 bg-lime-500/10 border border-lime-500/30 rounded-full text-[8px] font-black uppercase text-lime-400"
                 >
                   +{style === 'perfection' ? 'Perfeição' : style === 'advertising' ? 'Publicitário' : 'Cinema'}
                 </button>
               ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="relative mb-10 inline-block">
              <div className="absolute inset-0 bg-lime-500/10 blur-3xl rounded-full"></div>
              <img src={`data:image/jpeg;base64,${logoBase64}`} className="w-48 h-48 object-contain opacity-20 relative z-10 grayscale" alt="Logo Agente Digital" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-[0.4em]">Laboratório V2</h2>
            <p className="text-gray-700 text-xs font-bold uppercase tracking-widest mt-4">Aguardando sua próxima criação</p>
          </div>
        )}
      </div>
    </div>
  );
};
