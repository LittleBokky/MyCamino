import React, { useState } from 'react';

interface Props {
    onNavigate: (view: any) => void;
    language: 'en' | 'es';
    toggleLanguage: () => void;
    openAuth: (mode: 'login' | 'register') => void;
    user?: any;
    onSignOut?: () => void;
}

const BusinessProfile = ({ onNavigate }: Props) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="bg-background-light dark:bg-background-dark text-[#0e1b14] dark:text-gray-100 min-h-screen flex flex-col">
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e7f3ed] dark:border-[#1e3a2f] bg-[#f8fcfa] dark:bg-[#112119] px-6 py-3">
                <div className="flex items-center gap-4 text-[#0e1b14] dark:text-white cursor-pointer">
                    <button className="lg:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="flex items-center gap-2" onClick={() => onNavigate('Landing')}>
                        <div className="size-8 text-primary">
                            <span className="material-symbols-outlined text-3xl">hiking</span>
                        </div>
                        <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">MyCamino</h2>
                    </div>
                </div>
                <div className="flex flex-1 justify-end items-center gap-6">
                    <div className="hidden sm:flex gap-3">
                        <button className="flex items-center justify-center rounded-lg h-9 px-4 text-sm font-bold text-[#4e9773] hover:bg-[#e7f3ed] dark:hover:bg-[#1e3a2f] transition-colors">Save Draft</button>
                        <button onClick={() => onNavigate('Pro Dashboard')} className="flex items-center justify-center rounded-lg h-9 px-4 bg-primary text-white text-sm font-bold shadow-sm hover:bg-opacity-90 transition-opacity">Publish Changes</button>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 w-full max-w-[1440px] mx-auto relative">
                <aside className={`flex flex-col w-72 border-r border-[#e7f3ed] dark:border-[#1e3a2f] bg-[#f8fcfa] dark:bg-[#112119] fixed lg:sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 pb-2">
                        <div className="flex gap-4 items-center mb-8">
                            <div className="bg-center bg-no-repeat bg-cover rounded-lg size-12 shrink-0 shadow-sm" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD1KGNlmWL8Q-NwyWJGlLGEKeX_m34wiFTWFfjz1uFVprhwxQuRJHJ_UmMiQXUzpzJuUYCrHscPPTM0he1TOCPYJt-6dgJqQALT_maxj1NaosJGM4h-0YRF5yM1NAohbBsevvG05AUiEklZHTLT1-KoyHMG_1L3vM5TOgEm9JnFZcs70x5QMgGxhdlobPZoNKkOzA8mpXfT4RMyGMp6RCRN9NWOJh7FZ4tq8unGJsdumy1iknjTNd2_Ehgc4MzEQFeM50M8ZO1fTqQ")' }}></div>
                            <div className="flex flex-col overflow-hidden">
                                <h1 className="text-[#0e1b14] dark:text-white text-base font-bold leading-tight truncate">Albergue Estrella</h1>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="size-2 rounded-full bg-yellow-400"></span>
                                    <p className="text-[#4e9773] text-xs font-medium">Pending Review</p>
                                </div>
                            </div>
                        </div>
                        <nav className="flex flex-col gap-1">
                            <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary border-l-4 border-primary" href="#"><span className="material-symbols-outlined">info</span><span className="text-sm font-bold">General Info</span></a>
                            <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#5c6e64] dark:text-gray-400 hover:bg-[#e7f3ed] dark:hover:bg-[#1e3a2f] border-l-4 border-transparent transition-all" href="#"><span className="material-symbols-outlined">location_on</span><span className="text-sm font-medium">Location & Contact</span></a>
                            <button onClick={() => onNavigate('Pro Dashboard')} className="flex lg:hidden items-center gap-3 px-4 py-3 rounded-lg text-[#5c6e64] dark:text-gray-400 hover:bg-[#e7f3ed] dark:hover:bg-[#1e3a2f] border-l-4 border-transparent transition-all"><span className="material-symbols-outlined">dashboard</span><span className="text-sm font-medium">Back to Dashboard</span></button>
                        </nav>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0e1b14]">
                    <div className="px-6 py-8 border-b border-[#e7f3ed] dark:border-[#1e3a2f]">
                        <div className="flex flex-wrap justify-between items-start gap-4 max-w-4xl">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-[#0e1b14] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">General Information</h1>
                                <p className="text-[#4e9773] text-base font-normal">Update your business details visible to pilgrims on the trail.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 md:p-10 max-w-4xl animate-fade-in">
                        <form className="flex flex-col gap-8">
                            <section className="flex flex-col gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center size-8 rounded-full bg-primary/20 text-primary font-bold text-sm">1</span>
                                    <h3 className="text-lg font-bold text-[#0e1b14] dark:text-white">Business Identity</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border border-[#e7f3ed] dark:border-[#1e3a2f] bg-[#f8fcfa] dark:bg-[#112119]">
                                    <label className="flex flex-col gap-2">
                                        <span className="text-sm font-semibold text-[#0e1b14] dark:text-gray-200">Business Name *</span>
                                        <input className="form-input w-full rounded-lg border border-[#d0e7db] dark:border-[#2d4a3e] bg-white dark:bg-[#0e1b14] text-[#0e1b14] dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-gray-400" placeholder="e.g. Albergue Estrella" type="text" defaultValue="Albergue Estrella" />
                                    </label>
                                    <label className="flex flex-col gap-2">
                                        <span className="text-sm font-semibold text-[#0e1b14] dark:text-gray-200">Category *</span>
                                        <div className="relative">
                                            <select className="form-select w-full rounded-lg border border-[#d0e7db] dark:border-[#2d4a3e] bg-white dark:bg-[#0e1b14] text-[#0e1b14] dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none cursor-pointer">
                                                <option>Albergue (Hostel)</option>
                                                <option>Hotel</option>
                                            </select>
                                        </div>
                                    </label>
                                </div>
                            </section>
                            <section className="flex flex-col gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center size-8 rounded-full bg-primary/20 text-primary font-bold text-sm">2</span>
                                    <h3 className="text-lg font-bold text-[#0e1b14] dark:text-white">About the Place</h3>
                                </div>
                                <div className="flex flex-col gap-6 p-6 rounded-xl border border-[#e7f3ed] dark:border-[#1e3a2f] bg-[#f8fcfa] dark:bg-[#112119]">
                                    <label className="flex flex-col gap-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-semibold text-[#0e1b14] dark:text-gray-200">Description *</span>
                                            <span className="text-xs text-gray-500">Min 100 characters</span>
                                        </div>
                                        <textarea className="form-textarea w-full rounded-lg border border-[#d0e7db] dark:border-[#2d4a3e] bg-white dark:bg-[#0e1b14] text-[#0e1b14] dark:text-white min-h-[160px] p-4 focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-gray-400 resize-y" placeholder="Tell pilgrims about your history, atmosphere, and what makes your place special..."></textarea>
                                    </label>
                                    <div>
                                        <span className="text-sm font-semibold text-[#0e1b14] dark:text-gray-200 block mb-3">Key Amenities</span>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {['Wi-Fi', 'Laundry', 'Kitchen', 'Breakfast', 'Dinner', 'Garden'].map((amenity) => (
                                                <label key={amenity} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-[#e7f3ed] dark:border-[#2d4a3e] bg-white dark:bg-[#0e1b14] hover:border-primary/50 transition-colors">
                                                    <input defaultChecked className="form-checkbox text-primary rounded border-gray-300 focus:ring-primary size-5" type="checkbox" />
                                                    <span className="text-sm">{amenity}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                            <div className="sm:hidden flex gap-3 pt-6">
                                <button className="flex-1 flex items-center justify-center rounded-lg h-12 px-4 text-sm font-bold text-[#4e9773] hover:bg-[#e7f3ed] dark:hover:bg-[#1e3a2f] transition-colors border border-border-light">Save Draft</button>
                                <button onClick={() => onNavigate('Pro Dashboard')} className="flex-1 flex items-center justify-center rounded-lg h-12 px-4 bg-primary text-white text-sm font-bold shadow-sm hover:bg-opacity-90 transition-opacity">Publish</button>
                            </div>
                        </form>
                    </div>
                </div>

                <aside className="hidden xl:block w-[380px] border-l border-[#e7f3ed] dark:border-[#1e3a2f] bg-white dark:bg-[#112119] p-6 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-[#4e9773]">smartphone</span>
                        <h3 className="font-bold text-sm text-[#0e1b14] dark:text-white uppercase tracking-wider">Live Preview</h3>
                    </div>
                    <div className="border border-gray-200 dark:border-[#2d4a3e] rounded-[32px] overflow-hidden shadow-lg bg-white dark:bg-[#0e1b14] max-w-[320px] mx-auto">
                        <div className="h-6 bg-[#0e1b14] flex justify-between items-center px-4">
                            <span className="text-[10px] text-white font-medium">9:41</span>
                            <div className="flex gap-1"><div className="size-1.5 rounded-full bg-white"></div><div className="size-1.5 rounded-full bg-white"></div><div className="size-1.5 rounded-full bg-white"></div></div>
                        </div>
                        <div className="relative h-[200px] bg-gray-200 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBv5xpLcnGUvItoiZg2Oqe3LUbDybxKzSAfeo_aX1AAwuQ6q0WaQA9WLZP0uGHPeG-CTqnsXJ0-RMfu2YMScQkccXFwzMbBlImtXiPMCByBn0IERNH9818POeU7_uspRF-vIxE4kQDxIz1iNewRh7WPj57jELS18uUraahq2ICO9jAt6k0lS-6CbZtiu1LjGJ2KVsSkWeFBdkOraQdlorzVjMUKXgboD8SE2iAP-cEvwVVVubt4jchxoGxdZyEiqDL-rBgnLASj8N8")' }}>
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-[#0e1b14]">Open Now</div>
                        </div>
                        <div className="px-5 pt-8 pb-6">
                            <h4 className="font-bold text-lg text-[#0e1b14] dark:text-white mb-1">Albergue Estrella</h4>
                            <p className="text-xs text-[#4e9773] font-medium mb-3">Hostel • 1.2km from center</p>
                            <div className="flex gap-1 mb-4">
                                {[1, 2, 3, 4].map(i => <span key={i} className="material-symbols-outlined text-yellow-400 text-[16px] filled">star</span>)}
                                <span className="material-symbols-outlined text-gray-300 text-[16px]">star</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed">Comfortable rest for the modern pilgrim. Located right on the Camino path, we offer warm meals, clean sheets, and a friendly atmosphere for everyone...</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button className="bg-primary text-white py-2 rounded-lg text-xs font-bold shadow-sm">Book Now</button>
                                <button className="bg-white border border-gray-200 text-[#0e1b14] py-2 rounded-lg text-xs font-bold">Directions</button>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default BusinessProfile;