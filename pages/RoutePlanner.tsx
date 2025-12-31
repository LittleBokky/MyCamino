import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

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

// Route Data
const STAGES = [
  { name: "Saint-Jean-Pied-de-Port", coords: [43.1636, -1.2358], description: "Start of French Way" },
  { name: "Roncesvalles", coords: [43.0094, -1.3194], description: "Historical Monastery" },
  { name: "Zubiri", coords: [42.9309, -1.5039], description: "Bridge of Rabies" },
  { name: "Pamplona", coords: [42.8125, -1.6458], description: "Capital of Navarre" },
  { name: "Puente la Reina", coords: [42.6719, -1.8153], description: "Bridge of the Queen" }
] as const;

const ROUTE_LINE = STAGES.map(s => [...s.coords]) as [number, number][];

interface Props {
  onNavigate: (view: any, profileId?: string | null) => void;
  language: 'en' | 'es';
  toggleLanguage: () => void;
  openAuth: (mode: 'login' | 'register') => void;
  user?: any;
  onSignOut?: () => void;
  notifications: any[];
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  markAllAsRead: () => void;
}

const RoutePlanner = ({
  onNavigate, user, notifications, unreadCount, showNotifications,
  setShowNotifications, markAllAsRead, language
}: Props) => {
  const [showListOnMobile, setShowListOnMobile] = useState(true);

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
          <nav className="hidden md:flex items-center gap-9">
            <button onClick={() => onNavigate('Dashboard')} className="text-sm font-medium hover:text-primary transition-colors">Community</button>
            <button onClick={() => onNavigate('Workshop')} className="text-sm font-medium hover:text-primary transition-colors">Shop</button>
            <button onClick={() => onNavigate('Credential')} className="text-sm font-medium hover:text-primary transition-colors">Profile</button>
          </nav>
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
          className={`w-full lg:w-[420px] xl:w-[480px] flex flex-col bg-white dark:bg-background-dark border-r border-border-light dark:border-border-dark z-30 shadow-xl lg:shadow-none h-full absolute lg:relative transform transition-transform duration-300 ease-in-out lg:translate-x-0 group/sidebar ${showListOnMobile ? 'translate-x-0' : '-translate-x-full'}`}
          id="sidebar"
        >
          <div className="p-6 border-b border-border-light dark:border-border-dark flex-none bg-white dark:bg-background-dark">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-text-main dark:text-white mb-1">Create Your Camino</h1>
                <p className="text-text-muted dark:text-gray-400 text-sm">Customize your pilgrimage route</p>
              </div>
              <button
                onClick={() => setShowListOnMobile(false)}
                className="lg:hidden p-2 text-gray-500 hover:text-primary"
              >
                <span className="material-symbols-outlined">map</span>
              </button>
            </div>
            <div className="relative mb-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 block">Select Major Route</label>
              <div className="relative">
                <select className="w-full appearance-none bg-background-light dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl px-4 py-3 pr-10 text-text-main dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow cursor-pointer">
                  <option value="frances">Camino Francés</option>
                  <option value="portugues">Camino Portugués</option>
                  <option value="norte">Camino del Norte</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/10">
              <div className="text-center">
                <p className="text-xs text-text-muted uppercase font-semibold">Total Distance</p>
                <p className="text-lg font-bold text-text-main dark:text-white">780 km</p>
              </div>
              <div className="w-px bg-primary/20"></div>
              <div className="text-center">
                <p className="text-xs text-text-muted uppercase font-semibold">Est. Days</p>
                <p className="text-lg font-bold text-text-main dark:text-white">32 Days</p>
              </div>
              <div className="w-px bg-primary/20"></div>
              <div className="text-center">
                <p className="text-xs text-text-muted uppercase font-semibold">Difficulty</p>
                <p className="text-lg font-bold text-text-main dark:text-white">Medium</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-text-main dark:text-white">Show on Map</h3>
                <button className="text-primary text-xs font-medium hover:underline">Reset</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-semibold shadow-sm transition-transform active:scale-95">
                  <span className="material-symbols-outlined text-[16px]">bed</span> Albergues
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark text-text-main dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">restaurant</span> Dining
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark text-text-main dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">attractions</span> Sights
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 pb-20">
              <h3 className="text-sm font-bold text-text-main dark:text-white">Route Stages</h3>
              <div className="group relative bg-white dark:bg-gray-800 rounded-xl border-2 border-primary shadow-sm overflow-hidden transition-all hover:shadow-md cursor-pointer" onClick={() => onNavigate('Stage Details')}>
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                <div className="p-4 pl-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Stage 1</span>
                      <span className="text-xs text-orange-500 font-bold flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px]">landscape</span> Difficult</span>
                    </div>
                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  </div>
                  <h4 className="font-bold text-text-main dark:text-white leading-tight mb-1">Saint-Jean-Pied-de-Port to Roncesvalles</h4>
                  <div className="flex items-center gap-3 text-xs text-text-muted dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">straighten</span> 25.1 km</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">trending_up</span> +1250m</span>
                  </div>
                </div>
              </div>

              <div className="group relative bg-white dark:bg-gray-800 rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden transition-all hover:border-primary/50 cursor-pointer" onClick={() => onNavigate('Stage Details')}>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Stage 2</span>
                      <span className="text-xs text-primary font-bold flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px]">hiking</span> Moderate</span>
                    </div>
                    <button className="text-gray-300 hover:text-primary transition-colors"><span className="material-symbols-outlined">add_circle</span></button>
                  </div>
                  <h4 className="font-bold text-text-main dark:text-white leading-tight mb-1">Roncesvalles to Zubiri</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border-light dark:border-border-dark bg-white dark:bg-background-dark flex-none sticky bottom-0">
            <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined">save</span> Save Itinerary
            </button>
          </div>
        </aside>

        <main className="flex-1 relative h-full bg-[#e5e7eb] w-full z-0">
          <MapContainer center={[42.9, -1.5]} zoom={9} scrollWheelZoom={true} className="h-full w-full outline-none z-0" zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline positions={ROUTE_LINE} color="#17cf73" weight={5} dashArray="10, 10" />
            {STAGES.map((stage, i) => (
              <Marker key={i} position={stage.coords as [number, number]} icon={icon}>
                <Popup className="font-display">
                  <div className="text-center">
                    <h3 className="font-bold text-text-main">{stage.name}</h3>
                    <p className="text-xs text-text-muted">{stage.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Mobile Map Toggle */}
          {!showListOnMobile && (
            <button
              onClick={() => setShowListOnMobile(true)}
              className="lg:hidden absolute bottom-6 right-6 z-[1000] flex items-center gap-2 bg-white dark:bg-gray-900 text-text-main dark:text-white px-4 py-3 rounded-full shadow-xl font-bold border border-gray-200 dark:border-gray-700"
            >
              <span className="material-symbols-outlined">list</span> Show List
            </button>
          )}

          <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between z-[400]">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pointer-events-auto">
              <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-lg flex items-center p-1">
                <div className="pl-3 pr-2 text-text-muted"><span className="material-symbols-outlined">search</span></div>
                <input className="w-full bg-transparent border-none focus:ring-0 text-sm text-text-main dark:text-white placeholder-text-muted h-10" placeholder="Search specific stage or town..." type="text" />
              </div>
              <div className="flex bg-white dark:bg-gray-900 rounded-lg shadow-lg p-1 gap-1">
                <button className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">Standard</button>
                <button className="px-3 py-1.5 rounded-md text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium transition-colors">Satellite</button>
              </div>
            </div>
            <div className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-[120%] bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl w-64 z-[500] group pointer-events-auto cursor-pointer" onClick={() => onNavigate('Stage Details')}>
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-bold text-text-main dark:text-white text-sm">Pamplona</h5>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold uppercase">Stage 3 End</span>
              </div>
              <div className="h-24 w-full bg-gray-200 rounded-lg mb-2 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD7AgROmEAKKOby4n2LsKH5Hx3QEqwgbwIsMe2Fs1nosb_hM2lzdi1ung--aQA-bZT_1WEvIHZejD7cz8MMQwaueSl1Y7vFkyftr3L0EFMMnKYoyGvw3tk5qhiUrgJEikbrd-GDhV8SNK6NTho02xEBY1rQNSAWS5IPswS9cjFOI28QHH90AwbZI7b5RtJOoqg456plTXp1kda8Qc1JlNR3PF0sFwKOHcSsSVeeTi7y2Hl2tvK7heLic_IrhYBq9jOX4y_U5gN9Sts")' }}></div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Historical Capital</span>
                <button className="text-primary text-xs font-bold hover:underline">View Details</button>
              </div>
              <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white dark:border-t-gray-800"></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoutePlanner;