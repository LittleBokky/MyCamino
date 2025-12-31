import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import PilgrimDashboard from './pages/PilgrimDashboard';
import RoutePlanner from './pages/RoutePlanner';
import StageDetails from './pages/StageDetails';
import Credential from './pages/Credential';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import BusinessProfile from './pages/BusinessProfile';
import Workshop from './pages/Workshop';
import Community from './pages/Community';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

export type ViewName = 'Landing' | 'Credential' | 'Planner' | 'Community';
export type Language = 'en' | 'es';
export type AuthMode = 'login' | 'register';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewName>('Landing');
  const [language, setLanguage] = useState<Language>('es');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [animationKey, setAnimationKey] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (view: ViewName, profileId: string | null = null) => {
    if (view === currentView && profileId === selectedProfileId) return;
    setSelectedProfileId(profileId);
    setCurrentView(view);
    setAnimationKey(prev => prev + 1); // Reset animation on nav
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'es' : 'en'));
  };

  const openAuth = (mode: AuthMode = 'login') => {
    setAuthMode(mode);
    setAuthError(null);
    setIsAuthOpen(true);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
    setAuthError(null);
    setEmail('');
    setPassword('');
    setFullName('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        handleNavigate('Credential');
        closeAuth();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        alert(language === 'en' ? 'Check your email for the confirmation link!' : '¡Revisa tu correo para el enlace de confirmación!');
        closeAuth();
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    handleNavigate('Landing');
  };

  const pageProps = {
    onNavigate: handleNavigate,
    language,
    toggleLanguage,
    openAuth,
    session,
    user: session?.user ?? null,
    onSignOut: handleSignOut,
    selectedProfileId: selectedProfileId,
  };

  const renderView = () => {
    switch (currentView) {
      case 'Landing': return <LandingPage {...pageProps} />;
      case 'Credential': return <Credential {...pageProps} />;
      case 'Planner': return <RoutePlanner {...pageProps} />;
      case 'Community': return <Community {...pageProps} />;
      default: return <LandingPage {...pageProps} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-primary selection:text-white">
      {/* Auth Modal with transition */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-light dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-scale-in">
            <button
              onClick={closeAuth}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10 hover:rotate-90 duration-200"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="mx-auto size-12 text-primary flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-5xl animate-bounce">hiking</span>
                </div>
                <h2 className="text-2xl font-black text-[#0e1b14] dark:text-white">
                  {authMode === 'login'
                    ? (language === 'en' ? 'Welcome Back' : 'Bienvenido de nuevo')
                    : (language === 'en' ? 'Join the Way' : 'Únete al Camino')
                  }
                </h2>
                <p className="text-gray-500 mt-2 text-sm">
                  {authMode === 'login'
                    ? (language === 'en' ? 'Enter your details to sign in.' : 'Ingresa tus datos para iniciar sesión.')
                    : (language === 'en' ? 'Start your digital pilgrimage today.' : 'Comienza tu peregrinaje digital hoy.')
                  }
                </p>
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleAuth}>
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg animate-shake">
                    {authError}
                  </div>
                )}

                {authMode === 'register' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">
                      {language === 'en' ? 'Full Name' : 'Nombre Completo'}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-shadow"
                      placeholder="Juan Peregrino"
                    />
                  </div>
                )}
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-shadow"
                    placeholder="buen@camino.com"
                  />
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">
                    {language === 'en' ? 'Password' : 'Contraseña'}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-shadow"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  disabled={loading}
                  className="mt-2 w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-lg shadow-primary/30 transition-all active:scale-[0.98] hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                  {authMode === 'login'
                    ? (language === 'en' ? 'Sign In' : 'Iniciar Sesión')
                    : (language === 'en' ? 'Create Account' : 'Crear Cuenta')
                  }
                </button>
              </form>

              <div className="mt-6 flex flex-col gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="relative flex items-center justify-center">
                  <hr className="absolute w-full border-gray-200 dark:border-gray-700" />
                  <span className="relative bg-surface-light dark:bg-surface-dark px-2 text-xs text-gray-400">
                    {language === 'en' ? 'Or continue with' : 'O continúa con'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-95">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    <span className="text-sm font-medium">Google</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-95">
                    <span className="material-symbols-outlined text-[22px]">apple</span>
                    <span className="text-sm font-medium">Apple</span>
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center text-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <span className="text-gray-500">
                  {authMode === 'login'
                    ? (language === 'en' ? "Don't have an account?" : "¿No tienes una cuenta?")
                    : (language === 'en' ? "Already have an account?" : "¿Ya tienes una cuenta?")
                  }
                </span>
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="ml-1 font-bold text-primary hover:underline transition-all"
                >
                  {authMode === 'login'
                    ? (language === 'en' ? 'Sign up' : 'Regístrate')
                    : (language === 'en' ? 'Log in' : 'Inicia Sesión')
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Page Transition Wrapper */}
      <div key={animationKey} className="page-enter flex-1 flex flex-col">
        {renderView()}
      </div>
    </div>
  );
}