import React, { useState } from 'react';

interface Props {
    onNavigate: (view: any) => void;
    language: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja';
    setLanguage: (lang: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja') => void;
    openAuth: (mode: 'login' | 'register') => void;
    user?: any;
    onSignOut?: () => void;
}

const Workshop = ({ onNavigate }: Props) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeMobileTab, setActiveMobileTab] = useState<'market' | 'schedule' | 'filters'>('market');

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white font-display h-screen flex flex-col overflow-hidden">
            <header className="flex-none flex items-center justify-between whitespace-nowrap border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-6 py-3 z-20 shadow-sm">
                <div className="flex items-center gap-4 text-text-main dark:text-white cursor-pointer" onClick={() => onNavigate('Landing')}>
                    <div className="size-8 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-3xl">hiking</span>
                    </div>
                    <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">MyCamino Workshop</h2>
                </div>
                <div className="flex flex-1 justify-end gap-8">
                    <nav className="hidden md:flex items-center gap-6">
                        <button onClick={() => onNavigate('Dashboard')} className="text-text-main dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium leading-normal">Dashboard</button>
                        <button onClick={() => onNavigate('Workshop')} className="text-primary text-sm font-bold leading-normal">Marketplace</button>
                        <button onClick={() => onNavigate('Workshop')} className="text-text-main dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium leading-normal">My Schedule</button>
                    </nav>
                    <div className="flex gap-3 items-center">
                        <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-primary cursor-pointer hidden md:block" onClick={() => onNavigate('Credential')} style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA3xjKDqjbgkblEtIabVSBQqLsSjTmXDzU1P19yqblgjLPV8pkixCeUHcBOv2c6mg13Kk7KLCvr3hmYt6v7ekOiynD-HYyOB0pPya_Mwj6BBRhlejNgkHGP2WzmKyL-nn5fw0NdzjnpVRZMtvEBgrpf2Z5PTbWbS5M2Fd0Neiv3KgqzwCDbLwbO9V6VDfTXO_duS8Cy61S4xYleThSoVO48eRI8-BoclvBS4cn5HSrcMDSfi8kVvtdDHEwufm1iYbNkNLFgEvP75bc")' }}></div>
                        <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                        </button>
                    </div>
                </div>
                {/* Mobile Navigation Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-4 py-3 space-y-3 z-30 shadow-lg absolute top-[60px] left-0 right-0">
                        <button onClick={() => { onNavigate('Dashboard'); setIsMobileMenuOpen(false); }} className="block w-full text-left font-medium">Dashboard</button>
                        <button onClick={() => { setActiveMobileTab('market'); setIsMobileMenuOpen(false); }} className="block w-full text-left font-medium text-primary">Marketplace</button>
                        <button onClick={() => { setActiveMobileTab('schedule'); setIsMobileMenuOpen(false); }} className="block w-full text-left font-medium">My Schedule</button>
                    </div>
                )}
            </header>

            {/* Mobile Tabs */}
            <div className="md:hidden flex border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                <button
                    onClick={() => setActiveMobileTab('filters')}
                    className={`flex-1 py-3 text-sm font-bold ${activeMobileTab === 'filters' ? 'text-primary border-b-2 border-primary' : 'text-text-muted'}`}
                >
                    Filters
                </button>
                <button
                    onClick={() => setActiveMobileTab('market')}
                    className={`flex-1 py-3 text-sm font-bold ${activeMobileTab === 'market' ? 'text-primary border-b-2 border-primary' : 'text-text-muted'}`}
                >
                    Market
                </button>
                <button
                    onClick={() => setActiveMobileTab('schedule')}
                    className={`flex-1 py-3 text-sm font-bold ${activeMobileTab === 'schedule' ? 'text-primary border-b-2 border-primary' : 'text-text-muted'}`}
                >
                    Schedule
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                <aside className={`${activeMobileTab === 'filters' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-72 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark overflow-y-auto p-6 flex-none absolute inset-0 lg:static z-10`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg dark:text-white">Filters</h3>
                        <button className="text-xs text-primary font-medium hover:underline">Clear all</button>
                    </div>
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Camino Region</h4>
                        <div className="space-y-2">
                            {['French Way', 'Portuguese Way', 'Northern Way', 'English Way'].map((way, idx) => (
                                <label key={way} className="flex items-center gap-3 cursor-pointer group">
                                    <input defaultChecked={idx === 1} className="form-checkbox rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 bg-background-light dark:bg-border-dark dark:border-gray-600" type="checkbox" />
                                    <span className="text-sm text-text-main dark:text-gray-300 group-hover:text-primary transition-colors">{way}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <hr className="border-border-light dark:border-border-dark mb-6" />
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Service Type</h4>
                        <div className="space-y-2">
                            {['Accommodation', 'Luggage Transfer', 'Guided Tours', 'Bike Rental'].map((service, idx) => (
                                <label key={service} className="flex items-center gap-3 cursor-pointer group">
                                    <input defaultChecked={idx === 0} className="form-checkbox rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 bg-background-light dark:bg-border-dark dark:border-gray-600" type="checkbox" />
                                    <span className="text-sm text-text-main dark:text-gray-300 group-hover:text-primary transition-colors">{service}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <button className="lg:hidden mt-4 w-full bg-primary text-white font-bold py-3 rounded-xl" onClick={() => setActiveMobileTab('market')}>Apply Filters</button>
                </aside>

                <main className={`${activeMobileTab === 'market' ? 'block' : 'hidden'} lg:block flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 md:p-10 relative scroll-smooth`}>
                    <div className="max-w-6xl mx-auto flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-text-main dark:text-white text-3xl font-bold leading-tight">Digital Workshop: Connect with Partners</h1>
                            <p className="text-text-main/70 dark:text-gray-400 text-base max-w-2xl">Network with local providers and tour operators. Schedule 1:1 meetings to build alliances for the upcoming season.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="size-14 rounded-lg bg-gray-100 flex-none overflow-hidden border border-border-light dark:border-gray-700">
                                            <img className="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWRW9pmCa9Tef_fa0qAgPfv20zwj4tLFDlnyzBmZ6kaL_p2m4g9awj__lxG19kSiCAbWm17O6mazeU6aaqbL_vV7RMRFu2N41Va-MNevplAB2p1P_4Ai-_gJAG5LQ2sPOVl1SJ522h4TW_vvYAJkhVAMhhaWRciV2F61uooLl94bKiC69py5K5w4GE_bBJ8EVIVdLbLSKSWyEKuHVbkLdgQxzae9iJ3QqtRO3BptUW3akmaPu3e7Kmq2cMscV3PVRSHnuANAxNuTo" alt="logo" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-main dark:text-white text-lg group-hover:text-primary transition-colors">Casa de Santiago</h3>
                                            <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-[14px]">location_on</span> Sarria, Galicia</p>
                                        </div>
                                    </div>
                                    <span className="flex h-2 w-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-surface-dark"></span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 dark:bg-green-900/30 text-primary text-xs font-medium"><span className="material-symbols-outlined text-[14px] mr-1">verified</span> Verified</span>
                                    <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-text-main dark:text-gray-300 text-xs font-medium">Accommodation</span>
                                </div>
                                <div className="mt-auto pt-3 flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-xs text-text-muted mb-1"><span>3 slots available today</span><span className="font-medium text-primary">09:00 - 17:00 CET</span></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors">Schedule</button>
                                        <button className="flex items-center justify-center gap-2 bg-transparent border border-border-light dark:border-gray-600 hover:bg-background-light dark:hover:bg-gray-700 text-text-main dark:text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">Message</button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="size-14 rounded-lg bg-gray-100 flex-none overflow-hidden border border-border-light dark:border-gray-700 p-2 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary text-3xl">directions_bus</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-main dark:text-white text-lg group-hover:text-primary transition-colors">Camino Express</h3>
                                            <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-[14px]">location_on</span> Tui - Santiago</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium"><span className="material-symbols-outlined text-[14px] mr-1">award_star</span> Top Rated</span>
                                    <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-text-main dark:text-gray-300 text-xs font-medium">Transport</span>
                                </div>
                                <div className="mt-auto pt-3 flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-xs text-text-muted mb-1"><span>1 slot available today</span><span className="font-medium text-primary">14:30 CET</span></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors">Schedule</button>
                                        <button className="flex items-center justify-center gap-2 bg-transparent border border-border-light dark:border-gray-600 hover:bg-background-light dark:hover:bg-gray-700 text-text-main dark:text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">Message</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <aside className={`${activeMobileTab === 'schedule' ? 'flex' : 'hidden'} xl:flex flex-col w-full xl:w-80 bg-surface-light dark:bg-surface-dark border-l border-border-light dark:border-border-dark overflow-y-auto p-6 flex-none absolute inset-0 xl:static z-10`}>
                    <h3 className="font-bold text-lg dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">calendar_month</span> My Schedule
                    </h3>
                    <div className="flex flex-col gap-4 relative">
                        <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-border-light dark:bg-border-dark z-0"></div>
                        <div className="flex gap-4 relative z-10">
                            <div className="flex-none flex flex-col items-center gap-1 pt-1"><div className="size-2.5 rounded-full bg-primary border-2 border-white dark:border-surface-dark shadow-sm"></div></div>
                            <div className="flex-1 bg-white dark:bg-border-dark p-3 rounded-lg border border-border-light dark:border-gray-700 shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-primary">10:00 AM</span>
                                    <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">Confirmed</span>
                                </div>
                                <h4 className="text-sm font-bold text-text-main dark:text-white">Camino Logistics</h4>
                                <p className="text-xs text-text-muted mt-1">Virtual Room A</p>
                            </div>
                        </div>
                        <div className="flex gap-4 relative z-10 opacity-60">
                            <div className="flex-none flex flex-col items-center gap-1 pt-1"><div className="size-2.5 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-surface-dark"></div></div>
                            <div className="flex-1 bg-white dark:bg-border-dark p-3 rounded-lg border border-border-light dark:border-gray-700 shadow-sm border-l-4 border-l-orange-400">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">11:30 AM</span>
                                    <span className="text-[10px] bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">Pending</span>
                                </div>
                                <h4 className="text-sm font-bold text-text-main dark:text-white">Hotel Parador Leon</h4>
                                <p className="text-xs text-text-muted mt-1">Awaiting confirmation</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-6">
                        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-4 text-white relative overflow-hidden">
                            <h4 className="font-bold relative z-10">Upgrade to Pro</h4>
                            <p className="text-xs text-white/90 mt-1 relative z-10 mb-3">Get unlimited meeting slots and premium placement.</p>
                            <button className="w-full py-2 bg-white text-primary text-xs font-bold rounded shadow-sm hover:bg-gray-50 transition-colors relative z-10">View Plans</button>
                        </div>
                    </div>
                    <button className="xl:hidden mt-4 w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl" onClick={() => setActiveMobileTab('market')}>Back to Market</button>
                </aside>
            </div>
        </div>
    );
};

export default Workshop;