import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet
const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to auto-fit map bounds
const MapUpdater = ({ start, end }: { start: [number, number], end: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (start && end) {
      const bounds = L.latLngBounds([start, end]);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [start, end, map]);
  return null;
};

// Route Card for Feed
const FeedRouteCard = memo(({ route, onNavigate, user }: { route: any, onNavigate: any, user: any }) => {
  const start = useMemo(() => [route.start_lat, route.start_lng] as [number, number], [route]);
  const end = useMemo(() => [route.end_lat, route.end_lng] as [number, number], [route]);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Like and comment state
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch route geometry
  useEffect(() => {
    if (!isVisible) return;
    let isMounted = true;
    const fetchRouteGeometry = async () => {
      try {
        const response = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${route.start_lng},${route.start_lat};${route.end_lng},${route.end_lat}?overview=full&geometries=geojson`);
        const data = await response.json();
        if (data.routes && data.routes[0] && isMounted) {
          const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
          setRoutePath(coordinates);
        }
      } catch (err) { console.error(err); }
      finally { if (isMounted) setIsLoaded(true); }
    };
    fetchRouteGeometry();
    return () => { isMounted = false; };
  }, [isVisible, route.start_lat, route.start_lng, route.end_lat, route.end_lng]);

  // Fetch likes and comments count
  useEffect(() => {
    const fetchInteractions = async () => {
      // Get like count
      const { count: likes } = await supabase
        .from('route_likes')
        .select('*', { count: 'exact', head: true })
        .eq('route_id', route.id);
      setLikeCount(likes || 0);

      // Check if current user liked
      if (user?.id) {
        const { data: userLike } = await supabase
          .from('route_likes')
          .select('id')
          .eq('route_id', route.id)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsLiked(!!userLike);
      }

      // Get comment count
      const { count: commentsNum } = await supabase
        .from('route_comments')
        .select('*', { count: 'exact', head: true })
        .eq('route_id', route.id);
      setCommentCount(commentsNum || 0);
    };
    fetchInteractions();
  }, [route.id, user?.id]);

  // Handle like/unlike
  const handleLike = async () => {
    if (!user) {
      alert('Inicia sesión para dar like');
      return;
    }

    if (isLiked) {
      // Unlike
      await supabase
        .from('route_likes')
        .delete()
        .eq('route_id', route.id)
        .eq('user_id', user.id);
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      // Like
      await supabase
        .from('route_likes')
        .insert({ route_id: route.id, user_id: user.id });
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    const { data } = await supabase
      .from('route_comments')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('route_id', route.id)
      .order('created_at', { ascending: false });
    setComments(data || []);
  };

  // Handle comment submission
  const handleComment = async () => {
    if (!user) {
      alert('Inicia sesión para comentar');
      return;
    }
    if (!newComment.trim()) return;

    await supabase
      .from('route_comments')
      .insert({
        route_id: route.id,
        user_id: user.id,
        comment_text: newComment.trim()
      });

    setNewComment('');
    setCommentCount(prev => prev + 1);
    await fetchComments();
  };

  // Open comments
  const handleShowComments = () => {
    setShowComments(true);
    fetchComments();
  };

  const profile = Array.isArray(route.profiles) ? route.profiles[0] : route.profiles;

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-6 animate-fade-in mx-auto max-w-[420px]">
      {/* Post Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('Credential', profile?.id)}>
          <img
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'P')}&background=random`}
            className="size-8 rounded-full object-cover ring-2 ring-primary/10 shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary transition-colors">
              {profile?.full_name || 'Peregrino'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">{profile?.username?.startsWith('@') ? profile.username : `@${profile?.username || 'user'}`}</span>
          </div>
        </div>
        <button className="text-slate-300 hover:text-slate-500 transition-colors">
          <span className="material-symbols-outlined text-lg">more_horiz</span>
        </button>
      </div>

      {/* Route Name Banner */}
      <div className="px-3 pb-2">
        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base filled">route</span>
          {route.name}
        </h3>
      </div>

      {/* Map Content - Smaller */}
      <div className="aspect-square relative flex-none group cursor-pointer overflow-hidden" onClick={() => onNavigate('Planner', null, route.id)}>
        <div ref={containerRef} className="absolute inset-0 bg-slate-100 dark:bg-slate-900/50">
          {!isVisible || !isLoaded ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-primary text-2xl">sync</span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Cargando...</span>
            </div>
          ) : (
            <MapContainer center={start} zoom={13} zoomControl={false} dragging={false} scrollWheelZoom={false} className="w-full h-full">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <MapUpdater start={start} end={end} />
              <Marker position={start} icon={icon} />
              <Marker position={end} icon={icon} />
              <Polyline positions={routePath} color="#17cf73" weight={4} opacity={0.8} />
            </MapContainer>
          )}
        </div>

        {/* Info overlay on hover */}
        <div className="absolute bottom-3 left-3 right-3 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 dark:border-slate-800/50 transform transition-all duration-300 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-primary">distance</span>{route.distance_km}</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-primary">timer</span>{route.duration_text}</span>
          </div>
        </div>
      </div>

      {/* Post Actions */}
      <div className="p-3 border-t border-slate-50 dark:border-slate-800/50">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-red-500' : 'text-slate-600 dark:text-slate-300 hover:text-red-500'}`}
          >
            <span className={`material-symbols-outlined text-xl ${isLiked ? 'filled' : ''}`}>favorite</span>
            {likeCount > 0 && <span className="text-xs font-bold">{likeCount}</span>}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShowComments();
            }}
            className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-xl">mode_comment</span>
            {commentCount > 0 && <span className="text-xs font-bold">{commentCount}</span>}
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">send</span>
          </button>
          <div className="flex-1" />
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">bookmark</span>
          </button>
        </div>

        {/* View Route Primary Button */}
        <button
          onClick={() => onNavigate('Planner', null, route.id)}
          className="w-full mb-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">map</span>
          Ver ruta en el mapa
        </button>

        {/* Like count */}
        {likeCount > 0 && (
          <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">
            {likeCount} {likeCount === 1 ? 'me gusta' : 'me gusta'}
          </p>
        )}

        {/* View comments button */}
        {commentCount > 0 && !showComments && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShowComments();
            }}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-2 transition-colors"
          >
            Ver los {commentCount} comentarios
          </button>
        )}

        {/* Comments Section - Inline like Instagram */}
        {showComments && (
          <div className="mt-2 space-y-3 max-h-[300px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {comments.map((comment) => {
              const commentProfile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
              return (
                <div key={comment.id} className="flex gap-2 text-sm">
                  <img
                    src={commentProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(commentProfile?.full_name || 'U')}`}
                    className="size-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                    alt={commentProfile?.full_name || 'Usuario'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-white">
                      <span className="font-bold mr-2">{commentProfile?.full_name || 'Usuario'}</span>
                      <span className="text-slate-700 dark:text-slate-300">{comment.comment_text}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Comment Input - Always visible like Instagram */}
        {user && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
                  e.preventDefault();
                  handleComment();
                }
              }}
              onFocus={() => {
                if (!showComments) {
                  setShowComments(true);
                  fetchComments();
                }
              }}
              placeholder="Añade un comentario..."
              className="flex-1 text-sm bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            {newComment.trim() && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleComment();
                }}
                className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
              >
                Publicar
              </button>
            )}
          </div>
        )}

        {!user && (
          <p className="text-xs text-slate-400 mt-2">Inicia sesión para comentar</p>
        )}
      </div>

    </div>
  );
});

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

// Optimized Card Component
const PilgrimCard = ({ pilgrim, onNavigate, onFollow, language }: {
  pilgrim: Pilgrim,
  onNavigate: any,
  onFollow: any,
  language: string,
  key?: React.Key
}) => {
  const t = {
    following: language === 'en' ? 'Following' : 'Siguiendo',
    follow: language === 'en' ? 'Follow' : 'Seguir',
    suggested: language === 'en' ? 'Suggested for you' : 'Sugerido para ti',
    mutual: language === 'en' ? 'Mutual friend' : 'Amigo mutuo',
  };

  return (
    <div className="group bg-white dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md animate-scale-in flex flex-col items-center text-center relative">
      {/* Close button (typical in IG discover) */}
      <button className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500 transition-colors">
        <span className="material-symbols-outlined text-lg">close</span>
      </button>

      {/* Avatar Section */}
      <div className="relative mb-4 mt-2">
        <div
          className="size-24 rounded-full p-0.5 bg-slate-100 dark:bg-slate-800 cursor-pointer"
          onClick={() => onNavigate('Credential', pilgrim.id)}
        >
          {pilgrim.avatar ? (
            <img
              src={pilgrim.avatar}
              alt={pilgrim.name}
              className="w-full h-full rounded-full object-cover border-2 border-white dark:border-surface-dark"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-3xl font-black border-2 border-white dark:border-surface-dark">
              {pilgrim.name[0]}
            </div>
          )}
        </div>
        {/* Status indicator on avatar */}
        <div className={`absolute bottom-1 right-1 size-5 rounded-full border-4 border-white dark:border-surface-dark ${pilgrim.status === 'walking' ? 'bg-orange-500' :
          pilgrim.status === 'resting' ? 'bg-blue-500' : 'bg-primary'
          }`} />
      </div>

      {/* Name and Username */}
      <div className="mb-4 flex flex-col items-center">
        <div className="flex items-center gap-1">
          <h3
            className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px] cursor-pointer hover:underline"
            onClick={() => onNavigate('Credential', pilgrim.id)}
          >
            {pilgrim.name}
          </h3>
          <span className="material-symbols-outlined text-primary text-[14px] filled select-none">verified</span>
        </div>
        <p className="text-sm text-slate-400">
          {pilgrim.username?.startsWith('@') ? pilgrim.username : `@${pilgrim.username}`}
        </p>
      </div>

      {/* Mutual / Context */}
      <div className="mb-6 flex-1 flex flex-col items-center justify-center">
        {pilgrim.isMutual ? (
          <div className="flex items-center gap-1 px-2">
            <div className="flex -space-x-2 mr-1">
              <div className="size-4 rounded-full bg-slate-200 border border-white"></div>
              <div className="size-4 rounded-full bg-slate-300 border border-white"></div>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">{t.mutual}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 font-medium">{t.suggested}</span>
        )}
        <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-primary uppercase tracking-tight">
          <span className="material-symbols-outlined text-[12px]">map</span>
          {pilgrim.way}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onFollow(pilgrim.id)}
        className={`w-full py-1.5 px-4 rounded-lg text-sm font-bold transition-all active:scale-95 ${pilgrim.isFollowing
          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:opacity-80'
          : 'bg-primary text-white hover:bg-primary-dark'
          }`}
      >
        {pilgrim.isFollowing ? t.following : t.follow}
      </button>
    </div>
  );
};


const Community = ({
  onNavigate, language, user, notifications, unreadCount,
  showNotifications, setShowNotifications, markAllAsRead, onSignOut
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [mutualIds, setMutualIds] = useState<Set<string>>(new Set());
  const [feed, setFeed] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'all' | 'friends' | 'nearby'>('feed');
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
          username: p.username || 'peregrino',
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

      // 4. Fetch Feed (Universal: Following + Global fallback)
      let relevantIds: string[] = [];
      if (user?.id) {
        const followIds = Array.from(followingSet);
        const { data: suggestions } = await supabase
          .from('follows')
          .select('following_id')
          .in('follower_id', followIds.length > 0 ? followIds : [user.id])
          .limit(50);

        const suggestionIds = suggestions?.map(s => s.following_id) || [];
        relevantIds = Array.from(new Set([user.id, ...followIds, ...suggestionIds]));
      }

      // Step 1: Fetch Routes
      let routeQuery = supabase
        .from('user_routes')
        .select('*')
        .order('created_at', { ascending: false });

      if (relevantIds.length > 0) {
        routeQuery = routeQuery.in('user_id', relevantIds);
      }

      let { data: routeData } = await routeQuery.limit(20);

      // Global fallback if empty
      if (!routeData || routeData.length === 0) {
        const { data: globalData } = await supabase
          .from('user_routes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        routeData = globalData;
      }

      if (routeData && routeData.length > 0) {
        // Step 2: Fetch Profiles for these routes
        const userIds = Array.from(new Set(routeData.map(r => r.user_id)));
        const { data: profileList } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profileList?.map(p => [p.id, p]));

        // Step 3: Combine
        const combinedFeed = routeData.map(r => ({
          ...r,
          profiles: profileMap.get(r.user_id) || null
        }));

        setFeed(combinedFeed);
      } else {
        setFeed([]);
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
    feed: language === 'en' ? 'Feed' : 'Explorar Rutas',
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
                                <span className="font-black">{n.actor?.full_name || 'Peregrino'}</span>{' '}
                                {n.message || (n.type === 'follow' ? (language === 'en' ? 'started following you' : 'empezó a seguirte') : (language === 'en' ? 'sent you a message' : 'te envió un mensaje'))}
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
            onClick={() => setActiveTab('feed')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'feed' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
            {t.feed}
          </button>
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

        {/* Results Grid / Feed */}
        {activeTab === 'feed' ? (
          <div className="max-w-xl mx-auto">
            {feed.length > 0 ? (
              feed.map(route => (
                <FeedRouteCard key={route.id} route={route} onNavigate={onNavigate} user={user} />
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50 dark:bg-surface-dark/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-fade-in">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">explore</span>
                <p className="text-slate-500 dark:text-slate-400 font-bold italic">No hay rutas nuevas en tu círculo.</p>
                <p className="text-slate-400 text-xs mt-2">¡Sigue a más peregrinos para ver sus rutas!</p>
              </div>
            )}
          </div>
        ) : filteredPilgrims.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPilgrims.map((pilgrim) => (
              <PilgrimCard
                key={pilgrim.id}
                pilgrim={pilgrim}
                onNavigate={onNavigate}
                onFollow={handleFollow}
                language={language}
              />
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