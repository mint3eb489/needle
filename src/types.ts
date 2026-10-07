export interface HandleStyles {
  grifflos: boolean;
  griffleisten: boolean;
  griffe: boolean;
}

export interface HandleNotes {
  grifflos: string;
  griffleisten: string;
  griffe: string;
}

export interface WorktopTypes {
  schichtstoff: boolean;
  naturstein: boolean;
  dekton: boolean;
}

export interface WorktopNotes {
  schichtstoff: string;
  naturstein: string;
  dekton: string;
}

export interface ApplianceDetail {
  needed: boolean;
  details: string[];
}

export interface Appliances {
  kochfeld: ApplianceDetail;
  backofen: ApplianceDetail;
  dunstabzug: ApplianceDetail;
  mikrowelle: ApplianceDetail;
  geschirrspueler: ApplianceDetail;
  kuehlschrank: ApplianceDetail;
  dampfgarer: ApplianceDetail;
  spuelbecken: ApplianceDetail;
}

export interface FormData {
  firstName: string;
  lastName: string;
  street: string;
  houseNumber: string;
  zipCode: string;
  city: string;
  billingStreet?: string;
  billingHouseNumber?: string;
  billingZipCode?: string;
  billingCity?: string;
  billingSameAsDelivery?: boolean;
  phone: string;
  mobile?: string;
  email: string;
  source: string;
  budget: string;
  timeline: string;
  manufacturer: string;
  frontMaterial: string;
  frontColor: string;
  hasSecondFront: boolean;
  secondFrontMaterial: string;
  secondFrontColor: string;
  hasThirdFront?: boolean;
  thirdFrontMaterial?: string;
  thirdFrontColor?: string;
  handleStyles: HandleStyles;
  handleNotes: HandleNotes;
  worktopTypes: WorktopTypes;
  worktopNotes: WorktopNotes;
  workHeight: string;
  roomHeight: string;
  sillHeight: string;
  ceilingHigh: boolean;
  ceilingPanel: boolean;
  appliances: Appliances;
  faucet: string;
  wasteBin: string;
  notes: string;
  distanceKm: string | number;
  driveTimeMin: string | number;
  plzValidated?: boolean;
  plzWithinRange?: boolean;
  floorPlans?: CustomFloorPlan[];
  consultantEmail?: string;
  consultantName?: string;
}

export interface CustomFloorPlan {
  id: string;
  name: string;
  url: string; // Base64 data-URL or file reference
  uploadDate: string;
  description: string;
  dimensions?: string; // Manual dimensions entered by consultation
  driveFileId?: string;
  driveWebViewLink?: string;
  driveStatus?: 'pending' | 'uploading' | 'uploaded' | 'error';
  driveError?: string;
}

export interface StudioAddress {
  name: string;
  street: string;
  houseNumber: string;
  zipCode: string;
  city: string;
  lat?: number;
  lon?: number;
}

export interface PriceGroupOption {
  id: string;
  name: string;
  pricePerMeter: number;
  description?: string;
}

export interface AppliancePackageOption {
  id: string;
  name: string;
  subtitle?: string;
  price: number;
  description?: string;
  items?: string[];
}

export interface CustomCatalogOptions {
  appliances: Record<string, string[]>;
  manufacturers: string[];
  frontMaterials: Record<string, string[]>;
  frontColors?: Record<string, Record<string, string[]>>;
  faucets: string[];
  wasteBins: string[];
  sources?: string[];
  studioAddress?: StudioAddress;
  priceGroups?: PriceGroupOption[];
  appliancePackages?: AppliancePackageOption[];
  deliveryAssemblyPercentage?: number;
  standardAssemblyRatePerMeter?: number;
  deliveryFlatRate?: number;
}

export interface Consultation extends FormData {
  id: string;
  createdAt?: any;
  updatedAt?: any;
  docPath?: string;
  consultantUserId?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type UserRole = 'admin' | 'berater';

export interface UserPermission {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  googleDriveFolderUrl?: string;
  googleDriveFolderId?: string;
  showMeterCalculation?: boolean;
  createdAt?: any;
  updatedAt?: any;
}
