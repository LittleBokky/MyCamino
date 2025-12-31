import React, { useState } from 'react';

interface Props {
    onNavigate: (view: any) => void;
    language: 'en' | 'es';
    toggleLanguage: () => void;
    openAuth: (mode: 'login' | 'register') => void;
    user?: any;
    onSignOut?: () => void;
}

const StageDetails = ({ onNavigate }: Props) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-text-main dark:text-gray-100 min-h-screen">
            <header className="flex flex-col items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7f3ed] dark:border-b-emerald-900/30 px-6 md:px-10 py-3 bg-surface-light dark:bg-surface-dark sticky top-0 z-50">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigate('Landing')}>
                            <div className="size-8 text-primary">
                                <span className="material-symbols-outlined text-4xl">hiking</span>
                            </div>
                            <h2 className="text-lg font-bold">MyCamino</h2>
                        </div>
                        <div className="hidden md:flex items-center gap-9">
                            <button onClick={() => onNavigate('Planner')} className="text-sm font-medium hover:text-primary transition-colors">Plan</button>
                            <button onClick={() => onNavigate('Planner')} className="text-sm font-medium hover:text-primary transition-colors text-primary">Routes</button>
                            <button onClick={() => onNavigate('Dashboard')} className="text-sm font-medium hover:text-primary transition-colors">Community</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-primary/20 cursor-pointer hidden md:block" onClick={() => onNavigate('Credential')} style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuABNRRyjHfCEPmlVCelNtNI_Yr1Ybz5ROFxgDHFrFWGJpnUIGJoYPTLDxmzcBJEkqLrSrbkKBHJ61Ka8P1wMut_U2-PSnO34L7GSM5S2vRtVPU0tUsY0i0yQnd2ZJjhv5GRpRymHT-npfo75cbadPfWnUY9ysXFzZFWWliwdmgOVyzJGze1gBLvTa-MtacmePAG4NkrjNnxhExg5S4-4n5ueyjkx6XglgfkYERaqGBtASOsLL4pr4Hg84XJUgAkXmHHTHvBr-VhtK8")' }}></div>
                        <button className="md:hidden p-2 text-text-main dark:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                        </button>
                    </div>
                </div>
                {isMobileMenuOpen && (
                    <div className="md:hidden w-full flex flex-col gap-4 py-4 border-t border-gray-100 dark:border-gray-800 animate-fade-in">
                        <button onClick={() => { onNavigate('Planner'); setIsMobileMenuOpen(false); }} className="text-left py-2 font-medium">Plan Journey</button>
                        <button onClick={() => { onNavigate('Dashboard'); setIsMobileMenuOpen(false); }} className="text-left py-2 font-medium">Community</button>
                        <button onClick={() => { onNavigate('Credential'); setIsMobileMenuOpen(false); }} className="text-left py-2 font-medium">My Profile</button>
                    </div>
                )}
            </header>

            <main className="flex flex-1 justify-center py-5 px-4 md:px-10 lg:px-20 xl:px-40 w-full">
                <div className="flex flex-col max-w-[1200px] flex-1 gap-6">
                    <div className="flex flex-wrap gap-2 px-4">
                        <span className="text-text-muted text-sm font-medium cursor-pointer hover:text-primary" onClick={() => onNavigate('Landing')}>Home</span>
                        <span className="text-text-muted text-sm font-medium">/</span>
                        <span className="text-text-muted text-sm font-medium cursor-pointer hover:text-primary" onClick={() => onNavigate('Planner')}>French Way</span>
                        <span className="text-text-muted text-sm font-medium">/</span>
                        <span className="text-text-muted text-sm font-medium">Stage 4</span>
                    </div>

                    <div className="flex flex-col gap-6 px-4">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex flex-col gap-2 max-w-3xl">
                                <h1 className="text-3xl md:text-4xl font-black leading-tight">Stage 4: Pamplona to Puente la Reina</h1>
                                <div className="flex items-center gap-3 text-text-muted">
                                    <span className="flex items-center gap-1 text-sm font-medium">
                                        <span className="material-symbols-outlined text-primary text-lg filled">star</span>
                                        <span className="text-text-main dark:text-white font-bold">4.8</span> (324 reviews)
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-text-muted"></span>
                                    <span className="text-sm font-normal">Moderate Difficulty</span>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button className="flex flex-1 md:flex-none items-center gap-2 justify-center rounded-lg h-10 px-4 bg-surface-light dark:bg-surface-dark border border-[#e7f3ed] dark:border-emerald-800 text-sm font-bold hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-colors">
                                    <span className="material-symbols-outlined text-lg">share</span> Share
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[300px] md:h-[400px] rounded-xl overflow-hidden">
                            <div className="col-span-1 md:col-span-2 h-full bg-center bg-no-repeat bg-cover relative group cursor-pointer" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAflO3ugBKOCTWlGnjfs7r1R5BB79P0SiSayOcCoT96ZSC0RN6EgeW544Mz_5XTLOSya9GM2CEQcgTcn03AlBy1Li6xE2C8gQ3KQdFPaJLL2JzwP6leID8Sk4dJcn7fRNn4Lfz63O2ZYEjO1v-x2p_YP-CzhdMuLvTqainOn0uGs_e9eUxBgUe5xYv9rPPfrLKrrotTK6I9p9i7BEcvEwUZm8s5cqPImvsxG09ULgxZR6ZVeAipEWILm0WtzlKPSYGK4OloJbggPK0")' }}></div>
                            <div className="hidden md:flex flex-col gap-3 h-full">
                                <div className="flex-1 bg-center bg-no-repeat bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDEuI21-aVzSMAWSAoQg6S8hW3Ogqnvd2wEacM7lgScsw2M92uHeX-6IHhgfY_htz-wHJqQRwXPYsTnKzcZEqMSzZ7VS-T44x7DRqHprA5-TYPhY_EE697lHSxK_xBEAWhGQTdf1Vbkh3duwog4mt1vTRBA-Bf4f3eqQGHd3Q8hwPO3Gs_SJdNFDf-aVFOGN_8bV4TleXI7qq-DydSFNBr5moU6EolxHOQkOrxVszJT-nFDfG-j8G1cuiqxbH4X3OPPm1kfOwbyB20")' }}></div>
                                <div className="flex-1 bg-center bg-no-repeat bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA2uOa02ZlSSlvT1sgdTDx6sKib6qeKhw83pQnw18ws5HXEWAFgZ7Eaj4OZzTdel3Hpg1kz1gyzHOt-LhvkC7NKZI4GrUj6C3is6G485LQPqialCb8TMim5t_3ZdT9Ui3lEQw6_5yFeAejS_V7qe9KoYNEqpk2okx_xKDFOgqZrzryRm907Afn8mAsPBcjlrfhBWFznwtfsyfVHrw0ri57yphDRX618OxNzzP9LpQx2REgCKWO6p3SHUXisoHJ2muOOu-dbPafnfEc")' }}></div>
                            </div>
                            <div className="hidden md:flex flex-col gap-3 h-full">
                                <div className="flex-1 bg-center bg-no-repeat bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC357lrw39l3eZrlgypouCfiLQAAVsK_uNluyNfvaSzOdiy8u-q-_G561XIk6bN8ZBBL70pJVJhyfpdIa9_YgYsrI7pFcCkuu3MziGzSxeWEvglowezTNlqgArNW26gpfoMg8_65pfY6USj3RVscaRn4b1JfJeKH78YPD9T0-EJNlbexB-DY0eD4qhiPi4e_w8JinUkk6EQGW6PZZTRBKCkh3rdgbOAPYYfU6U2PVv4__t0iKrhAnjLmtcu6xZq9InH0cu2FwIq_UU")' }}></div>
                                <div className="flex-1 bg-center bg-no-repeat bg-cover relative flex items-center justify-center bg-gray-100 dark:bg-gray-800" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCLWPbTdVI2lA1FIzsjnIQvTNQYhZytc9uS92Ov5l6nRgxl2j_GJ9Dt3rXfhg2bdlHrUDJJ3MumlaDFg2suY1OS31HUYXtZ8hDpO5w9BZBSeimsHS_PQyjwuv7uRvo0uVKhWA1M9nJB7aJHDfXdfnF-EyTewT4dK1LEX2Ar4W5_lN9CgGLdkE8PXVt-ACBO02AUDzvn5n6Qkg60zfEWFJQ5hLHP0apueFCQry7-p5AHsW9IWo5PDw60L9GgjN_GW7DhWaXcehtWk68")' }}>
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white font-bold text-lg">+12 Photos</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="mx-4 p-4 md:p-6 bg-surface-light dark:bg-surface-dark rounded-xl border border-[#e7f3ed] dark:border-emerald-800/30 flex flex-wrap justify-between gap-6 md:gap-12 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-primary/10 text-primary"><span className="material-symbols-outlined">hiking</span></div>
                                <div className="flex flex-col"><span className="text-xs text-text-muted uppercase font-semibold tracking-wider">Distance</span><span className="text-lg font-bold">24.3 km</span></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-primary/10 text-primary"><span className="material-symbols-outlined">landscape</span></div>
                                <div className="flex flex-col"><span className="text-xs text-text-muted uppercase font-semibold tracking-wider">Elevation</span><span className="text-lg font-bold">↑ 350m · ↓ 420m</span></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-primary/10 text-primary"><span className="material-symbols-outlined">schedule</span></div>
                                <div className="flex flex-col"><span className="text-xs text-text-muted uppercase font-semibold tracking-wider">Est. Time</span><span className="text-lg font-bold">5 - 6 hrs</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 px-4">
                            <div className="flex flex-col gap-8">
                                <div className="flex border-b border-[#e7f3ed] dark:border-emerald-800/30 overflow-x-auto no-scrollbar">
                                    <button className="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm whitespace-nowrap">Overview</button>
                                    <button className="px-6 py-3 text-text-muted font-medium text-sm whitespace-nowrap">Amenities & Services</button>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="prose dark:prose-invert max-w-none">
                                        <h3 className="text-xl font-bold mb-3">About this stage</h3>
                                        <p className="text-text-main/80 dark:text-gray-300 leading-relaxed">
                                            Leaving Pamplona behind, this stage takes you through rolling countryside and up to the iconic Alto del Perdón (Hill of Forgiveness), famous for its metal pilgrim sculptures and panoramic views.
                                        </p>
                                    </div>

                                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-[#e7f3ed] dark:border-emerald-800/30 flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold">Elevation Profile</h3>
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">Interactive Graph</span>
                                        </div>
                                        <div className="h-48 w-full bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-900/20 dark:to-transparent rounded-lg relative flex items-end px-2 pt-8">
                                            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
                                                <path d="M0,35 L10,30 L20,32 L30,10 L40,15 L50,25 L60,28 L70,30 L80,32 L90,34 L100,35" fill="none" stroke="#17cf73" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                                                <circle cx="30" cy="10" fill="#112119" r="1.5" className="dark:fill-white"></circle>
                                                <text x="30" y="5" fill="currentColor" fontSize="3" textAnchor="middle" className="text-[3px]">Alto del Perdón</text>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="p-5 rounded-xl bg-surface-light dark:bg-surface-dark border border-[#e7f3ed] dark:border-emerald-800/30 shadow-sm">
                                    <h3 className="font-bold text-lg mb-4">Plan Your Walk</h3>
                                    <div className="flex flex-col gap-3">
                                        <button className="w-full h-12 bg-primary hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined">add_location_alt</span> Add to My Plan
                                        </button>
                                        <button onClick={() => onNavigate('Planner')} className="w-full h-12 bg-[#e7f3ed] dark:bg-emerald-900/30 text-primary font-bold rounded-lg transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined">map</span> View on Map
                                        </button>
                                    </div>
                                </div>
                                <div className="p-5 rounded-xl bg-surface-light dark:bg-surface-dark border border-[#e7f3ed] dark:border-emerald-800/30">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold">Weather</h4>
                                        <span className="text-xs text-text-muted">Puente la Reina</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-4xl text-yellow-500">sunny</span>
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-bold">24°C</span>
                                                <span className="text-xs text-text-muted">Sunny</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StageDetails;