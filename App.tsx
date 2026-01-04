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
import Packs from './pages/Packs';
import Contact from './pages/Contact';
import Chat from './pages/Chat';
import LiveTracker from './pages/LiveTracker';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

export type ViewName = 'Landing' | 'Credential' | 'Planner' | 'Community' | 'Packs' | 'Contact' | 'Pro Dashboard' | 'Biz Profile' | 'Workshop' | 'Stage Details' | 'Chat' | 'Live';
export type Language = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja';
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
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('ES');
  const [showPassword, setShowPassword] = useState(false);

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

  useEffect(() => {
    if (!session?.user) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*, actor:profiles!notifications_actor_id_fkey(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setNotifications(data);
    };

    fetchNotifications();

    const channel = supabase
      .channel('global-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${session.user.id}`
      }, async (payload) => {
        const { data: actor } = await supabase.from('profiles').select('*').eq('id', payload.new.actor_id).single();
        setNotifications(prev => [{ ...payload.new, actor }, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const markAllAsRead = async () => {
    if (!session?.user) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNavigate = (view: ViewName, profileId: string | null = null, routeId: string | null = null) => {
    if (view === currentView && profileId === selectedProfileId && routeId === selectedRouteId) return;
    setSelectedProfileId(profileId);
    setSelectedRouteId(routeId);
    setCurrentView(view);
    setAnimationKey(prev => prev + 1); // Reset animation on nav
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setAppLanguage = (lang: Language) => {
    setLanguage(lang);
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
              username: username.startsWith('@') ? username : `@${username}`,
              birth_date: birthDate,
              country: country,
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
    setLanguage: setAppLanguage,
    openAuth,
    session,
    user: session?.user ?? null,
    onSignOut: handleSignOut,
    selectedProfileId: selectedProfileId,
    selectedRouteId: selectedRouteId,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    showNotifications,
    setShowNotifications,
    markAllAsRead,
  };

  const renderView = () => {
    switch (currentView) {
      case 'Landing': return <LandingPage {...pageProps} />;
      case 'Credential': return <Credential {...pageProps} />;
      case 'Planner': return <RoutePlanner {...pageProps} />;
      case 'Community': return <Community {...pageProps} />;
      case 'Packs': return <Packs {...pageProps} />;
      case 'Contact': return <Contact {...pageProps} />;
      case 'Chat': return <Chat {...pageProps} selectedUserId={selectedProfileId} />;
      case 'Pro Dashboard': return <ProfessionalDashboard {...pageProps} />;
      case 'Biz Profile': return <BusinessProfile {...pageProps} />;
      case 'Workshop': return <Workshop {...pageProps} />;
      case 'Stage Details': return <StageDetails {...pageProps} />;
      case 'Live': return <LiveTracker {...pageProps} />;
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
                  <>
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

                    <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">
                        {language === 'en' ? 'Username' : 'Nombre de Usuario'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => {
                            const val = e.target.value;
                            setUsername(val.startsWith('@') ? val : `@${val}`);
                          }}
                          className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-shadow pl-3"
                          placeholder="@peregrino_feliz"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">
                          {language === 'en' ? 'Birth Date' : 'Fecha Nacimiento'}
                        </label>
                        <input
                          type="date"
                          required
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-shadow"
                        />
                      </div>
                      <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">
                          {language === 'en' ? 'Country' : 'País'}
                        </label>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-shadow"
                        >
                          <option value="ES">España</option>
                          <option value="PT">Portugal</option>
                          <option value="FR">Francia</option>
                          <option value="IT">Italia</option>
                          <option value="DE">Alemania</option>
                          <option value="GB">Reino Unido</option>
                          <option value="US">USA</option>
                          <option value="MX">México</option>
                          <option value="AR">Argentina</option>
                          <option value="CO">Colombia</option>
                          <option value="CL">Chile</option>
                          <option value="BR">Brasil</option>
                          <option value="CA">Canadá</option>
                          <option value="AU">Australia</option>
                          <option value="JP">Japón</option>
                          <option value="OTHER">Otro / Other</option>
                        </select>
                      </div>
                    </div>
                  </>
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-shadow pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
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
      <div key={animationKey} className="page-enter flex-1 flex flex-col pb-24 lg:pb-0">
        {renderView()}
      </div>

      {/* Persistent Mobile Bottom Navbar */}
      {session?.user && !['Community', 'Chat', 'Contact', 'Credential', 'Live'].includes(currentView) && (
        <div className="lg:hidden fixed bottom-4 inset-x-6 z-[100000] animate-slide-up">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-2xl shadow-[0_15px_35px_-10px_rgba(0,0,0,0.25)] px-5 py-2 flex items-center justify-between">
            <button
              onClick={() => handleNavigate('Planner')}
              className="flex flex-col items-center gap-0.5 group transition-all active:scale-90"
            >
              <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined !text-[20px]">map</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-tight text-slate-400 group-hover:text-primary transition-colors">Mapas</span>
            </button>

            <button
              onClick={() => handleNavigate('Live')}
              className="flex flex-col items-center gap-0.5 group -mt-7 transition-all active:scale-90"
            >
              <div className="size-12 rounded-full bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-500/30 border-4 border-white/20 dark:border-slate-900/50 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined !text-[24px] animate-pulse">sensors</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-tight text-red-500">Ruta</span>
            </button>

            <button
              onClick={() => handleNavigate('Chat')}
              className="flex flex-col items-center gap-0.5 group transition-all active:scale-90"
            >
              <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined !text-[20px]">chat</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-tight text-slate-400 group-hover:text-primary transition-colors">Chat</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}