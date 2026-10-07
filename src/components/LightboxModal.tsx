import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, FileText } from 'lucide-react';
import { CustomFloorPlan, Consultation, FormData } from '../types';

interface LightboxModalProps {
  lightboxIndex: number | null;
  lightboxConsultation: Consultation | null;
  formData: FormData;
  onClose: () => void;
  onIndexChange: (newIndex: number) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  lightboxIndex,
  lightboxConsultation,
  formData,
  onClose,
  onIndexChange,
}) => {
  if (lightboxIndex === null) return null;

  const activePlansArray: CustomFloorPlan[] = lightboxConsultation
    ? (lightboxConsultation.floorPlans || [])
    : (formData.floorPlans || []);

  const currentPlan = activePlansArray[lightboxIndex];
  if (!currentPlan) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 md:p-8 select-none"
      >
        {/* Header toolbar */}
        <div className="flex justify-between items-center w-full border-b border-white/10 pb-3">
          <div className="text-left">
            <h3 className="text-white font-bold text-sm md:text-base pr-4 truncate max-w-xs md:max-w-md">
              {currentPlan.name}
            </h3>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Plan {lightboxIndex + 1} von {activePlansArray.length}
            </span>
          </div>
          
          <div className="flex gap-2 shrink-0">
            {currentPlan.url.startsWith('data:') && (
              <a 
                href={currentPlan.url} 
                download={currentPlan.name}
                className="bg-indigo-650 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport viewport */}
        <div className="flex-1 flex items-center justify-between my-4 gap-4 relative">
          {/* Previous button */}
          {lightboxIndex > 0 ? (
            <button
              type="button"
              onClick={() => onIndexChange(lightboxIndex - 1)}
              className="absolute left-0 z-10 md:static bg-white/10 hover:bg-white/20 active:scale-95 text-white p-3 md:p-4 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : <div className="w-12 hidden md:block" />}

          {/* Main content frame */}
          <div className="flex-1 max-w-4xl mx-auto flex items-center justify-center p-2">
            {currentPlan.url.startsWith('data:image/') || currentPlan.url.startsWith('http') ? (
              <img 
                src={currentPlan.url} 
                alt={currentPlan.name} 
                className="max-h-[62vh] max-w-full object-contain rounded-xl border border-white/10 bg-slate-900 shadow-2xl modal-fade"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-96 aspect-square rounded-2xl bg-[#111] border border-white/10 flex flex-col items-center justify-center text-slate-300 p-8 text-center shadow-lg">
                <FileText className="w-16 h-16 text-indigo-500 mb-4" />
                <h4 className="font-bold text-sm text-white mb-2">{currentPlan.name}</h4>
                <p className="text-xs text-slate-400">PDF Dokumentenscan. Nutzen Sie den Download-Button oben rechts, um das Dokument auf Ihrem Gerät anzuzeigen.</p>
              </div>
            )}
          </div>

          {/* Next button */}
          {lightboxIndex < activePlansArray.length - 1 ? (
            <button
              type="button"
              onClick={() => onIndexChange(lightboxIndex + 1)}
              className="absolute right-0 z-10 md:static bg-white/10 hover:bg-white/20 active:scale-95 text-white p-3 md:p-4 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : <div className="w-12 hidden md:block" />}
        </div>

        {/* Bottom details card */}
        <div className="bg-[#111112] border border-white/10 rounded-2xl p-4 md:p-5 max-w-3xl mx-auto w-full text-left">
          <div className="flex flex-wrap gap-x-6 gap-y-2 items-center mb-2.5">
            {currentPlan.dimensions && (
              <span className="bg-indigo-650 border border-indigo-500/30 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                {currentPlan.dimensions}
              </span>
            )}
            <span className="text-slate-400 text-xs">
              Erfasst am: {new Date(currentPlan.uploadDate).toLocaleDateString('de-DE')} • {new Date(currentPlan.uploadDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
            </span>
          </div>
          <p className="text-slate-200 font-bold text-xs leading-relaxed whitespace-pre-wrap">
            {currentPlan.description || "Keine zusätzlichen Notizen hinterlegt."}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
