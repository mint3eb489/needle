import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, X, Check } from 'lucide-react';
import { Appliances } from '../types';

interface ApplianceModalProps {
  activeApplianceKey: string | null;
  activeApplianceConfig: Record<string, { label: string; options: string[] }>;
  appliancesData?: Appliances;
  onClose: () => void;
  onToggleOption: (key: string, option: string) => void;
  onResetOptions: (key: string) => void;
}

export const ApplianceModal: React.FC<ApplianceModalProps> = ({
  activeApplianceKey,
  activeApplianceConfig,
  appliancesData,
  onClose,
  onToggleOption,
  onResetOptions,
}) => {
  if (!activeApplianceKey || !activeApplianceConfig[activeApplianceKey]) return null;

  const currentConfig = activeApplianceConfig[activeApplianceKey];
  const currentDetails = appliancesData?.[activeApplianceKey as keyof Appliances]?.details || [];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 modal-fade"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#0b0f19]/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{currentConfig.label}</span>
                  {currentDetails.length > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-600 text-white">
                      {currentDetails.length} gewählt
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Details & Merkmale auswählen
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body: Grid of option chips */}
          <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Optionen wählen ({currentConfig.options.length}):</span>
              {currentDetails.length ? (
                <button
                  type="button"
                  onClick={() => onResetOptions(activeApplianceKey)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Auswahl zurücksetzen
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[55vh] sm:max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {currentConfig.options.map((option) => {
                const isSelected = currentDetails.includes(option);
                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => onToggleOption(activeApplianceKey, option)}
                    className={`p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500'
                    }`}
                  >
                    <span>{option}</span>
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                      isSelected ? 'border-white bg-white/20' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0b0f19]/50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm cursor-pointer"
            >
              Fertig & Übernehmen
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
