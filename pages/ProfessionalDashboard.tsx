import React, { useState } from 'react';

interface Props {
    onNavigate: (view: any) => void;
    language: 'en' | 'es';
    toggleLanguage: () => void;
    openAuth: (mode: 'login' | 'register') => void;
    user?: any;
    onSignOut?: () => void;
}

const ProfessionalDashboard = ({ onNavigate }: Props) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-display transition-colors duration-200 h-screen flex overflow-hidden">
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-gray-200 bg-surface-light dark:bg-surface-dark dark:border-gray-800 flex transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-full flex-col justify-between p-4">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => onNavigate('Landing')}>
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBvdQeyZ7KjXwPjFe0rAsD9Oom4jwym7xHDzpIRemA57jl5ed5eDDpksSkZEbm0DHw1T3JuidtYQ6gIITGFfvzezPTb4Qs0hLrpslEC0GkevdRK60ukz-Pq7ZAkNF9NbPAUOAXDQ543u5rT1tOrOBB_Td1M2rk_V69bT0o_-8oJ7RU-iwhsywCUJlf5Hqi2jkKHcEV8501SMgbUwpdPs0IXt4KbS5gEnAol_QZkA9k6ufYouhuUt-iyCFkaOobAQK5k3fk2ni29x-U")' }}></div>
                            <div className="flex flex-col overflow-hidden">
                                <h1 className="truncate text-base font-bold text-gray-900 dark:text-white">Albergue Estrella</h1>
                                <p className="truncate text-xs font-medium text-primary">Professional Portal</p>
                            </div>
                        </div>
                        <nav className="flex flex-col gap-2">
                            <button onClick={() => { onNavigate('Pro Dashboard'); setIsSidebarOpen(false); }} className="group flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary transition-colors w-full text-left"><span className="material-symbols-outlined filled">dashboard</span><span className="text-sm font-medium">Dashboard</span></button>
                            <button className="group flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors w-full text-left"><span className="material-symbols-outlined">calendar_month</span><span className="text-sm font-medium">Bookings</span></button>
                            <button onClick={() => { onNavigate('Biz Profile'); setIsSidebarOpen(false); }} className="group flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors w-full text-left"><span className="material-symbols-outlined">storefront</span><span className="text-sm font-medium">Business Profile</span></button>
                        </nav>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
                        <button onClick={() => onNavigate('Landing')} className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 w-full text-left"><span className="material-symbols-outlined">logout</span><span className="text-sm font-medium">Log out</span></button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
                <div className="container mx-auto max-w-7xl p-4 md:p-8">
                    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            <button className="md:hidden text-gray-600 dark:text-gray-300" onClick={() => setIsSidebarOpen(true)}>
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">Welcome back, Estrella</h1>
                                <p className="mt-1 text-base text-gray-500 dark:text-gray-400">Today is October 12, 2023</p>
                            </div>
                        </div>
                        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark w-full md:w-auto">
                            <span className="material-symbols-outlined text-[20px]">add_circle</span> Add Availability
                        </button>
                    </header>

                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-surface-light p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                            <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupancy Rate</p><span className="material-symbols-outlined text-gray-400">bed</span></div>
                            <div className="mt-4 flex items-end justify-between"><p className="text-3xl font-bold text-gray-900 dark:text-white">85%</p><span className="flex items-center text-sm font-medium text-primary"><span className="material-symbols-outlined mr-1 text-sm">trending_up</span> +5%</span></div>
                        </div>
                        <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-surface-light p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                            <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p><span className="material-symbols-outlined text-gray-400">euro</span></div>
                            <div className="mt-4 flex items-end justify-between"><p className="text-3xl font-bold text-gray-900 dark:text-white">€1,240</p><span className="flex items-center text-sm font-medium text-red-500"><span className="material-symbols-outlined mr-1 text-sm">trending_down</span> -1.2%</span></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                        <div className="flex flex-col gap-6 xl:col-span-2">
                            <div className="rounded-xl border border-gray-100 bg-surface-light shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Arrivals</h2>
                                    <button className="text-sm font-medium text-primary hover:text-primary-dark">View All</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[600px] text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                            <tr><th className="px-6 py-3 font-medium">Guest Name</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Check-in</th><th className="px-6 py-3 font-medium">Notes</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            <tr>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDIfJ4V3K44clanTx9aEP2P2sFIYr0XbUGkbKxmIQht5v8NbpPi25_gBrYJrTeMXc_wiBlAQPYkXX9Gfq0XGf2X_iXFWCrkPZUd4oC6jwy82m8IIvO28VjMAg-KA4IrD2oXgu5f7AzZDRxTN2PW3Pph-h_tOZplbLYnPMVcOWqAw1JtuBGjy6aDQ5AbtxIHSU3FR5SZQPkgl0HLVxUSyuLshK_mP0cywwBhJHWf82rFeXwC_hNa6QIncUtxiJ-xLN_FTMum4xUiVo0")' }}></div>
                                                        <span className="font-medium text-gray-900 dark:text-white">Maria Sanchez</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Confirmed</span></td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">Oct 12, 2023</td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">Gluten-free diet</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBBOq4RhkosxNZVgZtuNur8XxMvmMVErsqKbKIp8oo22pLZphbvS4qI1N9o6ToyI8v4ccRbM7dWpaoKAvxvHl-0HgHvftL73QuiMfzkaTrbacDeeMsNOgY7JqgpcZJDylBTy8pxO_2Xd3_duQLHpP86BkArrW94neEDaT_9aNtWwp4nfWIJpvpHB_g-2w3dwTBqwX38nNjp89gwHLtKULqmzybfrMNtMa75vj_cvrbSaVBf44x335ogffM6zW23kRnjnR-eZ3kbfUU")' }}></div>
                                                        <span className="font-medium text-gray-900 dark:text-white">John Smith</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">Pending</span></td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">Oct 12, 2023</td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">Late check-in</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 xl:col-span-1">
                            <div className="rounded-xl border border-gray-100 bg-surface-light p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Profile Strength</h3>
                                    <span className="text-sm font-bold text-primary">80%</span>
                                </div>
                                <div className="mt-4 h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                                    <div className="h-2.5 rounded-full bg-primary" style={{ width: '80%' }}></div>
                                </div>
                                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Your profile is almost complete. Add more photos of your facilities to increase views by 20%.</p>
                                <button onClick={() => onNavigate('Biz Profile')} className="mt-4 w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800">Complete Profile</button>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-surface-light p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Recent Inquiries</h3>
                                    <button className="text-xs font-semibold text-primary hover:underline">View All</button>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-3">
                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDx_TTkHpywVr_1N_TkGIGy-oI1kh3iE0dfEpps9hvglrVB3MIkahvTkHB2rDPnizniOhxNC3Lo8T3ygyx0SUBb81aeLJhmmj-FW5BO3PfYJiRe8K2k-y9K4YzIDT2CXrM4d5zfn4TcSo-8WcPWDaPM5d-egCgsLHe_GgM0VjibsCKjteRmYeNqIeG-zntORU7pkpauwpAA1Vln27FQxg0JCti3nbnXv7fFEAiwHCRUec3YPWOFxnq6SXpoSoxf6AlPAJ76PIlv_Do")' }}></div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-900 dark:text-white">Elena R.</p><span className="text-xs text-gray-400">20m ago</span></div>
                                            <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">Is there bed availability for Sep 12 for 3 people?</p>
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

export default ProfessionalDashboard;