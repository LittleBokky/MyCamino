import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';

const currentPosIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="relative">
            <div class="size-4 bg-primary rounded-full border-2 border-white shadow-lg"></div>
            <div class="absolute -inset-2 bg-primary/30 rounded-full animate-ping"></div>
           </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

const MapController = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [map]);
    return null;
};

interface LiveTrackerProps {
    onNavigate: (view: any) => void;
    user: any;
    language: string;
    trackingState: {
        isRecording: boolean;
        setIsRecording: (v: boolean) => void;
        isPaused: boolean;
        setIsPaused: (v: boolean) => void;
        path: [number, number][];
        setPath: (v: any) => void;
        distance: number;
        setDistance: (v: any) => void;
        time: number;
        setTime: (v: any) => void;
        currentPos: [number, number] | null;
        resetTracking: () => void;
    };
}

const LiveTracker = ({ onNavigate, user, language, trackingState }: LiveTrackerProps) => {
    const {
        isRecording, setIsRecording,
        isPaused, setIsPaused,
        path, distance, time,
        currentPos, resetTracking
    } = trackingState;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        if (!user) {
            alert(language === 'en' ? 'Please login to track activities' : 'Inicia sesión para registrar actividades');
            return;
        }
        resetTracking();
        setIsRecording(true);
        setIsPaused(false);
    };

    const handlePause = () => setIsPaused(!isPaused);

    const handleStop = async () => {
        if (!isRecording) return;

        setIsRecording(false);
        const routeName = prompt(language === 'en' ? 'Route name:' : 'Nombre de la ruta:', `Ruta ${new Date().toLocaleDateString()}`);

        if (routeName && path.length > 1) {
            try {
                const { error } = await supabase.from('user_routes').insert({
                    user_id: user.id,
                    name: routeName,
                    distance_km: distance.toFixed(2),
                    duration_text: formatTime(time),
                    start_lat: path[0][0],
                    start_lng: path[0][1],
                    end_lat: path[path.length - 1][0],
                    end_lng: path[path.length - 1][1],
                    participants: [],
                    route_id: 'live_tracking'
                });

                if (error) throw error;
                alert(language === 'en' ? 'Route saved!' : '¡Ruta guardada!');
                resetTracking();
                onNavigate('Credential');
            } catch (err: any) {
                console.error(err);
                alert('Error: ' + err.message);
            }
        } else {
            resetTracking();
        }
    };

    const pace = useMemo(() => {
        if (distance === 0) return '0:00';
        const paceMinKm = (time / 60) / distance;
        const min = Math.floor(paceMinKm);
        const sec = Math.round((paceMinKm - min) * 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }, [distance, time]);

    const requestManualLocation = () => {
        navigator.geolocation.getCurrentPosition(
            (pos) => { }, // App.tsx will pick it up via watch
            (err) => alert(language === 'en' ? "Location access denied" : "Acceso a ubicación denegado"),
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="flex-1 flex flex-col relative h-screen bg-slate-100 overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 z-[1001] p-4 flex items-center justify-between pointer-events-none">
                <button
                    onClick={() => onNavigate('Landing')}
                    className="pointer-events-auto size-12 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl text-slate-900 dark:text-white border border-white/20 hover:bg-white transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex flex-col items-end gap-2">
                    <div className={`pointer-events-auto ${isRecording ? 'bg-red-500' : 'bg-primary'} text-white px-4 py-2 rounded-full font-black text-xs shadow-xl flex items-center gap-2 ${isRecording && !isPaused ? 'animate-pulse' : ''}`}>
                        <span className="size-2 bg-white rounded-full"></span>
                        {isRecording ? (isPaused ? (language === 'en' ? 'PAUSED' : 'PAUSADO') : (language === 'en' ? 'LIVE' : 'EN DIRECTO')) : (language === 'en' ? 'READY' : 'LISTO')}
                    </div>
                    <button
                        onClick={requestManualLocation}
                        className="pointer-events-auto size-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg text-primary border border-white/20 hover:scale-105 active:scale-95 transition-all"
                        title={language === 'en' ? "Find my location" : "Buscar mi ubicación"}
                    >
                        <span className="material-symbols-outlined">my_location</span>
                    </button>
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 z-0 relative">
                <MapContainer
                    center={currentPos || [42.8125, -1.6458]}
                    zoom={16}
                    className="h-full w-full"
                    zoomControl={false}
                >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <MapResizer />
                    {currentPos && <MapController center={currentPos} />}
                    {currentPos && <Marker position={currentPos} icon={currentPosIcon} />}
                    {path.length > 1 && <Polyline positions={path} color="#ef4444" weight={6} opacity={0.8} lineCap="round" />}
                </MapContainer>
            </div>

            {/* Stats Overlay */}
            <div className="absolute bottom-0 inset-x-0 z-[1001] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 rounded-t-[40px] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.15)] p-8">
                <div className="max-w-md mx-auto space-y-8">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center group">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{language === 'en' ? 'Time' : 'TIEMPO'}</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{formatTime(time)}</p>
                        </div>
                        <div className="text-center group border-x border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{language === 'en' ? 'Distance' : 'DISTANCIA'}</p>
                            <div className="flex items-baseline justify-center gap-1">
                                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{distance.toFixed(2)}</p>
                                <p className="text-xs font-bold text-slate-400">km</p>
                            </div>
                        </div>
                        <div className="text-center group">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{language === 'en' ? 'Pace' : 'RITMO'}</p>
                            <div className="flex items-baseline justify-center gap-1">
                                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{pace}</p>
                                <p className="text-xs font-bold text-slate-400">/km</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-6">
                        {!isRecording ? (
                            <button
                                onClick={handleStart}
                                className="size-20 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/30 transition-all hover:scale-110 active:scale-95 group"
                            >
                                <span className="material-symbols-outlined text-4xl filled group-hover:scale-110 transition-transform">play_arrow</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handlePause}
                                    className={`size-16 ${isPaused ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'} rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95`}
                                >
                                    <span className="material-symbols-outlined text-3xl">{isPaused ? 'play_arrow' : 'pause'}</span>
                                </button>
                                <button
                                    onClick={handleStop}
                                    className="size-20 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/30 transition-all hover:scale-110 active:scale-95 group"
                                >
                                    <span className="material-symbols-outlined text-4xl filled group-hover:rotate-90 transition-transform">stop</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .material-symbols-outlined.filled {
                    font-variation-settings: 'FILL' 1;
                }
            `}</style>
        </div>
    );
};

export default LiveTracker;
