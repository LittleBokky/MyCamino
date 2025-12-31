import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Pilgrim {
  id: string;
  name: string;
  username: string;
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
  language: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja';
  setLanguage: (lang: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja') => void;
  user?: any;
  onSignOut?: () => void;
  notifications: any[];
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  markAllAsRead: () => void;
}

const Community = ({
  onNavigate, language, user, notifications, unreadCount,
  showNotifications, setShowNotifications, markAllAsRead, onSignOut
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [mutualIds, setMutualIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'nearby'>('all');
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(5);
      setSearchResults(data || []);
      setShowDropdown(true);
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data
  useEffect(() => {
    fetchData();

    // Listen for profile changes
    const profileSub = supabase
      .channel('community-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .subscribe();

    // Listen for follow changes
    const followSub = supabase
      .channel('community-follows')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(profileSub);
      supabase.removeChannel(followSub);
    };
  }, [user?.id]);

  const fetchData = async () => {
    try {
      // 1. Fetch all profiles
      let query = supabase.from('profiles').select('*');

      // If logged in, exclude self
      if (user?.id) {
        query = query.neq('id', user.id);
      }

      const { data: profilesData } = await query;

      // 2. Fetch people I follow
      let followingSet = new Set<string>();
      let mutualSet = new Set<string>();

      if (user?.id) {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        followingData?.forEach(f => followingSet.add(f.following_id));

        // 3. Check mutuals (friends)
        const { data: followersOfMe } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', user.id);

        followersOfMe?.forEach(f => {
          if (followingSet.has(f.follower_id)) {
            mutualSet.add(f.follower_id);
          }
        });
      }

      setFollowingIds(followingSet);
      setMutualIds(mutualSet);

      if (profilesData) {
        const formatted: Pilgrim[] = profilesData.map(p => ({
          id: p.id,
          name: p.full_name || p.username || 'Peregrino',
          username: p.username || '@peregrino',
          avatar: p.avatar_url,
          way: p.way || 'Camino por definir',
          stage: p.country ? `Desde ${p.country}` : 'En ruta',
          nationality: p.country === 'ES' ? '🇪🇸' : p.country === 'PT' ? '🇵🇹' : p.country === 'FR' ? '🇫🇷' : p.country === 'IT' ? '🇮🇹' : p.country === 'DE' ? '🇩🇪' : p.country === 'GB' ? '🇬🇧' : p.country === 'US' ? '🇺🇸' : '🏳️',
          isFollowing: followingSet.has(p.id),
          isMutual: mutualSet.has(p.id),
          status: 'online'
        }));
        setPilgrims(formatted);
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    loading: language === 'en' ? 'Updating community...' : 'Actualizando comunidad...',
    login: language === 'en' ? 'Login' : 'Iniciar Sesión',
  };

  const handleFollow = async (targetId: string) => {
    if (!user) return;

    const currentlyFollowing = followingIds.has(targetId);

    if (currentlyFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetId);

      if (!error) {
        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetId });

      if (!error) {
        setFollowingIds(prev => {
          const next = new Set(prev);
          next.add(targetId);
          return next;
        });
      }
    }
    // Re-fetch to update mutuals etc quickly manually or wait for realtime
    fetchData();
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
      // Logic: same country/stage or just mock logic
      list = list.slice(0, 5);
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
          <nav className="hidden md:flex items-center gap-8 px-6">
            {user && (
              <button onClick={() => onNavigate('Credential')} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors whitespace-nowrap">Dashboard</button>
            )}
            <button onClick={() => onNavigate('Planner')} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors whitespace-nowrap">Planner</button>
            <button className="text-sm font-black text-primary border-b-2 border-primary pb-0.5 whitespace-nowrap">{t.title}</button>
          </nav>

          {/* Search Bar in Navbar */}
          <div className="flex-1 max-w-md mx-6 hidden sm:block relative">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-xl">search</span>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-80 overflow-y-auto">
                  {searchResults.map((res) => (
                    <div
                      key={res.id}
                      className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      onClick={() => {
                        onNavigate('Credential', res.id);
                        setSearchQuery('');
                        setShowDropdown(false);
                      }}
                    >
                      <img
                        src={res.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(res.full_name || 'P')}&background=random`}
                        className="size-10 rounded-xl object-cover"
                        alt=""
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                          {res.full_name || 'Peregrino'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          @{res.username || 'peregrino'}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-lg">chevron_right</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) markAllAsRead();
                  }}
                  className="relative p-2 text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 size-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-surface-dark">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-scale-in">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">
                        {language === 'en' ? 'Notifications' : 'Notificaciones'}
                      </h4>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className={`p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`} onClick={() => { onNavigate('Credential', n.actor_id); setShowNotifications(false); }}>
                            <img
                              src={n.actor?.avatar_url || `https://i.pravatar.cc/150?u=${n.actor_id}`}
                              className="size-10 rounded-xl object-cover"
                              alt=""
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-700 dark:text-gray-200">
                                <span className="font-black">{n.actor?.full_name || 'Peregrino'}</span> {language === 'en' ? 'started following you' : 'empezó a seguirte'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center text-slate-400 italic text-sm">
                          {language === 'en' ? 'No new notifications' : 'No hay notificaciones'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {user && (
              <div
                className="size-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm cursor-pointer hover:bg-primary/30 transition-colors"
                onClick={() => onNavigate('Credential')}
              >
                {user?.user_metadata?.full_name?.[0] || 'MP'}
              </div>
            )}
            {!user && (
              <button
                onClick={onSignOut}
                className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
              >
                {t.login}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

        {/* Mobile Search Bar (Only visible on small screens) */}
        <div className="sm:hidden mb-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400">search</span>
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-surface-dark border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
                    {pilgrim.avatar ? (
                      <img
                        src={pilgrim.avatar}
                        alt={pilgrim.name}
                        className="size-16 rounded-2xl object-cover ring-2 ring-slate-50 dark:ring-slate-700 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xl font-black ring-2 ring-slate-50 dark:ring-slate-700 group-hover:scale-105 transition-transform">
                        {pilgrim.name[0]}
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white dark:border-surface-dark ${pilgrim.status === 'walking' ? 'bg-orange-500' :
                      pilgrim.status === 'resting' ? 'bg-blue-500' : 'bg-primary'
                      }`} />
                  </div>
                  <div className="text-2xl">{pilgrim.nationality}</div>
                </div>

                <div className="mb-6 flex-1">
                  <h3
                    className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onNavigate('Credential', pilgrim.id)}
                  >
                    {pilgrim.name}
                    {pilgrim.isMutual && (
                      <span className="material-symbols-outlined text-primary text-sm filled" title="Mutual Friend">handshake</span>
                    )}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mb-2">{pilgrim.username}</p>
                  <div className="flex flex-col gap-1 text-sm font-semibold">
                    <div className="text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">map</span>
                      {pilgrim.way}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">public</span>
                      {pilgrim.nationality}
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