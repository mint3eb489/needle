import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Smartphone, 
  Mail, 
  Building2, 
  Palette, 
  Ruler, 
  Layers, 
  Droplets, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  Clock, 
  Euro, 
  ChefHat, 
  RotateCcw, 
  Check,
  X
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { FormData } from '../types';

export interface LiveSummaryBoxProps {
  formData: FormData;
  editingId: string | null;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onResetDraft?: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onClose?: () => void;
}

export const calculateConsultationProgress = (formData: FormData): number => {
  if (!formData) return 0;

  // STEP 1: Raum & Design (max 25%)
  let step1 = 0;
  // Hersteller gewählt (5 Punkte)
  if (formData.manufacturer && formData.manufacturer.trim().length > 0) {
    step1 += 5;
  }
  // Front-Material & Front-Farbe (je 4 Punkte = 8 Punkte)
  if (formData.frontMaterial && formData.frontMaterial.trim().length > 0) {
    step1 += 4;
  }
  if (formData.frontColor && formData.frontColor.trim().length > 0) {
    step1 += 4;
  }
  // Optionale Zusatzfronten (1 Punkt)
  if (formData.hasSecondFront && (formData.secondFrontMaterial || formData.secondFrontColor)) {
    step1 += 1;
  }
  // Griffausführung (4 Punkte für Stil + 1 Punkt für Notiz)
  const hasHandleStyle = Boolean(
    formData.handleStyles?.grifflos || 
    formData.handleStyles?.griffleisten || 
    formData.handleStyles?.griffe
  );
  if (hasHandleStyle) step1 += 4;
  const hasHandleNote = Boolean(
    formData.handleNotes?.grifflos?.trim() || 
    formData.handleNotes?.griffleisten?.trim() || 
    formData.handleNotes?.griffe?.trim()
  );
  if (hasHandleNote) step1 += 1;

  // Arbeitsplatte (4 Punkte für Typ + 2 Punkte für Notiz)
  const hasWorktopType = Boolean(
    formData.worktopTypes?.schichtstoff || 
    formData.worktopTypes?.naturstein || 
    formData.worktopTypes?.dekton
  );
  if (hasWorktopType) step1 += 4;
  const hasWorktopNote = Boolean(
    formData.worktopNotes?.schichtstoff?.trim() || 
    formData.worktopNotes?.naturstein?.trim() || 
    formData.worktopNotes?.dekton?.trim()
  );
  if (hasWorktopNote) step1 += 2;
  step1 = Math.min(25, step1);

  // STEP 2: Grundriss & Aufmaß (max 25%)
  let step2 = 0;
  if (formData.workHeight && formData.workHeight.trim().length > 0) step2 += 6;
  if (formData.roomHeight && formData.roomHeight.trim().length > 0) step2 += 6;
  if (formData.sillHeight && formData.sillHeight.trim().length > 0) step2 += 3;
  if (formData.ceilingHigh || (formData.ceilingPanel && String(formData.ceilingPanel).trim().length > 0)) {
    step2 += 3;
  }
  if (formData.floorPlans && formData.floorPlans.length > 0) {
    step2 += Math.min(7, formData.floorPlans.length * 4);
  }
  step2 = Math.min(25, step2);

  // STEP 3: Geräte & Zubehör (max 25%)
  let step3 = 0;
  let appliancesScore = 0;
  const appliancesList = Object.values(formData.appliances || {}) as { needed?: boolean; details?: string[] }[];
  appliancesList.forEach(app => {
    if (app.needed) appliancesScore += 2;
    if (app.details && app.details.length > 0) appliancesScore += 1;
  });
  step3 += Math.min(17, appliancesScore);

  // Sanitär & Zubehör (je 4 Punkte)
  if (formData.faucet && formData.faucet.trim().length > 0) step3 += 4;
  if (formData.wasteBin && formData.wasteBin.trim().length > 0) step3 += 4;
  step3 = Math.min(25, step3);

  // STEP 4: Kundendaten & Rahmenbedingungen (max 25%)
  let step4 = 0;
  // Name (je 3 Punkte)
  if (formData.firstName && formData.firstName.trim().length > 0) step4 += 3;
  if (formData.lastName && formData.lastName.trim().length > 0) step4 += 3;
  // Adresse (je 3 Punkte)
  if ((formData.street && formData.street.trim().length > 0) || (formData.houseNumber && formData.houseNumber.trim().length > 0)) {
    step4 += 3;
  }
  if ((formData.zipCode && formData.zipCode.trim().length > 0) || (formData.city && formData.city.trim().length > 0)) {
    step4 += 3;
  }
  // Kontakt (je 3 Punkte)
  if ((formData.phone && formData.phone.trim().length > 0) || (formData.mobile && formData.mobile.trim().length > 0)) {
    step4 += 3;
  }
  if (formData.email && formData.email.trim().length > 0) step4 += 3;
  // Projektdetails (Budget, Zeitplan, Quelle, Notizen)
  if (formData.budget && formData.budget.trim().length > 0) step4 += 3;
  if (formData.timeline && formData.timeline.trim().length > 0) step4 += 2;
  if (formData.source && formData.source.trim().length > 0) step4 += 1;
  if (formData.notes && formData.notes.trim().length > 0) step4 += 1;
  step4 = Math.min(25, step4);

  const total = step1 + step2 + step3 + step4;
  return Math.min(100, Math.max(0, Math.round(total)));
};

const applianceLabels: Record<string, string> = {
  kochfeld: 'Kochfeld',
  backofen: 'Backofen',
  dunstabzug: 'Dunstabzug',
  mikrowelle: 'Mikrowelle',
  geschirrspueler: 'Geschirrspüler',
  kuehlschrank: 'Kühlschrank',
  dampfgarer: 'Dampfgarer',
  spuelbecken: 'Spülbecken',
};

export const LiveSummaryBox: React.FC<LiveSummaryBoxProps> = ({
  formData,
  editingId,
  isSubmitting,
  onSubmit,
  onResetDraft,
  currentStep,
  onStepChange,
  onClose,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allSectionKeys = ['eckdaten', 'fronten', 'arbeitsplatte', 'geraete', 'sanitaer'];
  const areAllCollapsed = allSectionKeys.length > 0 && allSectionKeys.every(k => collapsedSections[k]);

  const toggleAllSections = () => {
    if (areAllCollapsed) {
      setCollapsedSections({});
    } else {
      const next: Record<string, boolean> = {};
      allSectionKeys.forEach(k => { next[k] = true; });
      setCollapsedSections(next);
    }
  };

  const progress = calculateConsultationProgress(formData);

  // Selected Handle Styles
  const selectedHandles = Object.entries(formData.handleStyles || {})
    .filter(([_, value]) => value)
    .map(([key]) => {
      let label = key;
      if (key === 'grifflos') label = 'Grifflos';
      if (key === 'griffleisten') label = 'Griffleisten';
      if (key === 'griffe') label = 'Klassische Griffe';
      const note = (formData.handleNotes as any)?.[key] || '';
      return { key, label, note: String(note).trim() };
    });

  // Selected Worktop Types
  const selectedWorktops = Object.entries(formData.worktopTypes || {})
    .filter(([_, value]) => value)
    .map(([key]) => {
      let label = key;
      if (key === 'schichtstoff') label = 'Schichtstoff';
      if (key === 'naturstein') label = 'Naturstein';
      if (key === 'dekton') label = 'Dekton';
      const note = (formData.worktopNotes as any)?.[key] || '';
      return { key, label, note: String(note).trim() };
    });

  // Selected Appliances count and list
  const selectedAppliances = (Object.entries(formData.appliances || {}) as [string, { needed: boolean; details: string[] }][])
    .filter(([_, app]) => app.needed || (app.details && app.details.length > 0))
    .map(([key, app]) => ({
      key,
      label: applianceLabels[key] || key,
      details: app.details || [],
    }));

  const customerName = `${formData.firstName} ${formData.lastName}`.trim();

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#151c2c] border-0 lg:border border-slate-200 dark:border-slate-800 rounded-none lg:rounded-2xl shadow-md overflow-hidden justify-between">
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-slate-100 dark:bg-[#0b0f19] p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 mr-0.5 rounded-xl bg-white dark:bg-[#151c2c] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
                title="Zurück zum Formular"
                aria-label="Zurück zum Formular"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <BrandLogo className="w-7 h-7 sm:w-8 sm:h-8" roundedClassName="rounded-lg" />
            <div className="min-w-0">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 truncate">
                Zusammenfassung
              </h3>
              <button
                type="button"
                onClick={toggleAllSections}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors cursor-pointer block -mt-0.5 text-left truncate"
              >
                {areAllCollapsed ? 'Alle Abschnitte zeigen' : 'Alle einklappen'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Progress Indicator Pill */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#151c2c] px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden xs:inline">
                Fortschritt
              </span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Clean Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 shrink-0">
            <div
              className="bg-indigo-600 h-1.5 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Live Content Body */}
          <div className="p-3.5 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">

          {/* CUSTOMER CARD */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200 dark:border-indigo-800">
                  {customerName ? customerName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {customerName || 'Vor- & Nachname eingeben...'}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-400 shrink-0" />
                    {formData.city || formData.zipCode ? (
                      <span>
                        {formData.zipCode} {formData.city} {formData.street && `(${formData.street} ${formData.houseNumber})`}
                      </span>
                    ) : (
                      <span className="italic text-slate-400 dark:text-slate-500">Keine Adresse angegeben</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Distance & Travel Info */}
            {Boolean(((formData.street && formData.street.trim().length >= 2) || (formData.billingStreet && formData.billingStreet.trim().length >= 2)) && formData.distanceKm !== undefined && formData.distanceKm !== '') && (
              <div 
                onClick={() => {
                  const hasDeviatingDelivery = !formData.billingSameAsDelivery;
                  const destStreet = (hasDeviatingDelivery ? (formData.street || '') : (formData.street || formData.billingStreet || '')).trim();
                  const destHouseNum = (hasDeviatingDelivery ? (formData.houseNumber || '') : (formData.houseNumber || formData.billingHouseNumber || '')).trim();
                  const destZip = (hasDeviatingDelivery ? (formData.zipCode || '') : (formData.zipCode || formData.billingZipCode || '')).trim();
                  const destCity = (hasDeviatingDelivery ? (formData.city || '') : (formData.city || formData.billingCity || '')).trim();
                  const destStr = [destStreet, destHouseNum, destZip, destCity].filter(Boolean).join(' ');
                  if (!destStr) return;
                  const isApple = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
                  const url = isApple
                    ? `https://maps.apple.com/?daddr=${encodeURIComponent(destStr)}&dirflg=d`
                    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destStr)}&travelmode=driving`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1.5 -mx-1.5 rounded-lg transition-colors"
                title="Route in Apple / Google Maps öffnen"
              >
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <MapPin className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  Entfernung:
                </span>
                <span className={`px-2 py-0.5 rounded-md font-mono-tabular font-black flex items-center gap-1 group-hover:scale-105 transition-transform ${
                  formData.plzWithinRange 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {formData.distanceKm} km ({formData.driveTimeMin} min) ↗
                </span>
              </div>
            )}

            {/* Contact Pills */}
            {(formData.phone || formData.mobile || formData.email) && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                {formData.phone && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#151c2c] rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                    <Phone className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    {formData.phone}
                  </span>
                )}
                {formData.mobile && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#151c2c] rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                    <Smartphone className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    {formData.mobile}
                  </span>
                )}
                {formData.email && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#151c2c] rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 truncate max-w-full">
                    <Mail className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    {formData.email}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* SECTION 1: HERSTELLER & ECKDATEN */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#151c2c]">
            <button
              type="button"
              onClick={() => toggleSection('eckdaten')}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-[#111827] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Hersteller & Budget
                </span>
              </div>
              {collapsedSections['eckdaten'] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </button>

            {!collapsedSections['eckdaten'] && (
              <div className="p-3 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 dark:bg-[#0b0f19] p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Hersteller</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formData.manufacturer || '–'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0b0f19] p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Budget</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                      {formData.budget ? `${formData.budget} €` : '–'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0b0f19] p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Zeitplan</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formData.timeline || '–'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0b0f19] p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Quelle</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                      {formData.source || '–'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: FRONTEN & GRIFFE */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#151c2c]">
            <button
              type="button"
              onClick={() => toggleSection('fronten')}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-[#111827] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Fronten & Griffe
                </span>
              </div>
              {collapsedSections['fronten'] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </button>

            {!collapsedSections['fronten'] && (
              <div className="p-3 text-xs space-y-2">
                {/* Front 1 */}
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Hauptfront:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-right">
                    {formData.frontMaterial || formData.frontColor ? `${formData.frontMaterial || ''} ${formData.frontColor ? `(${formData.frontColor})` : ''}` : '–'}
                  </span>
                </div>

                {/* Front 2 */}
                {formData.hasSecondFront && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">2. Front:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">
                      {formData.secondFrontMaterial || formData.secondFrontColor ? `${formData.secondFrontMaterial || ''} ${formData.secondFrontColor ? `(${formData.secondFrontColor})` : ''}` : '–'}
                    </span>
                  </div>
                )}

                {/* Front 3 */}
                {formData.hasThirdFront && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">3. Front:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">
                      {formData.thirdFrontMaterial || formData.thirdFrontColor ? `${formData.thirdFrontMaterial || ''} ${formData.thirdFrontColor ? `(${formData.thirdFrontColor})` : ''}` : '–'}
                    </span>
                  </div>
                )}

                {/* Handles */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Griffausführung</span>
                  {selectedHandles.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedHandles.map(h => (
                        <div key={h.key} className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                            {h.label}
                          </span>
                          {h.note && (
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#0b0f19] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                              {h.note}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Keine Griffart ausgewählt</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: ARBEITSPLATTE & MASSE */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#151c2c]">
            <button
              type="button"
              onClick={() => toggleSection('arbeitsplatte')}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-[#111827] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Ruler className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Arbeitsplatte & Maße
                </span>
              </div>
              {collapsedSections['arbeitsplatte'] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </button>

            {!collapsedSections['arbeitsplatte'] && (
              <div className="p-3 text-xs space-y-2">
                {/* Worktop material */}
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Arbeitsplatten-Typ</span>
                  {selectedWorktops.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedWorktops.map(w => (
                        <div key={w.key} className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                            {w.label}
                          </span>
                          {w.note && (
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#0b0f19] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                              {w.note}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Nicht festgelegt</span>
                  )}
                </div>

                {/* Dimensions Grid */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <div className="bg-slate-50 dark:bg-[#0b0f19] p-1.5 rounded border border-slate-200/80 dark:border-slate-800 text-center">
                    <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Arbeitshöhe</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formData.workHeight ? `${formData.workHeight} cm` : '–'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0b0f19] p-1.5 rounded border border-slate-200/80 dark:border-slate-800 text-center">
                    <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Raumhöhe</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formData.roomHeight ? `${formData.roomHeight} cm` : '–'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0b0f19] p-1.5 rounded border border-slate-200/80 dark:border-slate-800 text-center">
                    <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Brüstung</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formData.sillHeight ? `${formData.sillHeight} cm` : '–'}
                    </span>
                  </div>
                </div>

                {/* Ceiling flags */}
                {(formData.ceilingHigh || Boolean(formData.ceilingPanel)) && (
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {formData.ceilingHigh && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#0b0f19] text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded border border-slate-200 dark:border-slate-800">
                        ✓ Deckenhoch
                      </span>
                    )}
                    {Boolean(formData.ceilingPanel) && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#0b0f19] text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded border border-slate-200 dark:border-slate-800">
                        ✓ {typeof formData.ceilingPanel === 'string' && formData.ceilingPanel ? formData.ceilingPanel : 'Deckenblende'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 4: GERÄTEAUSSTATTUNG */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#151c2c]">
            <button
              type="button"
              onClick={() => toggleSection('geraete')}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-[#111827] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Geräte & Ausstattung ({selectedAppliances.length})
                </span>
              </div>
              {collapsedSections['geraete'] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </button>

            {!collapsedSections['geraete'] && (
              <div className="p-2.5 text-xs space-y-1.5">
                {selectedAppliances.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedAppliances.map(app => (
                      <div key={app.key} className="bg-slate-50 dark:bg-[#0b0f19] p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            {app.label}:
                          </span>
                          {app.details.length > 0 ? (
                            <div className="flex flex-wrap gap-1 items-center">
                              {app.details.map((detail, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-white dark:bg-[#151c2c] text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded border border-slate-200 dark:border-slate-800">
                                  {detail}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 italic">Ausgewählt</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-center py-2">Noch keine Elektrogeräte ausgewählt</p>
                )}
              </div>
            )}
          </div>

          {/* SECTION 5: SANITÄR, GRUNDRISS & NOTIZEN */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#151c2c]">
            <button
              type="button"
              onClick={() => toggleSection('sanitaer')}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-[#111827] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Sanitär, Grundriss & Notizen
                </span>
              </div>
              {collapsedSections['sanitaer'] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </button>

            {!collapsedSections['sanitaer'] && (
              <div className="p-3 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 dark:bg-[#0b0f19] p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Armatur</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formData.faucet || '–'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0b0f19] p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Abfallsystem</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formData.wasteBin || '–'}
                    </span>
                  </div>
                </div>

                {/* Floor plans count */}
                {formData.floorPlans && formData.floorPlans.length > 0 && (
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>{formData.floorPlans.length} Grundriss-Dateien angehängt</span>
                  </div>
                )}

                {/* Notes preview */}
                {formData.notes && (
                  <div className="p-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800 rounded-lg">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Anmerkungen</span>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 italic">
                      "{formData.notes}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
        </div>

        {/* Action Box Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#0b0f19] border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 active:scale-98 transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isSubmitting ? (
              <span>Wird gespeichert...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {editingId ? 'Änderungen speichern' : 'Bedarf speichern'}
              </>
            )}
          </button>

          {onResetDraft && (
            <button
              type="button"
              onClick={onResetDraft}
              className="w-full text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Entwurf zurücksetzen
            </button>
          )}
        </div>
      </div>
  );
};
