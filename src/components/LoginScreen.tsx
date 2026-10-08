import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from './BrandLogo';

interface LoginScreenProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ isDark, onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateAuthError = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'E-Mail-Adresse oder Passwort ist falsch. Bitte überprüfen Sie Ihre Eingabe.';
      case 'auth/invalid-email':
        return 'Geben Sie eine gültige E-Mail-Adresse ein.';
      case 'auth/user-disabled':
        return 'Dieses Konto wurde deaktiviert. Bitte kontaktieren Sie den Administrator.';
      case 'auth/too-many-requests':
        return 'Zu viele gescheiterte Anmeldeversuche. Bitte warten Sie einen Moment.';
      case 'auth/network-request-failed':
        return 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
      case 'auth/operation-not-allowed':
        return 'E-Mail/Passwort-Anmeldung ist im Firebase-Projekt noch nicht aktiviert (Firebase Console > Authentication > Sign-in method).';
      case 'auth/unauthorized-domain':
        return 'Diese Domain ist in Firebase nicht autorisiert (Firebase Console > Authentication > Settings > Authorized domains).';
      case 'auth/api-key-not-valid':
        return 'Ungültiger Firebase API-Key. Bitte Konfiguration überprüfen.';
      default:
        return errorCode 
          ? `Anmeldung fehlgeschlagen (${errorCode}). Bitte Anmeldedaten und Firebase-Projekt überprüfen.`
          : 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }

    if (!password) {
      setError('Bitte geben Sie Ihr Passwort ein.');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err: any) {
      console.error('Login-Fehler:', err);
      const code = err?.code || '';
      setError(translateAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-[#0b0f19] flex items-center justify-center app-container-safe transition-colors duration-200">
      
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl transform -translate-y-12"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10"
      >
        
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800/80 text-center relative bg-slate-50/50 dark:bg-[#0f1523]/50">
          
          <div className="mx-auto w-16 h-16 flex items-center justify-center mb-3 transform hover:scale-105 transition-transform">
            <BrandLogo className="w-16 h-16" roundedClassName="rounded-2xl" />
          </div>

          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
            needle
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Web-App für Küchen-Bedarfsermittlung
          </p>

          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/40 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
            <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Gesicherter Mitarbeiter-Zugang</span>
          </div>
        </div>

        {/* Form Area */}
        <div className="p-6 sm:p-8 space-y-5">
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kuechenstudio.de"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-600 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Passwort
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-600 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>



            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-60 active:scale-[0.99] mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Anmeldung läuft...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>Anmelden</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5] ml-auto opacity-70" />
                </>
              )}
            </button>
          </form>

          {/* Additional Info Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Verbindung ist über SSL/TLS verschlüsselt und durch Firebase Authentifizierung geschützt.
          </div>

        </div>
      </motion.div>
    </div>
  );
};
