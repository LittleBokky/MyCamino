import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { t as trans } from '../lib/translations';



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

// Mini Map Component for Cards (Memoized for performance)
const RouteMapCard = memo(({ route, onClick, onDelete, isOwnProfile }: { route: any, onClick: () => void, onDelete: () => void, isOwnProfile: boolean }) => {
    const start = useMemo(() => [route.start_lat, route.start_lng] as [number, number], [route]);
    const end = useMemo(() => [route.end_lat, route.end_lng] as [number, number], [route]);

    // Lazy loading states
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    const [liveDuration, setLiveDuration] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Interaction counts
    const [likeCount, setLikeCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);

    // Intersection Observer to detect when card is on screen
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' } // Start loading safely before it enters view
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let isMounted = true;
        const fetchRouteGeometry = async () => {
            if (!route.start_lat || !route.end_lat) return;

            try {
                // Using FOSSGIS OSRM server (routing.openstreetmap.de)
                const response = await fetch(
                    `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${route.start_lng},${route.start_lat};${route.end_lng},${route.end_lat}?overview=full&geometries=geojson`
                );
                const data = await response.json();

                if (data.routes && data.routes[0] && isMounted) {
                    const r = data.routes[0];
                    // OSRM returns [lon, lat], Leaflet needs [lat, lon]
                    const coordinates = r.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                    setRoutePath(coordinates);

                    // Calculate live duration for walking MANUALLY
                    const distKm = r.distance / 1000;
                    const totalHours = distKm / 4.5;
                    const hours = Math.floor(totalHours);
                    const minutes = Math.round((totalHours - hours) * 60);

                    let timeString = '';
                    if (hours > 0) timeString += `${hours}h `;
                    timeString += `${minutes}min`;
                    setLiveDuration(timeString);
                }
            } catch (error) {
                console.error("Error fetching card route preview:", error);
            } finally {
                if (isMounted) setIsLoaded(true);
            }
        };

        fetchRouteGeometry();

        return () => { isMounted = false; };
    }, [isVisible, route.start_lat, route.start_lng, route.end_lat, route.end_lng]);

    // Fetch interaction counts
    useEffect(() => {
        const fetchCounts = async () => {
            // Get like count
            const { count: likes } = await supabase
                .from('route_likes')
                .select('*', { count: 'exact', head: true })
                .eq('route_id', route.id);
            setLikeCount(likes || 0);

            // Get comment count
            const { count: comments } = await supabase
                .from('route_comments')
                .select('*', { count: 'exact', head: true })
                .eq('route_id', route.id);
            setCommentCount(comments || 0);
        };
        fetchCounts();
    }, [route.id]);

    return (
        <div
            ref={containerRef}
            className="group relative bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden aspect-square cursor-pointer hover:shadow-lg transition-all"
            onClick={onClick}
        >
            {/* Map Preview (Only render maps when visible to save memory/battery) */}
            <div className="absolute inset-0 z-0">
                {!isVisible || !isLoaded ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/20">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <span className="material-symbols-outlined animate-pulse text-2xl">map</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Cargando...</span>
                        </div>
                    </div>
                ) : (
                    <MapContainer
                        center={start}
                        zoom={13}
                        zoomControl={false}
                        scrollWheelZoom={false}
                        dragging={false}
                        touchZoom={false}
                        doubleClickZoom={false}
                        attributionControl={false}
                        className="w-full h-full animate-in fade-in duration-500"
                        style={{ background: '#f0f0f0' }}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                        <MapUpdater start={start} end={end} />
                        <Marker position={start} icon={icon} />
                        <Marker position={end} icon={icon} />
                        <Polyline
                            positions={routePath.length > 0 ? routePath : [start, end]}
                            color="#16a34a"
                            weight={3}
                            opacity={0.8}
                        />
                    </MapContainer>
                )}
            </div>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity z-10" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-2 text-white z-20">
                <h4 className="font-bold text-xs md:text-sm leading-tight mb-0.5 truncate shadow-sm">{route.name}</h4>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-white/90">
                        <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px] md:text-[14px]">straighten</span> {route.distance_km}</span>
                        <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px] md:text-[14px]">schedule</span> {liveDuration || route.duration_text}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-white/90">
                        {likeCount > 0 && (
                            <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[12px] md:text-[14px] filled">favorite</span>
                                {likeCount}
                            </span>
                        )}
                        {commentCount > 0 && (
                            <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[12px] md:text-[14px]">mode_comment</span>
                                {commentCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Button (Top Right) */}
            {isOwnProfile && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute top-1 right-1 p-1 bg-white/10 hover:bg-red-500/80 backdrop-blur-md text-white rounded-full lg:opacity-0 lg:group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 z-30"
                    title="Delete Route"
                >
                    <span className="material-symbols-outlined text-[16px] flex">delete</span>
                </button>
            )}
        </div>
    );
});

// Route Detail View Component - Instagram Style
const RouteDetailView = ({ route, profile, user, onNavigate, onClose }: { route: any, profile: any, user: any, onNavigate: any, onClose: () => void }) => {
    const start = useMemo(() => [route.start_lat, route.start_lng] as [number, number], [route]);
    const end = useMemo(() => [route.end_lat, route.end_lng] as [number, number], [route]);
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Like and comment state
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');

    // Fetch route geometry
    useEffect(() => {
        const fetchRouteGeometry = async () => {
            try {
                const response = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${route.start_lng},${route.start_lat};${route.end_lng},${route.end_lat}?overview=full&geometries=geojson`);
                const data = await response.json();
                if (data.routes && data.routes[0]) {
                    const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                    setRoutePath(coordinates);
                }
            } catch (err) { console.error(err); }
            finally { setIsLoaded(true); }
        };
        fetchRouteGeometry();
    }, [route]);

    // Fetch likes and comments count
    useEffect(() => {
        const fetchInteractions = async () => {
            const { count: likes } = await supabase
                .from('route_likes')
                .select('*', { count: 'exact', head: true })
                .eq('route_id', route.id);
            setLikeCount(likes || 0);

            if (user?.id) {
                const { data: userLike } = await supabase
                    .from('route_likes')
                    .select('id')
                    .eq('route_id', route.id)
                    .eq('user_id', user.id)
                    .maybeSingle();
                setIsLiked(!!userLike);
            }

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
            await supabase
                .from('route_likes')
                .delete()
                .eq('route_id', route.id)
                .eq('user_id', user.id);
            setIsLiked(false);
            setLikeCount(prev => prev - 1);
        } else {
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

    return (
        <div>
            {/* Map Preview */}
            <div className="aspect-square relative bg-slate-100 dark:bg-slate-900">
                {!isLoaded ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined animate-pulse text-4xl text-slate-400">map</span>
                    </div>
                ) : (
                    <MapContainer
                        center={start}
                        zoom={13}
                        zoomControl={true}
                        scrollWheelZoom={true}
                        className="w-full h-full"
                    >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <MapUpdater start={start} end={end} />
                        <Marker position={start} icon={icon} />
                        <Marker position={end} icon={icon} />
                        <Polyline
                            positions={routePath.length > 0 ? routePath : [start, end]}
                            color="#16a34a"
                            weight={4}
                            opacity={0.8}
                        />
                    </MapContainer>
                )}

                {/* Route info overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-lg">straighten</span>
                            {route.distance_km}
                        </span>
                        <span className="flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-lg">schedule</span>
                            {route.duration_text}
                        </span>
                        <button
                            onClick={() => {
                                onClose();
                                onNavigate('Planner', null, route.id);
                            }}
                            className="px-3 py-1.5 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary-dark transition-colors flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">map</span>
                            Ver ruta
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions and Comments */}
            <div className="p-4">
                {/* Action buttons */}
                <div className="flex items-center gap-4 mb-3">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-red-500' : 'text-slate-600 dark:text-slate-300 hover:text-red-500'}`}
                    >
                        <span className={`material-symbols-outlined text-2xl ${isLiked ? 'filled' : ''}`}>favorite</span>
                        {likeCount > 0 && <span className="text-sm font-bold">{likeCount}</span>}
                    </button>
                    <button
                        onClick={handleShowComments}
                        className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">mode_comment</span>
                        {commentCount > 0 && <span className="text-sm font-bold">{commentCount}</span>}
                    </button>
                </div>

                {/* Like count */}
                {likeCount > 0 && (
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                        {likeCount} {likeCount === 1 ? 'me gusta' : 'me gusta'}
                    </p>
                )}

                {/* View comments button */}
                {commentCount > 0 && !showComments && (
                    <button
                        onClick={handleShowComments}
                        className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-3 transition-colors"
                    >
                        Ver los {commentCount} comentarios
                    </button>
                )}

                {/* Comments Section */}
                {showComments && (
                    <div className="mt-3 space-y-4 max-h-[400px] overflow-y-auto mb-4">
                        {comments.map((comment) => {
                            const commentProfile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
                            return (
                                <div key={comment.id} className="flex gap-3">
                                    <img
                                        src={commentProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(commentProfile?.full_name || 'U')}`}
                                        className="size-8 rounded-full object-cover flex-shrink-0"
                                        alt={commentProfile?.full_name || 'Usuario'}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-900 dark:text-white">
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

                {/* Comment Input */}
                {user && (
                    <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
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
                                onClick={handleComment}
                                className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
                            >
                                Publicar
                            </button>
                        )}
                    </div>
                )}

                {!user && (
                    <p className="text-sm text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800">Inicia sesión para comentar</p>
                )}
            </div>
        </div>
    );
};

interface Props {
    onNavigate: (view: any, profileId?: string | null, routeId?: string | null) => void;
    language: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja';
    setLanguage: (lang: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja') => void;
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
            <button
                className="absolute top-6 right-6 z-10 size-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white transition-all transform hover:rotate-90 active:scale-95 group shadow-2xl backdrop-blur-md"
                onClick={onClose}
            >
                <span className="material-symbols-outlined text-2xl group-hover:scale-110">close</span>
            </button>

            <div
                className="relative w-full max-w-4xl h-full flex items-center justify-center animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-500 ease-out"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative group max-h-full">
                    <div className="absolute inset-x-0 inset-y-0 bg-primary/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <img
                        src={src}
                        className="relative block max-w-full max-h-[85vh] object-contain rounded-2xl md:rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] ring-1 ring-white/20 select-none"
                        alt="Full size view"
                    />
                </div>
            </div>
        </div>,
        document.body
    );
};

const Credential = ({
    onNavigate, user, onSignOut, language, setLanguage, selectedProfileId,
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

    const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'friends'>('posts');
    const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
    const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);


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

        // 4. Fetch Saved Routes
        const { data: routes } = await supabase
            .from('user_routes')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });
        setSavedRoutes(routes || []);

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

    const handleDeleteRoute = async (routeId: string) => {
        if (!confirm('Are you sure you want to delete this specific route plan?')) return;

        const { error } = await supabase
            .from('user_routes')
            .delete()
            .eq('id', routeId);

        if (!error) {
            setSavedRoutes(prev => prev.filter(r => r.id !== routeId));
        }
    };

    const metrics = {
        following: counts.following,
        followers: counts.followers,
        friends: counts.friends,
        posts: savedRoutes.length
    };

    const t = {
        followers: trans('followers', language),
        following: trans('following', language),
        friends: trans('friends', language),
        signOut: trans('logout', language),
        dashboard: trans('dashboard', language),
        plan: trans('plan', language),
        follow: trans('follow', language),
        following_btn: trans('following', language),
        notifs: trans('notifications', language),
        editProfile: trans('editProfile', language),
        message: trans('message', language),
        posts: trans('posts', language),
        saved: trans('saved', language),
        achievements: trans('achievements', language),
        bio_default: trans('bio', language),
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
                                {/* Nav Links Removed as requested by user */}
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
                                                    <div className="relative group/avatar cursor-pointer" onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFullImage(res.avatar_url);
                                                    }}>
                                                        {res.avatar_url ? (
                                                            <img
                                                                src={res.avatar_url}
                                                                className="size-10 rounded-xl object-cover transition-transform group-hover/avatar:scale-105"
                                                                alt=""
                                                            />
                                                        ) : (
                                                            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-bold">
                                                                {(res.full_name || 'P')[0]}
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-white text-xs">zoom_in</span>
                                                        </div>
                                                    </div>
                                                    streams                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold truncate text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                            {res.full_name || 'Peregrino'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                            {res.username?.startsWith('@') ? res.username : `@${res.username || 'peregrino'}`}
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
                                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                                <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">{t.notifs}</h4>
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
                                                            <div className="relative flex-none group/avatar cursor-pointer" onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedFullImage(n.actor?.avatar_url || `https://i.pravatar.cc/150?u=${n.actor_id}`);
                                                            }}>
                                                                <img
                                                                    src={n.actor?.avatar_url || `https://i.pravatar.cc/150?u=${n.actor_id}`}
                                                                    className="size-11 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm transition-transform group-hover/avatar:scale-105"
                                                                    alt=""
                                                                />
                                                                <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-white text-[10px]">zoom_in</span>
                                                                </div>
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

            <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-0 py-8 md:py-12">
                {/* Instagram Header Style */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16 mb-12 md:mb-16">
                    <div className="relative flex-none">
                        <div className="size-24 md:size-40 rounded-full border-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-1">
                            <div className="relative group w-full h-full rounded-full overflow-hidden">
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
                                    className={`w-full h-full flex items-center justify-center transition-all ${isOwnProfile ? 'cursor-pointer group' : ''} relative ${uploading ? 'animate-pulse' : ''}`}
                                >
                                    <div
                                        className="relative group/avatar cursor-pointer w-full h-full"
                                        onClick={(e) => {
                                            if (profile?.avatar_url) {
                                                e.stopPropagation();
                                                setSelectedFullImage(profile.avatar_url);
                                            }
                                        }}
                                    >
                                        {uploading ? (
                                            <span className="material-symbols-outlined text-primary animate-spin text-3xl">sync</span>
                                        ) : profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover transition-transform group-hover/avatar:scale-105" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-4xl md:text-6xl font-black">
                                                {displayName[0]}
                                            </div>
                                        )}

                                        {profile?.avatar_url && (
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                                            </div>
                                        )}

                                        {isOwnProfile && (
                                            <div
                                                className="absolute bottom-2 right-2 size-8 bg-white dark:bg-surface-dark rounded-full shadow-lg flex items-center justify-center border border-slate-100 dark:border-slate-800 z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    document.getElementById('avatar-upload-main')?.click();
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 text-lg">photo_camera</span>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                    {/* Info Column */}
                    <div className="flex-1 flex flex-col gap-6 w-full text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <h1 className="text-2xl md:text-3xl font-light text-slate-900 dark:text-white uppercase tracking-tight">{profile?.username || (isOwnProfile ? user?.user_metadata?.username : '@peregrino')}</h1>

                            <div className="flex gap-2">
                                {isOwnProfile ? (
                                    <>
                                        <button className="px-5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            {t.editProfile}
                                        </button>
                                        <button className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <span className="material-symbols-outlined text-xl">settings</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleFollow}
                                            className={`px-6 py-1.5 font-bold rounded-lg text-sm transition-all active:scale-95 ${isFollowing
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-red-50 hover:text-red-500'
                                                : 'bg-primary text-white hover:bg-primary-dark'
                                                }`}
                                        >
                                            {isFollowing ? t.following_btn : t.follow}
                                        </button>
                                        <button
                                            onClick={() => onNavigate('Chat', selectedProfileId)}
                                            className="px-6 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                        >
                                            {t.message}
                                        </button>
                                        <button className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                            <span className="material-symbols-outlined text-xl">person_add</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex justify-center md:justify-start gap-8 md:gap-10 border-y md:border-y-0 border-slate-100 dark:border-slate-800 py-3 md:py-0">
                            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">{metrics.posts}</span>
                                <span className="text-slate-500 text-sm">{t.posts}</span>
                            </div>
                            <button onClick={() => fetchList('followers')} className="flex flex-col md:flex-row items-center gap-1 md:gap-2 hover:opacity-70 transition-opacity">
                                <span className="font-bold text-slate-900 dark:text-white">{metrics.followers}</span>
                                <span className="text-slate-500 text-sm">{t.followers}</span>
                            </button>
                            <button onClick={() => fetchList('following')} className="flex flex-col md:flex-row items-center gap-1 md:gap-2 hover:opacity-70 transition-opacity">
                                <span className="font-bold text-slate-900 dark:text-white">{metrics.following}</span>
                                <span className="text-slate-500 text-sm">{t.following}</span>
                            </button>
                        </div>

                        {/* Bio Section */}
                        <div className="space-y-1">
                            <p className="font-bold text-slate-900 dark:text-white">{displayName}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{profile?.bio || t.bio_default}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}

                <div className="max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
                    <div className="flex justify-center gap-12 md:gap-16">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`flex items-center gap-2 py-4 border-t transition-all uppercase tracking-widest text-[10px] md:text-xs font-bold ${activeTab === 'posts' ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-500'}`}
                        >
                            <span className="material-symbols-outlined text-lg">grid_on</span>
                            {t.posts}
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`flex items-center gap-2 py-4 border-t transition-all uppercase tracking-widest text-[10px] md:text-xs font-bold ${activeTab === 'saved' ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-500'}`}
                        >
                            <span className="material-symbols-outlined text-lg">military_tech</span>
                            {t.achievements}
                        </button>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`flex items-center gap-2 py-4 border-t transition-all uppercase tracking-widest text-[10px] md:text-xs font-bold ${activeTab === 'friends' ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-500'}`}
                        >
                            <span className="material-symbols-outlined text-lg">group</span>
                            {t.friends} ( {metrics.friends} )
                        </button>
                    </div>
                </div>

                {/* Grid Content Section */}
                <div className="max-w-4xl mx-auto mt-6">
                    {activeTab === 'posts' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {savedRoutes.length > 0 ? (
                                savedRoutes.map(route => (
                                    <RouteMapCard
                                        key={route.id}
                                        route={route}
                                        onClick={() => setSelectedRoute(route)}
                                        onDelete={() => handleDeleteRoute(route.id)}
                                        isOwnProfile={isOwnProfile}
                                    />
                                ))
                            ) : (
                                <div className="col-span-2 md:col-span-3 text-center py-20">
                                    <div className="size-20 rounded-full border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-4xl text-slate-300">add_a_photo</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Compartir rutas</h3>
                                    <p className="text-slate-400 text-sm max-w-xs mx-auto">Cuando guardes rutas planificadas, aparecerán aquí para tus seguidores.</p>
                                    {isOwnProfile && (
                                        <button onClick={() => onNavigate('Planner')} className="mt-4 text-primary font-bold text-sm">Crear tu primera ruta</button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'saved' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 px-2 md:px-0">
                                {[
                                    { id: 'first_step', icon: 'hiking', label: 'Primer Paso', desc: 'Crea tu primera ruta personalizada', unlocked: savedRoutes.length > 0 },
                                    { id: 'gran_caminante', icon: 'distance', label: 'Gran Caminante', desc: 'Supera los 100km planificados', unlocked: metrics.posts >= 10 },
                                    { id: 'friend_maker', icon: 'diversity_3', label: 'Compañero', desc: 'Ten al menos 5 amigos en el Camino', unlocked: metrics.friends >= 5 },
                                    { id: 'photographer', icon: 'photo_camera', label: 'Fotógrafo', desc: 'Sube una foto de perfil', unlocked: !!profile?.avatar_url },
                                    { id: 'planner', icon: 'map', label: 'Cartógrafo', desc: 'Guarda 5 rutas diferentes', unlocked: savedRoutes.length >= 5 },
                                    { id: 'veteran', icon: 'workspace_premium', label: 'Veterano', desc: 'Más de 10 seguidores', unlocked: metrics.followers >= 10 }
                                ].map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 flex flex-col items-center text-center ${achievement.unlocked
                                            ? 'bg-white dark:bg-slate-900 border-primary/20 shadow-md shadow-primary/5'
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-60'
                                            }`}
                                    >
                                        <div className={`size-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 ${achievement.unlocked
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                            }`}>
                                            <span className="material-symbols-outlined text-3xl filled">{achievement.icon}</span>
                                        </div>

                                        <h4 className={`text-sm font-black uppercase tracking-tight mb-1 ${achievement.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                            {achievement.label}
                                        </h4>
                                        <p className="text-[10px] md:text-xs text-slate-400 leading-tight">
                                            {achievement.desc}
                                        </p>

                                        {!achievement.unlocked && (
                                            <div className="absolute top-2 right-2">
                                                <span className="material-symbols-outlined text-slate-300 text-sm">lock</span>
                                            </div>
                                        )}
                                        {achievement.unlocked && (
                                            <div className="absolute top-2 right-2 animate-in zoom-in duration-500">
                                                <span className="material-symbols-outlined text-primary text-sm filled">verified</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'friends' && (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-4xl text-primary">volunteer_activism</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{metrics.friends} Amigos mutuos</h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Los amigos mutuos son peregrinos que se siguen el uno al otro.</p>
                            <button
                                onClick={() => fetchList('friends')}
                                className="px-8 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                            >
                                Ver lista de amigos
                            </button>
                        </div>
                    )}
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
                                                {person.avatar_url ? (
                                                    <img
                                                        src={person.avatar_url}
                                                        alt={person.full_name}
                                                        className="size-12 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 group-hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-lg font-black ring-2 ring-slate-100 dark:ring-slate-800 group-hover:scale-105 transition-transform">
                                                        {(person.full_name || 'P')[0]}
                                                    </div>
                                                )}
                                                <div className="absolute -bottom-1 -right-1 size-3 bg-primary rounded-full border-2 border-white dark:border-surface-dark"></div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight group-hover:text-primary transition-colors">{person.full_name}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {person.username?.startsWith('@') ? person.username : `@${person.username || 'peregrino'}`}
                                                </p>
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

            {/* Route Detail Modal - Instagram Style */}
            {selectedRoute && (
                <div className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedRoute(null)}>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header with close button */}
                        <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between z-10">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedRoute.name}</h3>
                            <button onClick={() => setSelectedRoute(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Route content - reusing the card structure */}
                        <RouteDetailView route={selectedRoute} profile={profile} user={user} onNavigate={onNavigate} onClose={() => setSelectedRoute(null)} />
                    </div>
                </div>
            )}

            {selectedFullImage && (
                <ImageModal
                    src={selectedFullImage}
                    isOpen={!!selectedFullImage}
                    onClose={() => setSelectedFullImage(null)}
                />
            )}
        </div>
    );
};

export default Credential;