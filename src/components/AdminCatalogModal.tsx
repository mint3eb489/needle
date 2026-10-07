import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, X, ChefHat, Home, PenTool, Megaphone, MapPin, 
  ChevronUp, ChevronDown, Trash2, Plus, RotateCcw,
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Tag, Palette, Check,
  CloudUpload, Cloud, Loader2, Calculator, Package, Ruler, Sparkles, Flame, Edit2, Save, PlusCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CustomCatalogOptions, StudioAddress, PriceGroupOption, AppliancePackageOption } from '../types';
import { DEFAULT_CUSTOM_CATALOG, DEFAULT_PRICE_GROUPS, DEFAULT_APPLIANCE_PACKAGES } from '../constants';
import { moveItemInArray } from '../utils/helpers';
import { inputClass, labelClass } from './ui/FormControls';

interface AdminCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  customCatalog: CustomCatalogOptions;
  saveCustomCatalog: (updated: CustomCatalogOptions) => Promise<void>;
  setToast: (toast: { show: boolean; message: string; type: string }) => void;
  currentStudioCoords: { lat: number; lon: number };
  lastCustomerCoords: { lat: number; lon: number } | null;
  calculateRouteToStudio: (studio: { lat: number; lon: number }, customer: { lat: number; lon: number }) => Promise<void>;
  activeApplianceConfig: Record<string, { label: string; options: string[] }>;
  activeManufacturers: string[];
  activeFrontMaterials: Record<string, string[]>;
  activeFrontColors?: Record<string, Record<string, string[]>>;
  activeFaucets: string[];
  activeWasteBins: string[];
  activeSources: string[];
  activeStudioAddress: StudioAddress;
}

export const AdminCatalogModal: React.FC<AdminCatalogModalProps> = ({
  isOpen,
  onClose,
  customCatalog,
  saveCustomCatalog,
  setToast,
  currentStudioCoords,
  lastCustomerCoords,
  calculateRouteToStudio,
  activeApplianceConfig,
  activeManufacturers,
  activeFrontMaterials,
  activeFrontColors,
  activeFaucets,
  activeWasteBins,
  activeSources,
  activeStudioAddress,
}) => {
  const [adminTab, setAdminTab] = useState<'appliances' | 'fronts' | 'accessories' | 'sources' | 'studio' | 'meterPricing'>('appliances');
  const [adminSelectedAppliance, setAdminSelectedAppliance] = useState<string>('kochfeld');
  const [adminNewApplianceOption, setAdminNewApplianceOption] = useState<string>('');
  const [adminSelectedManufacturer, setAdminSelectedManufacturer] = useState<string>('Ballerina');
  const [adminNewManufacturerName, setAdminNewManufacturerName] = useState<string>('');
  const [adminNewMaterialName, setAdminNewMaterialName] = useState<string>('');
  const [adminNewFaucetName, setAdminNewFaucetName] = useState<string>('');
  const [adminNewWasteBinName, setAdminNewWasteBinName] = useState<string>('');
  const [adminNewSourceName, setAdminNewSourceName] = useState<string>('');

  // Meter pricing state
  const activePriceGroups: PriceGroupOption[] = useMemo(() => {
    if (customCatalog.priceGroups && Array.isArray(customCatalog.priceGroups) && customCatalog.priceGroups.length > 0) {
      return customCatalog.priceGroups;
    }
    return DEFAULT_PRICE_GROUPS;
  }, [customCatalog.priceGroups]);

  const activeAppliancePackages: AppliancePackageOption[] = useMemo(() => {
    if (customCatalog.appliancePackages && Array.isArray(customCatalog.appliancePackages) && customCatalog.appliancePackages.length > 0) {
      return customCatalog.appliancePackages;
    }
    return DEFAULT_APPLIANCE_PACKAGES;
  }, [customCatalog.appliancePackages]);

  const [newPgName, setNewPgName] = useState<string>('');
  const [newPgPrice, setNewPgPrice] = useState<string>('');
  const [newPgDesc, setNewPgDesc] = useState<string>('');
  const [editingPgId, setEditingPgId] = useState<string | null>(null);
  const [editPgName, setEditPgName] = useState<string>('');
  const [editPgPrice, setEditPgPrice] = useState<string>('');
  const [editPgDesc, setEditPgDesc] = useState<string>('');
  const [newPkgItemInput, setNewPkgItemInput] = useState<Record<string, string>>({});

  const handleCreatePriceGroup = () => {
    const trimmedName = newPgName.trim();
    const priceNum = parseFloat(newPgPrice.replace(',', '.')) || 0;
    if (!trimmedName) {
      setToast({ show: true, message: 'Bitte einen Namen für die Preisgruppe eingeben.', type: 'error' });
      return;
    }
    if (priceNum <= 0) {
      setToast({ show: true, message: 'Bitte einen gültigen Meterpreis (> 0 €) eingeben.', type: 'error' });
      return;
    }

    const newGroup: PriceGroupOption = {
      id: `pg-${Date.now()}`,
      name: trimmedName,
      pricePerMeter: priceNum,
      description: newPgDesc.trim() || undefined
    };

    const updatedGroups = [...activePriceGroups, newGroup];
    saveCustomCatalog({
      ...customCatalog,
      priceGroups: updatedGroups
    });

    setNewPgName('');
    setNewPgPrice('');
    setNewPgDesc('');
    setToast({ show: true, message: `Preisgruppe "${trimmedName}" erfolgreich hinzugefügt!`, type: 'success' });
  };

  const handleStartEditPriceGroup = (pg: PriceGroupOption) => {
    setEditingPgId(pg.id);
    setEditPgName(pg.name);
    setEditPgPrice(String(pg.pricePerMeter));
    setEditPgDesc(pg.description || '');
  };

  const handleSaveEditPriceGroup = (id: string) => {
    const trimmedName = editPgName.trim();
    const priceNum = parseFloat(editPgPrice.replace(',', '.')) || 0;
    if (!trimmedName) return;

    const updated = activePriceGroups.map(pg => {
      if (pg.id === id) {
        return {
          ...pg,
          name: trimmedName,
          pricePerMeter: priceNum > 0 ? priceNum : pg.pricePerMeter,
          description: editPgDesc.trim() || undefined
        };
      }
      return pg;
    });

    saveCustomCatalog({
      ...customCatalog,
      priceGroups: updated
    });
    setEditingPgId(null);
    setToast({ show: true, message: 'Preisgruppe aktualisiert!', type: 'success' });
  };

  const handleDeletePriceGroup = (id: string, name: string) => {
    if (activePriceGroups.length <= 1) {
      setToast({ show: true, message: 'Mindestens eine Preisgruppe muss vorhanden sein.', type: 'error' });
      return;
    }
    const filtered = activePriceGroups.filter(pg => pg.id !== id);
    saveCustomCatalog({
      ...customCatalog,
      priceGroups: filtered
    });
    setToast({ show: true, message: `Preisgruppe "${name}" gelöscht.`, type: 'success' });
  };

  const handleMovePriceGroup = (idx: number, direction: 'up' | 'down') => {
    const reordered = moveItemInArray(activePriceGroups, idx, direction);
    saveCustomCatalog({
      ...customCatalog,
      priceGroups: reordered
    });
  };

  const handleResetPriceGroups = () => {
    if (window.confirm('Möchten Sie die Preisgruppen auf den Standard (PG 1 bis PG 8) zurücksetzen?')) {
      saveCustomCatalog({
        ...customCatalog,
        priceGroups: DEFAULT_PRICE_GROUPS
      });
      setToast({ show: true, message: 'Preisgruppen auf Standard zurückgesetzt.', type: 'success' });
    }
  };

  const handleUpdateAppliancePackage = (id: string, partial: Partial<AppliancePackageOption>) => {
    const updated = activeAppliancePackages.map(pkg => {
      if (pkg.id === id) {
        return { ...pkg, ...partial };
      }
      return pkg;
    });
    saveCustomCatalog({
      ...customCatalog,
      appliancePackages: updated
    });
  };

  const handleAddPackageItem = (pkgId: string) => {
    const val = (newPkgItemInput[pkgId] || '').trim();
    if (!val) return;
    const targetPkg = activeAppliancePackages.find(p => p.id === pkgId);
    if (!targetPkg) return;

    const currentItems = targetPkg.items || [];
    const updatedItems = [...currentItems, val];
    handleUpdateAppliancePackage(pkgId, { items: updatedItems });
    setNewPkgItemInput(prev => ({ ...prev, [pkgId]: '' }));
  };

  const handleRemovePackageItem = (pkgId: string, itemIdx: number) => {
    const targetPkg = activeAppliancePackages.find(p => p.id === pkgId);
    if (!targetPkg || !targetPkg.items) return;
    const updatedItems = targetPkg.items.filter((_, i) => i !== itemIdx);
    handleUpdateAppliancePackage(pkgId, { items: updatedItems });
  };

  const handleResetAppliancePackages = () => {
    if (window.confirm('Möchten Sie die 3 Geräte-Pakete auf die Standard-Werte zurücksetzen?')) {
      saveCustomCatalog({
        ...customCatalog,
        appliancePackages: DEFAULT_APPLIANCE_PACKAGES
      });
      setToast({ show: true, message: 'Geräte-Pakete auf Standard zurückgesetzt.', type: 'success' });
    }
  };

  // CSV / XLSX Upload & Import state
  const [importFileName, setImportFileName] = useState<string>('');
  const [importManufacturer, setImportManufacturer] = useState<string>('');
  const [importParsedData, setImportParsedData] = useState<Record<string, Record<string, string[]>> | null>(null);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [newColorInputs, setNewColorInputs] = useState<Record<string, string>>({});
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({});

  const toggleModelExpanded = (model: string) => {
    setExpandedModels(prev => ({
      ...prev,
      [model]: !prev[model]
    }));
  };

  const toggleAllModelsExpanded = (models: string[]) => {
    const allExpanded = models.every(m => expandedModels[m]);
    const newState: Record<string, boolean> = {};
    models.forEach(m => {
      newState[m] = !allExpanded;
    });
    setExpandedModels(prev => ({ ...prev, ...newState }));
  };

  // Helper for case-insensitive lookup of selected manufacturer key in active objects
  const selectedManufacturerKey = useMemo(() => {
    if (!adminSelectedManufacturer) return '';
    const fm = customCatalog.frontMaterials || {};
    const foundKey = Object.keys(fm).find(k => k.trim().toLowerCase() === adminSelectedManufacturer.trim().toLowerCase());
    if (foundKey) return foundKey;
    const activeKey = Object.keys(activeFrontMaterials || {}).find(k => k.trim().toLowerCase() === adminSelectedManufacturer.trim().toLowerCase());
    return activeKey || adminSelectedManufacturer;
  }, [adminSelectedManufacturer, customCatalog.frontMaterials, activeFrontMaterials]);

  const handleSaveToFirebase = async () => {
    setIsSavingCloud(true);
    try {
      await saveCustomCatalog(customCatalog);
      setToast({
        show: true,
        message: 'Katalog & Fronten erfolgreich in Firebase gespeichert!',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Firebase save error:', err);
      setToast({
        show: true,
        message: 'Fehler beim Speichern in Firebase: ' + (err?.message || 'Bitte Verbindung prüfen'),
        type: 'error'
      });
    } finally {
      setIsSavingCloud(false);
    }
  };

  const processImportFile = (file: File) => {
    setIsParsingFile(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        if (!jsonRows || jsonRows.length === 0) {
          setToast({ show: true, message: 'Die hochgeladene Datei enthält keine Daten.', type: 'error' });
          setIsParsingFile(false);
          return;
        }

        let filenameNoExt = file.name.replace(/\.[^/.]+$/, '').trim();
        filenameNoExt = filenameNoExt.replace(/[-_]?(fronten|farben|katalog|table|tabelle)$/i, '').trim() || filenameNoExt;
        const autoManufacturer = filenameNoExt.charAt(0).toUpperCase() + filenameNoExt.slice(1);

        let mfrColIdx = -1;
        let frontColIdx = -1;
        let colorColIdx = -1;
        let headerRowIdx = -1;

        // Scan first 5 rows for header keywords
        for (let r = 0; r < Math.min(jsonRows.length, 5); r++) {
          const row = jsonRows[r];
          if (!Array.isArray(row)) continue;

          let foundMfr = -1;
          let foundFront = -1;
          let foundColor = -1;

          row.forEach((cell, idx) => {
            const str = String(cell || '').toLowerCase().trim();
            if (str.includes('hersteller') || str.includes('marke') || str.includes('brand') || str.includes('lieferant')) {
              foundMfr = idx;
            } else if (str.includes('front') || str.includes('modell') || str.includes('material') || str.includes('programm')) {
              foundFront = idx;
            } else if (str.includes('farb') || str.includes('color') || str.includes('bezeichnung') || str.includes('ton') || str.includes('ausführung') || str.includes('oberfläche')) {
              foundColor = idx;
            }
          });

          if (foundFront >= 0 || foundColor >= 0 || foundMfr >= 0) {
            headerRowIdx = r;
            mfrColIdx = foundMfr;
            frontColIdx = foundFront >= 0 ? foundFront : (foundMfr === 0 ? 1 : 0);
            colorColIdx = foundColor >= 0 ? foundColor : (frontColIdx === 0 ? 1 : 2);
            break;
          }
        }

        if (frontColIdx === -1) frontColIdx = 0;
        if (colorColIdx === -1) colorColIdx = 1;

        const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
        const parsedMap: Record<string, Record<string, string[]>> = {};

        for (let i = startRow; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || !Array.isArray(row)) continue;

          const rowMfr = (mfrColIdx >= 0 && row[mfrColIdx] != null) ? String(row[mfrColIdx]).trim() : '';
          const mName = rowMfr || autoManufacturer;

          const frontVal = row[frontColIdx] != null ? String(row[frontColIdx]).trim() : '';
          const colorVal = row[colorColIdx] != null ? String(row[colorColIdx]).trim() : '';

          if (!frontVal) continue;

          if (!parsedMap[mName]) {
            parsedMap[mName] = {};
          }
          if (!parsedMap[mName][frontVal]) {
            parsedMap[mName][frontVal] = [];
          }

          if (colorVal && !parsedMap[mName][frontVal].includes(colorVal)) {
            parsedMap[mName][frontVal].push(colorVal);
          }
        }

        if (Object.keys(parsedMap).length === 0) {
          setToast({ show: true, message: 'Keine gültigen Zeilen für Front und Farbe gefunden.', type: 'error' });
          setIsParsingFile(false);
          return;
        }

        setImportFileName(file.name);
        setImportManufacturer(autoManufacturer);
        setImportParsedData(parsedMap);

        const totalMfrs = Object.keys(parsedMap).length;
        const totalFronts = Object.values(parsedMap).reduce((s, fMap) => s + Object.keys(fMap).length, 0);

        setToast({ show: true, message: `Datei "${file.name}" eingelesen (${totalMfrs} Hersteller, ${totalFronts} Fronten). Bitte prüfen & importieren.`, type: 'success' });
      } catch (err) {
        console.error('File parsing error:', err);
        setToast({ show: true, message: 'Fehler beim Lesen der Datei. Bitte CSV oder XLSX verwenden.', type: 'error' });
      } finally {
        setIsParsingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const executeCatalogImport = async () => {
    if (!importParsedData || Object.keys(importParsedData).length === 0) return;

    let updatedManufacturers = [...activeManufacturers];
    const updatedFrontMaterials: Record<string, string[]> = { ...(customCatalog.frontMaterials || {}) };
    const updatedFrontColors: Record<string, Record<string, string[]>> = { ...(customCatalog.frontColors || {}) };

    let totalFrontsCount = 0;
    let totalColorsCount = 0;

    Object.entries(importParsedData).forEach(([mNameRaw, frontsMap]) => {
      const mName = (mNameRaw === importManufacturer ? importManufacturer.trim() : mNameRaw.trim()) || importManufacturer.trim();

      const existingMfr = updatedManufacturers.find(m => m.trim().toLowerCase() === mName.trim().toLowerCase());
      const targetMfr = existingMfr || mName;

      if (!existingMfr) {
        updatedManufacturers.push(targetMfr);
      }

      const frontsList = Object.keys(frontsMap);
      totalFrontsCount += frontsList.length;

      const existingFronts = updatedFrontMaterials[targetMfr] || [];
      const mergedFronts = Array.from(new Set([...existingFronts, ...frontsList]));
      updatedFrontMaterials[targetMfr] = mergedFronts;

      const existingColorsMap = updatedFrontColors[targetMfr] || {};
      const newColorsMap: Record<string, string[]> = { ...existingColorsMap };

      Object.entries(frontsMap).forEach(([fModel, colors]) => {
        const colorList = Array.isArray(colors) ? colors : [];
        totalColorsCount += colorList.length;
        const existingForModel = newColorsMap[fModel] || [];
        newColorsMap[fModel] = Array.from(new Set([...existingForModel, ...colorList]));
      });

      updatedFrontColors[targetMfr] = newColorsMap;
    });

    const updatedCatalog: CustomCatalogOptions = {
      ...customCatalog,
      manufacturers: updatedManufacturers,
      frontMaterials: updatedFrontMaterials,
      frontColors: updatedFrontColors,
    };

    try {
      await saveCustomCatalog(updatedCatalog);
      const firstMfr = Object.keys(importParsedData)[0] || importManufacturer;
      if (firstMfr) setAdminSelectedManufacturer(firstMfr);

      setToast({
        show: true,
        message: `Import erfolgreich & in Firebase gespeichert! ${Object.keys(importParsedData).length} Hersteller, ${totalFrontsCount} Frontmodelle, ${totalColorsCount} Farben.`,
        type: 'success',
      });

      setImportParsedData(null);
      setImportFileName('');
      setImportManufacturer('');
    } catch (err: any) {
      setToast({
        show: true,
        message: 'Fehler beim Speichern in Firebase: ' + (err?.message || 'Bitte "In Firebase speichern" erneut versuchen'),
        type: 'error',
      });
    }
  };

  const handleAddColorToModel = (model: string) => {
    const val = (newColorInputs[model] || '').trim();
    const mName = selectedManufacturerKey;
    if (!val || !mName) return;

    const currentColorsObj = customCatalog.frontColors?.[mName] || {};
    const currentList = currentColorsObj[model] || [];

    if (!currentList.includes(val)) {
      const updatedColorsMap = {
        ...currentColorsObj,
        [model]: [...currentList, val]
      };

      saveCustomCatalog({
        ...customCatalog,
        frontColors: {
          ...(customCatalog.frontColors || {}),
          [mName]: updatedColorsMap
        }
      });

      setNewColorInputs(prev => ({ ...prev, [model]: '' }));
      setToast({ show: true, message: `Farbe "${val}" zu Front "${model}" hinzugefügt.`, type: 'success' });
    }
  };

  const handleDeleteColorFromModel = (model: string, colorToDelete: string) => {
    const mName = selectedManufacturerKey;
    if (!mName) return;
    const currentColorsObj = customCatalog.frontColors?.[mName] || {};
    const currentList = currentColorsObj[model] || [];
    const updatedList = currentList.filter(c => c !== colorToDelete);

    saveCustomCatalog({
      ...customCatalog,
      frontColors: {
        ...(customCatalog.frontColors || {}),
        [mName]: {
          ...currentColorsObj,
          [model]: updatedList
        }
      }
    });

    setToast({ show: true, message: `Farbe "${colorToDelete}" gelöscht.`, type: 'success' });
  };

  // Admin Studio Address Edit State
  const [adminStudioName, setAdminStudioName] = useState<string>('');
  const [adminStudioStreet, setAdminStudioStreet] = useState<string>('');
  const [adminStudioHouseNumber, setAdminStudioHouseNumber] = useState<string>('');
  const [adminStudioZipCode, setAdminStudioZipCode] = useState<string>('');
  const [adminStudioCity, setAdminStudioCity] = useState<string>('');
  const [isGeocodingStudio, setIsGeocodingStudio] = useState<boolean>(false);

  // Sync admin studio state when customCatalog changes or modal opens
  useEffect(() => {
    const currentStudio = customCatalog.studioAddress || DEFAULT_CUSTOM_CATALOG.studioAddress!;
    setAdminStudioName(currentStudio.name || '');
    setAdminStudioStreet(currentStudio.street || '');
    setAdminStudioHouseNumber(currentStudio.houseNumber || '');
    setAdminStudioZipCode(currentStudio.zipCode || '');
    setAdminStudioCity(currentStudio.city || '');
  }, [customCatalog.studioAddress, isOpen]);

  // Save studio address and calculate geocoordinates
  const handleSaveStudioAddress = async () => {
    if (!adminStudioStreet.trim() || !adminStudioCity.trim()) {
      setToast({ show: true, message: 'Bitte geben Sie Straße und Ort für Ihr Studio ein.', type: 'error' });
      return;
    }

    setIsGeocodingStudio(true);
    let resolvedLat = currentStudioCoords.lat;
    let resolvedLon = currentStudioCoords.lon;

    const query = `${adminStudioStreet.trim()} ${adminStudioHouseNumber.trim()}, ${adminStudioZipCode.trim()} ${adminStudioCity.trim()}, Germany`.trim();

    try {
      const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
      if (photonRes.ok) {
        const photonData = await photonRes.json();
        if (photonData?.features?.[0]?.geometry?.coordinates) {
          resolvedLon = photonData.features[0].geometry.coordinates[0];
          resolvedLat = photonData.features[0].geometry.coordinates[1];
        } else {
          throw new Error('Photon empty');
        }
      } else {
        throw new Error('Photon HTTP error');
      }
    } catch {
      try {
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (nomData && nomData.length > 0 && nomData[0].lat && nomData[0].lon) {
            resolvedLat = parseFloat(nomData[0].lat);
            resolvedLon = parseFloat(nomData[0].lon);
          }
        }
      } catch (e) {
        console.warn('Geocoding studio failed:', e);
      }
    }

    const updatedStudio: StudioAddress = {
      name: adminStudioName.trim() || 'Küchenstudio',
      street: adminStudioStreet.trim(),
      houseNumber: adminStudioHouseNumber.trim(),
      zipCode: adminStudioZipCode.trim(),
      city: adminStudioCity.trim(),
      lat: resolvedLat,
      lon: resolvedLon,
    };

    await saveCustomCatalog({
      ...customCatalog,
      studioAddress: updatedStudio
    });

    setIsGeocodingStudio(false);
    setToast({
      show: true,
      message: `Studio-Adresse (${updatedStudio.city}) gespeichert & geokodiert!`,
      type: 'success'
    });

    if (lastCustomerCoords) {
      calculateRouteToStudio({ lat: resolvedLat, lon: resolvedLon }, lastCustomerCoords);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-slate-900/70 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 modal-fade"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[82vh] max-h-[850px] min-h-[480px] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0b0f19]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Admin-Katalog & Optionen
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Tabs Bar */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0b0f19]/50 overflow-x-auto">
            <button
              type="button"
              onClick={() => setAdminTab('appliances')}
              className={`px-3 sm:px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                adminTab === 'appliances'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#151c2c]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 shrink-0" />
              <span>Elektrogeräte & Spüle</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('fronts')}
              className={`px-3 sm:px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                adminTab === 'fronts'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#151c2c]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span>Hersteller & Fronten</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('accessories')}
              className={`px-3 sm:px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                adminTab === 'accessories'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#151c2c]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 shrink-0" />
              <span>Armaturen & Zubehör</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('meterPricing')}
              className={`px-3 sm:px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                adminTab === 'meterPricing'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#151c2c]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 shrink-0" />
              <span>Meterpreise & Geräte-Pakete</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('sources')}
              className={`px-3 sm:px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                adminTab === 'sources'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#151c2c]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 shrink-0" />
              <span>Kundenquelle</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('studio')}
              className={`px-3 sm:px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                adminTab === 'studio'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#151c2c]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Studio-Adresse</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar text-left">
            {/* TAB 1: APPLIANCES */}
            {adminTab === 'appliances' && (
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Gerätetyp wählen</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(activeApplianceConfig).map(([key, config]: [string, { label: string; options: string[] }]) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setAdminSelectedAppliance(key)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          adminSelectedAppliance === key
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-[#0b0f19] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[#0b0f19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Optionen & Sortierung für "{activeApplianceConfig[adminSelectedAppliance]?.label}"
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {activeApplianceConfig[adminSelectedAppliance]?.options.length || 0} Optionen aktiv
                    </span>
                  </div>

                  {/* Compact Grid List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(activeApplianceConfig[adminSelectedAppliance]?.options || []).map((option, idx, arr) => (
                      <div 
                        key={option}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={option}>
                            {option}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const list = activeApplianceConfig[adminSelectedAppliance]?.options || [];
                              const reordered = moveItemInArray(list, idx, 'up');
                              saveCustomCatalog({
                                ...customCatalog,
                                appliances: {
                                  ...customCatalog.appliances,
                                  [adminSelectedAppliance]: reordered
                                }
                              });
                            }}
                            className={`p-1 rounded-lg border transition-all ${
                              idx === 0 
                                ? 'opacity-25 cursor-not-allowed border-transparent text-slate-400' 
                                : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 cursor-pointer'
                            }`}
                            title="Nach oben verschieben"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => {
                              const list = activeApplianceConfig[adminSelectedAppliance]?.options || [];
                              const reordered = moveItemInArray(list, idx, 'down');
                              saveCustomCatalog({
                                ...customCatalog,
                                appliances: {
                                  ...customCatalog.appliances,
                                  [adminSelectedAppliance]: reordered
                                }
                              });
                            }}
                            className={`p-1 rounded-lg border transition-all ${
                              idx === arr.length - 1 
                                ? 'opacity-25 cursor-not-allowed border-transparent text-slate-400' 
                                : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 cursor-pointer'
                            }`}
                            title="Nach unten verschieben"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const list = activeApplianceConfig[adminSelectedAppliance]?.options || [];
                              const filtered = list.filter((_, i) => i !== idx);
                              saveCustomCatalog({
                                ...customCatalog,
                                appliances: {
                                  ...customCatalog.appliances,
                                  [adminSelectedAppliance]: filtered
                                }
                              });
                              setToast({ show: true, message: `Option "${option}" gelöscht.`, type: 'success' });
                            }}
                            className="p-1 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                            title="Option löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex gap-2">
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="text"
                        value={adminNewApplianceOption}
                        onChange={(e) => setAdminNewApplianceOption(e.target.value)}
                        placeholder={`Neue Option für ${activeApplianceConfig[adminSelectedAppliance]?.label} eingeben...`}
                        className={`${inputClass} flex-1 ${adminNewApplianceOption ? 'pr-9' : ''}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!adminNewApplianceOption.trim()) return;
                            const val = adminNewApplianceOption.trim();
                            const list = activeApplianceConfig[adminSelectedAppliance]?.options || [];
                            if (!list.includes(val)) {
                              saveCustomCatalog({
                                ...customCatalog,
                                appliances: {
                                  ...customCatalog.appliances,
                                  [adminSelectedAppliance]: [...list, val]
                                }
                              });
                              setAdminNewApplianceOption('');
                              setToast({ show: true, message: `Option "${val}" hinzugefügt.`, type: 'success' });
                            }
                          }
                        }}
                      />
                      {Boolean(adminNewApplianceOption) && (
                        <button
                          type="button"
                          onClick={() => setAdminNewApplianceOption('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                          title="Zeile leeren"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!adminNewApplianceOption.trim()) return;
                        const val = adminNewApplianceOption.trim();
                        const list = activeApplianceConfig[adminSelectedAppliance]?.options || [];
                        if (!list.includes(val)) {
                          saveCustomCatalog({
                            ...customCatalog,
                            appliances: {
                              ...customCatalog.appliances,
                              [adminSelectedAppliance]: [...list, val]
                            }
                          });
                          setAdminNewApplianceOption('');
                          setToast({ show: true, message: `Option "${val}" hinzugefügt.`, type: 'success' });
                        }
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Hinzufügen</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FRONTS & MANUFACTURERS */}
            {adminTab === 'fronts' && (
              <div className="space-y-6">
                
                {/* 0. FILE UPLOAD CARD (CSV / XLSX IMPORT) */}
                <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-indigo-950/40 p-4 sm:p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          Datei-Import für hersteller & fronten (CSV / Excel / Sheets)
                          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                            Neu
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Der Dateiname (z.B. <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">Ballerina.xlsx</code>) bestimmt den Herstellernamen. Nach dem Import klicken Sie unten auf <strong className="text-indigo-600 dark:text-indigo-400 font-bold">"In Firebase speichern"</strong>, um die Daten dauerhaft in der Cloud zu sichern.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upload Dropzone */}
                  {!importParsedData ? (
                    <div className="relative border-2 border-dashed border-indigo-300 dark:border-indigo-700/70 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white/60 dark:bg-[#151c2c]/60 rounded-xl p-4 text-center transition-all cursor-pointer group">
                      <input 
                        type="file" 
                        accept=".csv, .xlsx, .xls, .ods, .tsv" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processImportFile(file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {isParsingFile ? (
                            <span className="text-indigo-600 dark:text-indigo-400 animate-pulse">Datei wird analysiert...</span>
                          ) : (
                            <span>CSV oder Excel-Datei (.xlsx, .xls, .csv) hierher ziehen oder klicken</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Spalten: Front | Farbe (z.B. TOP | Kristallweiß Matt)
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Import Live Preview Panel */
                    <div className="bg-white dark:bg-[#151c2c] p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Vorschau für "{importFileName}"
                            </span>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{Object.values(importParsedData).reduce((s: number, fMap) => s + Object.keys(fMap || {}).length, 0)} Frontmodelle</span>
                              <span>•</span>
                              <span>{Object.values(importParsedData).reduce((s: number, fMap) => s + Object.values(fMap || {}).reduce((cSum: number, colors) => cSum + (Array.isArray(colors) ? colors.length : 0), 0), 0)} Farben insgesamt</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setImportParsedData(null);
                              setImportFileName('');
                              setImportManufacturer('');
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                          >
                            Abbrechen
                          </button>
                          <button
                            type="button"
                            onClick={executeCatalogImport}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Import durchführen & Speichern</span>
                          </button>
                        </div>
                      </div>

                      {/* Editable Manufacturer Name */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                          Hersteller-Name:
                        </label>
                        <input
                          type="text"
                          value={importManufacturer}
                          onChange={(e) => setImportManufacturer(e.target.value)}
                          placeholder="Herstellername anpassen..."
                          className={`${inputClass} max-w-xs`}
                        />
                      </div>

                      {/* Parsed models and colors list preview */}
                      <div className="max-h-56 overflow-y-auto space-y-3 pr-1 custom-scrollbar border border-slate-100 dark:border-slate-800/60 p-2.5 rounded-xl bg-slate-50/50 dark:bg-[#0b0f19]/50">
                        {Object.entries(importParsedData).map(([mName, frontsMap]) => {
                          const displayName = mName === importManufacturer ? (importManufacturer || mName) : mName;
                          return (
                            <div key={mName} className="space-y-1.5">
                              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider px-1">
                                Hersteller: {displayName}
                              </div>
                              {Object.entries(frontsMap).map(([frontModel, colors]) => {
                                const colorList = Array.isArray(colors) ? colors : [];
                                return (
                                  <div key={frontModel} className="bg-white dark:bg-[#151c2c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between mb-1.5">
                                      <span className="flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-indigo-500" />
                                        Frontmodell: <span className="text-indigo-600 dark:text-indigo-400">{frontModel}</span>
                                      </span>
                                      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                        {colorList.length} Farben
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {colorList.map(c => (
                                        <span key={c} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold border border-slate-200 dark:border-slate-700">
                                          {c}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-[#0b0f19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      1. Küchenhersteller (Reihenfolge & Verwaltung)
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {activeManufacturers.length} Hersteller
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activeManufacturers.map((m, idx, arr) => (
                      <div 
                        key={m}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 shadow-2xs transition-all ${
                          adminSelectedManufacturer === m
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                            : 'bg-white dark:bg-[#151c2c] border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div 
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                          onClick={() => setAdminSelectedManufacturer(m)}
                        >
                          <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className={`text-xs font-bold ${adminSelectedManufacturer === m ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {m}
                          </span>
                          {adminSelectedManufacturer === m && (
                            <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0">
                              Ausgewählt
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const reordered = moveItemInArray(activeManufacturers, idx, 'up');
                              saveCustomCatalog({
                                ...customCatalog,
                                manufacturers: reordered
                              });
                            }}
                            className={`p-1 rounded-lg border transition-all ${
                              idx === 0 
                                ? 'opacity-30 cursor-not-allowed border-transparent text-slate-400' 
                                : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 cursor-pointer'
                            }`}
                            title="Nach oben verschieben"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => {
                              const reordered = moveItemInArray(activeManufacturers, idx, 'down');
                              saveCustomCatalog({
                                ...customCatalog,
                                manufacturers: reordered
                              });
                            }}
                            className={`p-1 rounded-lg border transition-all ${
                              idx === arr.length - 1 
                                ? 'opacity-30 cursor-not-allowed border-transparent text-slate-400' 
                                : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 cursor-pointer'
                            }`}
                            title="Nach unten verschieben"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const filtered = activeManufacturers.filter((_, i) => i !== idx);
                              const updatedFronts = { ...(customCatalog.frontMaterials || {}) };
                              delete updatedFronts[m];
                              saveCustomCatalog({
                                ...customCatalog,
                                manufacturers: filtered,
                                frontMaterials: updatedFronts
                              });
                              if (adminSelectedManufacturer === m) {
                                setAdminSelectedManufacturer(filtered[0] || '');
                              }
                              setToast({ show: true, message: `Hersteller "${m}" gelöscht.`, type: 'success' });
                            }}
                            className="p-1 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                            title="Hersteller löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex gap-2">
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="text"
                        value={adminNewManufacturerName}
                        onChange={(e) => setAdminNewManufacturerName(e.target.value)}
                        placeholder="Neuer Küchenhersteller (z.B. Nobilia, Schüller)..."
                        className={`${inputClass} flex-1 ${adminNewManufacturerName ? 'pr-9' : ''}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!adminNewManufacturerName.trim()) return;
                            const name = adminNewManufacturerName.trim();
                            if (!activeManufacturers.includes(name)) {
                              const newFronts = {
                                ...(customCatalog.frontMaterials || {}),
                                [name]: []
                              };
                              saveCustomCatalog({
                                ...customCatalog,
                                manufacturers: [...activeManufacturers, name],
                                frontMaterials: newFronts
                              });
                              setAdminSelectedManufacturer(name);
                              setAdminNewManufacturerName('');
                              setToast({ show: true, message: `Hersteller "${name}" hinzugefügt.`, type: 'success' });
                            }
                          }
                        }}
                      />
                      {Boolean(adminNewManufacturerName) && (
                        <button
                          type="button"
                          onClick={() => setAdminNewManufacturerName('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                          title="Zeile leeren"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!adminNewManufacturerName.trim()) return;
                        const name = adminNewManufacturerName.trim();
                        if (!activeManufacturers.includes(name)) {
                          const newFronts = {
                            ...(customCatalog.frontMaterials || {}),
                            [name]: []
                          };
                          saveCustomCatalog({
                            ...customCatalog,
                            manufacturers: [...activeManufacturers, name],
                            frontMaterials: newFronts
                          });
                          setAdminSelectedManufacturer(name);
                          setAdminNewManufacturerName('');
                          setToast({ show: true, message: `Hersteller "${name}" hinzugefügt.`, type: 'success' });
                        }
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Hersteller anlegen</span>
                    </button>
                  </div>
                </div>

                {adminSelectedManufacturer && (
                  <div className="bg-slate-50 dark:bg-[#0b0f19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          2. Frontmaterialien & Farben für "{adminSelectedManufacturer}"
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {(activeFrontMaterials[adminSelectedManufacturer] || []).length} Frontmodelle
                        </span>
                      </div>

                      {/* Expand / Collapse All */}
                      {(activeFrontMaterials[adminSelectedManufacturer] || []).length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleAllModelsExpanded(activeFrontMaterials[adminSelectedManufacturer] || [])}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#151c2c] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                        >
                          {(activeFrontMaterials[adminSelectedManufacturer] || []).every(m => expandedModels[m])
                            ? 'Alle einklappen'
                            : 'Alle ausklappen'}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {(activeFrontMaterials[adminSelectedManufacturer] || []).map((mat, idx, arr) => {
                        const colorsForMat = (
                          customCatalog.frontColors?.[adminSelectedManufacturer]?.[mat] || []
                        );
                        const isExpanded = !!expandedModels[mat];

                        return (
                          <div 
                            key={mat}
                            className="rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-all"
                          >
                            {/* Clickable Header for Front Model */}
                            <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <div 
                                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                                onClick={() => toggleModelExpanded(mat)}
                              >
                                <button
                                  type="button"
                                  className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center shrink-0 transition-transform"
                                  title={isExpanded ? 'Farben einklappen' : 'Farben ausklappen'}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {mat}
                                </span>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-0.5 rounded-full font-mono font-semibold shrink-0">
                                  <span className="sm:hidden">{colorsForMat.length}</span>
                                  <span className="hidden sm:inline">{colorsForMat.length} {colorsForMat.length === 1 ? 'Farbe' : 'Farben'}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const list = activeFrontMaterials[adminSelectedManufacturer] || [];
                                    const filtered = list.filter((_, i) => i !== idx);
                                    saveCustomCatalog({
                                      ...customCatalog,
                                      frontMaterials: {
                                        ...(customCatalog.frontMaterials || {}),
                                        [adminSelectedManufacturer]: filtered
                                      }
                                    });
                                    setToast({ show: true, message: `Material "${mat}" gelöscht.`, type: 'success' });
                                  }}
                                  className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                                  title="Frontmodell löschen"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Collapsible Color Pills & Add Color input for this model */}
                            {isExpanded && (
                              <div className="p-3 sm:p-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-[#0b0f19]/30 space-y-2.5">
                                <div className="flex flex-wrap gap-1.5 items-center min-h-[28px]">
                                  {colorsForMat.length === 0 && (
                                    <span className="text-[11px] text-slate-400 italic">Noch keine Farben hinterlegt.</span>
                                  )}
                                  {colorsForMat.map((color) => (
                                    <span 
                                      key={color} 
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                                    >
                                      <Palette className="w-3 h-3 text-indigo-500" />
                                      <span>{color}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteColorFromModel(mat, color)}
                                        className="ml-0.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer p-0.5 rounded"
                                        title="Farbe entfernen"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>

                                {/* Inline add color to model */}
                                <div className="flex gap-2 items-center pt-1">
                                  <input
                                    type="text"
                                    value={newColorInputs[mat] || ''}
                                    onChange={(e) => setNewColorInputs(prev => ({ ...prev, [mat]: e.target.value }))}
                                    placeholder={`Neue Farbe für ${mat} eingeben...`}
                                    className={`${inputClass} text-xs py-1.5 flex-1 bg-white dark:bg-[#151c2c]`}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddColorToModel(mat);
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddColorToModel(mat)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Farbe</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="text"
                          value={adminNewMaterialName}
                          onChange={(e) => setAdminNewMaterialName(e.target.value)}
                          placeholder={`Neues Frontmaterial für ${adminSelectedManufacturer}...`}
                          className={`${inputClass} flex-1 ${adminNewMaterialName ? 'pr-9' : ''}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (!adminNewMaterialName.trim()) return;
                              const val = adminNewMaterialName.trim();
                              const list = activeFrontMaterials[adminSelectedManufacturer] || [];
                              if (!list.includes(val)) {
                                saveCustomCatalog({
                                  ...customCatalog,
                                  frontMaterials: {
                                    ...(customCatalog.frontMaterials || {}),
                                    [adminSelectedManufacturer]: [...list, val]
                                  }
                                });
                                setAdminNewMaterialName('');
                                setToast({ show: true, message: `Material "${val}" hinzugefügt.`, type: 'success' });
                              }
                            }
                          }}
                        />
                        {Boolean(adminNewMaterialName) && (
                          <button
                            type="button"
                            onClick={() => setAdminNewMaterialName('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                            title="Zeile leeren"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!adminNewMaterialName.trim()) return;
                          const val = adminNewMaterialName.trim();
                          const list = activeFrontMaterials[adminSelectedManufacturer] || [];
                          if (!list.includes(val)) {
                            saveCustomCatalog({
                              ...customCatalog,
                              frontMaterials: {
                                ...(customCatalog.frontMaterials || {}),
                                [adminSelectedManufacturer]: [...list, val]
                              }
                            });
                            setAdminNewMaterialName('');
                            setToast({ show: true, message: `Material "${val}" hinzugefügt.`, type: 'success' });
                          }
                        }}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Frontmodell anlegen</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ACCESSORIES & FAUCETS */}
            {adminTab === 'accessories' && (
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-[#0b0f19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Armaturen / Spezialarmaturen (Reihenfolge & Optionen)
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {activeFaucets.length} Optionen
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {activeFaucets.map((faucet, idx, arr) => (
                      <div 
                        key={faucet}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={faucet}>
                            {faucet}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const reordered = moveItemInArray(activeFaucets, idx, 'up');
                              saveCustomCatalog({
                                ...customCatalog,
                                faucets: reordered
                              });
                            }}
                            className={`p-1 rounded-lg border transition-all ${
                              idx === 0 
                                ? 'opacity-25 cursor-not-allowed border-transparent text-slate-400' 
                                : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 cursor-pointer'
                            }`}
                            title="Nach oben verschieben"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => {
                              const reordered = moveItemInArray(activeFaucets, idx, 'down');
                              saveCustomCatalog({
                                ...customCatalog,
                                faucets: reordered
                              });
                            }}
                            className={`p-1 rounded-lg border transition-all ${
                              idx === arr.length - 1 
                                ? 'opacity-25 cursor-not-allowed border-transparent text-slate-400' 
                                : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 cursor-pointer'
                            }`}
                            title="Nach unten verschieben"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const filtered = activeFaucets.filter((_, i) => i !== idx);
                              saveCustomCatalog({
                                ...customCatalog,
                                faucets: filtered
                              });
                              setToast({ show: true, message: `Armatur "${faucet}" gelöscht.`, type: 'success' });
                            }}
                            className="p-1 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                            title="Armatur löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex gap-2">
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="text"
                        value={adminNewFaucetName}
                        onChange={(e) => setAdminNewFaucetName(e.target.value)}
                        placeholder="Neue Armatur (z.B. Grohe Blue, Dornbracht)..."
                        className={`${inputClass} flex-1 ${adminNewFaucetName ? 'pr-9' : ''}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!adminNewFaucetName.trim()) return;
                            const val = adminNewFaucetName.trim();
                            if (!activeFaucets.includes(val)) {
                              saveCustomCatalog({
                                ...customCatalog,
                                faucets: [...activeFaucets, val]
                              });
                              setAdminNewFaucetName('');
                              setToast({ show: true, message: `Armatur "${val}" hinzugefügt.`, type: 'success' });
                            }
                          }
                        }}
                      />
                      {Boolean(adminNewFaucetName) && (
                        <button
                          type="button"
                          onClick={() => setAdminNewFaucetName('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                          title="Zeile leeren"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!adminNewFaucetName.trim()) return;
                        const val = adminNewFaucetName.trim();
                        if (!activeFaucets.includes(val)) {
                          saveCustomCatalog({
                            ...customCatalog,
                            faucets: [...activeFaucets, val]
                          });
                          setAdminNewFaucetName('');
                          setToast({ show: true, message: `Armatur "${val}" hinzugefügt.`, type: 'success' });
                        }
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Hinzufügen</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[#0b0f19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Abfallsammler / Müllsysteme (Reihenfolge & Optionen)
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {activeWasteBins.length} Optionen
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {activeWasteBins.map((bin, idx, arr) => (
                      <div 
                        key={bin}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={bin}>
                            {bin}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const reordered = moveItemInArray(activeWasteBins, idx, 'up');
                              saveCustomCatalog({
                                ...customCatalog,
                                wasteBins: reordered
                              });
                            }}
                            className={`p-1 rounded-lg border transition-all ${
                              idx === 0 
                                ? 'opacity-25 cursor-not-allowed border-transparent text-slate-400' 
                                : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 cursor-pointer'
                            }`}
                            title="Nach oben verschieben"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => {
                              const reordered = moveItemInArray(activeWasteBins, idx, 'down');
                              saveCustomCatalog({
                                ...customCatalog,
                                wasteBins: reordered
                              });
                            }}
                            className={`p-1 rounded-lg border transition-all ${
                              idx === arr.length - 1 
                                ? 'opacity-25 cursor-not-allowed border-transparent text-slate-400' 
                                : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 cursor-pointer'
                            }`}
                            title="Nach unten verschieben"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const filtered = activeWasteBins.filter((_, i) => i !== idx);
                              saveCustomCatalog({
                                ...customCatalog,
                                wasteBins: filtered
                              });
                              setToast({ show: true, message: `Müllsystem "${bin}" gelöscht.`, type: 'success' });
                            }}
                            className="p-1 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                            title="Müllsystem löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex gap-2">
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="text"
                        value={adminNewWasteBinName}
                        onChange={(e) => setAdminNewWasteBinName(e.target.value)}
                        placeholder="Neues Müllsystem (z.B. Hailo Cargo Synchro, Blanco Select)..."
                        className={`${inputClass} flex-1 ${adminNewWasteBinName ? 'pr-9' : ''}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!adminNewWasteBinName.trim()) return;
                            const val = adminNewWasteBinName.trim();
                            if (!activeWasteBins.includes(val)) {
                              saveCustomCatalog({
                                ...customCatalog,
                                wasteBins: [...activeWasteBins, val]
                              });
                              setAdminNewWasteBinName('');
                              setToast({ show: true, message: `Müllsystem "${val}" hinzugefügt.`, type: 'success' });
                            }
                          }
                        }}
                      />
                      {Boolean(adminNewWasteBinName) && (
                        <button
                          type="button"
                          onClick={() => setAdminNewWasteBinName('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                          title="Zeile leeren"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!adminNewWasteBinName.trim()) return;
                        const val = adminNewWasteBinName.trim();
                        if (!activeWasteBins.includes(val)) {
                          saveCustomCatalog({
                            ...customCatalog,
                            wasteBins: [...activeWasteBins, val]
                          });
                          setAdminNewWasteBinName('');
                          setToast({ show: true, message: `Müllsystem "${val}" hinzugefügt.`, type: 'success' });
                        }
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Hinzufügen</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SOURCES / KUNDENQUELLE */}
            {adminTab === 'sources' && (
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-[#0b0f19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      "Wie haben Sie zu uns gefunden?" (Optionen & Reihenfolge)
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {activeSources.length} Optionen
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {activeSources.map((source, idx, arr) => (
                      <div 
                        key={source}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={source}>
                            {source}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const reordered = moveItemInArray(activeSources, idx, 'up');
                              saveCustomCatalog({
                                ...customCatalog,
                                sources: reordered
                              });
                            }}
                            className={`p-1 rounded-lg border transition-all ${
                              idx === 0 
                                ? 'opacity-25 cursor-not-allowed border-transparent text-slate-400' 
                                : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 cursor-pointer'
                            }`}
                            title="Nach oben verschieben"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => {
                              const reordered = moveItemInArray(activeSources, idx, 'down');
                              saveCustomCatalog({
                                ...customCatalog,
                                sources: reordered
                              });
                            }}
                            className={`p-1 rounded-lg border transition-all ${
                              idx === arr.length - 1 
                                ? 'opacity-25 cursor-not-allowed border-transparent text-slate-400' 
                                : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 cursor-pointer'
                            }`}
                            title="Nach unten verschieben"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const filtered = activeSources.filter((_, i) => i !== idx);
                              saveCustomCatalog({
                                ...customCatalog,
                                sources: filtered
                              });
                              setToast({ show: true, message: `Option "${source}" gelöscht.`, type: 'success' });
                            }}
                            className="p-1 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                            title="Option löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex gap-2">
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="text"
                        value={adminNewSourceName}
                        onChange={(e) => setAdminNewSourceName(e.target.value)}
                        placeholder="Neue Kundenquelle (z.B. Google Suche, Messe, Flyer, Schaufenster)..."
                        className={`${inputClass} flex-1 ${adminNewSourceName ? 'pr-9' : ''}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!adminNewSourceName.trim()) return;
                            const val = adminNewSourceName.trim();
                            if (!activeSources.includes(val)) {
                              saveCustomCatalog({
                                ...customCatalog,
                                sources: [...activeSources, val]
                              });
                              setAdminNewSourceName('');
                              setToast({ show: true, message: `Option "${val}" hinzugefügt.`, type: 'success' });
                            }
                          }
                        }}
                      />
                      {Boolean(adminNewSourceName) && (
                        <button
                          type="button"
                          onClick={() => setAdminNewSourceName('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                          title="Zeile leeren"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!adminNewSourceName.trim()) return;
                        const val = adminNewSourceName.trim();
                        if (!activeSources.includes(val)) {
                          saveCustomCatalog({
                            ...customCatalog,
                            sources: [...activeSources, val]
                          });
                          setAdminNewSourceName('');
                          setToast({ show: true, message: `Option "${val}" hinzugefügt.`, type: 'success' });
                        }
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Hinzufügen</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: STUDIO ADRESSE */}
            {adminTab === 'studio' && (
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-[#0b0f19] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Studio-Adresse & Startpunkt für Anfahrtsberechnung
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Geo-Aktiv
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Hinterlegen Sie die Adresse Ihres Küchenstudios. Das System ermittelt automatisch die Geokoordinaten und berechnet damit bei jeder Kundenberatung exakt die Fahrzeit und Entfernung (in km).
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Studio / Firmenname</label>
                      <input
                        type="text"
                        value={adminStudioName}
                        onChange={(e) => setAdminStudioName(e.target.value)}
                        placeholder="z.B. Küchenstudio Balingen"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Straße</label>
                      <input
                        type="text"
                        value={adminStudioStreet}
                        onChange={(e) => setAdminStudioStreet(e.target.value)}
                        placeholder="z.B. Balinger Str."
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Hausnummer</label>
                      <input
                        type="text"
                        value={adminStudioHouseNumber}
                        onChange={(e) => setAdminStudioHouseNumber(e.target.value)}
                        placeholder="z.B. 12/1"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>PLZ</label>
                      <input
                        type="text"
                        value={adminStudioZipCode}
                        onChange={(e) => setAdminStudioZipCode(e.target.value)}
                        placeholder="z.B. 72336"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Ort</label>
                      <input
                        type="text"
                        value={adminStudioCity}
                        onChange={(e) => setAdminStudioCity(e.target.value)}
                        placeholder="z.B. Balingen"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Berechnete Geokoordinaten
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        Lat: {currentStudioCoords.lat.toFixed(6)}, Lon: {currentStudioCoords.lon.toFixed(6)}
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Gespeicherter Startort
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {activeStudioAddress.name || 'Küchenstudio'} ({activeStudioAddress.zipCode} {activeStudioAddress.city})
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={isGeocodingStudio}
                      onClick={handleSaveStudioAddress}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>
                        {isGeocodingStudio ? 'Geokodierung läuft...' : 'Adresse speichern & Geokoordinaten ermitteln'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: METERPRICING & GERÄTE-PAKETE */}
            {adminTab === 'meterPricing' && (
              <div className="space-y-8">
                {/* Intro Info Banner */}
                <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex items-start gap-3">
                  <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                    <p className="font-bold text-sm">
                      Kalkulationsbasis für den Meterpreis-Rechner
                    </p>
                    <p className="text-indigo-700/90 dark:text-indigo-300/80 leading-relaxed">
                      Hier hinterlegen Sie die Meterpreise je Preisgruppe (PG) sowie die 3 festen Geräte-Pakete und Standard-Montagesätze. Diese Werte werden direkt in den Meterpreis-Rechner übernommen und können für schnelle Vorkalkulationen genutzt werden.
                    </p>
                  </div>
                </div>

                {/* SECTION 1: PREISGRUPPEN (METERPREISE) */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Meterpreise je Preisgruppe (PG)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Definieren Sie für jede Preisgruppe den Preis pro laufendem Meter (€/m).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetPriceGroups}
                      className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Standard-PG wiederherstellen</span>
                    </button>
                  </div>

                  {/* Add New PG Form */}
                  <div className="p-4 bg-slate-50 dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                      Neue Preisgruppe anlegen
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-7">
                        <label className={labelClass}>Name / Bezeichnung</label>
                        <input
                          type="text"
                          value={newPgName}
                          onChange={(e) => setNewPgName(e.target.value)}
                          placeholder="z.B. PG 9 - Exklusiv"
                          className={inputClass}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className={labelClass}>Meterpreis (€ / m)</label>
                        <input
                          type="number"
                          step="10"
                          value={newPgPrice}
                          onChange={(e) => setNewPgPrice(e.target.value)}
                          placeholder="z.B. 2150"
                          className={inputClass}
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-end">
                        <button
                          type="button"
                          onClick={handleCreatePriceGroup}
                          className="w-full h-[42px] px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Hinzufügen</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List of Price Groups */}
                  <div className="space-y-2">
                    {activePriceGroups.map((pg, idx) => (
                      <div
                        key={pg.id}
                        className="p-3.5 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                      >
                        {editingPgId === pg.id ? (
                          <div className="w-full grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <div className="sm:col-span-6">
                              <input
                                type="text"
                                value={editPgName}
                                onChange={(e) => setEditPgName(e.target.value)}
                                className={inputClass}
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <div className="relative">
                                <input
                                  type="number"
                                  step="10"
                                  value={editPgPrice}
                                  onChange={(e) => setEditPgPrice(e.target.value)}
                                  className={inputClass}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                                  € / m
                                </span>
                              </div>
                            </div>
                            <div className="sm:col-span-2 flex items-center gap-1 justify-end">
                              <button
                                type="button"
                                onClick={() => handleSaveEditPriceGroup(pg.id)}
                                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Speichern"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPgId(null)}
                                className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Abbrechen"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {pg.name}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              <span className="font-mono font-extrabold text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200/40 dark:border-indigo-800/40">
                                {pg.pricePerMeter.toLocaleString('de-DE', { minimumFractionDigits: 0 })} € <span className="text-[10px] font-normal text-slate-500">/ m</span>
                              </span>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditPriceGroup(pg)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Bearbeiten"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMovePriceGroup(idx, 'up')}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                                  title="Nach oben verschieben"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === activePriceGroups.length - 1}
                                  onClick={() => handleMovePriceGroup(idx, 'down')}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                                  title="Nach unten verschieben"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePriceGroup(pg.id, pg.name)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                  title="Löschen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 2: 3 GERÄTE-PAKETE */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        3 Feste Geräte-Pakete & Summen
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Konfigurieren Sie die 3 Standard-Gerätepakete mit fester Pauschalsumme und enthaltenen Geräten.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetAppliancePackages}
                      className="text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Pakete zurücksetzen</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {activeAppliancePackages.map((pkg, pIdx) => {
                      const badgeColors = [
                        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                        'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                      ][pIdx % 3];

                      return (
                        <div
                          key={pkg.id}
                          className="p-4 bg-slate-50 dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${badgeColors}`}>
                                Paket {pIdx + 1}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                ID: {pkg.id}
                              </span>
                            </div>

                            {/* Package Title & Subtitle */}
                            <div className="space-y-2">
                              <div>
                                <label className={labelClass}>Paket-Name</label>
                                <input
                                  type="text"
                                  value={pkg.name}
                                  onChange={(e) => handleUpdateAppliancePackage(pkg.id, { name: e.target.value })}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Untertitel / Zielgruppe</label>
                                <input
                                  type="text"
                                  value={pkg.subtitle || ''}
                                  onChange={(e) => handleUpdateAppliancePackage(pkg.id, { subtitle: e.target.value })}
                                  className={inputClass}
                                  placeholder="z.B. Markengeräte Grundausstattung"
                                />
                              </div>
                            </div>

                            {/* Fixed Price */}
                            <div>
                              <label className={labelClass}>Feste Pauschalsumme (€)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="50"
                                  value={pkg.price}
                                  onChange={(e) => handleUpdateAppliancePackage(pkg.id, { price: parseFloat(e.target.value) || 0 })}
                                  className={`${inputClass} font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                                  € inkl. MwSt.
                                </span>
                              </div>
                            </div>

                            {/* Description */}
                            <div>
                              <label className={labelClass}>Kurzbeschreibung</label>
                              <textarea
                                rows={2}
                                value={pkg.description || ''}
                                onChange={(e) => handleUpdateAppliancePackage(pkg.id, { description: e.target.value })}
                                className={`${inputClass} resize-none`}
                                placeholder="z.B. Solide Marken-Geräte für Mietobjekte..."
                              />
                            </div>

                            {/* Included Items */}
                            <div className="space-y-2">
                              <label className={labelClass}>Enthaltene Einzelgeräte & Features</label>
                              <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                                {(pkg.items || []).map((item, itemIdx) => (
                                  <div
                                    key={itemIdx}
                                    className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                                  >
                                    <span className="text-slate-700 dark:text-slate-300 truncate">
                                      {item}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePackageItem(pkg.id, itemIdx)}
                                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                                      title="Entfernen"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className="flex gap-1.5 pt-1">
                                <input
                                  type="text"
                                  value={newPkgItemInput[pkg.id] || ''}
                                  onChange={(e) => setNewPkgItemInput(prev => ({ ...prev, [pkg.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddPackageItem(pkg.id);
                                    }
                                  }}
                                  placeholder="Weiteres Gerät hinzufügen..."
                                  className={`${inputClass} text-xs py-1.5`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddPackageItem(pkg.id)}
                                  className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                                  title="Gerät hinzufügen"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 3: STANDARD-KONDITIONEN FÜR MONTAGE & LIEFERUNG */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Standard-Konditionen für Lieferung & Montage
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Prozentsatz, der in der Gesamtsumme der Küche (Meterpreis + Geräte) für Lieferung und fachgerechte Montage bereits einkalkuliert ist und ausgewiesen wird.
                    </p>
                  </div>

                  <div className="max-w-md">
                    <div className="p-4 bg-slate-50 dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                      <label className={labelClass}>Standard-Prozentsatz Lieferung & Montage (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={customCatalog.deliveryAssemblyPercentage ?? 9.5}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            saveCustomCatalog({
                              ...customCatalog,
                              deliveryAssemblyPercentage: val
                            });
                          }}
                          className={inputClass}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                          % vom Gesamtwert
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Wird im Meterpreis-Rechner transparent als im Gesamtpreis enthaltene Leistung ausgewiesen (Standard: 9,5 %).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Möchten Sie wirklich alle benutzerdefinierten Katalogeinstellungen auf Werkseinstellungen zurücksetzen?')) {
                  saveCustomCatalog(DEFAULT_CUSTOM_CATALOG);
                  setToast({ show: true, message: 'Kataloge auf Werkseinstellungen zurückgesetzt.', type: 'success' });
                }
              }}
              className="px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:underline text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Auf Werkseinstellungen zurücksetzen</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToFirebase}
              disabled={isSavingCloud}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingCloud ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Speichere in Firebase...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4 text-indigo-100" />
                  <span>In Firebase speichern</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
