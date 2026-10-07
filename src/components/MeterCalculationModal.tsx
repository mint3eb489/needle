import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, X, Check, Copy, Sliders,
  Ruler, Package, Sparkles, Plus, Minus, RotateCcw,
  CheckCircle2, Printer, Tag, Flame, Truck
} from 'lucide-react';
import { CustomCatalogOptions, PriceGroupOption, AppliancePackageOption, UserRole } from '../types';
import { DEFAULT_PRICE_GROUPS, DEFAULT_APPLIANCE_PACKAGES } from '../constants';
import { inputClass, labelClass } from './ui/FormControls';

interface MeterCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customCatalog: CustomCatalogOptions;
  userRole?: UserRole;
  onOpenAdminCatalog?: () => void;
  onApplyToConsultation?: (calculatedData: {
    totalGross: number;
    meters: number;
    priceGroupName: string;
    appliancePackageName: string;
    summaryText: string;
  }) => void;
  setToast: (toast: { show: boolean; message: string; type: string }) => void;
}

export const MeterCalculationModal: React.FC<MeterCalculationModalProps> = ({
  isOpen,
  onClose,
  customCatalog,
  userRole,
  onOpenAdminCatalog,
  onApplyToConsultation,
  setToast,
}) => {
  // Active Price Groups & Packages from Custom Catalog with fallback to defaults
  const priceGroups: PriceGroupOption[] = useMemo(() => {
    if (customCatalog.priceGroups && Array.isArray(customCatalog.priceGroups) && customCatalog.priceGroups.length > 0) {
      return customCatalog.priceGroups;
    }
    return DEFAULT_PRICE_GROUPS;
  }, [customCatalog.priceGroups]);

  const appliancePackages: AppliancePackageOption[] = useMemo(() => {
    if (customCatalog.appliancePackages && Array.isArray(customCatalog.appliancePackages) && customCatalog.appliancePackages.length > 0) {
      return customCatalog.appliancePackages;
    }
    return DEFAULT_APPLIANCE_PACKAGES;
  }, [customCatalog.appliancePackages]);

  // Main Calculation State
  const [runningMeters, setRunningMeters] = useState<number>(4.5);
  const [selectedPgId, setSelectedPgId] = useState<string>(() => priceGroups[2]?.id || priceGroups[0]?.id || 'pg-3');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(() => appliancePackages[1]?.id || appliancePackages[0]?.id || 'pkg-2');

  // Optional Surcharges & Services
  const deliveryAssemblyPercentage = customCatalog.deliveryAssemblyPercentage ?? 9.5;

  const [worktopSurcharge, setWorktopSurcharge] = useState<number>(0);
  const [specialAccessoriesSurcharge, setSpecialAccessoriesSurcharge] = useState<number>(0);

  // Active selected Price Group
  const activePriceGroup = useMemo(() => {
    return priceGroups.find(pg => pg.id === selectedPgId) || priceGroups[0] || {
      id: 'pg-1',
      name: 'Preisgruppe 1',
      pricePerMeter: 1250
    };
  }, [priceGroups, selectedPgId]);

  // Active selected Appliance Package
  const activeAppliancePackage = useMemo(() => {
    return appliancePackages.find(pkg => pkg.id === selectedPackageId) || appliancePackages[0] || null;
  }, [appliancePackages, selectedPackageId]);

  // Current effective price per meter
  const effectiveMeterPrice = activePriceGroup.pricePerMeter;

  // Calculations
  const furnitureGross = useMemo(() => {
    return Math.max(0, runningMeters * effectiveMeterPrice);
  }, [runningMeters, effectiveMeterPrice]);

  const appliancesGross = useMemo(() => {
    return activeAppliancePackage ? activeAppliancePackage.price : 0;
  }, [activeAppliancePackage]);

  // The total price consists of Furniture + Appliances + any optional surcharges
  const finalTotalGross = useMemo(() => {
    return furnitureGross + appliancesGross + worktopSurcharge + specialAccessoriesSurcharge;
  }, [furnitureGross, appliancesGross, worktopSurcharge, specialAccessoriesSurcharge]);

  // 9.5% for delivery & assembly is ALREADY INCLUDED in the total sum and itemized
  const deliveryAssemblyGross = useMemo(() => {
    return (finalTotalGross * deliveryAssemblyPercentage) / 100;
  }, [finalTotalGross, deliveryAssemblyPercentage]);

  const finalNetTotal = useMemo(() => {
    return finalTotalGross / 1.19;
  }, [finalTotalGross]);

  const finalVat = useMemo(() => {
    return finalTotalGross - finalNetTotal;
  }, [finalTotalGross, finalNetTotal]);

  const effectiveTotalPerMeter = useMemo(() => {
    if (runningMeters <= 0) return 0;
    return finalTotalGross / runningMeters;
  }, [finalTotalGross, runningMeters]);

  // Format currency
  const formatEur = (val: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
  };

  // Generate clean formatted text summary
  const generateCalculationSummaryText = () => {
    const lines = [
      `=========================================`,
      `   KÜCHEN-VORKALKULATION (METERPREIS)   `,
      `   ${customCatalog.studioAddress?.name || 'Küchenstudio Balingen'}`,
      `=========================================`,
      `Laufmeter: ${runningMeters.toFixed(2).replace('.', ',')} m`,
      `Preisgruppe: ${activePriceGroup.name} (${formatEur(effectiveMeterPrice)} / lfm)`,
      `Holzteile / Möbel: ${formatEur(furnitureGross)}`,
      ``,
      `Geräte-Paket: ${activeAppliancePackage ? `${activeAppliancePackage.name} (${formatEur(appliancesGross)})` : 'Kein Paket gewählt (0,00 €)'}`,
    ];

    if (activeAppliancePackage?.items && activeAppliancePackage.items.length > 0) {
      lines.push(`  Enthalten: ${activeAppliancePackage.items.join(', ')}`);
    }

    if (worktopSurcharge > 0) {
      lines.push(`Arbeitsplatten-Aufpreis: ${formatEur(worktopSurcharge)}`);
    }
    if (specialAccessoriesSurcharge > 0) {
      lines.push(`Zubehör & Sonderausstattung: ${formatEur(specialAccessoriesSurcharge)}`);
    }

    lines.push(`-----------------------------------------`);
    lines.push(`GESAMTPREIS (BRUTTO inkl. 19% MwSt.): ${formatEur(finalTotalGross)}`);
    lines.push(`  * Im Gesamtpreis enthalten: ${deliveryAssemblyPercentage.toString().replace('.', ',')} % Lieferung & Montage (${formatEur(deliveryAssemblyGross)})`);
    lines.push(`Netto-Warenwert: ${formatEur(finalNetTotal)} | MwSt. 19%: ${formatEur(finalVat)}`);
    lines.push(`Effektiver Komplett-Meterpreis: ${formatEur(effectiveTotalPerMeter)} / m`);
    lines.push(`=========================================`);

    return lines.join('\n');
  };

  const handleCopySummary = async () => {
    const text = generateCalculationSummaryText();
    try {
      await navigator.clipboard.writeText(text);
      setToast({
        show: true,
        message: 'Kalkulation erfolgreich in die Zwischenablage kopiert!',
        type: 'success'
      });
    } catch (err) {
      setToast({
        show: true,
        message: 'Konnte nicht kopiert werden.',
        type: 'error'
      });
    }
  };

  const handleApply = () => {
    if (onApplyToConsultation) {
      onApplyToConsultation({
        totalGross: finalTotalGross,
        meters: runningMeters,
        priceGroupName: activePriceGroup.name,
        appliancePackageName: activeAppliancePackage ? activeAppliancePackage.name : 'Ohne Gerätepaket',
        summaryText: generateCalculationSummaryText()
      });
      setToast({
        show: true,
        message: `Kalkulation (${formatEur(finalTotalGross)}) in Kunden-Beratung übernommen!`,
        type: 'success'
      });
      onClose();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setToast({ show: true, message: 'Druckfenster konnte nicht geöffnet werden.', type: 'error' });
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Küchen-Vorkalkulation - ${customCatalog.studioAddress?.name || 'Küchenstudio'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; }
          .studio { font-size: 13px; color: #64748b; text-align: right; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { text-align: left; font-size: 12px; color: #64748b; padding: 8px 12px; border-bottom: 1px solid #cbd5e1; }
          td { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
          td.amount { text-align: right; font-weight: 600; }
          .total-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px; margin-top: 24px; }
          .total-row { display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 6px; }
          .total-highlight { font-size: 20px; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 10px; }
          .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Küchen-Vorkalkulation</h1>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Kalkulationsdatum: ${new Date().toLocaleDateString('de-DE')}</div>
          </div>
          <div class="studio">
            <strong>${customCatalog.studioAddress?.name || 'Küchenstudio'}</strong><br/>
            ${customCatalog.studioAddress?.street || ''} ${customCatalog.studioAddress?.houseNumber || ''}<br/>
            ${customCatalog.studioAddress?.zipCode || ''} ${customCatalog.studioAddress?.city || ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Grunddaten & Maße</div>
          <table>
            <tr>
              <td><strong>Küchen-Laufmeter</strong></td>
              <td>${runningMeters.toFixed(2).replace('.', ',')} Meter</td>
              <td class="amount">${formatEur(effectiveMeterPrice)} / m</td>
            </tr>
            <tr>
              <td><strong>Ausgewählte Preisgruppe</strong></td>
              <td>${activePriceGroup.name}</td>
              <td class="amount">${formatEur(furnitureGross)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Geräte-Ausstattung</div>
          <table>
            <tr>
              <td><strong>${activeAppliancePackage ? activeAppliancePackage.name : ''}</strong></td>
              <td>
                ${activeAppliancePackage?.subtitle ? `<span style="font-size:12px; color:#64748b;">${activeAppliancePackage.subtitle}</span><br/>` : ''}
                ${activeAppliancePackage?.items ? `<span style="font-size:12px; color:#475569;">${activeAppliancePackage.items.join(' • ')}</span>` : ''}
              </td>
              <td class="amount">${formatEur(appliancesGross)}</td>
            </tr>
          </table>
        </div>

        ${(worktopSurcharge > 0 || specialAccessoriesSurcharge > 0) ? `
        <div class="section">
          <div class="section-title">Sonderausstattung & Zubehör</div>
          <table>
            ${worktopSurcharge > 0 ? `
            <tr>
              <td>Arbeitsplatten-Aufpreis</td>
              <td>Sonderausführung / Materialaufpreis</td>
              <td class="amount">${formatEur(worktopSurcharge)}</td>
            </tr>` : ''}
            ${specialAccessoriesSurcharge > 0 ? `
            <tr>
              <td>Sonderzubehör / Mehrwert</td>
              <td>Armaturen, Spülen, Beleuchtung</td>
              <td class="amount">${formatEur(specialAccessoriesSurcharge)}</td>
            </tr>` : ''}
          </table>
        </div>` : ''}

        <div class="total-box">
          <div class="total-row">
            <span>Holzteile / Möbel (${runningMeters.toFixed(2).replace('.', ',')} m • ${activePriceGroup.name}):</span>
            <span>${formatEur(furnitureGross)}</span>
          </div>
          <div class="total-row">
            <span>Geräte-Paket (${activeAppliancePackage?.name || 'Keines'}):</span>
            <span>${formatEur(appliancesGross)}</span>
          </div>
          ${(worktopSurcharge + specialAccessoriesSurcharge) > 0 ? `
          <div class="total-row">
            <span>Sonderausstattung & Zubehör:</span>
            <span>${formatEur(worktopSurcharge + specialAccessoriesSurcharge)}</span>
          </div>` : ''}
          
          <div class="total-row total-highlight">
            <span>Gesamtpreis (Brutto):</span>
            <span>${formatEur(finalTotalGross)}</span>
          </div>
          <div class="total-row" style="font-size: 13px; color: #4338ca; margin-top: 6px; font-weight: 600;">
            <span>Darin enthalten: ${deliveryAssemblyPercentage.toString().replace('.', ',')} % Lieferung & fachgerechte Montage:</span>
            <span>${formatEur(deliveryAssemblyGross)}</span>
          </div>
          <div class="total-row" style="font-size: 12px; color: #64748b; margin-top: 4px;">
            <span>Darin enthaltene 19% MwSt.: ${formatEur(finalVat)} (Nettobetrag: ${formatEur(finalNetTotal)})</span>
            <span>Ø ${formatEur(effectiveTotalPerMeter)} / m</span>
          </div>
        </div>

        <div class="footer">
          Unverbindliche Vorkalkulation auf Grundlage von Meterpreisen. Lieferung und Montage sind im Gesamtpreis bereits einkalkuliert. Irrtümer und Modelländerungen vorbehalten.<br/>
          Erstellt mit needle Küchenberatung & Kalkulation.
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleReset = () => {
    setRunningMeters(4.5);
    setSelectedPgId(priceGroups[2]?.id || priceGroups[0]?.id || 'pg-3');
    setSelectedPackageId(appliancePackages[1]?.id || appliancePackages[0]?.id || 'pkg-2');
    setWorktopSurcharge(0);
    setSpecialAccessoriesSurcharge(0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl bg-white dark:bg-[#0f1422] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#151c2c]/80 backdrop-blur-xs shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Meterpreis-Rechner
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {userRole === 'admin' && onOpenAdminCatalog && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminCatalog();
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Meterpreise & Geräte-Pakete im Admin-Katalog verwalten"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Admin-Katalog</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                title="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Inputs & Configuration (7 Cols on lg) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. KÜCHEN-LAUFMETER */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151c2c]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Ruler className="w-4 h-4 text-indigo-500" />
                      1. Küchen-Laufmeter
                    </label>
                  </div>

                  {/* Main Meter Input Row */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0.5"
                        max="50"
                        step="0.05"
                        value={runningMeters}
                        onChange={(e) => setRunningMeters(Math.max(0, parseFloat(e.target.value) || 0))}
                        className={`${inputClass} text-lg font-bold text-slate-900 dark:text-white pr-12`}
                        placeholder="z.B. 4.5"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400 dark:text-slate-500 pointer-events-none">
                        Meter
                      </span>
                    </div>

                    {/* Quick Adjustment Increment Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setRunningMeters(prev => Math.max(0.5, Math.round((prev - 0.5) * 10) / 10))}
                        className="w-9 h-9 rounded-xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold cursor-pointer transition-all active:scale-95"
                        title="-0.5m"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRunningMeters(prev => Math.round((prev + 0.5) * 10) / 10)}
                        className="w-9 h-9 rounded-xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold cursor-pointer transition-all active:scale-95"
                        title="+0.5m"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. PREISGRUPPE AUSWÄHLEN */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-indigo-500" />
                      2. Preisgruppe
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {priceGroups.map((pg) => {
                      const isSelected = selectedPgId === pg.id;
                      return (
                        <div
                          key={pg.id}
                          onClick={() => setSelectedPgId(pg.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer relative flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 shadow-sm ring-1 ring-indigo-500/50'
                              : 'bg-white dark:bg-[#151c2c] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {pg.name}
                            </h4>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                              {formatEur(pg.pricePerMeter)} <span className="text-[10px] font-normal text-slate-400">/ m</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. GERÄTE-PAKETE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-indigo-500" />
                      3. Geräte-Paket
                    </label>
                  </div>

                  {/* 3 Packages from Catalog */}
                  <div className="space-y-2.5">
                    {appliancePackages.map((pkg, idx) => {
                      const isSelected = selectedPackageId === pkg.id;
                      const isPopular = idx === 1; // 2nd package as popular
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                            isSelected
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 shadow-sm ring-1 ring-indigo-500/50'
                              : 'bg-white dark:bg-[#151c2c] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className={`w-3.5 h-3.5 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                    {pkg.name}
                                  </h4>
                                  {isPopular && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-0.5">
                                      <Flame className="w-2.5 h-2.5" />
                                      Bestseller
                                    </span>
                                  )}
                                  {idx === 2 && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 flex items-center gap-0.5">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      High-End
                                    </span>
                                  )}
                                </div>

                                {/* Included items tags */}
                                {pkg.items && pkg.items.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {pkg.items.map((item, i) => (
                                      <span
                                        key={i}
                                        className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-[#0f1422] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                {formatEur(pkg.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. LIEFERUNG & MONTAGE SOWIE SONDERAUSSTATTUNG */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151c2c]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-500" />
                    4. Lieferung & Montage sowie Sonderausstattung
                  </label>

                  <div className="space-y-3 pt-1">
                    {/* Inklusiv-Leistung Lieferung & Montage 9,5% */}
                    <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Lieferung & fachgerechte Montage ({deliveryAssemblyPercentage.toString().replace('.', ',')} %)
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Im Preis enthalten
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {formatEur(deliveryAssemblyGross)}
                        </span>
                      </div>
                    </div>

                    {/* Surcharges Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          Arbeitsplatten-Aufpreis
                        </label>
                        <input
                          type="number"
                          step="50"
                          value={worktopSurcharge || ''}
                          onChange={(e) => setWorktopSurcharge(Math.max(0, parseFloat(e.target.value) || 0))}
                          className={inputClass}
                          placeholder="0 €"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          Sonderzubehör
                        </label>
                        <input
                          type="number"
                          step="50"
                          value={specialAccessoriesSurcharge || ''}
                          onChange={(e) => setSpecialAccessoriesSurcharge(Math.max(0, parseFloat(e.target.value) || 0))}
                          className={inputClass}
                          placeholder="0 €"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Live Calculation Summary & Action Cards (5 Cols on lg) */}
              <div className="lg:col-span-5 lg:sticky lg:top-0 space-y-4">
                
                {/* Total Summary Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-700/60 space-y-4 relative overflow-hidden">
                  {/* Subtle decorative glow */}
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    <span className="text-[10px] font-extrabold tracking-wider uppercase text-indigo-300">
                      Gesamtpreis
                    </span>
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                      {formatEur(finalTotalGross)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300 mt-1">
                      <span>inkl. 19% MwSt. ({formatEur(finalVat)})</span>
                      <span className="font-semibold text-indigo-300">
                        Ø {formatEur(effectiveTotalPerMeter)} / m
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700/80 space-y-2 text-xs">
                    {/* Item 1: Holzteile */}
                    <div className="flex items-center justify-between">
                      <div className="text-slate-300 truncate max-w-[200px]">
                        <span>Holzteile ({runningMeters.toFixed(2).replace('.', ',')} m • {activePriceGroup.name})</span>
                      </div>
                      <span className="font-bold text-white shrink-0">
                        {formatEur(furnitureGross)}
                      </span>
                    </div>

                    {/* Item 2: Geräte */}
                    <div className="flex items-center justify-between">
                      <div className="text-slate-300 truncate max-w-[200px]">
                        <span>Geräte ({activeAppliancePackage ? activeAppliancePackage.name : 'Kein Paket'})</span>
                      </div>
                      <span className="font-bold text-white shrink-0">
                        {formatEur(appliancesGross)}
                      </span>
                    </div>

                    {/* Item 3: Sonderzuschläge */}
                    {(worktopSurcharge > 0 || specialAccessoriesSurcharge > 0) && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Sonderausstattung & Zubehör</span>
                        <span className="font-bold text-white shrink-0">
                          {formatEur(worktopSurcharge + specialAccessoriesSurcharge)}
                        </span>
                      </div>
                    )}

                    {/* Item 4: Ausgewiesene Lieferung & Montage (im Preis enthalten) */}
                    <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-indigo-500/30 text-indigo-300">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Truck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Darin enthalten ({deliveryAssemblyPercentage.toString().replace('.', ',')} % Lfg. & Montage):</span>
                      </span>
                      <span className="font-bold text-white shrink-0">
                        {formatEur(deliveryAssemblyGross)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Netto-Warenwert:</span>
                    <span className="font-semibold text-slate-200">{formatEur(finalNetTotal)}</span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2">
                  {onApplyToConsultation && (
                    <button
                      type="button"
                      onClick={handleApply}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>In Kunden-Beratung übernehmen</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#151c2c] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
                      title="Kalkulation als Text für E-Mails oder Angebote kopieren"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Kopieren</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#151c2c] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
                      title="Drucken / PDF-Vorschau generieren"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Drucken</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Werte zurücksetzen</span>
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#151c2c]/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>Stand: {new Date().toLocaleDateString('de-DE')}</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer transition-all"
            >
              Schließen
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
