import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, oauthClientId } from '../firebase';

declare global {
  interface Window {
    google?: any;
  }
}

let cachedAccessToken: string | null = null;

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity SDK konnte nicht geladen werden.'));
    document.head.appendChild(script);
  });
}

/**
 * Extracts Google Drive Folder ID from a full Drive URL or raw folder ID string.
 */
export function extractDriveFolderId(urlOrId: string | null | undefined): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;
  
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Prompts user to authenticate with Google Drive scope.
 * Uses direct Google Identity Services (GIS) Token Client if available (bypassing Firebase Auth domain checks),
 * and falls back to Firebase Auth Popup if GIS is unavailable.
 */
export async function authenticateGoogleDrive(): Promise<string> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  // 1. Try Google Identity Services (GIS) token client directly with OAuth Client ID
  if (oauthClientId) {
    try {
      await loadGsiScript();
      if (window.google?.accounts?.oauth2) {
        return await new Promise<string>((resolve, reject) => {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: oauthClientId,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: (response: any) => {
              if (response.error) {
                reject(new Error(response.error_description || response.error));
                return;
              }
              if (response.access_token) {
                cachedAccessToken = response.access_token;
                resolve(response.access_token);
              } else {
                reject(new Error('Kein Zugriffs-Token von Google erhalten.'));
              }
            },
            error_callback: (err: any) => {
              reject(new Error(err?.message || 'OAuth Fehler'));
            }
          });
          client.requestAccessToken({ prompt: 'consent' });
        });
      }
    } catch (gsiError: any) {
      console.warn('GIS Auth attempt failed, falling back to Firebase Auth:', gsiError);
    }
  }

  // 2. Fallback to Firebase Auth Popup
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.setCustomParameters({
    prompt: 'consent'
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Kein Zugriffs-Token von Google erhalten.');
    }
    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (err: any) {
    console.error('Google Drive Auth Fehler:', err);
    if (err?.code === 'auth/popup-closed-by-user') {
      throw new Error('Das Anmeldefenster wurde abgebrochen.');
    }
    if (err?.code === 'auth/unauthorized-domain' || (err?.message && err.message.includes('unauthorized-domain'))) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      throw new Error(`Firebase Auth Domain-Fehler (auth/unauthorized-domain): Die Domain "${currentHost}" muss in der Firebase Console unter Authentication -> Settings -> Authorized Domains eingetragen werden.`);
    }
    throw new Error(err?.message || 'Fehler bei der Google Drive Autorisierung.');
  }
}

/**
 * Converts Data URL (base64) into Blob
 */
function dataURLtoBlob(dataurl: string): { blob: Blob; mimeType: string } {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return { blob: new Blob([u8arr], { type: mimeType }), mimeType };
}

export interface UploadToDriveResult {
  fileId: string;
  webViewLink: string;
}

/**
 * Uploads a file (base64 Data URL) directly to a specified Google Drive folder.
 */
export async function uploadFileToDrive(params: {
  accessToken: string;
  folderId?: string | null;
  fileName: string;
  fileDataUrl: string;
}): Promise<UploadToDriveResult> {
  const { accessToken, folderId, fileName, fileDataUrl } = params;

  const { blob, mimeType } = dataURLtoBlob(fileDataUrl);

  const metadata: Record<string, any> = {
    name: fileName,
    mimeType: mimeType,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' })
  );
  formData.append('file', blob);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Drive API Upload Error Response:', errorText);
    
    if (response.status === 401) {
      cachedAccessToken = null; // reset token so user re-authenticates
      throw new Error('Google Sitzung abgelaufen. Bitte erneut anmelden.');
    }
    if (response.status === 404 || errorText.includes('File not found')) {
      throw new Error('Der Google Drive Ziel-Ordner wurde nicht gefunden oder ist nicht freigegeben.');
    }
    throw new Error(`Google Drive Upload fehlgeschlagen (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  return {
    fileId: data.id,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
  };
}
