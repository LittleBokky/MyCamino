import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';

// Custom Marker Icon definition
const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Route Group Definition
interface RouteGroup {
  country: string;
  routes: {
    id: string;
    name: string;
    start: [number, number];
    end: [number, number];
    description: string;
  }[];
}

const FAMOUS_ROUTES_GROUPED: RouteGroup[] = [
  {
    country: "Spain",
    routes: [
      {
        id: 'frances',
        name: 'Camino Francés',
        start: [43.1636, -1.2358], // St Jean Pied de Port (technically France, but start of main route)
        end: [42.8782, -8.5448], // Santiago
        description: 'The classic 800km route.'
      },
      {
        id: 'norte',
        name: 'Camino del Norte',
        start: [43.3379, -1.7888], // Irun
        end: [42.8782, -8.5448],
        description: 'Coastal route from Basque Country.'
      },
      {
        id: 'primitivo',
        name: 'Camino Primitivo',
        start: [43.3619, -5.8494], // Oviedo
        end: [42.8782, -8.5448],
        description: 'The first pilgrimage route.'
      },
      {
        id: 'ingles_ferrol',
        name: 'Camino Inglés (Ferrol)',
        start: [43.4832, -8.2369], // Ferrol
        end: [42.8782, -8.5448],
        description: 'Standard 100km+ for Compostela.'
      },
      {
        id: 'ingles_coruna',
        name: 'Camino Inglés (A Coruña)',
        start: [43.3623, -8.4115], // A Coruña
        end: [42.8782, -8.5448],
        description: 'For Celtic Camino (Link with Ireland/UK).'
      },
      {
        id: 'via_plata',
        name: 'Vía de la Plata',
        start: [37.3891, -5.9845], // Sevilla
        end: [42.8782, -8.5448], // Santiago
        description: 'Long Roman road from the south.'
      },
      {
        id: 'fisterra',
        name: 'Camino de Fisterra',
        start: [42.8782, -8.5448], // Santiago
        end: [42.9068, -9.2633], // Fisterra
        description: 'To the end of the world.'
      }
    ]
  },
  {
    country: "Portugal",
    routes: [
      {
        id: 'portugues_central',
        name: 'Portugués Central',
        start: [41.1579, -8.6291], // Porto
        end: [42.8782, -8.5448],
        description: 'Popular route from Porto.'
      },
      {
        id: 'portugues_litoral',
        name: 'Portugués Coastal',
        start: [41.1579, -8.6291], // Porto (actually follows coast)
        end: [42.8782, -8.5448],
        description: 'Scenic coastal alternative.'
      },
      {
        id: 'portugues_lisboa',
        name: 'Portugués from Lisbon',
        start: [38.7115, -9.1399], // Lisbon
        end: [42.8782, -8.5448],
        description: 'The full Portuguese way.'
      }
    ]
  },
  {
    country: "France",
    routes: [
      {
        id: 'podiensis',
        name: 'Via Podiensis',
        start: [45.0445, 3.8860], // Le Puy-en-Velay
        end: [43.1636, -1.2358], // St Jean Pied de Port
        description: 'From Le Puy-en-Velay.'
      },
      {
        id: 'turonensis',
        name: 'Via Turonensis',
        start: [48.8566, 2.3522], // Paris (Saint-Jacques Tower)
        end: [43.1636, -1.2358],
        description: 'The Way of Tours (from Paris).'
      }
    ]
  },
  {
    country: "Ireland (Celtic Camino)",
    routes: [
      {
        id: 'kerry_camino',
        name: 'Kerry Camino',
        start: [52.2713, -9.7026], // Tralee
        end: [52.1409, -10.2703], // Dingle
        description: 'Official Celtic Camino. Finish in Spain (A Coruña).'
      },
      {
        id: 'st_kevins',
        name: 'St Kevin\'s Way',
        start: [53.0936, -6.6067], // Hollywood
        end: [53.0119, -6.3298], // Glendalough
        description: 'Official Celtic Camino. Finish in Spain (A Coruña).'
      },
      {
        id: 'boyne_valley',
        name: 'Boyne Valley Camino',
        start: [53.7145, -6.3506], // Drogheda
        end: [53.7431, -6.5025], // Mellifont Abbey loops
        description: 'Official 25km Celtic Camino.'
      }
    ]
  },
  {
    country: "United Kingdom",
    routes: [
      {
        id: 'st_michaels',
        name: 'St Michael\'s Way',
        start: [50.1982, -5.4607], // Lelant
        end: [50.1171, -5.4778], // St Michael's Mount
        description: 'Cornish Celtic Camino route.'
      },
      {
        id: 'north_wales',
        name: 'North Wales Pilgrim\'s Way',
        start: [53.2800, -3.2200], // Holywell (approx)
        end: [52.7900, -4.7500], // Bardsey Island
        description: 'Historical connection to Santiago.'
      }
    ]
  }
];

interface Props {
  onNavigate: (view: any, profileId?: string | null) => void;
  language: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja';
  setLanguage: (lang: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja') => void;
  openAuth: (mode: 'login' | 'register') => void;
  user?: any;
  onSignOut?: () => void;
  notifications: any[];
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  markAllAsRead: () => void;
  selectedRouteId?: string | null;
}

// Map Click Component
const MapEvents = ({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) => {
  useMapEvents({
    click: (e) => onMapClick(e),
  });
  return null;
};

// Fix for Leaflet not resizing correctly in flex containers
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300); // Small delay to wait for container transition
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const RoutePlanner = ({
  onNavigate, user, notifications, unreadCount, showNotifications,
  setShowNotifications, markAllAsRead, language, selectedRouteId
}: Props) => {
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const [startPoint, setStartPoint] = useState<L.LatLng | null>(null);
  const [endPoint, setEndPoint] = useState<L.LatLng | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Effect to handle selectedRouteId (loading saved routes)
  useEffect(() => {
    if (!selectedRouteId) return;

    const loadSavedRoute = async () => {
      // 1. Check if it is a Famous Route ID
      let famousRoute = null;
      for (const group of FAMOUS_ROUTES_GROUPED) {
        famousRoute = group.routes.find(r => r.id === selectedRouteId);
        if (famousRoute) break;
      }

      if (famousRoute) {
        setSelectedPreset(selectedRouteId);
        const start = L.latLng(famousRoute.start[0], famousRoute.start[1]);
        const end = L.latLng(famousRoute.end[0], famousRoute.end[1]);
        setStartPoint(start);
        setEndPoint(end);
        fetchRoute(start, end);
        return;
      }

      // 2. If not famous, fetch from DB assuming it's a custom route UUID
      setLoading(true);
      const { data, error } = await supabase
        .from('user_routes')
        .select('*')
        .eq('id', selectedRouteId)
        .single();

      if (data && !error) {
        const start = L.latLng(data.start_lat, data.start_lng);
        const end = L.latLng(data.end_lat, data.end_lng);
        setStartPoint(start);
        setEndPoint(end);

        // If it was a famous route saved by ID
        if (data.route_id && data.route_id !== 'custom') {
          setSelectedPreset(data.route_id);
        } else {
          setSelectedPreset('');
        }

        // Ideally we fetch route again or store geometry. For now fetch again.
        fetchRoute(start, end);
      }
      setLoading(false);
    };

    loadSavedRoute();
  }, [selectedRouteId]);

  const fetchRoute = async (start: L.LatLng, end: L.LatLng) => {
    setLoading(true);

    // Using FOSSGIS OSRM server (routing.openstreetmap.de)
    // This server is specifically configured for better pedestrian routing.
    const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // OSRM returns [lon, lat], leaflet needs [lat, lon]
        const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        setRoutePath(coordinates);

        // Distance in meters to km
        const distKmRaw = route.distance / 1000;
        const distKm = distKmRaw.toFixed(2);
        setDistance(`${distKm} km`);

        // Force manual calculation for Walking (approx 4.5 km/h)
        const walkingSpeedKmH = 4.5;
        const totalHours = distKmRaw / walkingSpeedKmH;

        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - hours) * 60);

        let timeString = '';
        if (hours > 0) timeString += `${hours}h `;
        timeString += `${minutes}min`;

        setDuration(timeString);
      } else {
        alert('Route not found. Try points closer to known paths.');
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      alert("Error calculating route. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const routeId = e.target.value;
    setSelectedPreset(routeId);

    if (routeId) {
      // Search in all groups
      let route = null;
      for (const group of FAMOUS_ROUTES_GROUPED) {
        route = group.routes.find(r => r.id === routeId);
        if (route) break;
      }

      if (route) {
        const start = L.latLng(route.start[0], route.start[1]);
        const end = L.latLng(route.end[0], route.end[1]);

        setStartPoint(start);
        setEndPoint(end);
        fetchRoute(start, end);
        // On mobile, maybe we want to close list? keeping it open for now
      }
    } else {
      resetRoute();
    }
  };

  const saveRoute = async () => {
    if (!user) {
      alert('Please sign in to save routes');
      return;
    }
    if (!startPoint || !endPoint) return;

    setSaving(true);
    try {
      const routeName = selectedPreset
        ? FAMOUS_ROUTES_GROUPED.flatMap(g => g.routes).find(r => r.id === selectedPreset)?.name
        : `Custom Route ${new Date().toLocaleDateString()}`;

      const { error } = await supabase.from('user_routes').insert({
        user_id: user.id,
        name: routeName,
        route_id: selectedPreset || 'custom',
        start_lat: startPoint.lat,
        start_lng: startPoint.lng,
        end_lat: endPoint.lat,
        end_lng: endPoint.lng,
        distance_km: distance,
        duration_text: duration
      });

      if (error) {
        // Check if table exists error?
        if (error.code === '42P01') { // undefined_table
          alert("Error: 'user_routes' table not found. Please run the migration.");
        } else {
          throw error;
        }
      } else {
        alert('Route saved to your profile!');
      }
    } catch (e: any) {
      console.error('Error saving route:', e);
      alert('Failed to save route: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!startPoint) {
      setStartPoint(e.latlng);
      setSelectedPreset(''); // User is customizing
    } else if (!endPoint) {
      setEndPoint(e.latlng);
      fetchRoute(startPoint, e.latlng);
      setSelectedPreset(''); // User is customizing
    }
  };

  const resetRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setRoutePath([]);
    setDistance('');
    setDuration('');
    setSelectedPreset('');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white font-display overflow-hidden flex flex-col h-screen relative">
      <header className="flex-none flex items-center justify-between whitespace-nowrap border-b border-solid border-border-light dark:border-border-dark px-6 py-3 bg-white dark:bg-background-dark z-20 relative shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigate('Landing')}>
          <div className="size-8 text-primary">
            <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-text-main dark:text-white text-xl font-bold leading-tight tracking-tight">MyCamino</h2>
        </div>
        <div className="flex items-center gap-8">
          {/* Nav removed as requested */}
          <div className="flex items-center gap-3">
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
                    <span className="absolute top-1.5 right-1.5 size-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-background-dark">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-scale-in text-left">
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
                            <div className="flex-1 whitespace-normal">
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
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm cursor-pointer" onClick={() => onNavigate('Credential')}>
              {user?.user_metadata?.full_name?.[0] || 'JD'}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside
          className={`flex flex-col bg-white dark:bg-background-dark z-30 shadow-2xl lg:shadow-xl absolute lg:relative transform transition-transform duration-300 ease-in-out group/sidebar overflow-hidden lg:translate-x-0
            /* Mobile: Floating Card */
            w-[calc(100%-32px)] max-w-sm h-auto max-h-[85vh] top-4 left-4 rounded-2xl border border-border-light dark:border-border-dark
            /* Desktop: Full Sidebar */
            lg:w-[420px] xl:w-[480px] lg:h-full lg:rounded-none lg:border-0 lg:border-r lg:top-0 lg:left-0 lg:max-h-none
            ${showListOnMobile ? 'translate-x-0' : '-translate-x-[200%]'}
          `}
          id="sidebar"
        >
          <div className="p-6 border-b border-border-light dark:border-border-dark flex-none bg-white dark:bg-background-dark relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-text-main dark:text-white mb-1">Route Planner</h1>
                <p className="text-text-muted dark:text-gray-400 text-sm">Design your own walking path</p>
              </div>
              <button
                onClick={() => setShowListOnMobile(false)}
                className="lg:hidden p-2 text-gray-500 hover:text-primary bg-gray-100 dark:bg-gray-800 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 border border-primary/10 mb-6 max-h-[40vh] overflow-y-auto lg:max-h-none">
              <h3 className="text-sm font-bold text-text-main dark:text-white mb-4">Instructions</h3>

              <div className="mb-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 block">Choose Famous Route</label>
                <div className="relative">
                  <select
                    value={selectedPreset}
                    onChange={handlePresetChange}
                    className="w-full appearance-none bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl px-4 py-3 pr-10 text-text-main dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow cursor-pointer text-sm"
                  >
                    <option value="">Select a route...</option>
                    {FAMOUS_ROUTES_GROUPED.map(group => (
                      <optgroup key={group.country} label={group.country}>
                        {group.routes.map(route => (
                          <option key={route.id} value={route.id}>{route.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 my-4">
                <div className="h-px bg-border-light dark:bg-border-dark flex-1"></div>
                <span className="text-[10px] text-text-muted uppercase font-bold">OR CUSTOMIZE</span>
                <div className="h-px bg-border-light dark:bg-border-dark flex-1"></div>
              </div>

              <ol className="list-decimal pl-4 space-y-2 text-sm text-text-muted">
                <li className={!startPoint && !selectedPreset ? "font-bold text-primary" : ""}>Click on the map to set Start Point</li>
                <li className={startPoint && !endPoint ? "font-bold text-primary" : ""}>Click again to set End Point</li>
                <li>View estimated distance and duration</li>
              </ol>
            </div>

            {(distance || loading) && (
              <div className="flex flex-col gap-4 animate-scale-in">
                <div className="flex justify-between bg-white dark:bg-gray-800 rounded-xl p-4 border border-border-light dark:border-border-dark shadow-sm">
                  <div className="text-center flex-1">
                    <p className="text-xs text-text-muted uppercase font-semibold">Values</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="material-symbols-outlined text-primary">straighten</span>
                      <p className="text-xl font-bold text-text-main dark:text-white">{loading ? '...' : distance}</p>
                    </div>
                  </div>
                  <div className="w-px bg-border-light dark:bg-border-dark mx-2"></div>
                  <div className="text-center flex-1">
                    <p className="text-xs text-text-muted uppercase font-semibold">Estimation</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="material-symbols-outlined text-primary">timer</span>
                      <p className="text-xl font-bold text-text-main dark:text-white">{loading ? '...' : duration}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                onClick={resetRoute}
                className={`flex-1 py-3 px-4 rounded-xl font-bold bg-white dark:bg-gray-800 text-text-main dark:text-white border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 ${!startPoint ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!startPoint}
              >
                <span className="material-symbols-outlined">restart_alt</span>
                Reset
              </button>
              <button
                onClick={saveRoute}
                disabled={!startPoint || !endPoint || saving}
                className={`flex-[2] py-3 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${startPoint && endPoint ? 'bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20' : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'}`}
              >
                {saving ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined">bookmark_add</span>
                )}
                {saving ? 'Saving...' : 'Save to Profile'}
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 relative h-full bg-[#e5e7eb] w-full z-0 overflow-hidden">
          <div className="absolute inset-0">
            <MapContainer center={[42.8125, -1.6458]} zoom={8} scrollWheelZoom={true} className="h-full w-full outline-none z-0" zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapEvents onMapClick={handleMapClick} />
              <MapResizer />

              {startPoint && (
                <Marker position={startPoint} icon={icon}>
                  <Popup>Start Point</Popup>
                </Marker>
              )}

              {endPoint && (
                <Marker position={endPoint} icon={icon}>
                  <Popup>End Point</Popup>
                </Marker>
              )}

              {routePath.length > 0 && (
                <Polyline positions={routePath} color="#17cf73" weight={5} />
              )}
            </MapContainer>
          </div>

          {/* Mobile Map Toggle */}
          {!showListOnMobile && (
            <button
              onClick={() => setShowListOnMobile(true)}
              className="lg:hidden absolute top-4 left-4 z-[1000] flex items-center justify-center size-12 bg-white dark:bg-gray-900 text-text-main dark:text-white rounded-2xl shadow-xl font-bold border border-gray-200 dark:border-gray-700"
            >
              <span className="material-symbols-outlined">menu_open</span>
            </button>
          )}

          <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-1 gap-1 flex">
              <button className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">Standard</button>
              <button className="px-3 py-1.5 rounded-md text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium transition-colors">Satellite</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoutePlanner;