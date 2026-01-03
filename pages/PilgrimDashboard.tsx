import React, { useState } from 'react';

interface Props {
  onNavigate: (view: any) => void;
  language: 'en' | 'es';
  toggleLanguage: () => void;
  openAuth: (mode: 'login' | 'register') => void;
  user: any;
  onSignOut: () => void;
}

const PilgrimDashboard = ({ onNavigate, user, onSignOut }: Props) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Peregrino';

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-50 transition-colors duration-200 min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('Landing')}>
              <img src="/navbar_logo.png" alt="MyCamino" className="h-10 w-auto object-contain" />
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => onNavigate('Planner')} className="nav-link text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300 transition-colors">Plan</button>
              <button onClick={() => onNavigate('Dashboard')} className="text-sm font-black text-primary border-b-2 border-primary pb-0.5">Walk</button>
              <button onClick={() => onNavigate('Community')} className="nav-link text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300 transition-colors">Community</button>
              <button onClick={() => onNavigate('Workshop')} className="nav-link text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300 transition-colors">Shop</button>
            </nav>
            <div className="flex items-center gap-3">
              <button onClick={onSignOut} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors hidden sm:block">
                Sign Out
              </button>
              <button className="flex items-center justify-center size-10 rounded-full hover:bg-primary/10 text-slate-600 dark:text-slate-300 transition-all hover:text-primary">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <div className="ml-2 relative group cursor-pointer hidden sm:block" onClick={() => onNavigate('Credential')}>
                <div className="size-10 rounded-full overflow-hidden border-2 border-primary/20 bg-slate-200 hover:border-primary transition-all flex items-center justify-center">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Portrait" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold">{displayName[0]}</span>
                  )}
                </div>
              </div>
              <button
                className="md:hidden p-2 text-slate-600 dark:text-slate-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark px-4 py-4 space-y-4 shadow-lg animate-slide-up">
            <button onClick={() => { onNavigate('Planner'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-primary/10 rounded-md">Plan</button>
            <button onClick={() => { onNavigate('Dashboard'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 text-base font-bold text-primary bg-primary/10 rounded-md">Walk</button>
            <button onClick={() => { onNavigate('Community'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-primary/10 rounded-md">Community</button>
            <button onClick={() => { onNavigate('Workshop'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-primary/10 rounded-md">Shop</button>
            <button onClick={() => { onNavigate('Credential'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-primary/10 rounded-md">My Profile</button>
            <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3"></div>
            <button onClick={onSignOut} className="block w-full text-left py-2 px-3 text-base font-bold text-red-500 hover:bg-red-50 rounded-md">Sign Out</button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Buen Camino, {displayName}!</h2>

              <p className="text-primary font-bold mt-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm animate-pulse">sunny</span>
                Day 5 on the French Way
              </p>
            </div>
            <button className="group inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-black shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 w-full md:w-auto">
              <span className="material-symbols-outlined mr-2 group-hover:rotate-12 transition-transform">edit_note</span>
              Log Today's Walk
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Distance Walked', val: '125 km', pct: '16%', icon: 'directions_walk' },
              { label: 'Remaining', val: '650 km', sub: 'Next: Burgos (150km)', icon: 'flag' },
              { label: 'Days on Trail', val: '5', sub: 'On pace', icon: 'calendar_today', trend: true }
            ].map((stat, i) => (
              <div key={i} className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-1 hover:shadow-md transition-shadow group animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">{stat.icon}</span>
                  {stat.label}
                </div>
                <span className="text-3xl font-black tracking-tight">{stat.val}</span>
                {stat.pct && (
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" style={{ width: stat.pct }}></div>
                  </div>
                )}
                {stat.sub && (
                  <p className={`text-xs mt-2 font-bold ${stat.trend ? 'text-green-500 flex items-center' : 'text-slate-400'}`}>
                    {stat.trend && <span className="material-symbols-outlined text-xs mr-1">trending_up</span>}
                    {stat.sub}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Active Route</h3>
                <button onClick={() => onNavigate('Planner')} className="group flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                  View Map <span className="material-symbols-outlined text-sm arrow-animate">arrow_forward</span>
                </button>
              </div>
              <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="flex flex-col md:flex-row">
                  <div className="p-8 md:p-10 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest">Active</span>
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest">Stage 6</span>
                      </div>
                      <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Camino Francés</h4>
                      <div className="flex flex-col gap-3 text-slate-600 dark:text-slate-300 mb-8">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                          Next Stop: <span className="font-black text-slate-900 dark:text-white">Pamplona</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className="material-symbols-outlined text-lg text-primary">thermostat</span>
                          Weather: <span className="font-black text-slate-900 dark:text-white">Sunny, 22°C</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap gap-4">
                      <button onClick={() => onNavigate('Stage Details')} className="flex-1 min-w-[140px] bg-primary/10 hover:bg-primary text-primary hover:text-white font-black py-3 px-6 rounded-xl text-sm transition-all active:scale-95">
                        Stage Details
                      </button>
                      <button onClick={() => onNavigate('Planner')} className="flex-1 min-w-[140px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-black py-3 px-6 rounded-xl text-sm transition-all active:scale-95">
                        Accommodations
                      </button>
                    </div>
                  </div>
                  <div className="relative w-full md:w-2/5 h-64 md:h-auto overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-l z-10"></div>
                    <div className="w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDIfMQHB-rQ0c1YtYncPjM7j-yhyl6fgFB66-RZ39XyxjZYwsFnvHsY5IfO7sWyyAWq3GuwQCAJM_x7Zc9UmagX5W78kpVp8HSVsuIzhcfEJxAdV7iDSfeuVH2esOyeQh1Lj86Kr1suNobM9y3XgpLNh6ljSJ6ooJMRPA6nrPguy0gq2MJqYvTnL1-ZyIiNhNgevulhnva2ANxH5o1ov0-6WtsOvm6N8sa1L7TN7i6BCo4KZCnACJ2fNCzsfiORj2qzP0YTMqXqjHc")' }}></div>
                    <div className="absolute bottom-6 left-6 z-20">
                      <span className="text-white text-xs font-black bg-primary px-3 py-1 rounded-full shadow-lg">Near Puente la Reina</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Pilgrim Passport</h3>
                <button onClick={() => onNavigate('Credential')} className="group flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                  View Full <span className="material-symbols-outlined text-sm arrow-animate">arrow_forward</span>
                </button>
              </div>
              <div className="bg-[#fcfaf7] dark:bg-[#25221e] rounded-3xl shadow-xl border border-[#eaddcf] dark:border-[#443d35] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
                  {[
                    { color: "blue", name: "St. Jean\nPied de Port", rotate: "-rotate-12", icon: "church", delay: 0 },
                    { color: "red", name: "Roncesvalles\nAlbergue", rotate: "rotate-6", icon: "bed", delay: 0.1 },
                    { color: "green", name: "Zubiri\nMunicipal", rotate: "-rotate-3", icon: "forest", delay: 0.2 },
                    { color: "purple", name: "Pamplona\nCatedral", rotate: "rotate-12", icon: "castle", delay: 0.3 },
                  ].map((stamp, i) => (
                    <div key={i} className="animate-scale-in aspect-square rounded-full border-2 border-slate-300/30 dark:border-slate-600/30 p-2 flex items-center justify-center bg-white/50 dark:bg-white/5 shadow-inner hover:scale-110 hover:rotate-0 transition-all duration-300 cursor-pointer group" style={{ animationDelay: `${stamp.delay}s` }}>
                      <div className={`size-full rounded-full bg-${stamp.color}-50 dark:bg-${stamp.color}-900/20 flex items-center justify-center text-${stamp.color}-700 dark:text-${stamp.color}-300 font-serif text-[10px] text-center font-black leading-tight p-2 transform ${stamp.rotate} border-2 border-${stamp.color}-800/20 dark:border-${stamp.color}-400/20 border-dashed group-hover:border-solid transition-all`}>
                        {stamp.name}
                      </div>
                    </div>
                  ))}
                  <div className="animate-scale-in aspect-square rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-white/20 dark:bg-white/5 group cursor-pointer hover:border-primary hover:text-primary transition-all duration-300" style={{ animationDelay: '0.4s' }}>
                    <span className="material-symbols-outlined text-3xl mb-1 group-hover:scale-125 group-hover:rotate-12 transition-transform">qr_code_scanner</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Scan</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-10">
            {/* Find Friends CTA */}
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-8 text-white shadow-xl shadow-primary/20 animate-fade-in relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">person_add</span>
                ¿Quién camina contigo?
              </h3>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">Encuentra a tus amigos en el mapa, sigue sus avances y haz nuevas amistades en tu misma ruta.</p>
              <button
                onClick={() => onNavigate('Community')}
                className="w-full py-3 bg-white text-primary font-black rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-lg"
              >
                Buscar Peregrinos
              </button>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 animate-fade-in" style={{ animationDelay: '0.7s' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Community</h3>
                <button onClick={() => onNavigate('Community')} className="text-primary text-sm font-black hover:underline">Ver todo</button>
              </div>
              <div className="space-y-6">
                {[
                  { title: "Best albergues in Logroño?", replies: 5, time: "2h ago" },
                  { title: "Packing tips for October weather", replies: 2, time: "5h ago" }
                ].map((post, i) => (
                  <div key={i} className="group cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">{post.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.replies} replies • {post.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]">
                Start New Topic
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PilgrimDashboard;