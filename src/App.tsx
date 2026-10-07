import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User, Home, ChefHat, PenTool, CheckCircle2, AlertCircle, FileText, 
  Calendar, Trash2, Edit2, Search, Filter, X, Car, Sun, Moon,
  Upload, Camera, FileUp, AlertTriangle, Image, Download, Plus, MapPin,
  ChevronLeft, ChevronRight, Check, Save, Ruler, Settings, Sliders, RotateCcw, PlusCircle,
  ChevronUp, ChevronDown, Megaphone, Smartphone, LogOut, Mail, Phone, Wallet,
  Folder, HardDrive, Cloud, ExternalLink, Calculator
} from 'lucide-react';
import { 
  collection, collectionGroup, addDoc, updateDoc, onSnapshot, deleteDoc, doc, serverTimestamp, setDoc, getDoc, getDocFromServer
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

// Modules imports
import { db, auth, handleFirestoreError } from './firebase';
import { FormData, Consultation, OperationType, HandleStyles, WorktopTypes, HandleNotes, WorktopNotes, Appliances, CustomFloorPlan, CustomCatalogOptions, StudioAddress, UserRole, UserPermission } from './types';
import { 
  defaultInitialState, applianceConfig, frontMaterialOptions, STUDIO_COORDS, DEFAULT_CUSTOM_CATALOG 
} from './constants';
import { processCityInput, getPlzSuggestions, PLZ_DATA } from './plz';
import { moveItemInArray, renderDate } from './utils/helpers';
import { extractDriveFolderId, authenticateGoogleDrive, uploadFileToDrive } from './utils/googleDrive';
import { SectionCard, InputField, SelectField, CustomCheckbox, inputClass, labelClass } from './components/ui/FormControls';
import { SearchableSelect } from './components/ui/SearchableSelect';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { ApplianceModal } from './components/ApplianceModal';
import { LightboxModal } from './components/LightboxModal';
import { AdminCatalogModal } from './components/AdminCatalogModal';
import { MeterCalculationModal } from './components/MeterCalculationModal';
import { LiveSummaryBox, calculateConsultationProgress } from './components/LiveSummaryBox';
import { LoginScreen } from './components/LoginScreen';
import { UserProfileModal } from './components/UserProfileModal';
import { BrandLogo } from './components/BrandLogo';

const APPLET_ID = 'dff4838f-2c38-41e3-ba3f-d3c751b5d42a';

interface Suggestion {
  street: string;
  city: string;
  postcode: string;
  lon?: number;
  lat?: number;
}

export default function App() {
  // Load Draft from LocalStorage
  const [formData, setFormData] = useState<FormData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kk_consult_draft');
      if (saved) {
        try { 
          return { ...defaultInitialState, ...JSON.parse(saved).formData }; 
        } catch (e) { 
          return JSON.parse(JSON.stringify(defaultInitialState)); 
        }
      }
    }
    return JSON.parse(JSON.stringify(defaultInitialState));
  });

  const [editingId, setEditingId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kk_consult_draft');
      if (saved) {
        try { 
          return JSON.parse(saved).editingId; 
        } catch (e) { 
          return null; 
        }
      }
    }
    return null;
  });

  // Theme support
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kk_theme') === 'dark' || 
        (!localStorage.getItem('kk_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Local sync to cache inputs
  useEffect(() => {
    localStorage.setItem('kk_consult_draft', JSON.stringify({ formData, editingId }));
  }, [formData, editingId]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('kk_theme', newTheme ? 'dark' : 'light');
  };

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [validationError, setValidationError] = useState('');
  
  const [currentView, setCurrentView] = useState<'new' | 'list'>('new');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [savedConsultations, setSavedConsultations] = useState<Consultation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConsultant, setFilterConsultant] = useState('all');

  // Selected customer for compact Master-Detail view
  const [detailConsultation, setDetailConsultation] = useState<Consultation | null>(null);
  
  const [streetSuggestions, setStreetSuggestions] = useState<Suggestion[]>([]);
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);

  // Local PLZ states
  const [plzRefSuggestions, setPlzRefSuggestions] = useState<string[]>([]);
  const [showPlzDropdown, setShowPlzDropdown] = useState(false);
  const [plzMessage, setPlzMessage] = useState<string>('');
  const [plzAndCityQuery, setPlzAndCityQuery] = useState<string>('');
  const [activeAddressTab, setActiveAddressTab] = useState<'billing' | 'delivery'>('billing');

  // Live camera stream state for direct floor plan scan & site layout snapshotting
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [activeCameraStream, setActiveCameraStream] = useState<MediaStream | null>(null);
  const [floorPlanNotes, setFloorPlanNotes] = useState<string>('');
  const [floorPlanDimensions, setFloorPlanDimensions] = useState<string>('');
  const [floorPlanFileName, setFloorPlanFileName] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Lightbox Modal for Fullscreen documentation previews
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxConsultation, setLightboxConsultation] = useState<Consultation | null>(null);

  // Active Appliance modal key for Concept 1 clean configuration
  const [activeApplianceKey, setActiveApplianceKey] = useState<string | null>(null);

  // Reset Draft Confirmation Modal state
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Delete Consultation Confirmation Modal state
  const [consultationToDelete, setConsultationToDelete] = useState<Consultation | null>(null);
  const [isDeletingConsultation, setIsDeletingConsultation] = useState<boolean>(false);

  // Mobile / Vertical Tablet Summary Drawer state
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState<boolean>(false);

  const summaryProgress = useMemo(() => calculateConsultationProgress(formData), [formData]);

  // Keyboard shortcut to close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSummaryDrawerOpen) {
        setIsSummaryDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSummaryDrawerOpen]);

  const handleConfirmResetDraft = () => {
    setFormData(JSON.parse(JSON.stringify(defaultInitialState)));
    setEditingId(null);
    localStorage.removeItem('kk_consult_draft');
    setPlzAndCityQuery('');
    setPlzMessage('');
    setCurrentStep(1);
    setFloorPlanFileName('');
    setFloorPlanDimensions('');
    setFloorPlanNotes('');
    if (activeCameraStream) {
      activeCameraStream.getTracks().forEach(track => track.stop());
      setActiveCameraStream(null);
    }
    setIsCameraActive(false);
    setShowResetConfirmModal(false);
    showToast('Entwurf wurde vollständig zurückgesetzt.');
  };

  // Helper to safely merge any loaded or updated catalog options with defaults
  const mergeCatalogOptions = (data?: Partial<CustomCatalogOptions> | null): CustomCatalogOptions => {
    if (!data) return DEFAULT_CUSTOM_CATALOG;

    // Appliances: User custom values ALWAYS take precedence.
    // If user has saved appliances in customCatalog, use their exact array even if empty or customized.
    // Only fall back to defaults if the specific key has never been defined at all.
    const mergedAppliances: Record<string, string[]> = {};
    const defaultKeys = Object.keys(DEFAULT_CUSTOM_CATALOG.appliances);
    const userKeys = data.appliances && typeof data.appliances === 'object' ? Object.keys(data.appliances) : [];
    const allApplianceKeys = Array.from(new Set([...defaultKeys, ...userKeys]));

    allApplianceKeys.forEach((key) => {
      if (data.appliances && typeof data.appliances === 'object' && key in data.appliances && Array.isArray(data.appliances[key])) {
        // User explicitly configured this key (can be customized, reordered, or filtered)
        mergedAppliances[key] = data.appliances[key];
      } else {
        mergedAppliances[key] = DEFAULT_CUSTOM_CATALOG.appliances[key] || [];
      }
    });

    // Manufacturers: ONLY use data.manufacturers if provided. Do NOT force DEFAULT_CUSTOM_CATALOG.manufacturers!
    let manufacturers = (Array.isArray(data.manufacturers) && data.manufacturers.length > 0)
      ? data.manufacturers
      : DEFAULT_CUSTOM_CATALOG.manufacturers;

    // Front materials per manufacturer: ONLY use data.frontMaterials if provided
    const frontMaterials: Record<string, string[]> = (data.frontMaterials && typeof data.frontMaterials === 'object')
      ? data.frontMaterials
      : DEFAULT_CUSTOM_CATALOG.frontMaterials;

    // Front colors per manufacturer & front model: ONLY use data.frontColors if provided
    const frontColors: Record<string, Record<string, string[]>> = (data.frontColors && typeof data.frontColors === 'object')
      ? data.frontColors
      : (DEFAULT_CUSTOM_CATALOG.frontColors || {});

    // Smart cleanup: If custom frontMaterials/frontColors are defined, filter out standard unconfigured manufacturers
    if (data.frontMaterials && typeof data.frontMaterials === 'object' && Object.keys(data.frontMaterials).length > 0) {
      const customMfrKeys = Object.keys(data.frontMaterials);
      const filteredMfrs = manufacturers.filter(m => {
        const matchingKey = customMfrKeys.find(k => k.trim().toLowerCase() === m.trim().toLowerCase());
        const hasMaterials = matchingKey && Array.isArray(frontMaterials[matchingKey]) && frontMaterials[matchingKey].length > 0;
        const hasColors = matchingKey && frontColors[matchingKey] && Object.keys(frontColors[matchingKey]).length > 0;
        return hasMaterials || hasColors || !!matchingKey;
      });
      if (filteredMfrs.length > 0) {
        manufacturers = filteredMfrs;
      }
    }

    // Faucets (Mehrwert Armatur)
    const faucets = (Array.isArray(data.faucets) && data.faucets.length > 0)
      ? data.faucets
      : DEFAULT_CUSTOM_CATALOG.faucets;

    // Waste Bins (Abfallsammler)
    const wasteBins = (Array.isArray(data.wasteBins) && data.wasteBins.length > 0)
      ? data.wasteBins
      : DEFAULT_CUSTOM_CATALOG.wasteBins;

    // Sources (Kundenquelle)
    const sources = (Array.isArray(data.sources) && data.sources.length > 0)
      ? data.sources
      : DEFAULT_CUSTOM_CATALOG.sources;

    // Studio Address
    const studioAddress: StudioAddress = {
      ...DEFAULT_CUSTOM_CATALOG.studioAddress!,
      ...(data.studioAddress || {})
    };

    // Price Groups (Meterpreis-Rechner)
    const priceGroups = (Array.isArray(data.priceGroups) && data.priceGroups.length > 0)
      ? data.priceGroups
      : DEFAULT_CUSTOM_CATALOG.priceGroups;

    // Appliance Packages (3 feste Pakete)
    const appliancePackages = (Array.isArray(data.appliancePackages) && data.appliancePackages.length > 0)
      ? data.appliancePackages
      : DEFAULT_CUSTOM_CATALOG.appliancePackages;

    const standardAssemblyRatePerMeter = data.standardAssemblyRatePerMeter ?? DEFAULT_CUSTOM_CATALOG.standardAssemblyRatePerMeter;
    const deliveryFlatRate = data.deliveryFlatRate ?? DEFAULT_CUSTOM_CATALOG.deliveryFlatRate;

    return {
      appliances: mergedAppliances,
      manufacturers,
      frontMaterials,
      frontColors,
      faucets,
      wasteBins,
      sources,
      studioAddress,
      priceGroups,
      appliancePackages,
      standardAssemblyRatePerMeter,
      deliveryFlatRate
    };
  };

  // Dynamic Admin Catalog State & Persistence
  const [customCatalog, setCustomCatalog] = useState<CustomCatalogOptions>(() => {
    try {
      const saved = localStorage.getItem('kuechen_catalog_options');
      if (saved) return mergeCatalogOptions(JSON.parse(saved));
    } catch (e) {
      console.error('Error reading localStorage catalog options:', e);
    }
    return DEFAULT_CUSTOM_CATALOG;
  });

  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isMeterCalculationOpen, setIsMeterCalculationOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [userPermissionsList, setUserPermissionsList] = useState<UserPermission[]>([]);
  const [lastCustomerCoords, setLastCustomerCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Helper to apply calculated meter pricing to current consultation draft
  const handleApplyCalculatedMeterPrice = (calculatedData: {
    totalGross: number;
    meters: number;
    priceGroupName: string;
    appliancePackageName: string;
    summaryText: string;
  }) => {
    const formattedPrice = calculatedData.totalGross.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    setFormData(prev => {
      const currentNotes = prev.notes || '';
      const calcNote = `\n--- Meterpreis-Kalkulation (${calculatedData.meters}m, ${calculatedData.priceGroupName}, ${calculatedData.appliancePackageName}): ${formattedPrice} € ---`;
      return {
        ...prev,
        budget: formattedPrice,
        notes: currentNotes ? `${currentNotes}\n${calcNote}` : calcNote.trim()
      };
    });

    setIsMeterCalculationOpen(false);
    showToast(`Kalkulation (${formattedPrice} €) erfolgreich in Budget & Notizen übernommen!`);
  };

  // Derived studio coordinates
  const activeStudioAddress = customCatalog.studioAddress || DEFAULT_CUSTOM_CATALOG.studioAddress!;
  const currentStudioCoords = {
    lat: activeStudioAddress.lat ?? STUDIO_COORDS.lat,
    lon: activeStudioAddress.lon ?? STUDIO_COORDS.lon
  };

  // Firestore sync for Custom Catalog across all devices
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let retryTimeout: any = null;

    const fetchDirectly = async () => {
      try {
        const docRef = doc(db, 'artifacts', APPLET_ID, 'settings', 'catalog_options');
        let snap;
        try {
          snap = await getDocFromServer(docRef);
        } catch (serverErr) {
          console.warn('Server fetch fallback to cache:', serverErr);
          snap = await getDoc(docRef);
        }

        if (snap.exists()) {
          const data = snap.data() as CustomCatalogOptions;
          if (data) {
            const mergedCatalog = mergeCatalogOptions(data);
            setCustomCatalog(mergedCatalog);
            try {
              localStorage.setItem('kuechen_catalog_options', JSON.stringify(mergedCatalog));
            } catch (e) {
              console.error('LocalStorage sync error:', e);
            }
          }
        }
      } catch (err) {
        console.warn('Direct catalog fetch error:', err);
      }
    };

    const setupListener = () => {
      const docRef = doc(db, 'artifacts', APPLET_ID, 'settings', 'catalog_options');
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as CustomCatalogOptions;
          if (data) {
            const mergedCatalog = mergeCatalogOptions(data);
            setCustomCatalog(mergedCatalog);
            try {
              localStorage.setItem('kuechen_catalog_options', JSON.stringify(mergedCatalog));
            } catch (e) {
              console.error('LocalStorage sync error:', e);
            }
          }
        }
      }, (err) => {
        console.warn('Catalog options listener error:', err);
        retryTimeout = setTimeout(() => {
          setupListener();
        }, 2000);
      });
    };

    fetchDirectly();
    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  // Function to save custom catalog to state, localStorage & Firestore
  const saveCustomCatalog = async (updated: CustomCatalogOptions) => {
    const cleanCatalog = mergeCatalogOptions(updated);
    setCustomCatalog(cleanCatalog);
    try {
      localStorage.setItem('kuechen_catalog_options', JSON.stringify(cleanCatalog));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }

    try {
      const docRef = doc(db, 'artifacts', APPLET_ID, 'settings', 'catalog_options');
      // Sanitize object to remove undefined values and write clean document without { merge: true }
      // (Merge mode treats dot-keys like 'TOP.SOFT' as nested FieldPaths which causes Firestore errors)
      const sanitized = JSON.parse(JSON.stringify(cleanCatalog));
      await setDoc(docRef, { ...sanitized, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error('Firestore catalog save error:', err);
      throw err;
    }
  };

  // Derived Active Configs (Full custom control for ordering and deletion)
  const activeApplianceConfig = useMemo<Record<string, { label: string; options: string[] }>>(() => {
    const merged: Record<string, { label: string; options: string[] }> = {};
    Object.entries(applianceConfig).forEach(([key, config]) => {
      const opts = customCatalog.appliances?.[key] ?? DEFAULT_CUSTOM_CATALOG.appliances[key] ?? config.options;
      merged[key] = {
        label: config.label,
        options: opts
      };
    });
    return merged;
  }, [customCatalog]);

  const activeManufacturers = useMemo(() => {
    const list = customCatalog.manufacturers ?? DEFAULT_CUSTOM_CATALOG.manufacturers;
    return [...list].sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true }));
  }, [customCatalog]);

  const activeFrontMaterials = useMemo(() => {
    const result: Record<string, string[]> = {};
    const fm = customCatalog.frontMaterials || {};
    const hasCustomFronts = Object.keys(fm).length > 0;

    activeManufacturers.forEach(m => {
      let mats: string[] = [];
      const matchingKey = Object.keys(fm).find(k => k.trim().toLowerCase() === m.trim().toLowerCase());
      if (matchingKey && Array.isArray(fm[matchingKey])) {
        mats = fm[matchingKey];
      } else {
        const defaultMatchingKey = Object.keys(DEFAULT_CUSTOM_CATALOG.frontMaterials).find(k => k.trim().toLowerCase() === m.trim().toLowerCase());
        mats = hasCustomFronts ? [] : (defaultMatchingKey ? DEFAULT_CUSTOM_CATALOG.frontMaterials[defaultMatchingKey] : []);
      }
      result[m] = [...mats].sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true }));
    });
    return result;
  }, [customCatalog, activeManufacturers]);

  const activeFrontColors = useMemo(() => {
    const result: Record<string, Record<string, string[]>> = {};
    const fc = customCatalog.frontColors || {};
    const hasCustomColors = Object.keys(fc).length > 0;

    activeManufacturers.forEach(m => {
      const matchingKey = Object.keys(fc).find(k => k.trim().toLowerCase() === m.trim().toLowerCase());
      if (matchingKey && fc[matchingKey]) {
        result[m] = fc[matchingKey];
      } else {
        const defaultMatchingKey = Object.keys(DEFAULT_CUSTOM_CATALOG.frontColors || {}).find(k => k.trim().toLowerCase() === m.trim().toLowerCase());
        result[m] = hasCustomColors ? {} : (defaultMatchingKey ? (DEFAULT_CUSTOM_CATALOG.frontColors?.[defaultMatchingKey] ?? {}) : {});
      }
    });
    return result;
  }, [customCatalog, activeManufacturers]);

  const getFrontMaterialsForManufacturer = (manufacturer?: string) => {
    if (!manufacturer) return [];
    const mKey = Object.keys(activeFrontMaterials).find(k => k.trim().toLowerCase() === manufacturer.trim().toLowerCase());
    return mKey ? (activeFrontMaterials[mKey] || []) : [];
  };

  const getAvailableColorsForFront = (manufacturer?: string, frontMaterial?: string) => {
    if (!manufacturer) return [];
    const mKey = Object.keys(activeFrontColors).find(k => k.trim().toLowerCase() === manufacturer.trim().toLowerCase());
    const mColors = mKey ? activeFrontColors[mKey] : undefined;
    if (!mColors) return [];

    let colors: string[] = [];
    if (frontMaterial && frontMaterial.trim() !== '') {
      const trimmedMat = frontMaterial.trim().toLowerCase();
      const matchingKey = Object.keys(mColors).find(k => k.trim().toLowerCase() === trimmedMat);
      if (matchingKey && Array.isArray(mColors[matchingKey])) {
        colors = mColors[matchingKey];
      }
    } else {
      const set = new Set<string>();
      Object.values(mColors).forEach(list => {
        if (Array.isArray(list)) {
          list.forEach(c => set.add(c));
        }
      });
      colors = Array.from(set);
    }

    return [...colors].sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true }));
  };

  const activeFaucets = useMemo(() => {
    return customCatalog.faucets ?? DEFAULT_CUSTOM_CATALOG.faucets;
  }, [customCatalog]);

  const activeWasteBins = useMemo(() => {
    return customCatalog.wasteBins ?? DEFAULT_CUSTOM_CATALOG.wasteBins;
  }, [customCatalog]);

  const activeSources = useMemo(() => {
    return customCatalog.sources ?? DEFAULT_CUSTOM_CATALOG.sources ?? ['Auf Empfehlung', 'Internet / Social Media', 'Zeitung', 'Werbebanner', 'Laufkundschaft'];
  }, [customCatalog]);

  // Synchronize the input field with changes in zipCode or city
  useEffect(() => {
    const isBilling = activeAddressTab === 'billing';
    const zip = (isBilling ? formData.billingZipCode : formData.zipCode) || '';
    const city = (isBilling ? formData.billingCity : formData.city) || '';
    const combined = zip && city ? `${zip} ${city}` : (zip || city);
    setPlzAndCityQuery(prev => {
      if (prev.trim() !== combined.trim()) {
        return combined;
      }
      return prev;
    });
  }, [formData.zipCode, formData.city, formData.billingZipCode, formData.billingCity, activeAddressTab]);

  // Local PLZ validation and suggestion builder
  useEffect(() => {
    const zip = formData.zipCode || '';
    const city = formData.city || '';
    
    // Generate suggestions based on whatever is typed
    const query = zip ? zip : city;
    const suggestions = getPlzSuggestions(query);
    setPlzRefSuggestions(suggestions);

    const checkInput = zip && city ? `${zip} ${city}` : (zip || city);
    const result = processCityInput(checkInput);
    
    // If we have a full zip (5 digits) or valid input, update our range checks
    if (zip.length === 5) {
      setFormData(prev => {
        if (prev.plzValidated !== result.isValid || prev.plzWithinRange !== result.isWithinRange) {
          return {
            ...prev,
            city: result.city || prev.city,
            plzValidated: result.isValid,
            plzWithinRange: result.isWithinRange
          };
        }
        return prev;
      });
    }

    if (result.message) {
      setPlzMessage(result.message);
    } else {
      setPlzMessage('');
    }
  }, [formData.zipCode, formData.city]);

  const handlePlzAndCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPlzAndCityQuery(val);
    setShowPlzDropdown(true);

    const suggestions = getPlzSuggestions(val);
    setPlzRefSuggestions(suggestions);

    const trimmed = val.trim();
    if (!trimmed) {
      setFormData(prev => {
        const isBilling = activeAddressTab === 'billing';
        const updated = { ...prev };
        if (isBilling) {
          updated.billingZipCode = '';
          updated.billingCity = '';
          if (prev.billingSameAsDelivery) {
            updated.zipCode = '';
            updated.city = '';
            updated.plzValidated = false;
            updated.plzWithinRange = false;
          }
        } else {
          updated.zipCode = '';
          updated.city = '';
          updated.plzValidated = false;
          updated.plzWithinRange = false;
        }
        return updated;
      });
      return;
    }

    let resolvedZip = '';
    let resolvedCity = '';
    let isValid = false;
    let isWithinRange = false;

    // Check if input starts with numbers (PLZ input)
    const leadingNumberMatch = trimmed.match(/^(\d{1,5})(?:\s*(.*))?$/);
    if (leadingNumberMatch) {
      const digits = leadingNumberMatch[1];
      const textRest = (leadingNumberMatch[2] || '').replace(/[^a-zA-ZäöüÄÖÜß\s\-\/]/g, '').trim();

      resolvedZip = digits;
      if (digits.length === 5) {
        const knownCity = PLZ_DATA[digits];
        if (knownCity) {
          resolvedCity = textRest || knownCity;
          isValid = true;
          isWithinRange = true;
        } else {
          resolvedCity = textRest;
          isValid = true;
          isWithinRange = digits.startsWith('7') || digits.startsWith('88') || digits.startsWith('89') || digits.startsWith('78') || digits.startsWith('79');
        }
      } else {
        // Still typing digits, do not put partial digits into the city field!
        resolvedCity = textRest;
        isValid = false;
        isWithinRange = false;
      }
    } else {
      // User typed text or city name without leading zip
      const zipMatch = trimmed.match(/\b\d{5}\b/);
      if (zipMatch) {
        const zip = zipMatch[0];
        const textRest = trimmed.replace(/\b\d{5}\b/g, '').replace(/[^a-zA-ZäöüÄÖÜß\s\-\/]/g, '').trim();
        resolvedZip = zip;
        const knownCity = PLZ_DATA[zip];
        resolvedCity = textRest || knownCity || '';
        isValid = true;
        isWithinRange = knownCity ? true : (zip.startsWith('7') || zip.startsWith('88') || zip.startsWith('89') || zip.startsWith('78') || zip.startsWith('79'));
      } else {
        const cleanText = trimmed.replace(/[^a-zA-ZäöüÄÖÜß\s\-\/]/g, '').trim();
        const cleanLower = cleanText.toLowerCase();
        const exactMatch = Object.entries(PLZ_DATA).find(([_, cityName]) => cityName.toLowerCase() === cleanLower);
        if (exactMatch) {
          resolvedZip = exactMatch[0];
          resolvedCity = exactMatch[1];
          isValid = true;
          isWithinRange = true;
        } else {
          resolvedZip = '';
          resolvedCity = cleanText;
          isValid = false;
          isWithinRange = false;
        }
      }
    }

    setFormData(prev => {
      const isBilling = activeAddressTab === 'billing';
      const updated = { ...prev };
      
      if (isBilling) {
        updated.billingZipCode = resolvedZip;
        updated.billingCity = resolvedCity;
        if (prev.billingSameAsDelivery) {
          updated.zipCode = resolvedZip;
          updated.city = resolvedCity;
          updated.plzValidated = isValid;
          updated.plzWithinRange = isWithinRange;
        }
      } else {
        updated.zipCode = resolvedZip;
        updated.city = resolvedCity;
        updated.plzValidated = isValid;
        updated.plzWithinRange = isWithinRange;
      }
      return updated;
    });
  };

  const selectPlzSuggestion = (val: string) => {
    const parts = val.split(' ');
    const zip = parts[0];
    const city = parts.slice(1).join(' ');
    
    setFormData(prev => {
      const isBilling = activeAddressTab === 'billing';
      const updated = { ...prev };
      
      if (isBilling) {
        updated.billingZipCode = zip;
        updated.billingCity = city;
        if (prev.billingSameAsDelivery) {
          updated.zipCode = zip;
          updated.city = city;
          updated.plzValidated = true;
          updated.plzWithinRange = true;
        }
      } else {
        updated.zipCode = zip;
        updated.city = city;
        updated.plzValidated = true;
        updated.plzWithinRange = true;
      }
      return updated;
    });
    setShowPlzDropdown(false);
  };

  // Camera handling for iPad/iPhone Live floor-plan scanning
  const startCamera = async () => {
    try {
      setValidationError('');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera-API wird von diesem Browser nicht unterstützt oder ist im iFrame blockiert.');
      }
      let stream: MediaStream;
      try {
        // Try rear camera with ideal constraint first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
      } catch (firstErr) {
        // Fallback to any default camera (webcam/front camera)
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      setActiveCameraStream(stream);
      setIsCameraActive(true);
      // Wait for React to render the video element, then attach stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Video play failed:", e));
        }
      }, 100);
    } catch (err: any) {
      console.error("Fehler beim Zugriff auf Kamera:", err);
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      const errMsg = isDenied
        ? "Kamerazugriff wurde im Browser verweigert. Bitte erlauben Sie den Kamerazugriff in den Browser-Einstellungen."
        : "Keine Kamera gefunden oder Kamerazugriff im Vorschau-Fenster nicht möglich. Öffnen Sie die App in einem neuen Tab oder laden Sie ein Foto direkt als Datei hoch.";
      setValidationError(errMsg);
    }
  };

  const stopCamera = () => {
    if (activeCameraStream) {
      activeCameraStream.getTracks().forEach(track => track.stop());
      setActiveCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const uploadPlanToDrive = async (plan: CustomFloorPlan, explicitFolderUrl?: string) => {
    const targetFolderUrl = explicitFolderUrl || currentUserDriveFolderUrl;
    const folderId = extractDriveFolderId(targetFolderUrl);

    if (!targetFolderUrl || !folderId) {
      setToast({
        show: true,
        message: 'Kein Google Drive Ordner im Benutzerprofil hinterlegt. Bitte erst konfigurieren.',
        type: 'error'
      });
      setIsProfileOpen(true);
      return;
    }

    // Set uploading state
    setFormData(prev => ({
      ...prev,
      floorPlans: (prev.floorPlans || []).map(p => p.id === plan.id ? { ...p, driveStatus: 'uploading', driveError: undefined } : p)
    }));

    try {
      const accessToken = await authenticateGoogleDrive();
      const result = await uploadFileToDrive({
        accessToken,
        folderId,
        fileName: plan.name,
        fileDataUrl: plan.url
      });

      setFormData(prev => ({
        ...prev,
        floorPlans: (prev.floorPlans || []).map(p => p.id === plan.id ? {
          ...p,
          driveStatus: 'uploaded',
          driveFileId: result.fileId,
          driveWebViewLink: result.webViewLink
        } : p)
      }));

      setToast({
        show: true,
        message: `✓ "${plan.name}" erfolgreich in Ihren Google Drive Ordner hochgeladen!`,
        type: 'success'
      });
    } catch (err: any) {
      console.error("Google Drive Upload Error:", err);
      setFormData(prev => ({
        ...prev,
        floorPlans: (prev.floorPlans || []).map(p => p.id === plan.id ? {
          ...p,
          driveStatus: 'error',
          driveError: err?.message || 'Upload fehlgeschlagen'
        } : p)
      }));

      setToast({
        show: true,
        message: `Drive Upload fehlgeschlagen: ${err?.message || 'Fehler'}`,
        type: 'error'
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1024;
      canvas.height = video.videoHeight || 768;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL('image/jpeg', 0.85);
        
        const newFloorPlan: CustomFloorPlan = {
          id: 'fp_' + Date.now().toString(36),
          name: floorPlanFileName || `Kamera-Aufmaß_${new Date().toLocaleDateString('de-DE').replace(/\./g, '-')}.jpg`,
          url: base64Data,
          uploadDate: new Date().toISOString(),
          description: floorPlanNotes || 'Live Kamera-Scan vor Ort beim Kunden',
          dimensions: floorPlanDimensions || '',
          driveStatus: currentUserDriveFolderUrl ? 'pending' : undefined
        };

        setFormData(prev => ({
          ...prev,
          floorPlans: [...(prev.floorPlans || []), newFloorPlan]
        }));

        setFloorPlanNotes('');
        setFloorPlanDimensions('');
        setFloorPlanFileName('');
        stopCamera();
        
        if (currentUserDriveFolderUrl) {
          uploadPlanToDrive(newFloorPlan);
        } else {
          setToast({
            show: true,
            message: "✓ Grundriss-Foto lokal im Entwurf gespeichert. Für Google Drive bitte Ordner verknüpfen.",
            type: "success"
          });
        }
      }
    } catch (err) {
      console.error("Snapshot capture Fehler:", err);
      setValidationError("Erfassung fehlgeschlagen. Bitte laden Sie eine Datei hoch.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) return;
        
        const newFloorPlan: CustomFloorPlan = {
          id: 'fp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 5),
          name: file.name,
          url: event.target.result as string,
          uploadDate: new Date().toISOString(),
          description: floorPlanNotes || 'Importierter Plan / Dokumentenscan mit iPad / iPhone',
          dimensions: floorPlanDimensions || '',
          driveStatus: currentUserDriveFolderUrl ? 'pending' : undefined
        };

        setFormData(prev => ({
          ...prev,
          floorPlans: [...(prev.floorPlans || []), newFloorPlan]
        }));

        setFloorPlanNotes('');
        setFloorPlanDimensions('');
        
        if (currentUserDriveFolderUrl) {
          uploadPlanToDrive(newFloorPlan);
        } else {
          setToast({
            show: true,
            message: "✓ Dokumentenscan lokal im Entwurf gespeichert. Für Google Drive bitte Ordner verknüpfen.",
            type: "success"
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFloorPlan = (id: string) => {
    setFormData(prev => ({
      ...prev,
      floorPlans: (prev.floorPlans || []).filter(plan => plan.id !== id)
    }));
    setToast({
      show: true,
      message: "Dokument gelöscht.",
      type: "info"
    });
  };

  // Suggest street names in real-time from Photon Komoot (OpenStreetMap data)
  useEffect(() => {
    const fetchStreets = async () => {
      const isBilling = activeAddressTab === 'billing';
      const currentStreet = isBilling ? formData.billingStreet : formData.street;
      const currentZip = isBilling ? formData.billingZipCode : formData.zipCode;
      const currentCity = isBilling ? formData.billingCity : formData.city;

      if (!currentStreet || String(currentStreet).length < 3) {
        setStreetSuggestions([]);
        return;
      }
      try {
        const query = [currentZip, currentCity, currentStreet].filter(Boolean).join(' ');
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=15&lang=de&bbox=5.8,47.2,15.1,55.1`);
        const data = await res.json();
        
        if (!data || !data.features) return;
  
        const validSuggestions: Suggestion[] = data.features
          .filter((f: any) => f.properties?.countrycode === 'DE' || f.properties?.country === 'Deutschland')
          .filter((f: any) => {
            // Wenn eine PLZ vorliegt, zeigen wir bevorzugt passende Straßen (mindestens Übereinstimmung der ersten zwei PLZ-Stellen)
            if (currentZip && f.properties?.postcode) {
              return f.properties.postcode.startsWith(currentZip.substring(0, 2)) || f.properties.postcode === currentZip;
            }
            return true;
          })
          .filter((f: any) => f.properties?.street || f.properties?.name)
          .map((f: any) => ({ 
            street: f.properties.street || f.properties.name, 
            city: f.properties.city || f.properties.town || f.properties.village || '', 
            postcode: f.properties.postcode || '',
            lon: f.geometry?.coordinates?.[0],
            lat: f.geometry?.coordinates?.[1]
          }));
          
        const uniqueSuggestions = Array.from(new Set(validSuggestions.map(a => a.street)))
          .map(street => validSuggestions.find(a => a.street === street)!)
          .filter(Boolean)
          .slice(0, 5);
        setStreetSuggestions(uniqueSuggestions);
      } catch (e) { 
        console.warn("Photon API Fehler (nicht kritisch):", e); 
      }
    };
    const timeoutId = setTimeout(fetchStreets, 400);
    return () => clearTimeout(timeoutId);
  }, [formData.street, formData.zipCode, formData.billingStreet, formData.billingZipCode, activeAddressTab]);

  // Helper to calculate straight line distance if router fetch is blocked or offline
  const calculateFallbackDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    try {
      const R = 6371; // Earth ratio in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    } catch {
      return 0;
    }
  };

  // Calculate route from studio to customer
  const calculateRouteToStudio = async (studio: { lat: number; lon: number }, customer: { lat: number; lon: number }) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${studio.lon},${studio.lat};${customer.lon},${customer.lat}?overview=false`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const distKm = (data.routes[0].distance / 1000).toFixed(1);
        const timeMin = Math.round(data.routes[0].duration / 60);
        setFormData(prev => ({ ...prev, distanceKm: distKm, driveTimeMin: timeMin }));
        return;
      }
    } catch (e) {
      console.warn("OSRM Routing API Fallback:", e);
    }

    const fallbackDist = calculateFallbackDistance(studio.lat, studio.lon, customer.lat, customer.lon);
    if (fallbackDist > 0) {
      const distKm = (fallbackDist * 1.3).toFixed(1);
      const timeMin = Math.round(fallbackDist * 1.3 * 1.1);
      setFormData(prev => ({ ...prev, distanceKm: distKm, driveTimeMin: timeMin }));
    } else {
      setFormData(prev => ({ ...prev, distanceKm: '', driveTimeMin: '' }));
    }
  };

  // Apply chosen suggestions, query OSRM Routing and set distance & duration from Studio to buyer
  const selectStreetSuggestion = async (suggestion: Suggestion) => {
    setFormData(prev => {
      const isBilling = activeAddressTab === 'billing';
      const updated = { ...prev };
      
      if (isBilling || prev.billingSameAsDelivery) {
        updated.billingStreet = suggestion.street || '';
        updated.billingZipCode = suggestion.postcode || prev.billingZipCode || '';
        updated.billingCity = suggestion.city || prev.billingCity || '';
      }
      if (!isBilling || prev.billingSameAsDelivery) {
        updated.street = suggestion.street || '';
        updated.zipCode = suggestion.postcode || prev.zipCode || '';
        updated.city = suggestion.city || prev.city || '';
      }
      return updated;
    });
    setShowStreetDropdown(false);

    if (suggestion.lon !== undefined && suggestion.lat !== undefined) {
      const targetLon = suggestion.lon;
      const targetLat = suggestion.lat;
      setLastCustomerCoords({ lat: targetLat, lon: targetLon });
      await calculateRouteToStudio(currentStudioCoords, { lat: targetLat, lon: targetLon });
    }
  };

  // Dynamically calculate route to studio or clear distance when address is updated or deleted
  // RULE: The route always targets the delivery address (formData.street, etc.).
  // If "billingSameAsDelivery" is true, delivery address is identical to billing address.
  // If "billingSameAsDelivery" is false (deviating delivery address), the route is strictly calculated from the delivery address.
  useEffect(() => {
    const hasDeviatingDelivery = !formData.billingSameAsDelivery;

    // Delivery address takes top priority.
    // If no deviating delivery address is chosen, fall back to billing address if delivery fields are empty.
    const activeStreet = (hasDeviatingDelivery
      ? (formData.street || '')
      : (formData.street || formData.billingStreet || '')
    ).trim();

    const activeHouseNum = (hasDeviatingDelivery
      ? (formData.houseNumber || '')
      : (formData.houseNumber || formData.billingHouseNumber || '')
    ).trim();

    const activeZip = (hasDeviatingDelivery
      ? (formData.zipCode || '')
      : (formData.zipCode || formData.billingZipCode || '')
    ).trim();

    const activeCity = (hasDeviatingDelivery
      ? (formData.city || '')
      : (formData.city || formData.billingCity || '')
    ).trim();

    const cleanStreet = activeStreet;

    // A valid street is required to calculate travel distance and duration.
    // If street is deleted or empty, clear distance and time immediately so the route window closes!
    if (!cleanStreet || cleanStreet.length < 2) {
      setFormData(prev => {
        if (prev.distanceKm !== '' || prev.driveTimeMin !== '') {
          return { ...prev, distanceKm: '', driveTimeMin: '' };
        }
        return prev;
      });
      setLastCustomerCoords(null);
      return;
    }

    const cleanZip = activeZip;
    const cleanCity = activeCity;

    const queryParts = [cleanStreet, activeHouseNum, cleanZip, cleanCity].filter(Boolean);
    const addressQuery = queryParts.join(' ');

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(addressQuery)}&limit=1&lang=de`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            const feature = data.features[0];
            const coords = feature.geometry?.coordinates;
            if (coords && coords.length >= 2) {
              const lon = coords[0];
              const lat = coords[1];
              setLastCustomerCoords({ lat, lon });
              await calculateRouteToStudio(currentStudioCoords, { lat, lon });
              return;
            }
          }
        }
        // If geocoding finds no results for street, clear distance
        setFormData(prev => ({ ...prev, distanceKm: '', driveTimeMin: '' }));
        setLastCustomerCoords(null);
      } catch (e) {
        console.warn("Dynamic route calculation failed:", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    formData.street, formData.houseNumber, formData.zipCode, formData.city,
    formData.billingStreet, formData.billingHouseNumber, formData.billingZipCode, formData.billingCity,
    formData.billingSameAsDelivery, currentStudioCoords.lat, currentStudioCoords.lon
  ]);

  // Helper to open route in Apple Maps or Google Maps depending on OS
  // Target is strictly the delivery address (or billing if same)
  const openRouteInMaps = () => {
    const hasDeviatingDelivery = !formData.billingSameAsDelivery;

    const activeStreet = (hasDeviatingDelivery
      ? (formData.street || '')
      : (formData.street || formData.billingStreet || '')
    ).trim();

    const activeHouseNum = (hasDeviatingDelivery
      ? (formData.houseNumber || '')
      : (formData.houseNumber || formData.billingHouseNumber || '')
    ).trim();

    const activeZip = (hasDeviatingDelivery
      ? (formData.zipCode || '')
      : (formData.zipCode || formData.billingZipCode || '')
    ).trim();

    const activeCity = (hasDeviatingDelivery
      ? (formData.city || '')
      : (formData.city || formData.billingCity || '')
    ).trim();

    const destParts = [activeStreet, activeHouseNum, activeZip, activeCity].filter(Boolean);
    if (destParts.length === 0) return;

    const destStr = destParts.join(' ');

    const originParts = [
      activeStudioAddress.street,
      activeStudioAddress.houseNumber,
      activeStudioAddress.zipCode,
      activeStudioAddress.city
    ].filter(Boolean);

    let originStr = originParts.join(' ');
    if (!originStr && currentStudioCoords.lat && currentStudioCoords.lon) {
      originStr = `${currentStudioCoords.lat},${currentStudioCoords.lon}`;
    }

    const isApple = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);

    let url = '';
    if (isApple) {
      url = `https://maps.apple.com/?saddr=${encodeURIComponent(originStr)}&daddr=${encodeURIComponent(destStr)}&dirflg=d`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&travelmode=driving`;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };



  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Listen to User Permissions collection in Firestore
  useEffect(() => {
    if (!user) return;
    const path = `user_permissions`;
    const colRef = collection(db, path);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserPermission));
      setUserPermissionsList(data);
    }, (error) => {
      console.warn("User permissions listener error:", error);
    });
    return unsubscribe;
  }, [user]);

  // Compute User Role (belmonte@fs-kuechen.de is automatically Sys-Admin)
  const userRole: UserRole = useMemo(() => {
    if (!user || !user.email) return 'berater';
    const cleanEmail = user.email.toLowerCase().trim();
    if (cleanEmail === 'belmonte@fs-kuechen.de') return 'admin';
    const permission = userPermissionsList.find(p => p.email.toLowerCase().trim() === cleanEmail);
    return permission ? permission.role : 'berater';
  }, [user, userPermissionsList]);

  // Check if current user has meter calculation enabled (defaults to true)
  const canShowMeterCalculation: boolean = useMemo(() => {
    if (!user || !user.email) return true;
    const cleanEmail = user.email.toLowerCase().trim();
    const permission = userPermissionsList.find(p => p.email.toLowerCase().trim() === cleanEmail);
    if (permission && permission.showMeterCalculation !== undefined) {
      return permission.showMeterCalculation;
    }
    if (typeof window !== 'undefined') {
      const localVal = localStorage.getItem(`kk_user_meter_calc_${cleanEmail}`);
      if (localVal !== null) {
        return localVal === 'true';
      }
    }
    return true;
  }, [user, userPermissionsList]);

  const handleAddUserPermission = async (email: string, role: UserRole) => {
    const cleanEmail = email.toLowerCase().trim();
    const existing = userPermissionsList.find(p => p.email.toLowerCase().trim() === cleanEmail);
    if (existing) {
      const docRef = doc(db, 'user_permissions', existing.id);
      await updateDoc(docRef, { role, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, 'user_permissions'), {
        email: cleanEmail,
        role,
        showMeterCalculation: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const handleUpdateUserRole = async (id: string, newRole: UserRole) => {
    const docRef = doc(db, 'user_permissions', id);
    await updateDoc(docRef, { role: newRole, updatedAt: serverTimestamp() });
  };

  const handleDeleteUserPermission = async (id: string) => {
    const docRef = doc(db, 'user_permissions', id);
    await deleteDoc(docRef);
  };

  const handleToggleMeterCalculation = async (userIdOrEmail: string, enabled: boolean) => {
    try {
      const existingById = userPermissionsList.find(p => p.id === userIdOrEmail);
      const existingByEmail = userPermissionsList.find(p => p.email.toLowerCase().trim() === userIdOrEmail.toLowerCase().trim());
      const existing = existingById || existingByEmail;

      if (existing) {
        const docRef = doc(db, 'user_permissions', existing.id);
        await updateDoc(docRef, { showMeterCalculation: enabled, updatedAt: serverTimestamp() });
        if (typeof window !== 'undefined') {
          localStorage.setItem(`kk_user_meter_calc_${existing.email.toLowerCase().trim()}`, String(enabled));
        }
      } else {
        const cleanEmail = userIdOrEmail.toLowerCase().trim();
        await addDoc(collection(db, 'user_permissions'), {
          email: cleanEmail,
          role: cleanEmail === 'belmonte@fs-kuechen.de' ? 'admin' : 'berater',
          showMeterCalculation: enabled,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem(`kk_user_meter_calc_${cleanEmail}`, String(enabled));
        }
      }
      setToast({
        show: true,
        message: `Meterpreis-Kalkulator ${enabled ? 'aktiviert' : 'deaktiviert'}.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Fehler beim Ändern des Kalkulator-Status:', err);
      setToast({
        show: true,
        message: 'Fehler beim Speichern der Einstellung.',
        type: 'error'
      });
    }
  };

  const handleUpdateGoogleDriveFolder = async (driveUrl: string) => {
    if (!user || !user.email) return;
    const cleanEmail = user.email.toLowerCase().trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem(`kk_user_drive_folder_${cleanEmail}`, driveUrl);
    }

    const existing = userPermissionsList.find(p => p.email.toLowerCase().trim() === cleanEmail);
    if (existing) {
      const docRef = doc(db, 'user_permissions', existing.id);
      await updateDoc(docRef, { googleDriveFolderUrl: driveUrl, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, 'user_permissions'), {
        email: cleanEmail,
        role: userRole,
        googleDriveFolderUrl: driveUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const currentUserDriveFolderUrl = useMemo(() => {
    if (!user || !user.email) return '';
    const cleanEmail = user.email.toLowerCase().trim();
    const found = userPermissionsList.find(p => p.email.toLowerCase().trim() === cleanEmail);
    if (found?.googleDriveFolderUrl) return found.googleDriveFolderUrl;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`kk_user_drive_folder_${cleanEmail}`) || '';
    }
    return '';
  }, [user, userPermissionsList]);

  const getUserInitials = (email: string | null) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split(/[\._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setToast({
        show: true,
        message: 'Sie wurden erfolgreich abgemeldet.',
        type: 'success'
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Listen to Firestore dataset real-time changes
  useEffect(() => {
    if (!user) return;
    let unsubscribe: () => void = () => {};

    if (userRole === 'admin') {
      // Sys-Admin receives ALL consultations across all consultants via collectionGroup
      const q = collectionGroup(db, 'consultations');
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(docSnap => {
          const docData = docSnap.data() as Consultation;
          const pathSegments = docSnap.ref.path.split('/');
          const docUserId = pathSegments.length >= 4 ? pathSegments[3] : user.uid;
          
          return {
            id: docSnap.id,
            ...docData,
            consultantEmail: docData.consultantEmail || (docUserId === user.uid ? user.email || 'Admin' : 'Unbekannt'),
            consultantUserId: docUserId,
            docPath: docSnap.ref.path,
          } as Consultation;
        });

        data.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0).getTime());
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0).getTime());
          return tB - tA;
        });
        setSavedConsultations(data);
      }, (error) => {
        console.warn("CollectionGroup consultations error:", error);
      });
    } else {
      // Regular Berater gets only their own consultations
      const path = `artifacts/${APPLET_ID}/users/${user.uid}/consultations`;
      const colRef = collection(db, path);
      unsubscribe = onSnapshot(colRef, (snapshot) => {
        const data = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          consultantEmail: docSnap.data().consultantEmail || user.email || '',
          consultantUserId: user.uid,
          docPath: docSnap.ref.path,
        } as Consultation));

        data.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0).getTime());
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0).getTime());
          return tB - tA;
        });
        setSavedConsultations(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      });
    }

    return () => unsubscribe();
  }, [user, userRole]);

  // Form input standard event handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      
      // If billing same as delivery, copy values bi-directionally
      if (updated.billingSameAsDelivery) {
        if (name === 'billingStreet' || name === 'street') {
          updated.street = value as string;
          updated.billingStreet = value as string;
        } else if (name === 'billingHouseNumber' || name === 'houseNumber') {
          updated.houseNumber = value as string;
          updated.billingHouseNumber = value as string;
        } else if (name === 'billingZipCode' || name === 'zipCode') {
          updated.zipCode = value as string;
          updated.billingZipCode = value as string;
        } else if (name === 'billingCity' || name === 'city') {
          updated.city = value as string;
          updated.billingCity = value as string;
        }
      }

      // If street field is being cleared, clear distanceKm and driveTimeMin immediately!
      if (name === 'street' || name === 'billingStreet') {
        const valStr = (value as string).trim();
        if (!valStr || valStr.length < 2) {
          updated.distanceKm = '';
          updated.driveTimeMin = '';
        }
      }

      return updated;
    });

    if (validationError) setValidationError('');
  };

  // Structured key style configuration handlers
  const handleNestedCheckboxChange = (group: 'handleStyles' | 'worktopTypes', field: string, checked: boolean) => {
    setFormData(p => {
      const noteGroup = group === 'handleStyles' ? 'handleNotes' : 'worktopNotes';
      return { 
        ...p, 
        [group]: { ...(p[group] || {}), [field]: checked } as any,
        ...(!checked ? { [noteGroup]: { ...(p[noteGroup] || {}), [field]: '' } } : {})
      };
    });
  };

  const handleNestedTextChange = (group: 'handleNotes' | 'worktopNotes', field: string, value: string) => {
    setFormData(p => ({ 
      ...p, 
      [group]: { ...(p[group] || {}), [field]: value } as any
    }));
  };

  const handleApplianceChange = (key: string, field: 'needed' | 'details', value: any) => {
    const k = key as keyof Appliances;
    setFormData(p => ({
      ...p,
      appliances: {
        ...p.appliances,
        [k]: {
          ...p.appliances[k],
          [field]: value,
          ...(field === 'needed' && !value ? { details: [] } : {})
        }
      }
    }));
  };
  
  const handleApplianceDetailToggle = (key: string, option: string) => {
    const k = key as keyof Appliances;
    setFormData(prev => {
      const curr = prev.appliances[k]?.details || [];
      const updatedDetails = curr.includes(option) 
        ? curr.filter(o => o !== option) 
        : [...curr, option];
      return { 
        ...prev, 
        appliances: { 
          ...prev.appliances, 
          [k]: { 
            ...prev.appliances[k], 
            needed: updatedDetails.length > 0,
            details: updatedDetails 
          } 
        } 
      };
    });
  };

  const showToast = (message: string, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Auto-dismiss all floating notifications after exactly 3 seconds (3000ms)
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, toast.message]);

  // Store consultation in Firestore with transaction wraps
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      setValidationError('Bitte Vor- und Nachname eingeben.');
      return;
    }
    if (!formData.phone && !formData.mobile && !formData.email) {
      setValidationError('Bitte mindestens eine Kontaktmöglichkeit (Telefon, Mobil oder E-Mail) angeben.');
      return;
    }
    if (!user) {
      setValidationError('Nicht bereit (keine Firebase-Verbindung).');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    const path = `artifacts/${APPLET_ID}/users/${user.uid}/consultations`;
    const consultantEmail = user.email || '';
    const consultantName = user.displayName || (user.email ? user.email.split('@')[0] : 'Berater');

    try {
      if (editingId) {
        const targetUserId = (savedConsultations.find(c => c.id === editingId) as any)?.consultantUserId || user.uid;
        const docPath = `artifacts/${APPLET_ID}/users/${targetUserId}/consultations/${editingId}`;
        try {
          await updateDoc(doc(db, 'artifacts', APPLET_ID, 'users', targetUserId, 'consultations', editingId), { 
            ...formData, 
            consultantEmail: formData.consultantEmail || consultantEmail,
            consultantName: formData.consultantName || consultantName,
            updatedAt: serverTimestamp() 
          });
          showToast('Bedarfsanalyse erfolgreich aktualisiert!');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, docPath);
        }
      } else {
        try {
          await addDoc(collection(db, 'artifacts', APPLET_ID, 'users', user.uid, 'consultations'), { 
            ...formData, 
            consultantEmail,
            consultantName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          showToast('Bedarfsanalyse erfolgreich angelegt!');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
      
      // Cleanup
      setFormData(JSON.parse(JSON.stringify(defaultInitialState)));
      setEditingId(null);
      localStorage.removeItem('kk_consult_draft');
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentView('list');
    } catch (error) {
      console.error(error);
      showToast('Fehler bei der Übertragung.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map database entry back to state for updates
  const handleEdit = (consultation: Consultation) => {
    setFormData({ ...defaultInitialState, ...consultation });
    setEditingId(consultation.id);
    setCurrentView('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const name = [consultation.firstName, consultation.lastName].filter(Boolean).join(' ');
    showToast(name ? `Bearbeitung aktiv: ${name}` : 'Bearbeitung aktiv', 'success');
  };

  const cancelEdit = () => {
    setFormData(JSON.parse(JSON.stringify(defaultInitialState)));
    setEditingId(null);
    localStorage.removeItem('kk_consult_draft');
    showToast('Bearbeitung abgebrochen.');
  };

  // Trigger custom confirmation modal for deleting database record
  const handleDeleteClick = (consultation: Consultation) => {
    setConsultationToDelete(consultation);
  };

  // Perform database record deletion
  const handleConfirmDelete = async () => {
    if (!consultationToDelete || !user) return;
    setIsDeletingConsultation(true);
    const targetUserId = consultationToDelete.consultantUserId || user.uid;
    const path = consultationToDelete.docPath || `artifacts/${APPLET_ID}/users/${targetUserId}/consultations/${consultationToDelete.id}`;
    
    try {
      const docRef = consultationToDelete.docPath 
        ? doc(db, consultationToDelete.docPath)
        : doc(db, 'artifacts', APPLET_ID, 'users', targetUserId, 'consultations', consultationToDelete.id);
      
      await deleteDoc(docRef);
      showToast('Eintrag erfolgreich gelöscht.');
      if (detailConsultation?.id === consultationToDelete.id) {
        setDetailConsultation(null);
      }
      setConsultationToDelete(null);
    } catch (e) { 
      console.error('Löschfehler:', e);
      handleFirestoreError(e, OperationType.DELETE, path);
      showToast('Löschvorgang fehlgeschlagen.', 'error'); 
    } finally {
      setIsDeletingConsultation(false);
    }
  };

  // Derived unique list of consultants for Sys-Admin filter dropdown
  const uniqueConsultants = useMemo(() => {
    const map = new Map<string, string>();

    // Add consultants from user permissions list
    userPermissionsList.forEach(p => {
      if (p.email) {
        const emailLower = p.email.toLowerCase().trim();
        const label = p.name ? `${p.name} (${p.email})` : p.email;
        map.set(emailLower, label);
      }
    });

    // Add current user
    if (user?.email) {
      const emailLower = user.email.toLowerCase().trim();
      if (!map.has(emailLower)) {
        map.set(emailLower, user.email);
      }
    }

    // Add any consultant emails present in saved consultations
    savedConsultations.forEach(c => {
      if (c.consultantEmail) {
        const emailLower = c.consultantEmail.toLowerCase().trim();
        if (!map.has(emailLower)) {
          const label = c.consultantName && c.consultantName !== c.consultantEmail 
            ? `${c.consultantName} (${c.consultantEmail})` 
            : c.consultantEmail;
          map.set(emailLower, label);
        }
      }
    });

    return Array.from(map.entries()).map(([email, label]) => ({
      email,
      label
    }));
  }, [savedConsultations, userPermissionsList, user]);

  // Filter and search computation
  const filteredConsultations = useMemo(() => {
    return savedConsultations.filter(c => {
      const searchString = `${c.firstName || ''} ${c.lastName || ''} ${c.city || ''} ${c.phone || ''} ${c.mobile || ''} ${c.consultantEmail || ''}`.toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());
      const matchesConsultant = userRole !== 'admin' || filterConsultant === 'all' || 
        (c.consultantEmail && c.consultantEmail.toLowerCase() === filterConsultant.toLowerCase());
      return matchesSearch && matchesConsultant;
    });
  }, [savedConsultations, searchTerm, filterConsultant, userRole]);

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-[#0b0f19] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Anmeldung wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen isDark={isDark} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 p-3 md:p-8 flex flex-col font-sans ${isDark ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="mx-auto w-full flex-1 transition-all duration-300 max-w-7xl">
        
        {/* Header */}
        <header className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          {/* MOBILE & VERTICAL TABLET HEADER (< lg) */}
          <div className="flex flex-col gap-3.5 lg:hidden">
            {/* Top row: Logo on left, Navigation + Actions (Admin, Darkmode, Profile) on right */}
            <div className="flex items-center justify-between gap-3">
              {/* Brand Logo */}
              <div className="flex items-center gap-2.5 shrink-0">
                <BrandLogo className="w-9 h-9" />
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 select-none font-sans">
                    needle
                    <span 
                      className="relative flex h-2.5 w-2.5 items-center justify-center cursor-pointer ml-0.5"
                      title="System online & Live-Cloud-Synchronisierung aktiv"
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                    </span>
                  </h1>
                </div>
              </div>

              {/* Right Corner: Tablet Navigation (md only) + Admin-Katalog, Darkmode, Profil on one line with needle */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Tablet Navigation Segmented Control: Visible on vertical tablet (md:flex), hidden on mobile phone */}
                <div className="hidden md:flex bg-slate-200/80 dark:bg-[#151c2c] p-1 rounded-xl border border-slate-300/80 dark:border-slate-800 gap-1 items-center mr-1">
                  <button 
                    onClick={() => setCurrentView('new')} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${currentView === 'new' ? 'bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    {editingId ? 'Kunde bearbeiten' : 'Neuer Kunde'}
                  </button>
                  <button 
                    onClick={() => setCurrentView('list')} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${currentView === 'list' ? 'bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    <span>Meine Kunden</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${currentView === 'list' ? 'bg-indigo-600 text-white font-black' : 'bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold'}`}>
                      {savedConsultations.length}
                    </span>
                  </button>
                </div>

                {userRole === 'admin' && (
                  <button 
                    onClick={() => setIsAdminOpen(true)} 
                    className="h-9 px-2.5 sm:px-3 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 border border-slate-800 dark:border-indigo-500 flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                    title="Admin-Bereich: Optionen & Kataloge verwalten"
                  >
                    <Sliders className="w-4 h-4 text-indigo-400 dark:text-white" />
                    <span className="hidden sm:inline">Admin-Katalog</span>
                  </button>
                )}

                {/* Meterpreis-Rechner / Kalkulations-Button (Rechts vom Admin-Katalog, ohne Text) */}
                {canShowMeterCalculation && (
                  <button 
                    onClick={() => setIsMeterCalculationOpen(true)} 
                    className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer shrink-0"
                    title="Meterpreis-Kalkulation öffnen"
                  >
                    <Calculator className="w-4 h-4 text-white shrink-0" />
                  </button>
                )}

                {/* Theme switcher */}
                <button 
                  onClick={toggleTheme} 
                  className="w-9 h-9 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0"
                  title="Farbschema wechseln"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                </button>

                {/* User Profile Button */}
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="h-9 px-2 sm:px-2.5 rounded-xl bg-white dark:bg-[#151c2c] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                  title="Benutzerprofil & Rechteverwaltung öffnen"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                    {getUserInitials(user?.email || null)}
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom row: "Neuer Kunde" und "Meine Kunden" mittig darunter — nur auf mobilen Smartphones (unter md) */}
            <div className="flex md:hidden justify-center w-full">
              <div className="bg-slate-200/80 dark:bg-[#151c2c] p-1 rounded-xl border border-slate-300/80 dark:border-slate-800 flex gap-1 items-center max-w-full">
                <button 
                  onClick={() => setCurrentView('new')} 
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${currentView === 'new' ? 'bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  {editingId ? 'Kunde bearbeiten' : 'Neuer Kunde'}
                </button>
                <button 
                  onClick={() => setCurrentView('list')} 
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${currentView === 'list' ? 'bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <span>Meine Kunden</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${currentView === 'list' ? 'bg-indigo-600 text-white font-black' : 'bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold'}`}>
                    {savedConsultations.length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* DESKTOP HEADER (>= lg) */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 lg:gap-6 xl:gap-8 items-center">
            {/* LEFT HEADER COLUMN: Aligns with Bedarfsermittlung box (lg:col-span-7 xl:col-span-8) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-wrap items-center justify-between gap-3">
              {/* Brand Logo */}
              <div className="flex items-center gap-3">
                <BrandLogo className="w-10 h-10" />
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 select-none font-sans">
                    needle
                    <span 
                      className="relative flex h-3 w-3 items-center justify-center cursor-pointer ml-0.5"
                      title="System online & Live-Cloud-Synchronisierung aktiv"
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                    </span>
                  </h1>
                </div>
              </div>

              {/* Navigation Buttons: Neuer Kunde / Meine Kunden (Right-aligned with Bedarfsermittlung Box) */}
              <div className="bg-slate-200/80 dark:bg-[#151c2c] p-1 rounded-xl border border-slate-300/80 dark:border-slate-800 flex gap-1 items-center shrink-0">
                <button 
                  onClick={() => setCurrentView('new')} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${currentView === 'new' ? 'bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  {editingId ? 'Kunde bearbeiten' : 'Neuer Kunde'}
                </button>
                <button 
                  onClick={() => setCurrentView('list')} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${currentView === 'list' ? 'bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <span>Meine Kunden</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${currentView === 'list' ? 'bg-indigo-600 text-white font-black' : 'bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold'}`}>
                    {savedConsultations.length}
                  </span>
                </button>
              </div>
            </div>

            {/* RIGHT HEADER COLUMN: Aligns with Zusammenfassung box (lg:col-span-5 xl:col-span-4) */}
            <div className="lg:col-span-5 xl:col-span-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Admin Catalog Manager Button (Left-aligned with Zusammenfassung Box) */}
                {userRole === 'admin' && (
                  <button 
                    onClick={() => setIsAdminOpen(true)} 
                    className="h-9 px-3.5 rounded-xl bg-slate-900 text-white dark:bg-[#1e293b] hover:bg-slate-800 dark:hover:bg-slate-700 border border-slate-800 dark:border-slate-700 flex items-center gap-2 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                    title="Admin-Bereich: Optionen & Kataloge verwalten"
                  >
                    <Sliders className="w-4 h-4 text-indigo-400 dark:text-indigo-400" />
                    <span className="hidden sm:inline">Admin-Katalog</span>
                  </button>
                )}

                {/* Meterpreis-Rechner / Kalkulations-Button (Rechts vom Admin-Katalog, ohne Text) */}
                {canShowMeterCalculation && (
                  <button 
                    onClick={() => setIsMeterCalculationOpen(true)} 
                    className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer shrink-0"
                    title="Meterpreis-Kalkulation öffnen"
                  >
                    <Calculator className="w-4 h-4 text-white shrink-0" />
                  </button>
                )}

                {/* Theme switcher */}
                <button 
                  onClick={toggleTheme} 
                  className="w-9 h-9 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0"
                  title="Farbschema wechseln"
                >
                  {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-600" />}
                </button>
              </div>

              {/* User Profile Button */}
              <button
                onClick={() => setIsProfileOpen(true)}
                className="h-9 px-2.5 sm:px-3 rounded-xl bg-white dark:bg-[#151c2c] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                title="Benutzerprofil & Rechteverwaltung öffnen"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                  {getUserInitials(user?.email || null)}
                </div>
                <div className="hidden lg:flex flex-col items-start text-left">
                  <span className="text-[10px] font-bold text-slate-900 dark:text-white leading-tight max-w-[110px] truncate">
                    {user?.email ? user.email.split('@')[0] : 'Profil'}
                  </span>
                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                    {userRole === 'admin' ? 'Sys-Admin' : 'Berater'}
                  </span>
                </div>
              </button>
            </div>

          </div>
        </header>

        {/* Floating notifications */}
        <AnimatePresence>
          {toast.show && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-4 right-4 z-50 flex items-center p-3.5 sm:p-4 rounded-xl shadow-2xl border ${
                toast.type === 'error' 
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' 
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
              } backdrop-blur-md max-w-md cursor-pointer`}
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 mr-3 shrink-0 text-emerald-500" />
              )}
              <p className="font-bold text-xs tracking-wide flex-1">{toast.message}</p>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setToast(prev => ({ ...prev, show: false }));
                }}
                className="ml-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Schließen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- VIEW: NEW / EDIT FORM --- */}
        {currentView === 'new' && (
          <form onSubmit={handleSubmit} className="pb-36 md:pb-24 modal-fade">
            
            {validationError && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 mb-6 rounded-xl flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 shrink-0" />
                <p className="text-red-500 text-xs font-bold">{validationError}</p>
              </div>
            )}

            {editingId && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 mb-6 rounded-xl flex items-center justify-between">
                <div className="flex items-center">
                  <Edit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-3 shrink-0" />
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    Bearbeitungsmodus aktiv {formData.firstName || formData.lastName ? `– ${formData.firstName} ${formData.lastName}` : ''}
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                  title="Bearbeitung abbrechen"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Abbrechen</span>
                </button>
              </div>
            )}

            {/* Grid Layout: Left Column (Form Inputs), Right Column (Live Summary Box) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 xl:gap-8 items-start">
              {/* LEFT COLUMN: Multi-step Form Wizard */}
              <div className="w-full lg:col-span-7 xl:col-span-8 flex flex-col">

                {/* STEPPER NAVIGATION BAR */}
                <div className="bg-white dark:bg-[#151c2c] rounded-2xl border border-slate-200 dark:border-slate-800 p-3 mb-6 shadow-sm">
                  <div className="grid grid-cols-4 gap-1 sm:gap-2">
                    {[
                      { id: 1, title: 'Raum & Design', icon: Home },
                      { id: 2, title: 'Grundriss & Aufmaß', icon: Ruler },
                      { id: 3, title: 'Geräte & Zubehör', icon: ChefHat },
                      { id: 4, title: 'Kundendaten', icon: User },
                    ].map((step) => {
                      const isActive = currentStep === step.id;
                      const isCompleted = step.id < currentStep;

                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => setCurrentStep(step.id)}
                          className={`py-2 px-1.5 sm:py-2.5 sm:px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                            isActive 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/15 font-bold' 
                              : isCompleted
                                ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/50'
                                : 'bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#111827]'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : isCompleted
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider truncate hidden sm:inline">
                            {step.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 1: RAUM & DESIGN */}
                {currentStep === 1 && (
                  <SectionCard 
                    title="1. Raum & Design" 
                    icon={Home}
                    headerRight={
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider shrink-0">
                          Hersteller-Wunsch:
                        </span>
                        <select 
                          name="manufacturer" 
                          value={formData.manufacturer || ''} 
                          onChange={(e) => { 
                            handleChange(e); 
                            setFormData(p => ({ 
                              ...p, 
                              frontMaterial: '', 
                              frontColor: '',
                              hasSecondFront: false,
                              secondFrontMaterial: '', 
                              secondFrontColor: '',
                              hasThirdFront: false,
                              thirdFrontMaterial: '',
                              thirdFrontColor: ''
                            })); 
                          }}
                          className="px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                        >
                          <option value="">Hersteller wählen...</option>
                          {activeManufacturers.map(m => (
                            <option key={m} value={m} className="bg-white dark:bg-[#151c2c]">{m}</option>
                          ))}
                        </select>
                      </div>
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-4">
                      {/* Front Options - Compact 3-Row Table Layout */}
                      <div className="md:col-span-2 space-y-2">
                        <label className={labelClass}>Fronten (Material & Farbe)</label>
                        <div className="grid grid-cols-1 gap-2">
                          {/* Hauptfront (1) */}
                          <div className="p-2.5 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="w-28 shrink-0 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Hauptfront</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                              <SearchableSelect
                                value={formData.frontMaterial || ''}
                                onChange={(newMaterial) => {
                                  const availableColors = getAvailableColorsForFront(formData.manufacturer, newMaterial);
                                  setFormData(p => ({
                                    ...p,
                                    frontMaterial: newMaterial,
                                    frontColor: (p.frontColor && availableColors.includes(p.frontColor)) ? p.frontColor : ''
                                  }));
                                }}
                                options={formData.manufacturer ? getFrontMaterialsForManufacturer(formData.manufacturer) : []}
                                placeholder={!formData.manufacturer ? 'Hersteller wählen...' : 'Material Hauptfront...'}
                                disabled={!formData.manufacturer}
                                onClear={() => {
                                  setFormData(p => ({ ...p, frontMaterial: '', frontColor: '' }));
                                }}
                              />
                              <SearchableSelect
                                value={formData.frontColor || ''}
                                onChange={(newColor) => {
                                  setFormData(p => ({ ...p, frontColor: newColor }));
                                }}
                                options={formData.manufacturer ? getAvailableColorsForFront(formData.manufacturer, formData.frontMaterial) : []}
                                placeholder={!formData.manufacturer ? 'Hersteller wählen...' : 'Farbe Hauptfront...'}
                                disabled={!formData.manufacturer}
                                allowCustomInput={true}
                                onClear={() => {
                                  setFormData(p => ({ ...p, frontColor: '' }));
                                }}
                              />
                            </div>
                          </div>

                          {/* 2. Front */}
                          <div className="p-2.5 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="w-28 shrink-0 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">2. Front</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                              <SearchableSelect
                                value={formData.secondFrontMaterial || ''}
                                onChange={(newMaterial) => {
                                  const availableColors = getAvailableColorsForFront(formData.manufacturer, newMaterial);
                                  const nextColor = (formData.secondFrontColor && availableColors.includes(formData.secondFrontColor)) ? formData.secondFrontColor : '';
                                  setFormData(p => ({
                                    ...p,
                                    secondFrontMaterial: newMaterial,
                                    secondFrontColor: nextColor,
                                    hasSecondFront: !!newMaterial || !!nextColor
                                  }));
                                }}
                                options={formData.manufacturer ? getFrontMaterialsForManufacturer(formData.manufacturer) : []}
                                placeholder={!formData.manufacturer ? 'Hersteller wählen...' : 'Material 2. Front (optional)...'}
                                disabled={!formData.manufacturer}
                                onClear={() => {
                                  setFormData(p => ({
                                    ...p,
                                    secondFrontMaterial: '',
                                    hasSecondFront: !!p.secondFrontColor
                                  }));
                                }}
                              />
                              <SearchableSelect
                                value={formData.secondFrontColor || ''}
                                onChange={(newColor) => {
                                  setFormData(p => ({
                                    ...p,
                                    secondFrontColor: newColor,
                                    hasSecondFront: !!newColor || !!p.secondFrontMaterial
                                  }));
                                }}
                                options={formData.manufacturer ? getAvailableColorsForFront(formData.manufacturer, formData.secondFrontMaterial) : []}
                                placeholder={!formData.manufacturer ? 'Hersteller wählen...' : 'Farbe 2. Front (optional)...'}
                                disabled={!formData.manufacturer}
                                allowCustomInput={true}
                                onClear={() => {
                                  setFormData(p => ({
                                    ...p,
                                    secondFrontColor: '',
                                    hasSecondFront: !!p.secondFrontMaterial
                                  }));
                                }}
                              />
                            </div>
                          </div>

                          {/* 3. Front */}
                          <div className="p-2.5 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="w-28 shrink-0 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">3. Front</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                              <SearchableSelect
                                value={formData.thirdFrontMaterial || ''}
                                onChange={(newMaterial) => {
                                  const availableColors = getAvailableColorsForFront(formData.manufacturer, newMaterial);
                                  const nextColor = (formData.thirdFrontColor && availableColors.includes(formData.thirdFrontColor)) ? formData.thirdFrontColor : '';
                                  setFormData(p => ({
                                    ...p,
                                    thirdFrontMaterial: newMaterial,
                                    thirdFrontColor: nextColor,
                                    hasThirdFront: !!newMaterial || !!nextColor
                                  }));
                                }}
                                options={formData.manufacturer ? getFrontMaterialsForManufacturer(formData.manufacturer) : []}
                                placeholder={!formData.manufacturer ? 'Hersteller wählen...' : 'Material 3. Front (optional)...'}
                                disabled={!formData.manufacturer}
                                onClear={() => {
                                  setFormData(p => ({
                                    ...p,
                                    thirdFrontMaterial: '',
                                    hasThirdFront: !!p.thirdFrontColor
                                  }));
                                }}
                              />
                              <SearchableSelect
                                value={formData.thirdFrontColor || ''}
                                onChange={(newColor) => {
                                  setFormData(p => ({
                                    ...p,
                                    thirdFrontColor: newColor,
                                    hasThirdFront: !!newColor || !!p.thirdFrontMaterial
                                  }));
                                }}
                                options={formData.manufacturer ? getAvailableColorsForFront(formData.manufacturer, formData.thirdFrontMaterial) : []}
                                placeholder={!formData.manufacturer ? 'Hersteller wählen...' : 'Farbe 3. Front (optional)...'}
                                disabled={!formData.manufacturer}
                                allowCustomInput={true}
                                onClear={() => {
                                  setFormData(p => ({
                                    ...p,
                                    thirdFrontColor: '',
                                    hasThirdFront: !!p.thirdFrontMaterial
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Griffausführung - Static 3-Column Grid without height jumps */}
                      <div className="md:col-span-2 space-y-2">
                        <label className={labelClass}>Griffausführung</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Grifflos */}
                          <div className={`p-3 rounded-xl border transition-all ${
                            formData.handleStyles?.grifflos 
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-500/60' 
                              : 'bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800'
                          }`}>
                            <label className="flex items-center gap-2 cursor-pointer mb-2 select-none">
                              <input 
                                type="checkbox" 
                                checked={formData.handleStyles?.grifflos || false} 
                                onChange={(e) => handleNestedCheckboxChange('handleStyles', 'grifflos', e.target.checked)} 
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer" 
                              />
                              <span className={`text-xs font-bold ${formData.handleStyles?.grifflos ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                Grifflos
                              </span>
                            </label>
                            <div className="relative flex items-center">
                              <input 
                                type="text" 
                                value={formData.handleNotes?.grifflos || ''} 
                                onChange={(e) => {
                                  handleNestedTextChange('handleNotes', 'grifflos', e.target.value);
                                  if (e.target.value && !formData.handleStyles?.grifflos) {
                                    handleNestedCheckboxChange('handleStyles', 'grifflos', true);
                                  }
                                }} 
                                placeholder="Profil / Ausführung..." 
                                className={`${inputClass} ${formData.handleNotes?.grifflos ? 'pr-9' : ''}`} 
                              />
                              {Boolean(formData.handleNotes?.grifflos) && (
                                <button
                                  type="button"
                                  onClick={() => handleNestedTextChange('handleNotes', 'grifflos', '')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                                  title="Zeile leeren"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Griffleisten */}
                          <div className={`p-3 rounded-xl border transition-all ${
                            formData.handleStyles?.griffleisten 
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-500/60' 
                              : 'bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800'
                          }`}>
                            <label className="flex items-center gap-2 cursor-pointer mb-2 select-none">
                              <input 
                                type="checkbox" 
                                checked={formData.handleStyles?.griffleisten || false} 
                                onChange={(e) => handleNestedCheckboxChange('handleStyles', 'griffleisten', e.target.checked)} 
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer" 
                              />
                              <span className={`text-xs font-bold ${formData.handleStyles?.griffleisten ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                Griffleisten
                              </span>
                            </label>
                            <div className="relative flex items-center">
                              <input 
                                type="text" 
                                value={formData.handleNotes?.griffleisten || ''} 
                                onChange={(e) => {
                                  handleNestedTextChange('handleNotes', 'griffleisten', e.target.value);
                                  if (e.target.value && !formData.handleStyles?.griffleisten) {
                                    handleNestedCheckboxChange('handleStyles', 'griffleisten', true);
                                  }
                                }} 
                                placeholder="Farbe / Länge..." 
                                className={`${inputClass} ${formData.handleNotes?.griffleisten ? 'pr-9' : ''}`} 
                              />
                              {Boolean(formData.handleNotes?.griffleisten) && (
                                <button
                                  type="button"
                                  onClick={() => handleNestedTextChange('handleNotes', 'griffleisten', '')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                                  title="Zeile leeren"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Möbelgriffe */}
                          <div className={`p-3 rounded-xl border transition-all ${
                            formData.handleStyles?.griffe 
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-500/60' 
                              : 'bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800'
                          }`}>
                            <label className="flex items-center gap-2 cursor-pointer mb-2 select-none">
                              <input 
                                type="checkbox" 
                                checked={formData.handleStyles?.griffe || false} 
                                onChange={(e) => handleNestedCheckboxChange('handleStyles', 'griffe', e.target.checked)} 
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer" 
                              />
                              <span className={`text-xs font-bold ${formData.handleStyles?.griffe ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                Möbelgriffe
                              </span>
                            </label>
                            <div className="relative flex items-center">
                              <input 
                                type="text" 
                                value={formData.handleNotes?.griffe || ''} 
                                onChange={(e) => {
                                  handleNestedTextChange('handleNotes', 'griffe', e.target.value);
                                  if (e.target.value && !formData.handleStyles?.griffe) {
                                    handleNestedCheckboxChange('handleStyles', 'griffe', true);
                                  }
                                }} 
                                placeholder="Modellnummer..." 
                                className={`${inputClass} ${formData.handleNotes?.griffe ? 'pr-9' : ''}`} 
                              />
                              {Boolean(formData.handleNotes?.griffe) && (
                                <button
                                  type="button"
                                  onClick={() => handleNestedTextChange('handleNotes', 'griffe', '')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                                  title="Zeile leeren"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Arbeitsplatte - Static 3-Column Grid without height jumps */}
                      <div className="md:col-span-2 space-y-2">
                        <label className={labelClass}>Arbeitsplatte</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Schichtstoff */}
                          <div className={`p-3 rounded-xl border transition-all ${
                            formData.worktopTypes?.schichtstoff 
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-500/60' 
                              : 'bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800'
                          }`}>
                            <label className="flex items-center gap-2 cursor-pointer mb-2 select-none">
                              <input 
                                type="checkbox" 
                                checked={formData.worktopTypes?.schichtstoff || false} 
                                onChange={(e) => handleNestedCheckboxChange('worktopTypes', 'schichtstoff', e.target.checked)} 
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer" 
                              />
                              <span className={`text-xs font-bold ${formData.worktopTypes?.schichtstoff ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                Schichtstoff
                              </span>
                            </label>
                            <div className="relative flex items-center">
                              <input 
                                type="text" 
                                value={formData.worktopNotes?.schichtstoff || ''} 
                                onChange={(e) => {
                                  handleNestedTextChange('worktopNotes', 'schichtstoff', e.target.value);
                                  if (e.target.value && !formData.worktopTypes?.schichtstoff) {
                                    handleNestedCheckboxChange('worktopTypes', 'schichtstoff', true);
                                  }
                                }} 
                                placeholder="Dekornummer / Kante..." 
                                className={`${inputClass} ${formData.worktopNotes?.schichtstoff ? 'pr-9' : ''}`} 
                              />
                              {Boolean(formData.worktopNotes?.schichtstoff) && (
                                <button
                                  type="button"
                                  onClick={() => handleNestedTextChange('worktopNotes', 'schichtstoff', '')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                                  title="Zeile leeren"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Naturstein */}
                          <div className={`p-3 rounded-xl border transition-all ${
                            formData.worktopTypes?.naturstein 
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-500/60' 
                              : 'bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800'
                          }`}>
                            <label className="flex items-center gap-2 cursor-pointer mb-2 select-none">
                              <input 
                                type="checkbox" 
                                checked={formData.worktopTypes?.naturstein || false} 
                                onChange={(e) => handleNestedCheckboxChange('worktopTypes', 'naturstein', e.target.checked)} 
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer" 
                              />
                              <span className={`text-xs font-bold ${formData.worktopTypes?.naturstein ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                Naturstein
                              </span>
                            </label>
                            <div className="relative flex items-center">
                              <input 
                                type="text" 
                                value={formData.worktopNotes?.naturstein || ''} 
                                onChange={(e) => {
                                  handleNestedTextChange('worktopNotes', 'naturstein', e.target.value);
                                  if (e.target.value && !formData.worktopTypes?.naturstein) {
                                    handleNestedCheckboxChange('worktopTypes', 'naturstein', true);
                                  }
                                }} 
                                placeholder="Steinsorte / Stärke..." 
                                className={`${inputClass} ${formData.worktopNotes?.naturstein ? 'pr-9' : ''}`} 
                              />
                              {Boolean(formData.worktopNotes?.naturstein) && (
                                <button
                                  type="button"
                                  onClick={() => handleNestedTextChange('worktopNotes', 'naturstein', '')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                                  title="Zeile leeren"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Dekton / Keramik */}
                          <div className={`p-3 rounded-xl border transition-all ${
                            formData.worktopTypes?.dekton 
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-500/60' 
                              : 'bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800'
                          }`}>
                            <label className="flex items-center gap-2 cursor-pointer mb-2 select-none">
                              <input 
                                type="checkbox" 
                                checked={formData.worktopTypes?.dekton || false} 
                                onChange={(e) => handleNestedCheckboxChange('worktopTypes', 'dekton', e.target.checked)} 
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer" 
                              />
                              <span className={`text-xs font-bold ${formData.worktopTypes?.dekton ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                Dekton / Keramik
                              </span>
                            </label>
                            <div className="relative flex items-center">
                              <input 
                                type="text" 
                                value={formData.worktopNotes?.dekton || ''} 
                                onChange={(e) => {
                                  handleNestedTextChange('worktopNotes', 'dekton', e.target.value);
                                  if (e.target.value && !formData.worktopTypes?.dekton) {
                                    handleNestedCheckboxChange('worktopTypes', 'dekton', true);
                                  }
                                }} 
                                placeholder="Dekor / Oberflächenart..." 
                                className={`${inputClass} ${formData.worktopNotes?.dekton ? 'pr-9' : ''}`} 
                              />
                              {Boolean(formData.worktopNotes?.dekton) && (
                                <button
                                  type="button"
                                  onClick={() => handleNestedTextChange('worktopNotes', 'dekton', '')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                                  title="Zeile leeren"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* STEP 2: GRUNDRISS & RAUMAUFMAẞ */}
                {currentStep === 2 && (
                  <SectionCard title="2. Grundriss & Raumaufmaß" icon={Ruler}>
                    <div className="space-y-6">
                      {/* Room Dimensions */}
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 border-b dark:border-[#1a1a1a] pb-2">
                          Raummaße & Deckenplanung
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <InputField label="Arbeitshöhe (cm)" name="workHeight" type="number" value={formData.workHeight} onChange={handleChange} />
                          <InputField label="Raumhöhe (cm)" name="roomHeight" type="number" value={formData.roomHeight} onChange={handleChange} />
                          <InputField label="Brüstungshöhe (cm)" name="sillHeight" placeholder="z.B. F1: 92cm, F2: 104cm" value={formData.sillHeight} onChange={handleChange} />
                        </div>
                        
                        {/* Ceiling Planning Options */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div>
                            <label className={labelClass}>Deckenhoch geplant?</label>
                            <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-[#121212] p-1.5 rounded-xl border border-slate-200 dark:border-[#222] w-full shadow-sm">
                              <label className="flex-1 relative cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="ceilingHigh" 
                                  checked={formData.ceilingHigh} 
                                  onChange={() => setFormData(p => ({...p, ceilingHigh: true}))} 
                                  className="peer sr-only" 
                                />
                                <div className="px-2 py-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:bg-slate-200/50 dark:hover:bg-white/5 peer-checked:bg-indigo-600 peer-checked:text-white transition-all text-center">
                                  Ja
                                </div>
                              </label>
                              <label className="flex-1 relative cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="ceilingHigh" 
                                  checked={!formData.ceilingHigh} 
                                  onChange={() => setFormData(p => ({...p, ceilingHigh: false}))} 
                                  className="peer sr-only" 
                                />
                                <div className="px-2 py-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:bg-slate-200/50 dark:hover:bg-white/5 peer-checked:bg-white dark:peer-checked:bg-[#1E1E1F] peer-checked:text-slate-800 dark:peer-checked:text-white transition-all text-center">
                                  Nein
                                </div>
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Deckenblende gewünscht?</label>
                            <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-[#121212] p-1.5 rounded-xl border border-slate-200 dark:border-[#222] w-full shadow-sm">
                              <label className="flex-1 relative cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="ceilingPanel" 
                                  checked={formData.ceilingPanel} 
                                  onChange={() => setFormData(p => ({...p, ceilingPanel: true}))} 
                                  className="peer sr-only" 
                                />
                                <div className="px-2 py-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:bg-slate-200/50 dark:hover:bg-white/5 peer-checked:bg-indigo-600 peer-checked:text-white transition-all text-center">
                                  Ja
                                </div>
                              </label>
                              <label className="flex-1 relative cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="ceilingPanel" 
                                  checked={!formData.ceilingPanel} 
                                  onChange={() => setFormData(p => ({...p, ceilingPanel: false}))} 
                                  className="peer sr-only" 
                                />
                                <div className="px-2 py-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:bg-slate-200/50 dark:hover:bg-white/5 peer-checked:bg-white dark:peer-checked:bg-[#1E1E1F] peer-checked:text-slate-800 dark:peer-checked:text-white transition-all text-center">
                                  Nein
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Floor plans & Scans */}
                      <div className="pt-4 border-t border-slate-100 dark:border-[#1a1a1a]">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Grundriss-Skizzen & Dokumente
                        </h3>
                        <p className="text-xs text-slate-505 dark:text-slate-400 mb-4 leading-relaxed font-semibold">
                          Hier können Sie Grundriss-Skizzen, Notizen-Scans oder Fotos der baulichen Begebenheiten direkt erfassen. Perfekt für das iPad oder iPhone unterwegs beim Kunden.
                        </p>

                        {/* Inline Camera Viewfinder */}
                        {isCameraActive && (
                          <div className="bg-slate-950 dark:bg-black rounded-2xl overflow-hidden border border-slate-800 p-4 relative modal-fade flex flex-col items-center">
                            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                              <video 
                                ref={videoRef} 
                                playsInline 
                                muted 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 border border-white/20 pointer-events-none flex items-center justify-center">
                                <div className="w-2/3 h-2/3 border border-dashed border-white/30 rounded animate-pulse" />
                              </div>
                              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-[10px] text-white px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                                Live-Kamera Aktiv
                              </div>
                            </div>

                            <div className="w-full mt-4 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Dateiname / Typ*</label>
                                  <div className="relative flex items-center">
                                    <input 
                                      type="text"
                                      placeholder="z.B. Grundriss Plan"
                                      value={floorPlanFileName}
                                      onChange={(e) => setFloorPlanFileName(e.target.value)}
                                      className={`w-full bg-slate-900 border border-slate-800 rounded-lg py-2 text-xs text-white outline-none ${floorPlanFileName ? 'pl-3 pr-8' : 'px-3'}`}
                                    />
                                    {Boolean(floorPlanFileName) && (
                                      <button
                                        type="button"
                                        onClick={() => setFloorPlanFileName('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-rose-400 hover:text-rose-300 rounded transition-all cursor-pointer z-10"
                                        title="Zeile leeren"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Raum-Abmessungen</label>
                                  <div className="relative flex items-center">
                                    <input 
                                      type="text"
                                      placeholder="z.B. 4.2m x 3.8m"
                                      value={floorPlanDimensions}
                                      onChange={(e) => setFloorPlanDimensions(e.target.value)}
                                      className={`w-full bg-slate-900 border border-slate-800 rounded-lg py-2 text-xs text-white outline-none ${floorPlanDimensions ? 'pl-3 pr-8' : 'px-3'}`}
                                    />
                                    {Boolean(floorPlanDimensions) && (
                                      <button
                                        type="button"
                                        onClick={() => setFloorPlanDimensions('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-rose-400 hover:text-rose-300 rounded transition-all cursor-pointer z-10"
                                        title="Zeile leeren"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Notizen / Spezifika</label>
                                <div className="relative flex items-center">
                                  <input 
                                    type="text"
                                    placeholder="z.B. Brüstungshöhe 92cm, Anschlüsse unterm Fenster"
                                    value={floorPlanNotes}
                                    onChange={(e) => setFloorPlanNotes(e.target.value)}
                                    className={`w-full bg-slate-900 border border-slate-800 rounded-lg py-2 text-xs text-white outline-none ${floorPlanNotes ? 'pl-3 pr-8' : 'px-3'}`}
                                  />
                                  {Boolean(floorPlanNotes) && (
                                    <button
                                      type="button"
                                      onClick={() => setFloorPlanNotes('')}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-rose-400 hover:text-rose-300 rounded transition-all cursor-pointer z-10"
                                      title="Zeile leeren"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                              
                              <div className="flex gap-2 justify-end pt-2">
                                <button
                                  type="button"
                                  onClick={stopCamera}
                                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-lg uppercase tracking-wider transition-colors cursor-pointer border border-slate-700/50"
                                >
                                  Abbrechen
                                </button>
                                <button
                                  type="button"
                                  onClick={capturePhoto}
                                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                                >
                                  <Camera className="w-4 h-4" />
                                  Foto speichern
                                </button>
                              </div>
                            </div>
                          )}

                        {/* Upload & Setup Section */}
                        {!isCameraActive && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3.5 justify-between text-left">
                              <div>
                                <span className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                                  Option A
                                </span>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  Kamera-Scan / Direktfoto (iPad / Mobil)
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                                  Fotografieren Sie den Papiergrundriss oder die Wandabmessungen direkt mit der Kamera.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={startCamera}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10"
                              >
                                <Camera className="w-4 h-4" />
                                Live-Kamera starten
                              </button>
                            </div>

                            <div className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3.5 justify-between text-left">
                              <div>
                                <span className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                                  Option B
                                </span>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  Datei-Upload (PDF, PNG, JPG)
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                                  Wählen Sie bestehende Pläne, Architektenzeichnungen oder Scans vom Gerät aus.
                                </p>
                              </div>
                              <label className="w-full py-2.5 bg-white dark:bg-[#151c2c] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                                <Upload className="w-4 h-4 text-indigo-500" />
                                <span>Datei auswählen...</span>
                                <input 
                                  type="file"
                                  accept="image/*,application/pdf"
                                  className="hidden"
                                  onChange={handleFileUpload}
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Attached Floor Plans Manager */}
                        {formData.floorPlans && formData.floorPlans.length > 0 && (
                          <div className="mt-4 border-t border-slate-100 dark:border-[#1a1a1a] pt-4 modal-fade">
                            <span className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-3 tracking-wider text-left">
                              Zugeordnate Pläne & Scans ({formData.floorPlans.length})
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-left">
                              {formData.floorPlans.map((plan, index) => (
                                <div 
                                  key={plan.id} 
                                  className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex gap-3 items-start relative group"
                                >
                                  <div 
                                    onClick={() => { setLightboxConsultation(null); setLightboxIndex(index); }}
                                    className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-[#222] overflow-hidden shrink-0 cursor-pointer hover:opacity-90 relative transition-opacity border border-slate-300 dark:border-slate-800 shadow-sm"
                                  >
                                    {plan.url.startsWith('data:image/') || plan.url.startsWith('http') ? (
                                      <img 
                                        src={plan.url} 
                                        alt={plan.name} 
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-[#151515] text-slate-400 dark:text-slate-500">
                                        <FileText className="w-6 h-6" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0 pr-6">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={plan.name}>
                                      {plan.name}
                                    </p>
                                    {plan.dimensions && (
                                      <span className="inline-block bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-[9px] font-bold text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded mt-0.5 mb-1">
                                        {plan.dimensions}
                                      </span>
                                    )}
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                                      {plan.description || 'Keine Beschreibung vorhanden'}
                                    </p>

                                    {/* Google Drive Status Pill */}
                                    <div className="mt-1.5">
                                      {plan.driveStatus === 'uploaded' ? (
                                        <a
                                          href={plan.driveWebViewLink || currentUserDriveFolderUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded hover:underline"
                                          title="In Google Drive hinterlegt – Klicken zum Öffnen"
                                        >
                                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                          <span>In Google Drive gespeichert</span>
                                          <ExternalLink className="w-2 h-2 ml-0.5" />
                                        </a>
                                      ) : plan.driveStatus === 'uploading' ? (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded">
                                          <div className="w-2 h-2 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                          <span>Drive Upload läuft...</span>
                                        </span>
                                      ) : plan.driveStatus === 'error' ? (
                                        <button
                                          type="button"
                                          onClick={() => uploadPlanToDrive(plan)}
                                          className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded hover:bg-rose-100 transition-colors cursor-pointer"
                                          title="Upload fehlgeschlagen - Erneut versuchen"
                                        >
                                          <AlertCircle className="w-2.5 h-2.5 text-rose-500" />
                                          <span>Fehler: Erneut hochladen</span>
                                        </button>
                                      ) : currentUserDriveFolderUrl ? (
                                        <button
                                          type="button"
                                          onClick={() => uploadPlanToDrive(plan)}
                                          className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                                          title="Jetzt in Google Drive hochladen"
                                        >
                                          <Cloud className="w-2.5 h-2.5 text-blue-500" />
                                          <span>In Drive hochladen</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setIsProfileOpen(true)}
                                          className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded hover:text-slate-800 cursor-pointer"
                                          title="Google Drive Ordner im Benutzerprofil hinterlegen"
                                        >
                                          <Folder className="w-2.5 h-2.5" />
                                          <span>Drive Ordner verknüpfen</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeFloorPlan(plan.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-500 rounded-lg transition-all cursor-pointer"
                                    title="Plan entfernen"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* STEP 3: GERÄTE & ZUBEHÖR */}
                {currentStep === 3 && (
                  <SectionCard title="3. Geräte & Zubehör" icon={ChefHat}>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                          <label className={`${labelClass} !mb-0`}>Elektrogeräte & Spüle</label>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Auf Kachel klicken für Details
                          </span>
                        </div>
                        
                        {/* Clean Streamlined Appliance Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                          {Object.entries(activeApplianceConfig).map(([key, config]: [string, { label: string; options: string[] }]) => {
                            const k = key as keyof Appliances;
                            const selectedDetails = formData.appliances?.[k]?.details || [];
                            const selectedCount = selectedDetails.length;
                            const hasSelection = selectedCount > 0;

                            return (
                              <div 
                                key={key} 
                                onClick={() => setActiveApplianceKey(key)}
                                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 relative cursor-pointer select-none group ${
                                  hasSelection 
                                    ? 'bg-indigo-50/70 dark:bg-indigo-950/35 border-indigo-500 dark:border-indigo-500/60 shadow-xs' 
                                    : 'bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-800/50 hover:bg-slate-100/50 dark:hover:bg-[#111622]'
                                }`}
                              >
                                {/* Top Row: Label + Option Count Badge */}
                                <div className="flex items-center justify-between gap-1.5 min-w-0">
                                  <span className={`text-xs sm:text-sm font-bold truncate ${hasSelection ? 'text-indigo-950 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100'}`}>
                                    {config.label}
                                  </span>

                                  {hasSelection && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-600 text-white shrink-0 shadow-2xs">
                                      {selectedCount}
                                    </span>
                                  )}
                                </div>

                                {/* Bottom Row: Selected Details or Click Hint */}
                                <div className="text-[11px] min-h-[18px] flex items-center min-w-0">
                                  {hasSelection ? (
                                    <span className="font-medium text-indigo-700 dark:text-indigo-300/90 truncate" title={selectedDetails.join(', ')}>
                                      {selectedDetails.join(', ')}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                                      Klicken zum Auswählen
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Spezifisches Zubehör */}
                      <div className="pt-1">
                        <label className={`${labelClass} border-b border-slate-100 dark:border-slate-800 pb-2 mb-3`}>
                          Spezifisches Zubehör
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <SelectField 
                            label="Mehrwert Armatur" 
                            name="faucet" 
                            options={activeFaucets} 
                            value={formData.faucet} 
                            onChange={handleChange} 
                          />
                          <SelectField 
                            label="Abfallsammler" 
                            name="wasteBin" 
                            options={activeWasteBins} 
                            value={formData.wasteBin} 
                            onChange={handleChange} 
                          />
                        </div>
                      </div>

                      {/* Anmerkungen & Besonderheiten (Sonstiges) */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={labelClass}>Anmerkungen & Besonderheiten</label>
                          {Boolean(formData.notes) && (
                            <button
                              type="button"
                              onClick={() => setFormData(p => ({ ...p, notes: '' }))}
                              className="px-2 py-0.5 text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all flex items-center gap-1 cursor-pointer"
                              title="Text leeren"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Leeren</span>
                            </button>
                          )}
                        </div>
                        <textarea 
                          name="notes" 
                          value={formData.notes || ''} 
                          onChange={handleChange} 
                          rows={4} 
                          placeholder="Zusatzwünsche, Wände/Nischen Beschaffenheit, bauliche Gegebenheiten oder Bemerkungen..." 
                          className={`${inputClass} resize-y leading-relaxed`} 
                        />
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* STEP 4: KUNDENDATEN */}
                {currentStep === 4 && (
                  <SectionCard title="4. Kundendaten" icon={User}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Vorname*" name="firstName" value={formData.firstName} onChange={handleChange} />
                      <InputField label="Nachname*" name="lastName" value={formData.lastName} onChange={handleChange} />
                      
                      {/* Address type switch buttons */}
                      <div className="col-span-1 md:col-span-2 flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-1">
                        <button
                          type="button"
                          onClick={() => setActiveAddressTab('billing')}
                          className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center relative ${
                            activeAddressTab === 'billing' 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                              : 'bg-slate-100 dark:bg-[#151c2c] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          Bestelladresse
                          {formData.billingStreet && formData.billingCity && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveAddressTab('delivery')}
                          className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center relative ${
                            activeAddressTab === 'delivery' 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                              : 'bg-slate-100 dark:bg-[#151c2c] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          Lieferadresse
                          {formData.street && formData.city && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
                          )}
                        </button>
                      </div>

                      <div className="col-span-1 relative">
                        <label className={labelClass}>
                          PLZ & Ort*
                        </label>
                        <div className="relative flex items-center">
                          <input 
                            type="text" 
                            value={plzAndCityQuery} 
                            onChange={handlePlzAndCityChange}
                            onFocus={() => setShowPlzDropdown(true)}
                            onBlur={() => {
                              setTimeout(() => {
                                setShowPlzDropdown(false);
                                const result = processCityInput(plzAndCityQuery);
                                if (result.isValid && result.plz) {
                                  setFormData(prev => {
                                    const updated = { ...prev };
                                    const isBilling = activeAddressTab === 'billing';
                                    const existingCity = (isBilling ? prev.billingCity : prev.city) || '';
                                    const safeExistingCity = /^\d+$/.test(existingCity.trim()) ? '' : existingCity;
                                    const resolvedCity = result.city || safeExistingCity;
                                    if (isBilling) {
                                      updated.billingZipCode = result.plz || '';
                                      updated.billingCity = resolvedCity;
                                      if (updated.billingSameAsDelivery) {
                                        updated.zipCode = result.plz || '';
                                        updated.city = resolvedCity;
                                        updated.plzValidated = result.isValid;
                                        updated.plzWithinRange = result.isWithinRange;
                                      }
                                    } else {
                                      updated.zipCode = result.plz || '';
                                      updated.city = resolvedCity;
                                      updated.plzValidated = result.isValid;
                                      updated.plzWithinRange = result.isWithinRange;
                                    }
                                    return updated;
                                  });
                                }
                              }, 250);
                            }}
                            className={`${inputClass} pr-14`} 
                            placeholder="z.B. 72336 Balingen"
                            autoComplete="off" 
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                            {Boolean(plzAndCityQuery) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPlzAndCityQuery('');
                                  setFormData(prev => ({
                                    ...prev,
                                    zipCode: '',
                                    city: '',
                                    billingZipCode: activeAddressTab === 'billing' ? '' : prev.billingZipCode,
                                    billingCity: activeAddressTab === 'billing' ? '' : prev.billingCity,
                                    plzValidated: false,
                                    plzWithinRange: false
                                  }));
                                }}
                                className="p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                                title="Zeile leeren"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {formData.zipCode ? (
                              formData.plzWithinRange ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" title="Lieferregion erfolgreich zugeordnet (Balingen ±100km)" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" title="Außerhalb des 100km Einzugsgebiets!" />
                              )
                            ) : null}
                          </div>
                        </div>
                        
                        {showPlzDropdown && plzRefSuggestions.length > 0 && (
                          <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-[#111111] border border-[#d1d5db] dark:border-[#333] rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            {plzRefSuggestions.map((s, i) => (
                              <li 
                                key={i} 
                                onMouseDown={(e) => { e.preventDefault(); selectPlzSuggestion(s); }} 
                                className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] cursor-pointer border-b last:border-0 border-slate-100 dark:border-[#222] text-xs font-bold text-slate-800 dark:text-slate-100"
                              >
                                {s}
                              </li>
                            ))}
                          </ul>
                        )}
                        {formData.zipCode && !formData.plzWithinRange && (
                          <span className="text-[10px] text-amber-500 font-bold mt-1 block">
                            Achtung: Außerhalb des 100km Einzugsgebiets!
                          </span>
                        )}
                      </div>

                      <div className="col-span-1 grid grid-cols-12 gap-2 sm:gap-2.5">
                        <div className="col-span-8 relative">
                          <label className={labelClass}>
                            Straße*
                          </label>
                          <div className="relative flex items-center">
                            <input 
                              type="text" 
                              name={activeAddressTab === 'billing' ? 'billingStreet' : 'street'} 
                              value={(activeAddressTab === 'billing' ? formData.billingStreet : formData.street) || ''} 
                              onChange={(e) => { handleChange(e); setShowStreetDropdown(true); }} 
                              onFocus={() => setShowStreetDropdown(true)}
                              onBlur={() => setTimeout(() => setShowStreetDropdown(false), 250)} 
                              className={`${inputClass} ${(activeAddressTab === 'billing' ? formData.billingStreet : formData.street) ? 'pr-9' : ''}`} 
                              placeholder="Straße..."
                              autoComplete="off" 
                            />
                            {Boolean(activeAddressTab === 'billing' ? formData.billingStreet : formData.street) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(p => {
                                    const updated = { ...p };
                                    updated.street = '';
                                    updated.billingStreet = '';
                                    updated.distanceKm = '';
                                    updated.driveTimeMin = '';
                                    return updated;
                                  });
                                  setLastCustomerCoords(null);
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                                title="Zeile leeren"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {showStreetDropdown && streetSuggestions.length > 0 && (
                            <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222] rounded-xl shadow-lg max-h-48 overflow-y-auto">
                              {streetSuggestions.map((s, i) => (
                                <li 
                                  key={i} 
                                  onMouseDown={(e) => { e.preventDefault(); selectStreetSuggestion(s); }} 
                                  className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] cursor-pointer border-b last:border-0 border-slate-100 dark:border-[#222]"
                                >
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{s.street}</p>
                                  {s.postcode && s.city && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.postcode} {s.city}</p>}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="col-span-4 min-w-[70px] sm:min-w-[80px]">
                          <label className={labelClass}>Nr.*</label>
                          <div className="relative flex items-center">
                            <input 
                              type="text" 
                              name={activeAddressTab === 'billing' ? 'billingHouseNumber' : 'houseNumber'} 
                              value={(activeAddressTab === 'billing' ? formData.billingHouseNumber : formData.houseNumber) || ''} 
                              onChange={handleChange} 
                              className={`${inputClass} pl-2.5 sm:pl-3 ${(activeAddressTab === 'billing' ? formData.billingHouseNumber : formData.houseNumber) ? 'pr-8' : 'pr-2'} text-left`} 
                              placeholder="Nr."
                              title="Hausnummer"
                            />
                            {Boolean(activeAddressTab === 'billing' ? formData.billingHouseNumber : formData.houseNumber) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const fieldName = activeAddressTab === 'billing' ? 'billingHouseNumber' : 'houseNumber';
                                  setFormData(p => ({ ...p, [fieldName]: '' }));
                                }}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                                title="Zeile leeren"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* If on billing address tab, show the deviates checkbox */}
                      {activeAddressTab === 'billing' && (
                        <div className="col-span-1 md:col-span-2 flex items-center gap-2.5 py-2.5 px-3 bg-slate-50/50 dark:bg-[#111]/30 border border-slate-150 dark:border-[#222]/30 rounded-xl">
                          <input 
                            type="checkbox"
                            id="billingSameAsDelivery"
                            name="billingSameAsDelivery"
                            checked={!formData.billingSameAsDelivery}
                            onChange={(e) => {
                              const deviates = e.target.checked;
                              setFormData(prev => {
                                const updated = { 
                                  ...prev, 
                                  billingSameAsDelivery: !deviates 
                                };
                                if (!deviates) {
                                  updated.street = prev.billingStreet || '';
                                  updated.houseNumber = prev.billingHouseNumber || '';
                                  updated.zipCode = prev.billingZipCode || '';
                                  updated.city = prev.billingCity || '';
                                }
                                return updated;
                              });
                              if (deviates) {
                                setActiveAddressTab('delivery');
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 dark:border-[#333] text-indigo-600 focus:ring-indigo-550 cursor-pointer"
                          />
                          <label htmlFor="billingSameAsDelivery" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            Abweichende Lieferadresse eingeben
                          </label>
                        </div>
                      )}

                      {Boolean(((formData.street && formData.street.trim().length >= 2) || (formData.billingStreet && formData.billingStreet.trim().length >= 2)) && formData.distanceKm && formData.driveTimeMin) && (
                        <div 
                          onClick={openRouteInMaps}
                          className="col-span-1 md:col-span-2 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-150 dark:border-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700/50 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer group transition-all"
                          title="Route in Maps öffnen (Apple / Google Maps)"
                        >
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500/80 dark:text-indigo-400/80">
                              Anfahrt / Route ({activeStudioAddress.name || (activeStudioAddress.city ? `Studio ${activeStudioAddress.city}` : 'Küchenstudio')})
                            </p>
                            <div className="flex justify-between items-end mt-1">
                              <span className="text-lg font-bold text-indigo-900 dark:text-indigo-200">{formData.distanceKm} km</span>
                              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{formData.driveTimeMin} Min. Fahrtzeit</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRouteInMaps();
                            }}
                            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-600/10 shrink-0 transition-all cursor-pointer"
                            title="Route in Apple / Google Maps öffnen"
                          >
                            <Car className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      <InputField label="Telefon" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                      <InputField label="Mobil" name="mobile" type="tel" value={formData.mobile || ''} onChange={handleChange} />
                      <InputField label="E-Mail*" name="email" type="email" value={formData.email} onChange={handleChange} />
                      <SelectField label="Wie haben Sie zu uns gefunden?" name="source" options={activeSources} value={formData.source} onChange={handleChange} />
                      <InputField label="Budget" name="budget" type="text" suffix="€" placeholder="0,00" value={formData.budget} onChange={handleChange} />
                      <InputField label="Bedarfs-Zeitpunkt (Timeline)" name="timeline" placeholder="z.B. Frühjahr 2027, schnellstmöglich" value={formData.timeline} onChange={handleChange} />
                    </div>
                  </SectionCard>
                )}
                {/* STEPPER NAVIGATION FOOTER */}
                <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(prev => Math.max(1, prev - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151c2c] hover:bg-slate-50 dark:hover:bg-[#1c263c] text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Zurück</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(prev => Math.min(4, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                    >
                      <span>Weiter</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/20 disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <span>Wird gespeichert...</span>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{editingId ? 'Änderungen speichern' : 'Bedarf speichern'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN: Live Summary Box (Visible on Desktop / Horizontal view) */}
              <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col h-full lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]">
                <LiveSummaryBox
                  formData={formData}
                  editingId={editingId}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                  onResetDraft={() => setShowResetConfirmModal(true)}
                  onOpenMeterCalculation={() => setIsMeterCalculationOpen(true)}
                />
              </div>
            </div>
          </form>
        )}

        {/* Floating Side Handle Tab: Docked subtly to right edge on Mobile & Vertical Tablet */}
        {currentView === 'new' && (
          <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 lg:hidden pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsSummaryDrawerOpen(true)}
              className="group flex flex-col items-center justify-center gap-1 bg-slate-900/85 hover:bg-slate-900 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-white pl-2 pr-1.5 py-3 rounded-l-xl shadow-lg border-y border-l border-slate-700/60 dark:border-slate-700/80 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="Zusammenfassung öffnen"
              aria-label="Zusammenfassung öffnen"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[10px] font-black text-indigo-300 leading-none tracking-tight">
                {summaryProgress}%
              </span>
            </button>
          </div>
        )}

        {/* Full-screen Overlay/Drawer for Mobile & Vertical Tablet */}
        <AnimatePresence>
          {currentView === 'new' && isSummaryDrawerOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed inset-0 z-50 w-full h-[100dvh] bg-white dark:bg-[#151c2c] flex flex-col overflow-hidden"
            >
              <LiveSummaryBox
                formData={formData}
                editingId={editingId}
                isSubmitting={isSubmitting}
                onSubmit={(e) => {
                  handleSubmit(e);
                  setIsSummaryDrawerOpen(false);
                }}
                currentStep={currentStep}
                onStepChange={(step) => {
                  setCurrentStep(step);
                  setIsSummaryDrawerOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onResetDraft={() => {
                  setShowResetConfirmModal(true);
                  setIsSummaryDrawerOpen(false);
                }}
                onClose={() => setIsSummaryDrawerOpen(false)}
                onOpenMeterCalculation={() => {
                  setIsSummaryDrawerOpen(false);
                  setIsMeterCalculationOpen(true);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- VIEW: SEARCH & SAVED LIST --- */}
        {currentView === 'list' && (
          <div className="pb-24 modal-fade">
            
            {/* Search, Filter Tools */}
            <div className="bg-white dark:bg-[#151c2c] rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3.5 md:p-4 mb-4 sm:mb-6 shadow-xs flex flex-col md:flex-row gap-2 sm:gap-3 items-stretch md:items-center">
              {/* Search Input */}
              <div className="relative flex-1 flex items-center">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-400 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Kunden, Ort, Tel. oder Berater suchen..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-700/80 rounded-xl py-2 sm:py-2.5 pl-9 sm:pl-11 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-[#0b0f19] focus:border-indigo-600 transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs ${searchTerm ? 'pr-9' : 'pr-3'}`}
                />
                {Boolean(searchTerm) && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
                    title="Suche leeren"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Categorization Dropdown by Consultant: ONLY available for Sys-Admin */}
              {userRole === 'admin' && (
                <div className="relative w-full md:w-64 flex items-center min-w-0">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 dark:text-indigo-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none shrink-0" />
                  <select 
                    value={filterConsultant}
                    onChange={(e) => setFilterConsultant(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-700/80 rounded-xl py-2 sm:py-2.5 pl-8 sm:pl-10 pr-7 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-[#0b0f19] focus:border-indigo-600 transition-all appearance-none cursor-pointer truncate shadow-2xs"
                  >
                    <option value="all" className="bg-white dark:bg-[#151c2c]">Alle Berater ({savedConsultations.length})</option>
                    {uniqueConsultants.map(c => (
                      <option key={c.email} value={c.email} className="bg-white dark:bg-[#151c2c]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {filteredConsultations.length === 0 ? (
              <div className="bg-white dark:bg-[#151c2c] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center justify-center text-center">
                <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Keine Planungen gefunden</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Es konnten keine Einträge passend zu Ihrer Filterung gefunden werden.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#151c2c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
                {filteredConsultations.map(consultation => {
                  const customerName = consultation.firstName || consultation.lastName 
                    ? `${consultation.firstName || ''} ${consultation.lastName || ''}`.trim() 
                    : 'Unbenannter Kunde';
                  
                  const locationStr = [consultation.zipCode, consultation.city].filter(Boolean).join(' ');

                  return (
                    <div 
                      key={consultation.id} 
                      onClick={() => setDetailConsultation(consultation)}
                      className="p-3 sm:px-4 sm:py-3.5 hover:bg-slate-50/80 dark:hover:bg-[#111726]/70 transition-colors flex items-center justify-between gap-2.5 sm:gap-3 cursor-pointer group"
                    >
                      {/* Left: Name + Subtitle (Ort, Datum, Berater, Budget) */}
                      <div className="min-w-0 flex-1">
                        {/* Top row: Customer Name + Consultant Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {customerName}
                          </h4>
                          {(userRole === 'admin' && consultation.consultantEmail) && (
                            <span className="hidden sm:inline-flex bg-indigo-50/80 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                              {consultation.consultantEmail.split('@')[0]}
                            </span>
                          )}
                        </div>

                        {/* Bottom row: Ort, Datum, ggf. Tel / Budget */}
                        <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                          {locationStr ? (
                            <span className="flex items-center gap-1 shrink-0">
                              <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span className="truncate max-w-[120px] sm:max-w-none">{locationStr}</span>
                            </span>
                          ) : null}
                          
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{renderDate(consultation.createdAt)}</span>
                          </span>

                          {consultation.budget && (
                            <span className="hidden md:flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                              <Wallet className="w-3 h-3 text-violet-500 shrink-0" />
                              <span>{consultation.budget} €</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Action Buttons (Edit, Delete) */}
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleEdit(consultation)}
                          className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          title="Bedarfsermittlung laden und bearbeiten"
                        >
                          <Edit2 className="w-4 h-4 text-indigo-500" />
                          <span className="hidden md:inline">Bearbeiten</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteClick(consultation)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900/40 transition-all cursor-pointer"
                          title="Eintrag löschen"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>



      {/* --- FULLSCREEN PLAN & MEASUREMENT LIGHTBOX MODAL --- */}
      <LightboxModal
        lightboxIndex={lightboxIndex}
        lightboxConsultation={lightboxConsultation}
        formData={formData}
        onClose={() => { setLightboxIndex(null); setLightboxConsultation(null); }}
        onIndexChange={(newIndex) => setLightboxIndex(newIndex)}
      />

      {/* APPLIANCE OPTIONS MODAL */}
      <ApplianceModal
        activeApplianceKey={activeApplianceKey}
        activeApplianceConfig={activeApplianceConfig}
        appliancesData={formData.appliances}
        onClose={() => setActiveApplianceKey(null)}
        onToggleOption={(key, option) => handleApplianceDetailToggle(key, option)}
        onResetOptions={(key) => {
          setFormData(prev => ({
            ...prev,
            appliances: {
              ...prev.appliances,
              [key]: {
                ...prev.appliances[key as keyof Appliances],
                needed: false,
                details: []
              }
            }
          }));
        }}
      />

      {/* ADMIN CATALOG MANAGER MODAL */}
      <AdminCatalogModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        customCatalog={customCatalog}
        saveCustomCatalog={saveCustomCatalog}
        setToast={setToast}
        currentStudioCoords={currentStudioCoords}
        lastCustomerCoords={lastCustomerCoords}
        calculateRouteToStudio={calculateRouteToStudio}
        activeApplianceConfig={activeApplianceConfig}
        activeManufacturers={activeManufacturers}
        activeFrontMaterials={activeFrontMaterials}
        activeFrontColors={activeFrontColors}
        activeFaucets={activeFaucets}
        activeWasteBins={activeWasteBins}
        activeSources={activeSources}
        activeStudioAddress={activeStudioAddress}
      />
      {/* METER PREIS KALKULATION MODAL */}
      <MeterCalculationModal
        isOpen={isMeterCalculationOpen && canShowMeterCalculation}
        onClose={() => setIsMeterCalculationOpen(false)}
        customCatalog={customCatalog}
        userRole={userRole}
        onOpenAdminCatalog={() => {
          setIsMeterCalculationOpen(false);
          setIsAdminOpen(true);
        }}
        onApplyToConsultation={handleApplyCalculatedMeterPrice}
        setToast={setToast}
      />

      {/* RESET DRAFT CONFIRMATION MODAL */}
      <ResetConfirmModal
        isOpen={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        onConfirm={handleConfirmResetDraft}
      />

      {/* DELETE CONSULTATION CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={Boolean(consultationToDelete)}
        onClose={() => {
          if (!isDeletingConsultation) setConsultationToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        customerName={consultationToDelete ? (
          consultationToDelete.firstName || consultationToDelete.lastName
            ? `${consultationToDelete.firstName || ''} ${consultationToDelete.lastName || ''}`.trim()
            : 'Unbenannter Kunde'
        ) : undefined}
        isDeleting={isDeletingConsultation}
      />

      {/* CUSTOMER DETAIL MODAL / BOTTOM SHEET (MASTER-DETAIL) */}
      <CustomerDetailModal
        isOpen={Boolean(detailConsultation)}
        consultation={detailConsultation}
        onClose={() => setDetailConsultation(null)}
        onEdit={(consultation) => {
          setDetailConsultation(null);
          handleEdit(consultation);
        }}
        onDelete={(consultation) => {
          handleDeleteClick(consultation);
        }}
        onOpenLightbox={(consultation, index) => {
          setLightboxConsultation(consultation);
          setLightboxIndex(index);
        }}
        userRole={userRole}
      />

      {/* USER PROFILE & PERMISSIONS MANAGEMENT MODAL */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        userRole={userRole}
        userPermissionsList={userPermissionsList}
        onAddUserPermission={handleAddUserPermission}
        onUpdateUserRole={handleUpdateUserRole}
        onDeleteUserPermission={handleDeleteUserPermission}
        onToggleMeterCalculation={handleToggleMeterCalculation}
        onUpdateGoogleDriveFolder={handleUpdateGoogleDriveFolder}
        onLogout={handleLogout}
      />
    </div>
  );
}
