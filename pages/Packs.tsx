import React, { useState } from 'react';

interface Props {
    onNavigate: (view: any) => void;
    language: 'en' | 'es';
    toggleLanguage: () => void;
    user: any;
    onSignOut: () => void;
}

const Packs = ({ onNavigate, language, toggleLanguage, user, onSignOut }: Props) => {
    const [selectedDuration, setSelectedDuration] = useState<'5-7' | '7-10' | '10+'>('5-7');

    const t = {
        title: language === 'en' ? 'Plan Your Way' : 'Planifica tu Camino',
        subtitle: language === 'en' ? 'Choose the perfect pack for your pilgrimage' : 'Elige el pack perfecto para tu peregrinaje',
        basic: language === 'en' ? 'Basic Pack' : 'Pack Básico',
        complete: language === 'en' ? 'Complete Pack' : 'Pack Completo',
        premium: language === 'en' ? 'Premium Pack' : 'Pack Premium',
        from: language === 'en' ? 'From' : 'Desde',
        contact: language === 'en' ? 'Contact Us' : 'Contactar',
        mostPopular: language === 'en' ? 'Most Popular' : 'Más Popular',
    };

    const getCompletePrice = () => {
        if (selectedDuration === '5-7') return '219,95€';
        if (selectedDuration === '7-10') return '295,95€';
        return t.contact;
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display transition-colors duration-200">
            {/* Navigation */}
            <header className="sticky top-0 z-50 flex flex-col whitespace-nowrap border-b border-solid border-b-[#e7f3ed] dark:border-gray-800 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-6 py-4 lg:px-20">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('Landing')}>
                        <div className="size-8 text-primary flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                            <span className="material-symbols-outlined !text-3xl">hiking</span>
                        </div>
                        <h2 className="text-[#0e1b14] dark:text-white text-xl font-black leading-tight tracking-tight">
                            MyCamino
                        </h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white dark:hover:bg-primary transition-all duration-300 text-xs font-bold text-[#0e1b14] dark:text-white"
                        >
                            <span className="material-symbols-outlined text-[16px]">language</span>
                            {language === 'en' ? 'EN' : 'ES'}
                        </button>
                        {user ? (
                            <button onClick={() => onNavigate('Credential')} className="text-[#0e1b14] dark:text-gray-200 text-sm font-semibold hover:text-primary transition-colors">
                                {language === 'en' ? 'My Profile' : 'Mi Perfil'}
                            </button>
                        ) : null}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-16 md:py-24">
                <div className="text-center mb-16 animate-fade-in text-[#0e1b14] dark:text-white">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">{t.title}</h1>
                    <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
                        {t.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

                    {/* Basic Pack */}
                    <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col group animate-scale-in">
                        <div className="mb-8">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-4">
                                {language === 'en' ? 'Essential' : 'Esencial'}
                            </span>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t.basic}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-900 dark:text-white">19,95€</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                language === 'en' ? 'Custom itinerary' : 'Itinerario personalizado',
                                language === 'en' ? 'Downloadable PDF' : 'PDF descargable',
                                language === 'en' ? 'Equipment checklist' : 'Lista de equipaje',
                                language === 'en' ? 'Economical solution' : 'Solución económica'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium">
                                    <span className="material-symbols-outlined text-primary text-[20px] filled">check_circle</span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <button className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none">
                            {language === 'en' ? 'Get Started' : 'Empezar ahora'}
                        </button>
                    </div>

                    {/* Complete Pack */}
                    <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] p-8 md:p-10 border-4 border-primary shadow-2xl shadow-primary/20 flex flex-col relative z-10 group animate-scale-in" style={{ animationDelay: '0.1s' }}>
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest shadow-lg">
                            {t.mostPopular}
                        </div>

                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{t.complete}</h3>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-6">
                                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                                    {language === 'en' ? 'Duration of your way' : 'Duración de tu camino'}
                                </p>
                                <div className="flex gap-2">
                                    {(['5-7', '7-10', '10+'] as const).map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setSelectedDuration(d)}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${selectedDuration === d
                                                ? 'bg-primary text-white shadow-md'
                                                : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
                                                }`}
                                        >
                                            {d === '10+' ? '+10' : d} {language === 'en' ? 'Days' : 'Días'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-slate-900 dark:text-white">{getCompletePrice()}</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                language === 'en' ? 'Everything in Basic' : 'Todo lo incluido en Básico',
                                language === 'en' ? 'Albergue/Hotel bookings' : 'Reservas de albergues/hoteles',
                                language === 'en' ? 'Backpack transport' : 'Transporte de mochilas',
                                language === 'en' ? 'WhatsApp/Web support' : 'Soporte por WhatsApp o web'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-900 dark:text-white font-bold">
                                    <span className="material-symbols-outlined text-primary text-[22px] filled">check_circle</span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <button onClick={() => onNavigate('Contact')} className="w-full py-5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/30">
                            {selectedDuration === '10+' ? t.contact : (language === 'en' ? 'Book Now' : 'Reservar ahora')}
                        </button>
                    </div>

                    {/* Premium Pack */}
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-10 border border-slate-700 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col group animate-scale-in" style={{ animationDelay: '0.2s' }}>
                        <div className="mb-8">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4">
                                {language === 'en' ? 'Full Peace of Mind' : 'Tranquilidad Total'}
                            </span>
                            <h3 className="text-2xl font-black text-white mb-2">{t.premium}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white">449,95€</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                language === 'en' ? 'Everything in Complete' : 'Todo lo incluido en Completo',
                                language === 'en' ? '24/7 VIP assistance' : 'Asistencia VIP 24/7',
                                language === 'en' ? 'Unlimited route changes' : 'Cambios de ruta ilimitados',
                                language === 'en' ? 'Incident management' : 'Gestión de incidencias',
                                language === 'en' ? 'Personalized certificate' : 'Certificado final personalizado'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                                    <span className="material-symbols-outlined text-primary text-[20px] filled">check_circle</span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <button className="w-full py-4 rounded-2xl bg-white text-slate-900 font-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
                            {language === 'en' ? 'Become Premium' : 'Hazte Premium'}
                        </button>
                    </div>

                </div>

                <div className="mt-20 text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <p className="text-gray-500 dark:text-gray-400 font-medium italic">
                        {language === 'en' ? 'Need a custom solution for groups or agencies?' : '¿Necesitas una solución personalizada para grupos o agencias?'}
                        <button onClick={() => onNavigate('Contact')} className="text-primary font-bold ml-2 hover:underline">{t.contact}</button>
                    </p>
                </div>
            </main>

            <footer className="py-12 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-gray-400 font-medium">© 2024 MyCamino. Buen Camino.</p>
            </footer>
        </div>
    );
};

export default Packs;
