import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/initialData';
import { loginWithGoogleApi } from '../utils/api';
import {
  ShieldCheck,
  Building2,
  Users,
  Briefcase,
  Clock,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LoginPageProps {
  onLogin?: (user: User) => void;
  onSelectUserRole?: (user: User) => void;
  users?: User[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSelectUserRole }) => {
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showDevPersonas, setShowDevPersonas] = useState(false);
  const initializedRef = useRef(false);

  const registeredAccounts = [
    { role: 'admin' as UserRole, title: 'Admin', email: 'balram6604@gmail.com', icon: <ShieldCheck className="w-4 h-4 text-purple-600" />, badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
    { role: 'pm' as UserRole, title: 'Project Manager', email: 'balramprajapati3263@gmail.com', icon: <Briefcase className="w-4 h-4 text-indigo-600" />, badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { role: 'ac_manager' as UserRole, title: 'Account Manager', email: 'balram@supersourcing.com', icon: <Building2 className="w-4 h-4 text-sky-600" />, badgeColor: 'bg-sky-50 text-sky-700 border-sky-200' },
    { role: 'employee' as UserRole, title: 'Employee', email: 'balram.btech@gmail.com', icon: <Users className="w-4 h-4 text-blue-600" />, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  ];

  const triggerLogin = (user: User) => {
    if (typeof onLogin === 'function') {
      onLogin(user);
    } else if (typeof onSelectUserRole === 'function') {
      onSelectUserRole(user);
    } else {
      console.warn('Neither onLogin nor onSelectUserRole was provided to LoginPage.');
    }
  };

  const handleCredentialResponse = async (response: { credential?: string }) => {
    if (!response.credential) return;
    setIsGoogleSigningIn(true);
    setAuthError(null);

    try {
      const authData = await loginWithGoogleApi(response.credential);
      localStorage.setItem('chronos_access_token', authData.access_token);
      localStorage.setItem('chronos_refresh_token', authData.refresh_token);
      triggerLogin(authData.user);
    } catch (err: any) {
      setAuthError(err.message || 'Google SSO Authentication failed');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '146072997584-and6rpntvi6fi6gvvthkp8c37spr6snn.apps.googleusercontent.com';
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        });

        initializedRef.current = true;

        const btnContainer = document.getElementById('google-sso-btn-container');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: 340,
            text: 'signin_with',
          });
        }
      } catch (err) {
        console.warn('Google Identity initialization:', err);
      }
    }
  }, []);

  const handleGoogleSSOClick = () => {
    setAuthError(null);
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const reason = notification.getNotDisplayedReason() || notification.getSkippedReason();
            if (reason === 'opt_out_or_error' || reason === 'origin_mismatch') {
              setAuthError(`Google SSO Origin Warning: Ensure ${window.location.origin} is added under 'Authorized JavaScript Origins' in Google Cloud Console for Client ID 146072997584-and6rpntvi6fi6gvvthkp8c37spr6snn.apps.googleusercontent.com.`);
            }
          }
        });
      } catch {
        setIsGoogleSigningIn(true);
        setTimeout(() => {
          setIsGoogleSigningIn(false);
        }, 500);
      }
    } else {
      setIsGoogleSigningIn(true);
      setTimeout(() => {
        setIsGoogleSigningIn(false);
        setAuthError('Google Identity SDK initializing... Please click the official Google button above.');
      }, 600);
    }
  };

  const handleDevPersonaLogin = (role: UserRole) => {
    const sampleUser = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    triggerLogin(sampleUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 font-semibold text-xs shadow-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Chronos Workspace Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Single Sign-On Access
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Log in with your corporate Google identity to access timesheets and project management.
          </p>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="leading-snug">{authError}</span>
          </div>
        )}

        {/* Clean Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
          <div className="space-y-4 text-center">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Google SSO Authentication
            </h2>

            {/* Official Google Button Container */}
            <div className="flex justify-center min-h-[44px]">
              <div id="google-sso-btn-container"></div>
            </div>

            {/* Fallback Custom Google Button */}
            <button
              type="button"
              onClick={handleGoogleSSOClick}
              disabled={isGoogleSigningIn}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-3 transition-all hover:border-slate-400 active:scale-[0.99]"
            >
              {isGoogleSigningIn ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleSigningIn ? 'Connecting to Google...' : 'Sign in with Google SSO'}</span>
            </button>
          </div>

          {/* Registered Database Accounts Section */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Authorized DB Accounts</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                PostgreSQL Synced
              </span>
            </div>

            <div className="space-y-2">
              {registeredAccounts.map((acc) => (
                <div
                  key={acc.email}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      {acc.icon}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 truncate">{acc.email}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${acc.badgeColor}`}>
                    {acc.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dev Persona Switcher Accordion */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowDevPersonas(!showDevPersonas)}
              className="w-full text-slate-400 hover:text-slate-600 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors py-1"
            >
              <span>Demo Persona Bypass</span>
              {showDevPersonas ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDevPersonas && (
              <div className="grid grid-cols-2 gap-2 pt-3 animate-fade-in">
                {registeredAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleDevPersonaLogin(acc.role)}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-700 font-semibold text-[11px] text-center transition-all"
                  >
                    Bypass as {acc.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400">
          © 2026 Chronos Workspace • FastAPI & PostgreSQL Auth Ready
        </div>
      </div>
    </div>
  );
};

