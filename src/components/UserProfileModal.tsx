import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserRole, UserPermission } from '../types';
import { authenticateGoogleDrive } from '../utils/googleDrive';
import { 
  X, UserCheck, Shield, ShieldAlert, LogOut, Plus, Trash2, Mail, 
  CheckCircle2, AlertCircle, User, Crown, Briefcase, RefreshCw,
  Folder, FolderPlus, ExternalLink, HardDrive, Save, Edit3, Check, Copy, Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  userRole: UserRole;
  userPermissionsList: UserPermission[];
  onAddUserPermission: (email: string, role: UserRole) => Promise<void>;
  onUpdateUserRole: (id: string, newRole: UserRole) => Promise<void>;
  onDeleteUserPermission: (id: string) => Promise<void>;
  onToggleMeterCalculation?: (idOrEmail: string, enabled: boolean) => Promise<void>;
  onUpdateGoogleDriveFolder?: (driveUrl: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  userRole,
  userPermissionsList,
  onAddUserPermission,
  onUpdateUserRole,
  onDeleteUserPermission,
  onToggleMeterCalculation,
  onUpdateGoogleDriveFolder,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'drive'>('users');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('berater');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Google Drive Folder state
  const cleanUserEmail = user?.email?.toLowerCase().trim() || '';
  const currentUserPermission = userPermissionsList.find(p => p.email.toLowerCase().trim() === cleanUserEmail);
  const savedDriveUrl = currentUserPermission?.googleDriveFolderUrl || 
    (typeof window !== 'undefined' ? localStorage.getItem(`kk_user_drive_folder_${cleanUserEmail}`) || '' : '');

  const [driveInput, setDriveInput] = useState(savedDriveUrl);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [driveSuccess, setDriveSuccess] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [isEditingDrive, setIsEditingDrive] = useState(false);
  const [isAuthDriveLoading, setIsAuthDriveLoading] = useState(false);

  useEffect(() => {
    setDriveInput(savedDriveUrl);
  }, [savedDriveUrl]);

  const handleAuthDrive = async () => {
    setIsAuthDriveLoading(true);
    setDriveError(null);
    setDriveSuccess(null);
    try {
      const token = await authenticateGoogleDrive();
      if (token) {
        setDriveSuccess('✓ Google Drive Konto erfolgreich autorisiert & verbunden!');
      }
    } catch (err: any) {
      setDriveError(err?.message || 'Google Drive Autorisierung fehlgeschlagen.');
    } finally {
      setIsAuthDriveLoading(false);
    }
  };

  if (!isOpen) return null;

  const isSysAdmin = userRole === 'admin' || cleanUserEmail === 'belmonte@fs-kuechen.de';

  const handleSaveDriveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriveError(null);
    setDriveSuccess(null);

    setIsSavingDrive(true);
    try {
      let url = driveInput.trim();
      // If user provided a raw folder ID without protocol, turn it into full Google Drive folder link
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://drive.google.com/drive/folders/${url}`;
        setDriveInput(url);
      }

      if (onUpdateGoogleDriveFolder) {
        await onUpdateGoogleDriveFolder(url);
      } else if (cleanUserEmail) {
        localStorage.setItem(`kk_user_drive_folder_${cleanUserEmail}`, url);
      }

      setDriveSuccess(url ? 'Google Drive Ordner erfolgreich gespeichert!' : 'Google Drive Ordner-Verknüpfung entfernt.');
      setIsEditingDrive(false);
    } catch (err: any) {
      console.error('Fehler beim Speichern des Drive Ordners:', err);
      setDriveError('Fehler beim Speichern. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSavingDrive(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Ungültiges E-Mail-Format.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddUserPermission(cleanEmail, newRole);
      setSuccessMsg(`Benutzer ${cleanEmail} wurde als ${newRole === 'admin' ? 'Sys-Admin' : 'Berater'} hinzugefügt.`);
      setNewEmail('');
      setNewRole('berater');
    } catch (err: any) {
      console.error('Fehler beim Hinzufügen:', err);
      setError('Fehler beim Hinzufügen des Benutzers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserInitials = (email: string | null) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split(/[\._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#151c2c] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#0f1523]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <UserCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Benutzerprofil & Rechteverwaltung
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 min-h-[380px] max-h-[75vh] overflow-y-auto">
          
          {/* Reiterkarten / Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Benutzerverwaltung</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('drive')}
              className={`flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
                activeTab === 'drive'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span>Drive</span>
              {savedDriveUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Ordner verknüpft"></span>
              )}
            </button>
          </div>

          {/* REITER 1: BENUTZERVERWALTUNG */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Benutzerverwaltung & Rollen
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {userPermissionsList.length + 1} Berechtigte
                </span>
              </div>

              {isSysAdmin ? (
                <>
                  {/* Form to add user */}
                  <form onSubmit={handleAddUser} className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 block">
                      Neuen zugriffsberechtigten Benutzer freischalten
                    </span>

                    {error && (
                      <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>{error}</span>
                      </div>
                    )}

                    {successMsg && (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span>{successMsg}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <div className="relative flex-1 w-full">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="neuer.kollege@fs-kuechen.de"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
                        />
                      </div>

                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full sm:w-36 py-2 px-3 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                      >
                        <option value="berater">Berater</option>
                        <option value="admin">Sys-Admin</option>
                      </select>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isSubmitting ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Hinzufügen</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* List of Users */}
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                      Hinterlegte Berechtigungen
                    </div>

                    {/* Fixed Sys-Admin belmonte@fs-kuechen.de item */}
                    {(() => {
                      const belmontePerm = userPermissionsList.find(p => p.email.toLowerCase().trim() === 'belmonte@fs-kuechen.de');
                      const belmonteCalcEnabled = belmontePerm?.showMeterCalculation !== undefined
                        ? belmontePerm.showMeterCalculation
                        : (typeof window !== 'undefined' ? localStorage.getItem('kk_user_meter_calc_belmonte@fs-kuechen.de') !== 'false' : true);

                      return (
                        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0">
                              <Crown className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                <span className="truncate">belmonte@fs-kuechen.de</span>
                                <span className="text-[10px] text-slate-400 font-medium shrink-0">(Haupt-Admin)</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                  Dauerhaft autorisiert
                                </span>
                                <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
                                <span className={`text-[10px] font-semibold ${belmonteCalcEnabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                  Kalkulator {belmonteCalcEnabled ? 'aktiviert' : 'deaktiviert'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 justify-end sm:justify-start pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60 shrink-0">
                            {/* Button links neben der Rolle: Meterpreis-Kalkulator an / aus */}
                            <button
                              type="button"
                              onClick={() => onToggleMeterCalculation?.(belmontePerm?.id || 'belmonte@fs-kuechen.de', !belmonteCalcEnabled)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                belmonteCalcEnabled
                                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 shadow-2xs'
                                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                              title={belmonteCalcEnabled ? 'Meterpreis-Kalkulator ist AKTIV (Klicken zum Ausschalten)' : 'Meterpreis-Kalkulator ist DEAKTIVIERT (Klicken zum Einschalten)'}
                            >
                              <Calculator className={`w-3.5 h-3.5 ${belmonteCalcEnabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                              <span>Kalkulator: {belmonteCalcEnabled ? 'An' : 'Aus'}</span>
                            </button>

                            <span className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center">
                              Sys-Admin
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* List items from Firestore */}
                    {userPermissionsList
                      .filter(p => p.email.toLowerCase() !== 'belmonte@fs-kuechen.de')
                      .map((p) => {
                        const isCurrentUser = user?.email?.toLowerCase() === p.email.toLowerCase();
                        const isCalcEnabled = p.showMeterCalculation !== false;

                        return (
                          <div
                            key={p.id}
                            className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0f1523] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                                p.role === 'admin' 
                                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}>
                                {p.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate">{p.email}</span>
                                  {isCurrentUser && (
                                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">Sie</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[10px] font-bold ${p.role === 'admin' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {p.role === 'admin' ? 'Sys-Admin' : 'Berater'}
                                  </span>
                                  <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
                                  <span className={`text-[10px] font-semibold ${isCalcEnabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                    Kalkulator {isCalcEnabled ? 'aktiviert' : 'deaktiviert'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 justify-end sm:justify-start pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60 shrink-0">
                              {/* Button links neben der Rolle: Meterpreis-Kalkulator an / aus */}
                              <button
                                type="button"
                                onClick={() => onToggleMeterCalculation?.(p.id, !isCalcEnabled)}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                  isCalcEnabled
                                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                                title={isCalcEnabled ? 'Meterpreis-Kalkulator ist AKTIV (Klicken zum Ausschalten)' : 'Meterpreis-Kalkulator ist DEAKTIVIERT (Klicken zum Einschalten)'}
                              >
                                <Calculator className={`w-3.5 h-3.5 ${isCalcEnabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                <span>Kalkulator: {isCalcEnabled ? 'An' : 'Aus'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onUpdateUserRole(p.id, p.role === 'admin' ? 'berater' : 'admin')}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/60 dark:border-slate-700"
                                title="Rolle ändern"
                              >
                                <RefreshCw className="w-3 h-3 text-slate-400" />
                                <span>Rolle: {p.role === 'admin' ? 'Sys-Admin' : 'Berater'}</span>
                              </button>

                              {!isCurrentUser && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteUserPermission(p.id)}
                                  className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-all cursor-pointer border border-rose-500/20"
                                  title="Zugriff entfernen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1">
                    <p className="font-bold">Eingeschränkter Berater-Zugang</p>
                    <p className="text-amber-800/80 dark:text-amber-300/80 leading-relaxed font-medium">
                      Die Verwaltung von weiteren Benutzern und deren Rollen ist dem Sys-Admin vorbehalten. Sie sind derzeit als <strong>Berater</strong> registriert.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REITER 2: GOOGLE DRIVE ORDNER */}
          {activeTab === 'drive' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Google Drive Ordner (Raummaße & Scans)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Externe Dokumentenablage zur Entlastung des Firebase-Speichers
                    </p>
                  </div>
                </div>
                {savedDriveUrl && !isEditingDrive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Ordner verknüpft
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Hinterlegen Sie hier Ihren eigenen oder den zentralen Google Drive Ordner-Link. Eingescannte Grundrisse und Raummaß-Dokumente können künftig direkt in Ihren Google Drive Ordner abgelegt werden.
              </p>

              {driveError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span className="flex-1 leading-relaxed">{driveError}</span>
                  </div>
                  {(driveError.includes('unauthorized-domain') || driveError.includes('Authorized Domains')) && (
                    <div className="pt-2 border-t border-rose-500/20 text-[11px] font-normal text-slate-700 dark:text-slate-300 space-y-2">
                      <p className="font-bold text-rose-800 dark:text-rose-300">
                        Anleitung zur Freischaltung in Firebase:
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                        <li>Öffnen Sie Ihre <strong>Firebase Console</strong>.</li>
                        <li>Gehen Sie zu <strong>Authentication</strong> → <strong>Einstellungen</strong> → <strong>Autorisierte Domains</strong>.</li>
                        <li>Fügen Sie diese Domain hinzu: <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-slate-900 dark:text-white select-all">{window.location.hostname}</code></li>
                      </ol>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.hostname);
                          setDriveSuccess('✓ Domain "' + window.location.hostname + '" in die Zwischenablage kopiert!');
                        }}
                        className="mt-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5 text-blue-500" />
                        <span>Domain kopieren ({window.location.hostname})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {driveSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{driveSuccess}</span>
                </div>
              )}

              {/* If folder is configured and user is not editing, show action card */}
              {savedDriveUrl && !isEditingDrive ? (
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1 overflow-hidden max-w-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Hinterlegter Google Drive Ziel-Ordner
                    </span>
                    <a
                      href={savedDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 truncate max-w-full"
                      title={savedDriveUrl}
                    >
                      <Folder className="w-4 h-4 shrink-0 text-blue-500" />
                      <span className="truncate">{savedDriveUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 ml-0.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <a
                      href={savedDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ordner öffnen</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsEditingDrive(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ändern</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Input form for Google Drive folder */
                <form onSubmit={handleSaveDriveFolder} className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <div className="relative flex-1 w-full">
                      <HardDrive className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={driveInput}
                        onChange={(e) => setDriveInput(e.target.value)}
                        placeholder="https://drive.google.com/drive/folders/IHRE_ORDNER_ID oder Ordner-ID"
                        className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="submit"
                        disabled={isSavingDrive}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isSavingDrive ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Ordner speichern</span>
                          </>
                        )}
                      </button>

                      {savedDriveUrl && isEditingDrive && (
                        <button
                          type="button"
                          onClick={() => {
                            setDriveInput(savedDriveUrl);
                            setIsEditingDrive(false);
                          }}
                          className="px-3 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer shrink-0"
                        >
                          Abbrechen
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">
                    Tipp: Kopieren Sie einfach den Link zu Ihrem Google Drive Ordner aus der Adresszeile Ihres Browsers und fügen Sie ihn hier ein.
                  </p>
                </form>
              )}

              {/* OAuth Auth Connect Button */}
              <div className="pt-3 border-t border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Google Drive Verbindung & Rechte
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Direkte Uploads aus der App in Ihren verknüpften Ordner freischalten
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAuthDrive}
                  disabled={isAuthDriveLoading}
                  className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-[#0b0f19] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  {isAuthDriveLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>Google Drive freigeben</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0f1523]/50 flex items-center justify-end">
          <button
            type="button"
            onClick={async () => {
              await onLogout();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Konto abmelden"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Abmelden</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
