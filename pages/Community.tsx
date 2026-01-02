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

const ImageModal = ({ src, isOpen, onClose }: { src: string, isOpen: boolean, onClose: () => void }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 overflow-hidden bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500"
      onClick={onClose}
    >
      {/* Premium Close Button */}
      <button
        className="absolute top-6 right-6 z-10 size-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white transition-all transform hover:rotate-90 active:scale-95 group shadow-2xl backdrop-blur-md"
        onClick={onClose}
      >
        <span className="material-symbols-outlined text-2xl group-hover:scale-110">close</span>
      </button>

      {/* Image Container with Perspective Effect */}
      <div
        className="relative w-full max-w-4xl h-full flex items-center justify-center animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-500 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative group max-h-full">
          {/* Subtle Glow Effect behind image */}
          <div className="absolute inset-x-0 inset-y-0 bg-primary/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <img
            src={src}
            className="relative block max-w-full max-h-[85vh] object-contain rounded-2xl md:rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] ring-1 ring-white/20 select-none cursor-default"
            alt="Full size view"
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Optional: User info or action here if needed */}
        </div>
      </div>
    </div>,
    document.body
  );
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
  const [showFullAvatar, setShowFullAvatar] = useState(false);

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
        <div className="flex items-center gap-2">
          <div className="relative group/avatar cursor-pointer" onClick={(e) => {
            e.stopPropagation();
            setShowFullAvatar(true);
          }}>
            <img
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'P')}&background=random`}
              className="size-10 rounded-full object-cover ring-2 ring-primary/10 shadow-sm transition-transform duration-300 group-hover/avatar:scale-110 active:scale-95"
            />
            <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xs">zoom_in</span>
            </div>
          </div>
          <div className="flex flex-col cursor-pointer" onClick={() => onNavigate('Credential', profile?.id)}>
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

      <ImageModal
        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'P')}&background=random&size=512`}
        isOpen={showFullAvatar}
        onClose={() => setShowFullAvatar(false)}
      />

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
  totalKm?: string;
  mutualFriends?: { name: string, avatar: string, total: number };
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
    <div className="group bg-white dark:bg-surface-dark rounded-xl p-3 md:p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md animate-scale-in flex flex-col items-center text-center relative overflow-hidden">
      {/* Close button (typical in IG discover) */}
      <button className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500 transition-colors z-10">
        <span className="material-symbols-outlined text-lg">close</span>
      </button>

      {/* Avatar Section */}
      <div className="relative mb-3 md:mb-4 mt-1 md:mt-2">
        <div
          className="size-20 md:size-24 rounded-full p-0.5 bg-slate-100 dark:bg-slate-800 cursor-pointer overflow-hidden"
          onClick={() => onNavigate('Credential', pilgrim.id)}
        >
          {pilgrim.avatar ? (
            <img
              src={pilgrim.avatar}
              alt={pilgrim.name}
              className="w-full h-full rounded-full object-cover border-2 border-white dark:border-surface-dark"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-2xl md:text-3xl font-black border-2 border-white dark:border-surface-dark">
              {pilgrim.name[0]}
            </div>
          )}
        </div>
        {/* Status indicator on avatar */}
        <div className={`absolute bottom-0.5 right-0.5 size-4 md:size-5 rounded-full border-2 md:border-4 border-white dark:border-surface-dark ${pilgrim.status === 'walking' ? 'bg-orange-500' :
          pilgrim.status === 'resting' ? 'bg-blue-500' : 'bg-primary'
          }`} />
      </div>

      {/* Name and Username - Fixed height and truncation */}
      <div className="mb-3 md:mb-4 flex flex-col items-center w-full min-h-[44px]">
        <div className="flex items-center gap-1 max-w-full px-1">
          <h3
            className="text-[13px] md:text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:underline"
            onClick={() => onNavigate('Credential', pilgrim.id)}
          >
            {pilgrim.name}
          </h3>
          <span className="material-symbols-outlined text-primary text-[14px] filled select-none flex-shrink-0">verified</span>
        </div>
        <p className="text-[12px] md:text-sm text-slate-400 truncate max-w-full px-2">
          {pilgrim.username?.startsWith('@') ? pilgrim.username : `@${pilgrim.username}`}
        </p>
      </div>

      {/* Mutual / Context */}
      <div className="mb-4 md:mb-6 flex-1 flex flex-col items-center justify-center w-full">
        {pilgrim.mutualFriends && pilgrim.mutualFriends.total > 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-1 overflow-hidden w-full">
            <div className="flex -space-x-2 mr-1 flex-shrink-0">
              <div className="size-4 md:size-5 rounded-full border-2 border-white dark:border-surface-dark bg-slate-100 overflow-hidden">
                {pilgrim.mutualFriends.avatar ? (
                  <img src={pilgrim.mutualFriends.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-[8px] text-white font-bold">
                    {pilgrim.mutualFriends.name[0]}
                  </div>
                )}
              </div>
              {pilgrim.mutualFriends.total > 1 && (
                <div className="size-4 md:size-5 rounded-full border-2 border-white dark:border-surface-dark bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-500">
                  +{pilgrim.mutualFriends.total - 1}
                </div>
              )}
            </div>
            <p className="text-[10px] md:text-[11px] text-slate-500 font-medium truncate max-w-full text-center">
              Seguido por <span className="font-bold text-slate-700 dark:text-slate-300">{pilgrim.mutualFriends.name}</span>
              {pilgrim.mutualFriends.total > 1 ? ` y ${pilgrim.mutualFriends.total - 1} más` : ''}
            </p>
          </div>
        ) : pilgrim.isMutual ? (
          <span className="text-[10px] md:text-[11px] text-slate-500 font-medium">{t.mutual}</span>
        ) : !pilgrim.isFollowing ? (
          <span className="text-[10px] md:text-[11px] text-slate-500 font-medium">{t.suggested}</span>
        ) : (
          <div className="h-4" />
        )}

        {pilgrim.way && pilgrim.way !== 'Camino por definir' && (
          <div className="flex items-center gap-1 mt-1 text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-tight">
            <span className="material-symbols-outlined text-[11px] md:text-[12px]">map</span>
            <span className="truncate">{pilgrim.way}</span>
          </div>
        )}
        <div className="flex items-center gap-1 mt-1 text-[10px] md:text-[11px] font-black text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[12px] md:text-[14px]">speed</span>
          <span>{pilgrim.totalKm || '0'} km</span>
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
  const [activeTab, setActiveTab] = useState<'feed' | 'all' | 'friends' | 'nearby' | 'rankings'>('feed');
  const [rankingTab, setRankingTab] = useState<'friends' | 'world'>('world');
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
      // 1. Fetch all profiles (including self for rankings)
      const { data: profilesData } = await supabase.from('profiles').select('*');

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

      // Fetch distances for all pilgrims in profilesData
      const profileIds = profilesData?.map(p => p.id) || [];
      const { data: allDistances } = await supabase
        .from('user_routes')
        .select('user_id, distance_km')
        .in('user_id', profileIds);

      const kmMap = new Map<string, number>();
      allDistances?.forEach(r => {
        const km = parseFloat(r.distance_km);
        if (!isNaN(km)) {
          kmMap.set(r.user_id, (kmMap.get(r.user_id) || 0) + km);
        }
      });

      // Calculate Mutual Friends (People I follow who follow this pilgrim)
      const mutualMap = new Map<string, any>();
      const profileInfoMap = new Map(profilesData?.map(p => [p.id, p]));

      if (user?.id) {
        const followList = Array.from(followingSet);
        if (followList.length > 0) {
          const { data: pilgrimFollowers } = await supabase
            .from('follows')
            .select('following_id, follower_id')
            .in('following_id', profileIds)
            .in('follower_id', followList);

          pilgrimFollowers?.forEach(f => {
            const current = mutualMap.get(f.following_id) || { total: 0, friends: [] };
            current.total += 1;
            if (current.friends.length < 1) {
              const friendProfile = profileInfoMap.get(f.follower_id);
              current.friends.push({
                name: friendProfile?.full_name?.split(' ')[0] || 'Peregrino',
                avatar: friendProfile?.avatar_url
              });
            }
            mutualMap.set(f.following_id, current);
          });
        }
      }

      if (profilesData) {
        const formatted: Pilgrim[] = profilesData.map(p => {
          const mutual = mutualMap.get(p.id);
          return {
            id: p.id,
            name: p.full_name || p.username || 'Peregrino',
            username: p.username || 'peregrino',
            avatar: p.avatar_url,
            way: p.way,
            stage: p.country ? `Desde ${p.country}` : 'En ruta',
            nationality: p.country === 'ES' ? '🇪🇸' : p.country === 'PT' ? '🇵🇹' : p.country === 'FR' ? '🇫🇷' : p.country === 'IT' ? '🇮🇹' : p.country === 'DE' ? '🇩🇪' : p.country === 'GB' ? '🇬🇧' : p.country === 'US' ? '🇺🇸' : '🏳️',
            isFollowing: followingSet.has(p.id),
            isMutual: mutualSet.has(p.id),
            status: 'online',
            totalKm: (kmMap.get(p.id) || 0).toFixed(1),
            mutualFriends: mutual ? {
              name: mutual.friends[0].name,
              avatar: mutual.friends[0].avatar,
              total: mutual.total
            } : undefined
          };
        });
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
    feed: language === 'en' ? 'Routes' : 'Rutas',
    rankings: language === 'en' ? 'Rank' : 'Ranking',
    world: language === 'en' ? 'World' : 'Mundial',
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
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.way.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.stage.toLowerCase().includes(searchQuery.toLowerCase()))
      && p.id !== user?.id // Exclude self from discovery tabs
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
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-scale-in z-[100] ring-1 ring-black/5">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                      <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        {language === 'en' ? 'Notifications' : 'Notificaciones'}
                      </h4>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                          {unreadCount} {language === 'en' ? 'new' : 'nuevas'}
                        </span>
                      )}
                    </div>
                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-50 dark:border-slate-800 cursor-pointer group ${!n.read ? 'bg-primary/[0.03]' : ''}`}
                            onClick={() => { onNavigate('Credential', n.actor_id); setShowNotifications(false); }}
                          >
                            <div className="relative flex-none">
                              <img
                                src={n.actor?.avatar_url || `https://i.pravatar.cc/150?u=${n.actor_id}`}
                                className="size-11 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm"
                                alt=""
                              />
                              <div className={`absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-900 shadow-sm
                                ${n.type === 'like' || n.type === 'route_like' ? 'bg-pink-500' :
                                  n.type === 'comment' || n.type === 'route_comment' ? 'bg-blue-500' :
                                    n.type === 'follow' ? 'bg-indigo-500' : 'bg-primary'}`}
                              >
                                <span className="material-symbols-outlined text-[12px] font-bold">
                                  {n.type === 'like' || n.type === 'route_like' ? 'favorite' :
                                    n.type === 'comment' || n.type === 'route_comment' ? 'chat_bubble' :
                                      n.type === 'follow' ? 'person_add' : 'notifications'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] leading-normal text-slate-600 dark:text-gray-300 break-words line-clamp-2">
                                <span className="font-bold text-slate-900 dark:text-white mr-1">{n.actor?.full_name || 'Peregrino'}</span>
                                {n.message || (n.type === 'follow' ? (language === 'en' ? 'started following you' : 'empezó a seguirte') : (language === 'en' ? 'sent you a message' : 'te envió un mensaje'))}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                                  {new Date(n.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </span>
                                {!n.read && <span className="size-1.5 rounded-full bg-primary ring-2 ring-primary/20"></span>}
                              </div>
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

        {/* Tabs - Optimized for Mobile (No scroll) */}
        <div className="flex items-end justify-between w-full mb-8 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 flex flex-col items-center gap-1 pb-3 text-[10px] md:text-sm font-bold transition-all border-b-2 ${activeTab === 'feed' ? 'text-primary border-primary' : 'text-slate-400 border-transparent'}`}
          >
            <span className={`material-symbols-outlined text-xl md:hidden ${activeTab === 'feed' ? 'filled' : ''}`}>explore</span>
            <span>{t.feed}</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 flex flex-col items-center gap-1 pb-3 text-[10px] md:text-sm font-bold transition-all border-b-2 ${activeTab === 'all' ? 'text-primary border-primary' : 'text-slate-400 border-transparent'}`}
          >
            <span className={`material-symbols-outlined text-xl md:hidden ${activeTab === 'all' ? 'filled' : ''}`}>search_check</span>
            <span>{t.all}</span>
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 flex flex-col items-center gap-1 pb-3 text-[10px] md:text-sm font-bold transition-all border-b-2 ${activeTab === 'friends' ? 'text-primary border-primary' : 'text-slate-400 border-transparent'}`}
          >
            <span className={`material-symbols-outlined text-xl md:hidden ${activeTab === 'friends' ? 'filled' : ''}`}>group</span>
            <span>{t.friends}</span>
          </button>
          <button
            onClick={() => setActiveTab('nearby')}
            className={`flex-1 flex flex-col items-center gap-1 pb-3 text-[10px] md:text-sm font-bold transition-all border-b-2 ${activeTab === 'nearby' ? 'text-primary border-primary' : 'text-slate-400 border-transparent'}`}
          >
            <span className={`material-symbols-outlined text-xl md:hidden ${activeTab === 'nearby' ? 'filled' : ''}`}>near_me</span>
            <span>{t.nearby}</span>
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={`flex-1 flex flex-col items-center gap-1 pb-3 text-[10px] md:text-sm font-bold transition-all border-b-2 ${activeTab === 'rankings' ? 'text-primary border-primary' : 'text-slate-400 border-transparent'}`}
          >
            <span className={`material-symbols-outlined text-xl md:hidden ${activeTab === 'rankings' ? 'filled' : ''}`}>leaderboard</span>
            <span>{t.rankings}</span>
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
        ) : activeTab === 'rankings' ? (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sub-tabs for Ranking */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8 w-full max-w-sm mx-auto">
              <button
                onClick={() => setRankingTab('world')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${rankingTab === 'world' ? 'bg-white dark:bg-slate-700 text-primary shadow-lg shadow-primary/10' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t.world}
              </button>
              <button
                onClick={() => setRankingTab('friends')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${rankingTab === 'friends' ? 'bg-white dark:bg-slate-700 text-primary shadow-lg shadow-primary/10' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t.friends}
              </button>
            </div>

            {/* Ranking List */}
            <div className="space-y-3">
              {(rankingTab === 'friends'
                ? pilgrims.filter(p => p.isFollowing || p.id === user?.id)
                : pilgrims
              )
                .sort((a, b) => parseFloat(b.totalKm || '0') - parseFloat(a.totalKm || '0'))
                .map((p, index) => (
                  <div
                    key={p.id}
                    className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1 cursor-pointer overflow-hidden relative ${p.id === user?.id ? 'bg-primary/5 border-primary/20 shadow-sm shadow-primary/5 ring-1 ring-primary/10' : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800'}`}
                    onClick={() => onNavigate('Credential', p.id)}
                  >
                    {/* Position Indicator */}
                    <div className="flex-none flex items-center justify-center size-10 rounded-xl font-black text-lg">
                      {index === 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="material-symbols-outlined text-yellow-500 text-4xl filled">workspace_premium</span>
                        </div>
                      ) : index === 1 ? (
                        <div className="flex flex-col items-center">
                          <span className="material-symbols-outlined text-slate-400 text-4xl filled">workspace_premium</span>
                        </div>
                      ) : index === 2 ? (
                        <div className="flex flex-col items-center">
                          <span className="material-symbols-outlined text-amber-600 text-4xl filled">workspace_premium</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 italic">#{index + 1}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="flex-none relative h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700">
                      {p.avatar ? (
                        <img src={p.avatar} className="h-full w-full object-cover transition-transform group-hover:scale-110" alt="" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xl font-black">
                          {p.name[0]}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{p.name}</h4>
                        {p.id === user?.id && (
                          <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm shadow-primary/50">Tú</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="truncate max-w-[100px]">@{p.username}</span>
                        <span className="size-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <span className="truncate">{p.way}</span>
                      </div>
                    </div>

                    {/* Kilometers */}
                    <div className="flex-none text-right pr-2">
                      <div className={`text-xl font-black leading-none ${index < 3 ? 'text-primary' : 'text-slate-700 dark:text-white'}`}>
                        {p.totalKm}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">km</div>
                    </div>

                    {/* Subtle index for non-top 3 */}
                    {index >= 3 && (
                      <div className="absolute top-0 right-0 p-1 opacity-5">
                        <span className="text-4xl font-black italic">{index + 1}</span>
                      </div>
                    )}
                  </div>
                ))}

              {(rankingTab === 'friends' && pilgrims.filter(p => (p.isFollowing || p.id === user?.id) && parseFloat(p.totalKm || '0') > 0).length === 0) && (
                <div className="p-20 text-center bg-slate-50 dark:bg-surface-dark rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 font-light">leaderboard</span>
                  <p className="text-slate-400 font-bold italic">Aún no hay amigos con kilómetros registrados.</p>
                  <p className="text-slate-300 text-xs mt-2">¡Anima a tus amigos a registrar sus rutas!</p>
                </div>
              )}
            </div>
          </div>
        ) : filteredPilgrims.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
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
        )
        }
      </main >
    </div >
  );
};

export default Community;