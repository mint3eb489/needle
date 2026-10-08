import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Calendar, MapPin, Mail, Smartphone, Car, 
  Wallet, Edit2, Trash2, FileText, ExternalLink, Sparkles 
} from 'lucide-react';
import { Consultation } from '../types';
import { renderDate } from '../utils/helpers';
import { applianceConfig } from '../constants';

interface CustomerDetailModalProps {
  isOpen: boolean;
  consultation: Consultation | null;
  onClose: () => void;
  onEdit: (consultation: Consultation) => void;
  onDelete: (consultation: Consultation) => void;
  onOpenLightbox: (consultation: Consultation, index: number) => void;
  userRole: 'admin' | 'consultant';
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  consultation,
  onClose,
  onEdit,
  onDelete,
  onOpenLightbox,
  userRole,
}) => {
  if (!isOpen || !consultation) return null;

  const customerName = consultation.firstName || consultation.lastName 
    ? `${consultation.firstName || ''} ${consultation.lastName || ''}`.trim()
    : 'Unbenannter Kunde';

  const fullAddress = [
    consultation.street && consultation.houseNumber 
      ? `${consultation.street} ${consultation.houseNumber}` 
      : (consultation.street || ''),
    consultation.zipCode && consultation.city 
      ? `${consultation.zipCode} ${consultation.city}` 
      : (consultation.city || consultation.zipCode || '')
  ].filter(Boolean).join(', ');

  const googleMapsUrl = fullAddress 
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`
    : null;

  const handleEditClick = () => {
    onClose();
    onEdit(consultation);
  };

  const handleDeleteClick = () => {
    onDelete(consultation);
  };

  const hasAppliances = consultation.appliances && 
    (Object.values(consultation.appliances) as any[]).some(app => app.needed);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 modal-fade"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white dark:bg-[#151c2c] border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Bottom-Sheet Pull Bar */}
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

          {/* Modal Header */}
          <div className="px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-[#111726]/80">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {customerName}
                </h3>
                {(userRole === 'admin' || consultation.consultantEmail) && (
                  <span className="bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center gap-1 font-bold text-[10px] shrink-0">
                    <User className="w-3 h-3 text-indigo-500" />
                    {consultation.consultantEmail || 'Berater'}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Erstellt am: {renderDate(consultation.createdAt) || 'Unbekannt'}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="px-5 py-2.5 bg-white dark:bg-[#151c2c] border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={handleEditClick}
              className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Bedarfsermittlung öffnen / bearbeiten</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Diesen Datensatz löschen"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Löschen</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* 1. Kontaktdaten & Adresse */}
            <div className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 sm:p-4">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                Kontaktdaten & Adresse
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Adresse */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Adresse</span>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {fullAddress || 'Keine Adresse hinterlegt'}
                  </span>
                </div>

                {/* Route / Entfernung */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Fahrstrecke / Route</span>
                  {consultation.distanceKm && googleMapsUrl ? (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Car className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{consultation.distanceKm} km ({consultation.driveTimeMin || '?'} Min)</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-400">-</span>
                  )}
                </div>

                {/* Telefon / Handy */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Telefon / Mobil</span>
                  {consultation.mobile || consultation.phone ? (
                    <a
                      href={`tel:${consultation.mobile || consultation.phone}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{consultation.mobile || consultation.phone}</span>
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-400">-</span>
                  )}
                </div>

                {/* E-Mail */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">E-Mail</span>
                  {consultation.email ? (
                    <a
                      href={`mailto:${consultation.email}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{consultation.email}</span>
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-400">-</span>
                  )}
                </div>

                {/* Budget */}
                {consultation.budget && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800 sm:col-span-2">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Kunden-Budget</span>
                    <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                      <Wallet className="w-4 h-4 text-violet-500 shrink-0" />
                      <span>{consultation.budget} €</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Küchenplanung & Spezifikationen */}
            <div className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 sm:p-4">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Küchenausstattung & Wünsche
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Hersteller */}
                {consultation.manufacturer && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Hersteller Wunsch</span>
                    <span className="font-bold text-slate-900 dark:text-white">{consultation.manufacturer}</span>
                  </div>
                )}

                {/* Fronten */}
                {consultation.frontMaterial && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Frontauswahl</span>
                    <div className="font-bold text-slate-900 dark:text-white space-y-0.5">
                      <div>
                        {consultation.hasSecondFront ? 'Front 1: ' : ''}{consultation.frontMaterial} {consultation.frontColor && `(${consultation.frontColor})`}
                      </div>
                      {consultation.hasSecondFront && consultation.secondFrontMaterial && (
                        <div className="text-indigo-600 dark:text-indigo-400">
                          Front 2: {consultation.secondFrontMaterial} {consultation.secondFrontColor && `(${consultation.secondFrontColor})`}
                        </div>
                      )}
                      {consultation.hasThirdFront && consultation.thirdFrontMaterial && (
                        <div className="text-indigo-600 dark:text-indigo-400">
                          Front 3: {consultation.thirdFrontMaterial} {consultation.thirdFrontColor && `(${consultation.thirdFrontColor})`}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Griffprofil */}
                {consultation.handleStyles && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Griffprofil</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {Object.entries(consultation.handleStyles)
                        .filter(([_, value]) => value)
                        .map(([key]) => {
                          const note = (consultation.handleNotes as any)?.[key];
                          const label = key === 'grifflos' ? 'Grifflos' : key === 'griffleisten' ? 'Leiste' : 'Griffe';
                          return note ? `${label} (${note})` : label;
                        }).join(', ') || '-'}
                    </span>
                  </div>
                )}

                {/* Arbeitsplatte */}
                {consultation.worktopTypes && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Arbeitsplatte</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {Object.entries(consultation.worktopTypes)
                        .filter(([_, value]) => value)
                        .map(([key]) => {
                          const note = (consultation.worktopNotes as any)?.[key];
                          const label = key === 'schichtstoff' ? 'Schichtstoff' : key === 'naturstein' ? 'Naturstein' : 'Dekton';
                          return note ? `${label} (${note})` : label;
                        }).join(', ') || '-'}
                    </span>
                  </div>
                )}

                {/* Mehrwert Armatur */}
                {consultation.faucet && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Mehrwert Armatur</span>
                    <span className="font-bold text-slate-900 dark:text-white">{consultation.faucet}</span>
                  </div>
                )}

                {/* Abfallsammler */}
                {consultation.wasteBin && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Abfallsammler</span>
                    <span className="font-bold text-slate-900 dark:text-white">{consultation.wasteBin}</span>
                  </div>
                )}

                {/* Deckenplanung */}
                {(consultation.ceilingHigh || Boolean(consultation.ceilingPanel)) && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Deckenplanung</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {[
                        consultation.ceilingHigh ? 'Deckenhoch' : null,
                        typeof consultation.ceilingPanel === 'string' && consultation.ceilingPanel 
                          ? consultation.ceilingPanel 
                          : consultation.ceilingPanel ? 'Deckenblende' : null
                      ].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Benötigte Elektrogeräte & Spüle */}
            {hasAppliances && (
              <div className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 sm:p-4">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  Benötigte Elektrogeräte & Spüle
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(consultation.appliances!) as Array<[string, any]>)
                    .filter(([_, app]) => app.needed)
                    .map(([key, app]) => {
                      const label = (applianceConfig as any)[key]?.label || key;
                      return (
                        <span 
                          key={key} 
                          className="bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs"
                        >
                          {label}
                          {app.details?.length > 0 && (
                            <span className="text-indigo-600 dark:text-indigo-400 ml-1">
                              ({app.details.join(', ')})
                            </span>
                          )}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 4. Anmerkungen & Bemerkungen */}
            {consultation.notes && (
              <div className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 sm:p-4">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Anmerkungen & Bemerkungen
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-semibold bg-white dark:bg-[#151c2c] p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
                  {consultation.notes}
                </p>
              </div>
            )}

            {/* 5. Pläne & Skizzen */}
            {consultation.floorPlans && consultation.floorPlans.length > 0 && (
              <div className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 sm:p-4">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  Zugeordnete Pläne & Scans ({consultation.floorPlans.length})
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {consultation.floorPlans.map((plan, index) => (
                    <div 
                      key={plan.id || index}
                      onClick={() => onOpenLightbox(consultation, index)}
                      className="group/plan relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1a1a] cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-sm"
                      title={`${plan.name} - Zum Vergrößern klicken`}
                    >
                      {plan.url.startsWith('data:image/') || plan.url.startsWith('http') ? (
                        <img 
                          src={plan.url} 
                          alt={plan.name} 
                          className="w-full h-full object-cover transition-transform duration-200 group-hover/plan:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-450 dark:text-slate-550">
                          <FileText className="w-6 h-6 mb-0.5 text-indigo-500/80" />
                          <span className="text-[8px] font-bold truncate w-full px-1 text-center text-slate-500">{plan.name}</span>
                        </div>
                      )}
                      {plan.dimensions && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] font-bold text-white py-0.5 px-1 truncate text-center">
                          {plan.dimensions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="p-3 bg-slate-50/70 dark:bg-[#111726]/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Schließen
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
