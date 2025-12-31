import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface Pilgrim {
  id: string;
  name: string;
  avatar: string;
  way: string;
  stage: string;
  nationality: string;
  isFollowing: boolean;
  status: 'online' | 'walking' | 'resting';
}

interface Props {
  onNavigate: (view: any, profileId?: string | null) => void;
  language: 'en' | 'es';
  toggleLanguage: () => void;
  openAuth: (mode: 'login' | 'register') => void;
  user: any;
  onSignOut: () => void;
}



const LandingPage = ({ onNavigate, language, toggleLanguage, openAuth, user, onSignOut }: Props) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchPilgrims = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);

      if (!error && data) {
        let followingIds: string[] = [];
        if (user) {
          const { data: followsData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);
          if (followsData) followingIds = followsData.map(f => f.following_id);
        }

        const mappedPilgrims: Pilgrim[] = data
          .filter(p => !user || p.id !== user.id)
          .map((p: any) => ({
            id: p.id,
            name: p.full_name || p.username || 'Peregrino',
            avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'P')}&background=random`,
            way: p.current_way || (language === 'en' ? 'Not on a way' : 'Sin ruta activa'),
            stage: p.current_stage || '-',
            nationality: p.nationality || '🌍',
            isFollowing: followingIds.includes(p.id),
            status: 'online'
          }));
        setPilgrims(mappedPilgrims);
      } else {
        console.error("Error fetching pilgrims:", error);
        setPilgrims([]);
      }
    };

    fetchPilgrims();
  }, [language, user]);

  const t = {
    home: language === 'en' ? 'Home' : 'Inicio',
    map: language === 'en' ? 'Map' : 'Mapa',
    community: language === 'en' ? 'Community' : 'Comunidad',
    login: language === 'en' ? 'Login' : 'Entrar',
    logout: language === 'en' ? 'Sign Out' : 'Cerrar Sesión',
    plan: language === 'en' ? 'Plan Your Camino' : 'Planifica tu Camino',
    heroTitle: language === 'en' ? 'Your Compass for the' : 'Tu Brújula para el',
    heroTitleAccent: language === 'en' ? 'Camino de Santiago' : 'Camino de Santiago',
    heroSubtitle: language === 'en' ? 'The ultimate digital companion for your pilgrimage to Santiago de Compostela.' : 'Tu compañero digital definitivo para tu peregrinaje a Santiago de Compostela.',
    startJourney: language === 'en' ? 'Start Your Journey' : 'Empieza tu Viaje',
    communityTitle: language === 'en' ? 'Find Your Community' : 'Encuentra tu Comunidad',
    communitySub: language === 'en' ? 'Search for fellow pilgrims currently on the path.' : 'Busca compañeros que estén recorriendo el camino ahora mismo.',
    searchPlaceholder: language === 'en' ? 'Search by name, route or town...' : 'Busca por nombre, ruta o pueblo...',
    follow: language === 'en' ? 'Follow' : 'Seguir',
    following: language === 'en' ? 'Following' : 'Siguiendo',
    noPilgrims: language === 'en' ? 'No pilgrims found matching your search.' : 'No se encontraron peregrinos que coincidan con tu búsqueda.',
    routesTitle: language === 'en' ? 'Explore the Routes' : 'Explora las Rutas',
    routesSub: language === 'en' ? 'Visualize your journey on the most popular paths.' : 'Visualiza tu viaje en las rutas más populares.',
    frenchWay: language === 'en' ? 'French Way' : 'Camino Francés',
    portugueseWay: language === 'en' ? 'Portuguese Way' : 'Camino Portugués',
    frenchSub: language === 'en' ? 'The classic route starting from St. Jean Pied de Port, crossing the Pyrenees and the vast meseta.' : 'La ruta clásica que comienza en St. Jean Pied de Port, cruzando los Pirineos y la vasta meseta.',
    portugueseSub: language === 'en' ? 'A stunning coastal journey starting from Lisbon or Porto, following the Atlantic breeze.' : 'Un impresionante viaje costero que comienza en Lisboa o Oporto, siguiendo la brisa del Atlántico.',
    voicesTitle: language === 'en' ? 'Voices of the Way' : 'Voces del Camino',
    voicesSub: language === 'en' ? 'Join the vibrant ecosystem of pilgrims and hosts.' : 'Únete al vibrante ecosistema de peregrinos y hospitaleros.',
    ctaTitle: language === 'en' ? 'Ready to take the first step?' : '¿Listo para dar el primer paso?',
    ctaSub: language === 'en' ? 'Join thousands of pilgrims on the journey of a lifetime.' : 'Únete a miles de peregrinos en el viaje de tu vida.',
    dashboardGo: language === 'en' ? 'My Profile' : 'Mi Perfil',
    readMore: language === 'en' ? 'Read more' : 'Leer más',
    story: language === 'en' ? 'STORY' : 'HISTORIA',
    pro: language === 'en' ? 'PRO' : 'PROFESIONAL',
    event: language === 'en' ? 'EVENT' : 'EVENTO',
    storyTitle: language === 'en' ? '"A Life Changing Walk"' : '"Un Viaje que Cambia Vidas"',
    proTitle: language === 'en' ? 'Supporting the Journey' : 'Apoyando el Viaje',
    eventTitle: language === 'en' ? 'Community Dinners' : 'Cenas Comunitarias',
    voicesDesc: language === 'en' ? 'Experience the Camino through the eyes of those who walk it and those who make it possible every day.' : 'Experimenta el Camino a través de los ojos de quienes lo recorren y quienes lo hacen posible cada día.',
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    let query = supabase.from('profiles').select('*');
    if (searchQuery.trim()) {
      query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,current_way.ilike.%${searchQuery}%,current_stage.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query.limit(10);

    if (!error && data) {
      let followingIds: string[] = [];
      if (user) {
        const { data: followsData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        if (followsData) followingIds = followsData.map(f => f.following_id);
      }

      const mappedPilgrims: Pilgrim[] = data
        .filter(p => !user || p.id !== user.id)
        .map((p: any) => ({
          id: p.id,
          name: p.full_name || p.username || 'Peregrino',
          avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'P')}&background=random`,
          way: p.current_way || (language === 'en' ? 'Not on a way' : 'Sin ruta activa'),
          stage: p.current_stage || '-',
          nationality: p.nationality || '🌍',
          isFollowing: followingIds.includes(p.id),
          status: 'online'
        }));
      setPilgrims(mappedPilgrims);
    }
    setIsSearching(false);
  };

  // The filteredPilgrims useMemo is no longer needed as handleSearch directly updates 'pilgrims'
  // However, if we want to filter the *currently displayed* pilgrims as the user types,
  // before they submit the search, we can keep a local filter.
  // For now, let's assume handleSearch is the primary filtering mechanism.
  // If the search input is updated to trigger handleSearch on submit, then 'pilgrims' will hold the search results.
  // If we want real-time filtering as the user types, we'd need to adjust this.
  // Given the instruction, handleSearch is for submitting a query.
  // So, 'pilgrims' state will directly hold the results of the last fetch or search.
  // We can simplify filteredPilgrims to just be 'pilgrims' if handleSearch is the only source.
  // Or, if we want to filter the *initial* fetch results locally before a search is submitted:
  const displayedPilgrims = useMemo(() => {
    if (!searchQuery.trim()) {
      return pilgrims; // Show all fetched pilgrims if search is empty
    }
    // If a search was submitted via handleSearch, 'pilgrims' already contains the filtered results.
    // This useMemo would only be relevant if we were doing client-side filtering *before* submitting to Supabase.
    // Given handleSearch updates 'pilgrims' directly, this useMemo is effectively just returning 'pilgrims'.
    // Let's keep it simple and just use 'pilgrims' directly in the render, as handleSearch updates it.
    return pilgrims;
  }, [pilgrims]);

  const filteredPilgrims = displayedPilgrims;

  const handleFollow = async (pilgrimId: string) => {
    if (!user) {
      openAuth('login');
      return;
    }

    const targetPilgrim = pilgrims.find(p => p.id === pilgrimId);
    if (!targetPilgrim) return;

    if (targetPilgrim.isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', pilgrimId);

      if (!error) {
        setPilgrims(prev => prev.map(p =>
          p.id === pilgrimId ? { ...p, isFollowing: false } : p
        ));
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: pilgrimId });

      if (!error) {
        setPilgrims(prev => prev.map(p =>
          p.id === pilgrimId ? { ...p, isFollowing: true } : p
        ));
      }
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-[#0e1b14] dark:text-gray-100 transition-colors duration-200">
      {/* Navigation */}
      <header className="sticky top-0 z-50 flex flex-col whitespace-nowrap border-b border-solid border-b-[#e7f3ed] dark:border-gray-800 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-6 py-4 lg:px-20">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('Landing')}>
            <div className="size-8 text-primary flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <span className="material-symbols-outlined !text-3xl">hiking</span>
            </div>
            <h2 className="text-[#0e1b14] dark:text-white text-xl font-black leading-tight tracking-tight">
              MyCamino
            </h2>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <button onClick={() => onNavigate('Landing')} className="nav-link text-[#0e1b14] dark:text-gray-200 text-sm font-semibold transition-colors">{t.home}</button>
              <button onClick={() => onNavigate('Planner')} className="nav-link text-[#0e1b14] dark:text-gray-200 text-sm font-semibold transition-colors">{t.map}</button>
              <button onClick={() => onNavigate('Community')} className="nav-link text-[#0e1b14] dark:text-gray-200 text-sm font-semibold transition-colors">{t.community}</button>

              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white dark:hover:bg-primary transition-all duration-300 text-xs font-bold text-[#0e1b14] dark:text-white"
              >
                <span className="material-symbols-outlined text-[16px]">language</span>
                {language === 'en' ? 'EN' : 'ES'}
              </button>

              {user ? (
                <>
                  <button onClick={() => onNavigate('Credential')} className="nav-link text-[#0e1b14] dark:text-gray-200 text-sm font-semibold transition-colors">{t.dashboardGo}</button>
                  <button onClick={onSignOut} className="nav-link text-red-500 text-sm font-semibold transition-colors">
                    {t.logout}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => openAuth('login')} className="nav-link text-[#0e1b14] dark:text-gray-200 text-sm font-semibold transition-colors">{t.login}</button>
                </>
              )}
            </nav>
            <button onClick={() => user ? onNavigate('Credential') : openAuth('register')} className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-all shadow-lg shadow-primary/20 active:scale-95">
              <span className="truncate">{user ? t.dashboardGo : t.plan}</span>
            </button>
          </div>
          <div className="lg:hidden flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-[#0e1b14] dark:text-white"
            >
              {language === 'en' ? 'EN' : 'ES'}
            </button>
            <button
              className="text-[#0e1b14] dark:text-white p-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden flex flex-col gap-4 mt-4 py-4 border-t border-gray-100 dark:border-gray-800 animate-slide-up">
            <button onClick={() => { onNavigate('Landing'); setIsMobileMenuOpen(false); }} className="text-left text-[#0e1b14] dark:text-gray-200 text-base font-bold py-2">{t.home}</button>
            <button onClick={() => { onNavigate('Planner'); setIsMobileMenuOpen(false); }} className="text-left text-[#0e1b14] dark:text-gray-200 text-base font-bold py-2">{t.map}</button>
            <button onClick={() => { onNavigate('Community'); setIsMobileMenuOpen(false); }} className="text-left text-[#0e1b14] dark:text-gray-200 text-base font-bold py-2">{t.community}</button>
            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
            {user ? (
              <>
                <button onClick={() => { onNavigate('Credential'); setIsMobileMenuOpen(false); }} className="text-left text-[#0e1b14] dark:text-gray-200 text-base font-bold py-2">{t.dashboardGo}</button>
                <button onClick={() => { onSignOut(); setIsMobileMenuOpen(false); }} className="text-left text-red-500 text-base font-bold py-2">{t.logout}</button>
              </>
            ) : (
              <>
                <button onClick={() => { openAuth('login'); setIsMobileMenuOpen(false); }} className="text-left text-[#0e1b14] dark:text-gray-200 text-base font-bold py-2">{t.login}</button>
                <button onClick={() => { openAuth('register'); setIsMobileMenuOpen(false); }} className="w-full mt-2 flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-md">
                  {t.plan}
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <div className="w-full overflow-hidden">
        <div className="@container">
          <div
            className="relative flex min-h-[620px] flex-col gap-6 items-center justify-center p-8 text-center bg-cover bg-center transition-all duration-700"
            style={{
              backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAVJlSAboTqT1_wZOQAO37-WTKQzvNgtXmZEcKozd-Xuz_XIp8EOUY1zKMiXvyyEFtqR47pVLrRyh9H3iD8us0XK8FqSNWHWC9NHyTxFdDfZQf7O5qMVK50wxryLyRXl6aNTrYxBi1ILLRqP7KBUj0DyVL7CYTpHFXMZGrzPeufiH8ij2zPFL5QCTjRRcyaXL4EN6aroGmWFXR-PT0WYnvXcuhgatSG9_QKOTKVyrWxas8KQOLgmQlO401YDxYhBB-zfkZEj8tWFiM")'
            }}
          >
            <div className="flex flex-col gap-4 max-w-4xl z-10 animate-fade-in">
              <h1 className="text-white text-5xl font-black leading-tight tracking-[-0.04em] md:text-7xl drop-shadow-lg">
                {t.heroTitle} <br className="hidden md:block" /> {t.heroTitleAccent}
              </h1>
              <h2 className="text-gray-200 text-lg font-medium leading-relaxed md:text-2xl max-w-2xl mx-auto opacity-90">
                {t.heroSubtitle}
              </h2>
            </div>
            <div className="flex justify-center mt-6 z-10 w-full max-w-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button onClick={() => user ? onNavigate('Credential') : openAuth('register')} className="min-w-[280px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-primary hover:bg-primary-dark text-white text-xl font-black shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                {user ? (language === 'en' ? 'My Profile' : 'Mi Perfil') : t.startJourney}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pilgrim Search Section */}
      <section className="flex justify-center py-24 px-4 md:px-10 lg:px-20 bg-white dark:bg-[#0c1811] relative overflow-hidden">
        <div className="flex flex-col max-w-[1000px] flex-1 gap-12 relative z-10">
          <div className="text-center">
            <h2 className="text-[#0e1b14] dark:text-white text-4xl font-black tracking-tight mb-4">
              {t.communityTitle}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {t.communitySub}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-surface-dark border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white text-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm outline-none"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPilgrims.length > 0 ? (
              filteredPilgrims.map((pilgrim) => (
                <div
                  key={pilgrim.id}
                  className="bg-background-light dark:bg-surface-dark rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col animate-scale-in"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative cursor-pointer" onClick={() => onNavigate('Credential', pilgrim.id)}>
                      <img
                        src={pilgrim.avatar}
                        alt={pilgrim.name}
                        className="size-16 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-700 group-hover:scale-105 transition-transform"
                      />
                      <div className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white dark:border-surface-dark ${pilgrim.status === 'walking' ? 'bg-orange-500' :
                        pilgrim.status === 'resting' ? 'bg-blue-500' : 'bg-primary'
                        }`} />
                    </div>
                    <div className="text-2xl">{pilgrim.nationality}</div>
                  </div>

                  <div className="mb-6 flex-1">
                    <h3
                      className="text-lg font-black text-slate-900 dark:text-white mb-1 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => onNavigate('Credential', pilgrim.id)}
                    >
                      {pilgrim.name}
                    </h3>
                    <div className="flex flex-col gap-1 text-xs font-semibold">
                      <div className="text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">map</span>
                        {pilgrim.way}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {pilgrim.stage}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFollow(pilgrim.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-95 ${pilgrim.isFollowing
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      : 'bg-primary hover:bg-primary-dark text-white'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {pilgrim.isFollowing ? 'check_circle' : 'person_add'}
                    </span>
                    {pilgrim.isFollowing ? t.following : t.follow}
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-slate-400 font-bold italic">{t.noPilgrims}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Routes */}
      <section className="flex justify-center py-24 px-4 md:px-10 lg:px-20 bg-background-light dark:bg-background-dark">
        <div className="flex flex-col max-w-[1000px] flex-1 gap-12">
          <div className="flex flex-col gap-4">
            <h2 className="text-[#0e1b14] dark:text-white text-4xl font-black leading-tight tracking-tight">
              {t.routesTitle}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t.routesSub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="group cursor-pointer" onClick={() => onNavigate('Planner')}>
              <div className="w-full h-72 bg-gray-200 rounded-2xl overflow-hidden mb-6 relative shadow-lg">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBkebcBL6OFTn-fbBn9hATiDu-ugXCWLFP94DnRU7IB3QHln26Ip4n9nV5QCslxuDKaCJX3NFltI4e2GCQs5Zscl8XdYaVArRTuifkR2AWHe9Q5tS3YYoMsf8fYRZsi0yjWWkZCx5lbn059zrCTBIesjkxgk6BAO41pWg68A47fSEr808WMjVV93hkMVkqD_O8Y5bKAVm1FCgGi_gUYEXJ82p6fe4RSejPOPatw6TKXtuRY4j2hjOAFjt0-oUC4fO9-jFRBgSHCX1g")' }}></div>
                <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/80 px-4 py-1.5 rounded-lg text-xs font-black backdrop-blur-md shadow-sm">780 km</div>
              </div>
              <div className="px-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#0e1b14] dark:text-white text-2xl font-black group-hover:text-primary transition-colors">{t.frenchWay}</h3>
                  <span className="material-symbols-outlined text-primary arrow-animate">arrow_forward</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">{t.frenchSub}</p>
              </div>
            </div>
            <div className="group cursor-pointer" onClick={() => onNavigate('Planner')}>
              <div className="w-full h-72 bg-gray-200 rounded-2xl overflow-hidden mb-6 relative shadow-lg">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC8hPCiMP9NLOgoo2bx2AA2ihT9gCVaNLGWqRhDyJSUw6hKOe338xvGxAKjN5QQZWpEHQcGpjMR25MTMbrShCwG6aH88NYaOfbjzCYOGRh7XrZ3W3ZwNnq74Npr0GfMAhKpz01836EfEVoJJSMdhcmH3Y7C0QsWzgEGDgWJLJe7CTJ0W_zvRHKXq9oC0DqmgHgQrqfpbfM4orZk-bMk5NLhzLjh6huK1uBp4jO60Gbzx1d26Ki6-wPAvrNZkmrzcjGnUI6WmDDUuWY")' }}></div>
                <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/80 px-4 py-1.5 rounded-lg text-xs font-black backdrop-blur-md shadow-sm">260 km</div>
              </div>
              <div className="px-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#0e1b14] dark:text-white text-2xl font-black group-hover:text-primary transition-colors">{t.portugueseWay}</h3>
                  <span className="material-symbols-outlined text-primary arrow-animate">arrow_forward</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">{t.portugueseSub}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section (Voices) */}
      <section className="flex justify-center py-24 px-4 md:px-10 lg:px-20 bg-white dark:bg-[#0c1811] border-t border-border-light dark:border-gray-800">
        <div className="flex flex-col max-w-[1000px] flex-1 gap-12">
          <div className="flex flex-col gap-2">
            <h2 className="text-[#0e1b14] dark:text-white text-4xl font-black tracking-tight">
              {t.voicesTitle}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t.voicesSub}</p>
          </div>
          <div className="flex overflow-x-auto gap-8 pb-10 no-scrollbar snap-x cursor-grab active:cursor-grabbing">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[300px] md:min-w-[360px] snap-center flex flex-col gap-6 rounded-2xl bg-surface-light dark:bg-surface-dark p-6 shadow-sm border border-transparent hover:border-primary/20 transition-all duration-300 group hover:shadow-xl">
                <div className="w-full aspect-[16/10] rounded-xl bg-gray-200 bg-cover bg-center overflow-hidden" style={{ backgroundImage: i === 1 ? 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBJknsXL1ESTgdPFJIQPdZXx9KfmUf41AgpVmOx5L70nLrbeEXWNstQvHrZuzOVpLFfSYtig1bndfzugyqnb3RUhVDUmKqnnpNs0w89F8AC8Z5W33x7QszkHLYBVkPOUP8BmT6sOzh838ihEy40lCWJ1rL-3qw_UtwwX4T2t1Xa0aZmARLhYAgSW5WRRaU7oDsh9cNUPlAQdtIkztlg02yQR5VmNFyKJRBEn6YkLyfEZT0ttDP7mGK7_eb0928n97xYZMbSl6epiaw")' : i === 2 ? 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDKyR4GPY7nt7A8JRtgm51sstm-8cub88q_PM2r6CjlumXE3Lq4MpWG8fA2WE_XKW9oWedb6ft66FxmPQyYEQledUB8hpJ1bshk1Gw_zchATXU-45hZeKM5BRAYR6co9zFBKWkfgqd_te5m2nkN3WHV4Kq5V2ABe-q-5TaJ9BvzmYabPisdsAyZI61EgIEJBtGg8V-KylmdKPVw9M2OpUPUDvtFq6D01qWuBA4iANJw7j6qRf8CbFHZg0sHeZMKlU4UDkmUc3jmiqE")' : 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCDrloFTtQF1e31XfKK7Sy0vSexp82XKbB6AH1kA74YvwE28MSWbGuXz3GvU2wcchyLTKA6Tiwexr6MFVjpYlLYgiJxpebIWW07zVdFsmeUgvbwVSgQpjlJzgp2ehXYKF3UtXQvcg55OkDsuVMTx3FyzGU5qgLrYA5lKOEWSKI-OBR3au_KqN6IDBMTkgzbIdfKsP_wYMTj_fujnBqfXjC91eGSIsfT1dtPKLae0LrfnUTqBwpm6GVw5BHdzOizCcR31yudCrYMtNA")' }}>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                      {i === 1 ? t.story : i === 2 ? t.pro : t.event}
                    </span>
                  </div>
                  <h4 className="text-[#0e1b14] dark:text-white text-xl font-black group-hover:text-primary transition-colors">
                    {i === 1 ? t.storyTitle : i === 2 ? t.proTitle : t.eventTitle}
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 line-clamp-2">{t.voicesDesc}</p>
                  <button className="mt-4 flex items-center gap-1 text-primary text-sm font-bold group-hover:gap-2 transition-all">
                    {t.readMore} <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-[#0e1b14] text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-primary rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-primary rounded-full blur-[120px]"></div>
        </div>
        <div className="max-w-3xl mx-auto flex flex-col gap-8 relative z-10">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight animate-fade-in">{t.ctaTitle}</h2>
          <p className="text-gray-400 text-xl max-w-xl mx-auto opacity-80">{t.ctaSub}</p>
          <div className="flex justify-center mt-4">
            <button onClick={() => openAuth('register')} className="h-14 px-12 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              {t.plan}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background-light dark:bg-background-dark py-16 px-6 lg:px-20 border-t border-border-light dark:border-gray-800">
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div className="flex flex-col gap-6 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-primary cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onNavigate('Landing')}>
              <span className="material-symbols-outlined !text-3xl">hiking</span>
              <span className="font-black text-xl text-[#0e1b14] dark:text-white tracking-tighter">MyCamino</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">Your digital credential and compass for the modern pilgrimage.</p>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-black text-[#0e1b14] dark:text-white uppercase text-xs tracking-widest">Platform</h4>
            <div className="flex flex-col gap-2">
              {['Plan Your Trip', 'Interactive Map', 'Albergue Directory'].map(link => (
                <button key={link} onClick={() => onNavigate('Planner')} className="text-left text-sm text-gray-500 hover:text-primary transition-colors">{link}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-black text-[#0e1b14] dark:text-white uppercase text-xs tracking-widest">Community</h4>
            <div className="flex flex-col gap-2">
              {['Forum', 'Events', 'Stories'].map(link => (
                <button key={link} onClick={() => onNavigate('Community')} className="text-left text-sm text-gray-500 hover:text-primary transition-colors">{link}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-black text-[#0e1b14] dark:text-white uppercase text-xs tracking-widest">Connect</h4>
            <div className="flex gap-4">
              {['public', 'share', 'mail'].map(icon => (
                <a key={icon} href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1">
                  <span className="material-symbols-outlined !text-xl">{icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-[1000px] mx-auto pt-8 border-t border-gray-200 dark:border-gray-800 text-center md:text-left">
          <p className="text-xs text-gray-400 font-medium">© 2024 MyCamino. Built for pilgrims, by pilgrims. Buen Camino.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;