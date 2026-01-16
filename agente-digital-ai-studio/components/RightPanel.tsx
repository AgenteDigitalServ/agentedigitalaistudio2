
import React from 'react';
import type { GeneratedImage } from '../types';
import { logoBase64 } from '../constants';

interface RightPanelProps {
  generatedImage: GeneratedImage | null;
  isLoading: boolean;
  error: string | null;
  onEdit: () => void;
  onApplyStyle: (style: string) => void;
}

const ActionButton: React.FC<{ onClick?: () => void; title: string; children: React.ReactNode; href?: string; download?: string; }> = ({ onClick, title, children, href, download }) => {
  const commonProps = {
    title: title,
    className: "action-btn p-3 bg-gray-900/90 rounded-full text-gray-200 hover:bg-lime-500 hover:text-gray-900 transition-all shadow-lg border border-gray-700 backdrop-blur-md",
  };
  
  if (href) {
    return <a href={href} download={download} {...commonProps}>{children}</a>;
  }
  
  return <button onClick={onClick} {...commonProps}>{children}</button>;
};

export const RightPanel: React.FC<RightPanelProps> = ({ generatedImage, isLoading, error, onEdit, onApplyStyle }) => {
  
  const downloadImage = () => {
    if (generatedImage) {
        const link = document.createElement('a');
        link.href = generatedImage.url;
        link.download = `agente-ai-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (generatedImage && navigator.share) {
      try {
        const response = await fetch(generatedImage.url);
        const blob = await response.blob();
        const file = new File([blob], 'ia-art.png', { type: 'image/png' });
        
        const shareData = {
          files: [file],
          title: 'Arte Gerada com IA',
          text: 'Veja esta imagem incrível que criei!',
        };
        
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div id="loadingContainer" className="loading-container text-center p-12 bg-gray-800/20 rounded-3xl border border-gray-700/50 backdrop-blur-xl shadow-2xl">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-lime-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="loading-text text-2xl font-black lime-accent tracking-tighter uppercase italic">Renderizando Ideia...</p>
          <p className="text-gray-400 text-sm mt-3 font-medium tracking-wide">A IA está processando cada pixel para você.</p>
        </div>
      );
    }

    if (error) {
       return (
        <div className="result-placeholder text-center text-red-400 p-10 bg-red-950/20 rounded-3xl border border-red-500/30 max-w-md shadow-2xl">
           <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </div>
           <h3 className="font-black text-2xl uppercase tracking-tight">Erro no Processo</h3>
           <p className="text-sm text-red-300/70 mt-4 leading-relaxed font-medium">{error}</p>
           <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-red-500 text-white rounded-xl text-xs font-black tracking-widest hover:bg-red-600 transition-all uppercase">Reiniciar Sistema</button>
        </div>
       );
    }

    if (generatedImage) {
      return (
        <div id="imageContainer" className="image-container w-full h-full relative group flex items-center justify-center p-4 lg:p-10 overflow-hidden">
          <div className="relative max-w-full max-h-full shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden bg-black border border-gray-800">
            <img 
              id="generatedImage" 
              src={generatedImage.url} 
              alt="Arte gerada por IA" 
              className="generated-image block max-w-full max-h-[80vh] object-contain transition-all duration-700 ease-out group-hover:scale-[1.02]" 
            />
          </div>
          
          <div className="image-actions absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-10 group-hover:translate-x-0">
             <div className="flex flex-col gap-2">
               <ActionButton onClick={onEdit} title="Entrar no Modo Edição">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>
               </ActionButton>
               {navigator.share && (
                 <ActionButton onClick={handleShare} title="Compartilhar Obra">
                   <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                 </ActionButton>
               )}
               <ActionButton onClick={downloadImage} title="Download HD">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
               </ActionButton>
             </div>
             
             <div className="h-px bg-gray-700/50 w-full"></div>
             
             <div className="flex flex-col gap-2">
                <ActionButton onClick={() => onApplyStyle('perfection')} title="Ultra Perfeição">
                    <svg className="w-6 h-6 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l8.6 8.59a2.41 2.41 0 0 0 3.41 0l8.6-8.59a2.41 2.41 0 0 0 0-3.41l-8.6-8.59a2.41 2.41 0 0 0-3.41 0z"></path></svg>
                </ActionButton>
                <ActionButton onClick={() => onApplyStyle('advertising')} title="Upgrade Publicitário">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </ActionButton>
                <ActionButton onClick={() => onApplyStyle('cinema')} title="Efeito Cinematic">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"></path></svg>
                </ActionButton>
             </div>
          </div>
        </div>
      );
    }

    return (
      <div id="resultPlaceholder" className="result-placeholder text-center text-gray-500 flex flex-col items-center justify-center p-10 animate-fade-in">
        <div className="relative mb-12">
            <div className="absolute inset-0 bg-lime-500/5 blur-[100px] rounded-full"></div>
            <img src={`data:image/jpeg;base64,${logoBase64}`} alt="Agente Digital Logo" className="w-72 h-72 object-contain opacity-20 relative z-10 filter brightness-150 contrast-125" />
        </div>
        <h2 className="text-3xl font-black text-gray-200 uppercase tracking-[0.3em] mb-4 italic">Visionary Lab</h2>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed font-medium text-lg">Crie imagens de alto impacto usando o poder transformador da inteligência artificial.</p>
        <div className="mt-8 flex gap-4">
           <div className="h-1 w-12 bg-lime-500/30 rounded-full"></div>
           <div className="h-1 w-12 bg-lime-500 rounded-full"></div>
           <div className="h-1 w-12 bg-lime-500/30 rounded-full"></div>
        </div>
      </div>
    );
  };

  return (
    <main className="right-panel flex-1 bg-gray-950 flex items-center justify-center relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-lime-500/5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[150px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30"></div>
      </div>
      
      <div className="w-full h-full flex items-center justify-center relative z-10">
        {renderContent()}
      </div>
    </main>
  );
};
