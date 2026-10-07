import { FormData, CustomCatalogOptions, PriceGroupOption, AppliancePackageOption } from './types';

export const STUDIO_COORDS = { lon: 8.851019739649697, lat: 48.26905474455655 }; // Dein Studio in Balingen

export const DEFAULT_PRICE_GROUPS: PriceGroupOption[] = [
  { id: 'pg-1', name: 'Preisgruppe 1 (PG 1)', pricePerMeter: 1250 },
  { id: 'pg-2', name: 'Preisgruppe 2 (PG 2)', pricePerMeter: 1490 },
  { id: 'pg-3', name: 'Preisgruppe 3 (PG 3)', pricePerMeter: 1780 },
  { id: 'pg-4', name: 'Preisgruppe 4 (PG 4)', pricePerMeter: 2150 },
  { id: 'pg-5', name: 'Preisgruppe 5 (PG 5)', pricePerMeter: 2590 },
  { id: 'pg-6', name: 'Preisgruppe 6 (PG 6)', pricePerMeter: 3100 },
  { id: 'pg-7', name: 'Preisgruppe 7 (PG 7)', pricePerMeter: 3690 },
  { id: 'pg-8', name: 'Preisgruppe 8 (PG 8)', pricePerMeter: 4350 },
];

export const DEFAULT_APPLIANCE_PACKAGES: AppliancePackageOption[] = [
  {
    id: 'pkg-1',
    name: 'Basis-Gerätepaket',
    subtitle: 'Solide Markengeräte für den idealen Einstieg',
    price: 2890,
    description: 'Induktionskochfeld 60cm, Multifunktions-Backofen, Flachschirmhaube, Vollintegrierter Geschirrspüler, Einbau-Kühlschrank 178cm',
    items: [
      'Induktionskochfeld 60 cm',
      'Einbau-Backofen mit Heißluft',
      'Dunstabzugshaube / Flachlüfter',
      'Geschirrspüler vollintegriert',
      'Kühl-Gefrierkombination 178 cm'
    ]
  },
  {
    id: 'pkg-2',
    name: 'Komfort-Gerätepaket',
    subtitle: 'Beliebteste Ausstattung mit Muldenlüfter & Pyrolyse',
    price: 4790,
    description: 'Flächeninduktion 80cm mit integriertem Kochfeldabzug, Backofen mit Pyrolyse-Selbstreinigung, Geschirrspüler XXL leise (42 dB), NoFrost Frischezone-Kühlschrank',
    items: [
      'Kochfeldabzug / Muldenlüfter 80 cm',
      'Backofen mit Pyrolyse-Selbstreinigung & Teleskopauszug',
      'Geschirrspüler XXL leise (42 dB) mit Besteckschublade',
      'Einbau-Kühlschrank mit Frischezone & NoFrost'
    ]
  },
  {
    id: 'pkg-3',
    name: 'Premium-Gerätepaket',
    subtitle: 'High-End Ausstattung für höchste Kochansprüche',
    price: 7990,
    description: 'High-End Muldenlüftungssystem (BORA/Miele), Dampfbackofen (Kombidampfgarer) + Wärmeschublade, Großraum-Geschirrspüler mit AutoDos, Großraum-Kühlschrank mit PerfectFresh Pro',
    items: [
      'Premium Kochfeldabzug (BORA / Miele)',
      'Kombi-Dampfbackofen mit Dampfgarfunktion',
      'Wärme- / Gourmet-Schublade',
      'Großraum-Geschirrspüler mit automatischer Dosierung',
      'Kühlschrank mit BioFresh / PerfectFresh Pro Frischesystem'
    ]
  }
];

export const DEFAULT_CUSTOM_CATALOG: CustomCatalogOptions = {
  appliances: {
    kochfeld: ['Induktion', 'Elektro', 'Gas', 'Flächeninduktion', 'vorhanden'],
    backofen: ['Standard (60cm)', 'Kompakt (45cm)', 'Pyrolyse', 'Dampfunterstützung', 'vorhanden'],
    dunstabzug: ['Schräghaube', 'Flachlüfter', 'Kochfeldabzug', 'Inselhaube', 'Lüfterbaustein', 'vorhanden'],
    mikrowelle: ['Einbau', 'Lifttür', 'vorhanden'],
    geschirrspueler: ['Vollintegriert', 'Teilintegriert', 'XXL', '45cm Breite', 'Korb', 'Schublade', 'vorhanden'],
    kuehlschrank: ['178er', '193er', '122er', 'Side-by-Side', 'mit Gefrierfach', 'vorhanden'],
    dampfgarer: ['Dampfbackofen', 'Kompaktgerät', 'vorhanden'],
    spuelbecken: ['Edelstahl', 'Silgranit/Quarz', 'Keramik', 'Unterbau', 'Flächenbündig', 'vorhanden']
  },
  manufacturers: ['Ballerina', 'Häcker'],
  frontMaterials: {
    'Ballerina': ['TOP', 'PUR', 'EDITION', 'RESOPAL', 'HPL', 'SMART'],
    'Häcker': ['UNO', 'TOP SOFT', 'TOP BRILLIANT', 'PERFECT SOFT', 'PERFECT BRILLIANT', 'COMET', 'VANCOUVER', 'TORONTO']
  },
  frontColors: {
    'Ballerina': {
      'TOP': ['Weiß Matt', 'Kristallweiß', 'Graphit Samtmatt', 'Schwarz Satin'],
      'PUR': ['Samtmatt Weiß', 'Samtmatt Sand', 'Samtmatt Eukalyptus'],
      'EDITION': ['Eiche Natur', 'Nussbaum', 'Beton Grau']
    },
    'Häcker': {
      'UNO': ['Polarweiß', 'Weiß', 'Magma', 'Perlgrau'],
      'TOP SOFT': ['Kristallweiß Samtmatt', 'Sand Samtmatt', 'Ozeanblaugrau Samtmatt'],
      'COMET': ['Beton Graphit', 'Beton Perlgrau', 'Spachtelbeton Opal']
    }
  },
  faucets: ['Keine Spezialarmatur', 'Quooker (Kochendwasser)', 'Blanco (Filtersystem / Brause)', 'Standardarmatur vorhanden'],
  wasteBins: ['2-fach Müllauszug', '3-fach Müllauszug', '4-fach Müllauszug', 'Kein Einbausystem'],
  sources: ['Auf Empfehlung', 'Internet / Social Media', 'Zeitung', 'Werbebanner', 'Laufkundschaft'],
  studioAddress: {
    name: 'Küchenstudio Balingen',
    street: 'Balinger Str.',
    houseNumber: '1',
    zipCode: '72336',
    city: 'Balingen',
    lat: 48.26905474455655,
    lon: 8.851019739649697
  },
  priceGroups: DEFAULT_PRICE_GROUPS,
  appliancePackages: DEFAULT_APPLIANCE_PACKAGES,
  deliveryAssemblyPercentage: 9.5,
  standardAssemblyRatePerMeter: 220,
  deliveryFlatRate: 190
};

export const applianceConfig = {
  kochfeld: { label: 'Kochfeld', options: ['Induktion', 'Elektro', 'Gas', 'Flächeninduktion', 'vorhanden'] },
  backofen: { label: 'Backofen', options: ['Standard (60cm)', 'Kompakt (45cm)', 'Pyrolyse', 'Dampfunterstützung', 'vorhanden'] },
  dunstabzug: { label: 'Dunstabzug', options: ['Schräghaube', 'Flachlüfter', 'Kochfeldabzug', 'Inselhaube', 'Lüfterbaustein', 'vorhanden'] },
  mikrowelle: { label: 'Mikrowelle', options: ['Einbau', 'Lifttür', 'vorhanden'] },
  geschirrspueler: { label: 'Geschirrspüler', options: ['Vollintegriert', 'Teilintegriert', 'XXL', '45cm Breite', 'Korb', 'Schublade', 'vorhanden'] },
  kuehlschrank: { label: 'Kühlschrank', options: ['178er', '193er', '122er', 'Side-by-Side', 'mit Gefrierfach', 'vorhanden'] },
  dampfgarer: { label: 'Dampfgarer', options: ['Dampfbackofen', 'Kompaktgerät', 'vorhanden'] },
  spuelbecken: { label: 'Spülbecken', options: ['Edelstahl', 'Silgranit/Quarz', 'Keramik', 'Unterbau', 'Flächenbündig', 'vorhanden'] },
};

export const frontMaterialOptions: Record<string, string[]> = {
  'Ballerina': ['TOP', 'PUR', 'EDITION', 'RESOPAL', 'HPL', 'SMART'],
  'Häcker': ['UNO', 'TOP SOFT', 'TOP BRILLIANT', 'PERFECT SOFT', 'PERFECT BRILLIANT', 'COMET', 'VANCOUVER', 'TORONTO']
};

export const initialAppliances = {
  kochfeld: { needed: false, details: [] },
  backofen: { needed: false, details: [] },
  dunstabzug: { needed: false, details: [] },
  mikrowelle: { needed: false, details: [] },
  geschirrspueler: { needed: false, details: [] },
  kuehlschrank: { needed: false, details: [] },
  dampfgarer: { needed: false, details: [] },
  spuelbecken: { needed: false, details: [] },
};

export const defaultInitialState: FormData = {
  firstName: '',
  lastName: '',
  street: '',
  houseNumber: '',
  zipCode: '',
  city: '',
  billingStreet: '',
  billingHouseNumber: '',
  billingZipCode: '',
  billingCity: '',
  billingSameAsDelivery: true,
  phone: '',
  mobile: '',
  email: '',
  source: '',
  budget: '',
  timeline: '',
  manufacturer: '',
  frontMaterial: '',
  frontColor: '',
  hasSecondFront: false,
  secondFrontMaterial: '',
  secondFrontColor: '',
  hasThirdFront: false,
  thirdFrontMaterial: '',
  thirdFrontColor: '',
  handleStyles: { grifflos: false, griffleisten: false, griffe: false },
  handleNotes: { grifflos: '', griffleisten: '', griffe: '' },
  worktopTypes: { schichtstoff: false, naturstein: false, dekton: false },
  worktopNotes: { schichtstoff: '', naturstein: '', dekton: '' },
  workHeight: '',
  roomHeight: '',
  sillHeight: '',
  ceilingHigh: false,
  ceilingPanel: false,
  appliances: JSON.parse(JSON.stringify(initialAppliances)),
  faucet: '',
  wasteBin: '',
  notes: '',
  distanceKm: '',
  driveTimeMin: '',
  plzValidated: false,
  plzWithinRange: true,
  floorPlans: []
};
