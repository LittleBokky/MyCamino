import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
    onNavigate: (view: any, profileId?: string | null) => void;
    language: 'en' | 'es';
    toggleLanguage: () => void;
    openAuth: (mode: 'login' | 'register') => void;
    user: any;
    onSignOut: () => void;
    selectedProfileId: string | null;
    notifications: any[];
    unreadCount: number;
    showNotifications: boolean;
    setShowNotifications: (show: boolean) => void;
    markAllAsRead: () => void;
}

const Credential = ({
    onNavigate, user, onSignOut, language, toggleLanguage, selectedProfileId,
    notifications, unreadCount, showNotifications, setShowNotifications, markAllAsRead
}: Props) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [counts, setCounts] = useState({ followers: 0, following: 0, friends: 0 });
    const [loading, setLoading] = useState(true);
    const [activeList, setActiveList] = useState<'following' | 'followers' | 'friends' | null>(null);
    const [listData, setListData] = useState<any[]>([]);
    const [listLoading, setListLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
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

    // If selectedProfileId exists, we are viewing that specific user. Otherwise, we view the logged-in user.
    const targetUserId = selectedProfileId || user?.id;
    const isOwnProfile = !selectedProfileId || selectedProfileId === user?.id;

    const displayName = profile?.full_name || (isOwnProfile ? (user?.user_metadata?.full_name || user?.email?.split('@')[0]) : 'Peregrino');

    const fetchData = async () => {
        if (!targetUserId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        // 1. Fetch Profile Info
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetUserId)
            .single();
        if (profileData) setProfile(profileData);

        // 2. Fetch Counts
        await updateCounts();

        // 3. Check if current user follows this profile
        if (user && !isOwnProfile) {
            const { data: followCheck } = await supabase
                .from('follows')
                .select('*')
                .eq('follower_id', user.id)
                .eq('following_id', targetUserId);
            setIsFollowing(followCheck && followCheck.length > 0);
        }

        setLoading(false);
    };

    const updateCounts = async () => {
        if (!targetUserId) return;

        const { count: followingCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', targetUserId);

        const { count: followersCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', targetUserId);

        // Mutual Friends
        const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', targetUserId);
        const { data: followers } = await supabase.from('follows').select('follower_id').eq('following_id', targetUserId);

        const followingIds = following?.map(f => f.following_id) || [];
        const followerIds = followers?.map(f => f.follower_id) || [];
        const friends = followingIds.filter(id => followerIds.includes(id)).length;

        setCounts({
            following: followingCount || 0,
            followers: followersCount || 0,
            friends: friends
        });

        // Also update list if it's open
        if (activeList) {
            fetchList(activeList);
        }
    };

    useEffect(() => {
        fetchData();

        // Real-time subscription for follows
        const followChannel = supabase
            .channel(`profile-follows-${targetUserId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'follows',
                filter: `follower_id=eq.${targetUserId}`
            }, () => updateCounts())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'follows',
                filter: `following_id=eq.${targetUserId}`
            }, () => updateCounts())
            .subscribe();

        // Real-time for profile updates
        const profileChannel = supabase
            .channel(`profile-data-${targetUserId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${targetUserId}`
            }, (payload) => setProfile(payload.new))
            .subscribe();

        return () => {
            supabase.removeChannel(followChannel);
            supabase.removeChannel(profileChannel);
        };
    }, [targetUserId, user]);

    // Real-time notifications listener removed - handled by App.tsx

    const handleFollow = async () => {
        if (!user || isOwnProfile) return;

        try {
            if (isFollowing) {
                // Unfollow
                await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', targetUserId);
                setIsFollowing(false);
                setCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
            } else {
                // Follow
                await supabase
                    .from('follows')
                    .insert({ follower_id: user.id, following_id: targetUserId });

                // Create Notification
                await supabase.from('notifications').insert({
                    user_id: targetUserId,
                    actor_id: user.id,
                    type: 'follow'
                });

                setIsFollowing(true);
                setCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
            }
        } catch (error) {
            console.error("Error following/unfollowing:", error);
        }
    };

    const fetchList = async (type: 'following' | 'followers' | 'friends') => {
        if (!targetUserId) return;
        setListLoading(true);
        setActiveList(type);

        try {
            let ids: string[] = [];

            if (type === 'following') {
                const { data } = await supabase
                    .from('follows')
                    .select('following_id')
                    .eq('follower_id', targetUserId);
                ids = data?.map(d => d.following_id) || [];
            } else if (type === 'followers') {
                const { data } = await supabase
                    .from('follows')
                    .select('follower_id')
                    .eq('following_id', targetUserId);
                ids = data?.map(d => d.follower_id) || [];
            } else if (type === 'friends') {
                const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', targetUserId);
                const { data: followers } = await supabase.from('follows').select('follower_id').eq('following_id', targetUserId);
                const followingIds = following?.map(f => f.following_id) || [];
                const followerIds = followers?.map(f => f.follower_id) || [];
                ids = followingIds.filter(id => followerIds.includes(id));
            }

            if (ids.length > 0) {
                const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
                setListData(profiles || []);
            } else {
                setListData([]);
            }
        } catch (error) {
            console.error("Error fetching list:", error);
        } finally {
            setListLoading(false);
        }
    };

    const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isOwnProfile) return;
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Debes seleccionar una imagen.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            // Refresh
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (profileData) setProfile(profileData);

        } catch (error: any) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    // markAllAsRead removed - handled by App.tsx

    const metrics = {
        following: counts.following,
        followers: counts.followers,
        friends: counts.friends
    };

    // unreadCount removed - handled by App.tsx

    const t = {
        followers: language === 'en' ? 'Followers' : 'Seguidores',
        following: language === 'en' ? 'Following' : 'Siguiendo',
        friends: language === 'en' ? 'Friends' : 'Amigos',
        signOut: language === 'en' ? 'Sign Out' : 'Cerrar Sesión',
        dashboard: language === 'en' ? 'My Profile' : 'Mi Perfil',
        plan: language === 'en' ? 'Plan' : 'Planificar',
        back: language === 'en' ? 'Back' : 'Volver',
        follow: language === 'en' ? 'Follow' : 'Seguir',
        notifs: language === 'en' ? 'Notifications' : 'Notificaciones',
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white overflow-x-hidden min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('Landing')}>
                                <span className="material-symbols-outlined text-4xl text-primary">hiking</span>
                                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">MyCamino</h2>
                            </div>
                            <nav className="hidden md:flex items-center gap-6 pr-4">
                                <button onClick={() => onNavigate('Landing')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">{language === 'en' ? 'Home' : 'Inicio'}</button>
                                <button onClick={() => onNavigate('Planner')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">{t.plan}</button>
                                <button onClick={() => onNavigate('Community')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Community</button>
                                <button onClick={() => onNavigate('Credential')} className={`text-sm font-medium transition-colors ${isOwnProfile ? 'font-bold text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>{t.dashboard}</button>
                            </nav>

                            {/* Global Search Bar */}
                            <div className="hidden lg:block w-64 group relative">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-xl">search</span>
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400"
                                        placeholder={language === 'en' ? 'Search pilgrims...' : 'Buscar peregrinos...'}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') onNavigate('Community');
                                        }}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                        onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                                    />
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
                        </div>
                        <div className="flex items-center gap-4">
                            {isOwnProfile && (
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
                                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">{t.notifs}</h4>
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

                            {!isOwnProfile && (
                                <button
                                    onClick={() => onNavigate('Credential')}
                                    className="flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-full transition-all border border-primary/20"
                                >
                                    <span className="material-symbols-outlined text-[18px]">person</span>
                                    {t.dashboard}
                                </button>
                            )}
                            <button onClick={onSignOut} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                                {t.signOut}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Profile Identity */}
                <div className="max-w-4xl mx-auto mb-16 flex flex-col items-center text-center">
                    <div className="relative group mb-6">
                        {isOwnProfile && (
                            <input
                                type="file"
                                id="avatar-upload-main"
                                accept="image/*"
                                onChange={handleUploadAvatar}
                                className="hidden"
                                disabled={uploading}
                            />
                        )}
                        <label
                            htmlFor={isOwnProfile ? "avatar-upload-main" : undefined}
                            className={`size-32 rounded-3xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-xl flex items-center justify-center overflow-hidden transition-all ${isOwnProfile ? 'cursor-pointer hover:scale-105 active:scale-95 group' : ''} relative ${uploading ? 'animate-pulse' : ''}`}
                        >
                            {uploading ? (
                                <span className="material-symbols-outlined text-primary animate-spin text-3xl">sync</span>
                            ) : profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-4xl font-black">
                                    {displayName[0]}
                                </div>
                            )}

                            {isOwnProfile && (
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                                    <span className="text-[10px] text-white font-bold uppercase tracking-widest mt-1">
                                        {language === 'en' ? 'Edit Photo' : 'Editar Foto'}
                                    </span>
                                </div>
                            )}
                        </label>
                        {isOwnProfile && !uploading && (
                            <div className="absolute -bottom-2 -right-2 size-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900">
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                            </div>
                        )}
                    </div>

                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">{displayName}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {profile?.username || (isOwnProfile ? user?.user_metadata?.username : '@peregrino')}
                    </p>

                    {!isOwnProfile && (
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleFollow}
                                className={`px-8 py-2.5 font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 ${isFollowing
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-500'
                                    : 'bg-primary text-white shadow-primary/20 hover:bg-primary-dark'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {isFollowing ? 'check_circle' : 'person_add'}
                                </span>
                                {isFollowing ? t.following : t.follow}
                            </button>
                            <button className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                <span className="material-symbols-outlined">mail</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div
                            onClick={() => fetchList('following')}
                            className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-all hover:shadow-md active:scale-95"
                        >
                            <span className="material-symbols-outlined text-primary bg-primary/10 p-3 rounded-2xl text-3xl">person_add</span>
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{metrics.following}</span>
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t.following}</p>
                        </div>

                        <div
                            onClick={() => fetchList('followers')}
                            className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-all hover:shadow-md active:scale-95"
                        >
                            <span className="material-symbols-outlined text-primary bg-primary/10 p-3 rounded-2xl text-3xl">group</span>
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{metrics.followers}</span>
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t.followers}</p>
                        </div>

                        <div
                            onClick={() => fetchList('friends')}
                            className="bg-primary/5 dark:bg-primary/10 p-8 rounded-2xl border-2 border-primary/20 dark:border-primary/30 shadow-lg flex flex-col items-center justify-center gap-3 relative overflow-hidden cursor-pointer hover:bg-primary/10 transition-all active:scale-95"
                        >
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl"></div>
                            <span className="material-symbols-outlined text-white bg-primary p-3 rounded-2xl text-3xl shadow-lg shadow-primary/30">volunteer_activism</span>
                            <span className="text-4xl font-black text-primary">{metrics.friends}</span>
                            <p className="text-sm font-bold uppercase tracking-widest text-primary">{t.friends}</p>
                        </div>
                    </div>
                </div>

                {/* List Modal */}
                {activeList && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setActiveList(null)}>
                        <div
                            className="bg-white dark:bg-surface-dark w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {activeList === 'following' ? t.following : activeList === 'followers' ? t.followers : t.friends}
                                </h3>
                                <button onClick={() => setActiveList(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto p-4 flex flex-col gap-3">
                                {listLoading ? (
                                    <div className="flex flex-col items-center py-12 gap-4">
                                        <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                        <p className="text-sm font-bold text-slate-400">Cargando...</p>
                                    </div>
                                ) : listData.length > 0 ? (
                                    listData.map((person) => (
                                        <div key={person.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all group">
                                            <div className="relative">
                                                <img
                                                    src={person.avatar_url || `https://i.pravatar.cc/150?u=${person.id}`}
                                                    alt={person.full_name}
                                                    className="size-12 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 group-hover:scale-105 transition-transform"
                                                />
                                                <div className="absolute -bottom-1 -right-1 size-3 bg-primary rounded-full border-2 border-white dark:border-surface-dark"></div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight group-hover:text-primary transition-colors">{person.full_name}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">@{person.username || 'peregrino'}</p>
                                            </div>
                                            <button
                                                onClick={() => onNavigate('Credential', person.id)}
                                                className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all group/btn"
                                            >
                                                <span className="material-symbols-outlined text-[20px] group-hover/btn:translate-x-1 transition-transform">chevron_right</span>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center py-16 text-center">
                                        <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-800 mb-4 text-slate-300">person_search</span>
                                        <p className="text-slate-400 font-bold">No hay nadie aquí todavía</p>
                                        <p className="text-slate-300 dark:text-slate-600 text-xs mt-1 italic">¡Empieza a conectar con otros peregrinos!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Credential;