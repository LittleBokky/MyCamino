import React, { useState, useMemo } from 'react';

interface Pilgrim {
  id: string;
  name: string;
  avatar: string;
  way: string;
  stage: string;
  nationality: string;
  isFollowing: boolean;
  isMutual?: boolean;
  status: 'online' | 'walking' | 'resting';
}

interface Props {
  onNavigate: (view: any, profileId?: string | null) => void;
  language: 'en' | 'es';
  toggleLanguage: () => void;
  user?: any;
  onSignOut?: () => void;
}

const INITIAL_PILGRIMS: Pilgrim[] = [
  { id: '1', name: 'Mateo Rossi', avatar: 'https://i.pravatar.cc/150?u=mateo', way: 'Camino Francés', stage: 'Burgos', nationality: '🇮🇹', isFollowing: false, status: 'walking' },
  { id: '2', name: 'Lucía Fernández', avatar: 'https://i.pravatar.cc/150?u=lucia', way: 'Camino Portugués', stage: 'Pontevedra', nationality: '🇪🇸', isFollowing: true, status: 'resting', isMutual: true },
  { id: '3', name: 'Oliver Smith', avatar: 'https://i.pravatar.cc/150?u=oliver', way: 'Camino Francés', stage: 'Logroño', nationality: '🇬🇧', isFollowing: false, status: 'online' },
  { id: '4', name: 'Sofia Müller', avatar: 'https://i.pravatar.cc/150?u=sofia', way: 'Camino del Norte', stage: 'Bilbao', nationality: '🇩🇪', isFollowing: false, status: 'walking' },
  { id: '5', name: 'Jean Dupont', avatar: 'https://i.pravatar.cc/150?u=jean', way: 'Vía de la Plata', stage: 'Salamanca', nationality: '🇫🇷', isFollowing: true, status: 'online' },
  { id: '6', name: 'Yuki Tanaka', avatar: 'https://i.pravatar.cc/150?u=yuki', way: 'Camino Francés', stage: 'Sarria', nationality: '🇯🇵', isFollowing: false, status: 'resting' },
];

const Community = ({ onNavigate, language }: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>(INITIAL_PILGRIMS);
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'nearby'>('all');

  const t = {
    title: language === 'en' ? 'Community' : 'Comunidad',
    subtitle: language === 'en' ? 'Find friends and fellow pilgrims on the way.' : 'Encuentra amigos y compañeros de ruta en el camino.',
    searchPlaceholder: language === 'en' ? 'Search by name, route or town...' : 'Busca por nombre, ruta o pueblo...',
    following: language === 'en' ? 'Following' : 'Siguiendo',
    follow: language === 'en' ? 'Follow' : 'Seguir',
    all: language === 'en' ? 'Discover' : 'Descubrir',
    friends: language === 'en' ? 'Friends' : 'Amigos',
    nearby: language === 'en' ? 'Nearby' : 'Cercanos',
    empty: language === 'en' ? 'No pilgrims found.' : 'No se encontraron peregrinos.',
  };

  const handleFollow = (id: string) => {
    setPilgrims(prev => prev.map(p =>
      p.id === id ? { ...p, isFollowing: !p.isFollowing } : p
    ));
  };

  const filteredPilgrims = useMemo(() => {
    let list = pilgrims.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.way.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.stage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTab === 'friends') {
      list = list.filter(p => p.isFollowing);
    } else if (activeTab === 'nearby') {
      // Mock logic: those on French Way
      list = list.filter(p => p.way === 'Camino Francés');
    }

    return list;
  }, [searchQuery, pilgrims, activeTab]);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-sans">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('Landing')}>
            <span className="material-symbols-outlined text-primary text-3xl transition-transform group-hover:scale-110">hiking</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">MyCamino</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigate('Credential')} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Dashboard</button>
            <button onClick={() => onNavigate('Planner')} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Planner</button>
            <button className="text-sm font-black text-primary border-b-2 border-primary pb-0.5">{t.title}</button>
          </nav>
          <div className="flex items-center gap-4">
            <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm cursor-pointer" onClick={() => onNavigate('Credential')}>MP</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{t.subtitle}</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-10 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-surface-dark border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white text-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'all' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
            {t.all}
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'friends' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
            {t.friends}
          </button>
          <button
            onClick={() => setActiveTab('nearby')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'nearby' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
            {t.nearby}
          </button>
        </div>

        {/* Results Grid */}
        {filteredPilgrims.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPilgrims.map((pilgrim) => (
              <div
                key={pilgrim.id}
                className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col animate-scale-in"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="relative cursor-pointer" onClick={() => onNavigate('Credential', pilgrim.id)}>
                    <img
                      src={pilgrim.avatar}
                      alt={pilgrim.name}
                      className="size-16 rounded-2xl object-cover ring-2 ring-slate-50 dark:ring-slate-700 group-hover:scale-105 transition-transform"
                    />
                    <div className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white dark:border-surface-dark ${pilgrim.status === 'walking' ? 'bg-orange-500' :
                      pilgrim.status === 'resting' ? 'bg-blue-500' : 'bg-primary'
                      }`} />
                  </div>
                  <div className="text-2xl">{pilgrim.nationality}</div>
                </div>

                <div className="mb-6 flex-1">
                  <h3
                    className="text-xl font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onNavigate('Credential', pilgrim.id)}
                  >
                    {pilgrim.name}
                    {pilgrim.isMutual && (
                      <span className="material-symbols-outlined text-primary text-sm filled" title="Mutual Friend">handshake</span>
                    )}
                  </h3>
                  <div className="flex flex-col gap-1 text-sm font-semibold">
                    <div className="text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">map</span>
                      {pilgrim.way}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      {pilgrim.stage}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleFollow(pilgrim.id)}
                  className={`w-full py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 active:scale-95 ${pilgrim.isFollowing
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20'
                    : 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {pilgrim.isFollowing ? 'check_circle' : 'person_add'}
                  </span>
                  {pilgrim.isFollowing ? t.following : t.follow}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 dark:bg-surface-dark/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-fade-in">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">person_search</span>
            <p className="text-slate-500 dark:text-slate-400 font-bold">{t.empty}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Community;