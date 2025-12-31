import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
    onNavigate: (view: any) => void;
    language: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja';
    setLanguage: (lang: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja') => void;
    user: any;
}

const Contact = ({ onNavigate, language, setLanguage, user }: Props) => {
    const [formData, setFormData] = useState({
        name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        subject: 'General',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const t = {
        title: language === 'en' ? 'Get in Touch' : 'Contacta con nosotros',
        subtitle: language === 'en' ? 'Have questions about our packs or need a custom plan? We are here to help.' : '¿Tienes dudas sobre nuestros packs o necesitas un plan a medida? Estamos aquí para ayudarte.',
        name: language === 'en' ? 'Full Name' : 'Nombre completo',
        email: language === 'en' ? 'Email Address' : 'Correo electrónico',
        subject: language === 'en' ? 'Subject' : 'Asunto',
        message: language === 'en' ? 'Your Message' : 'Tu mensaje',
        send: language === 'en' ? 'Send Message' : 'Enviar mensaje',
        sending: language === 'en' ? 'Sending...' : 'Enviando...',
        success: language === 'en' ? 'Message sent successfully!' : '¡Mensaje enviado con éxito!',
        successSub: language === 'en' ? "We'll get back to you at mycaminoeu@gmail.com shortly." : 'Te responderemos pronto desde mycaminoeu@gmail.com.',
        error: language === 'en' ? 'Something went wrong.' : 'Algo salió mal.',
        subjects: {
            general: language === 'en' ? 'General Inquiry' : 'Consulta General',
            custom: language === 'en' ? 'Custom Contract' : 'Contrato Personalizado',
            incident: language === 'en' ? 'Incident / Support' : 'Incidencia / Soporte',
            other: language === 'en' ? 'Other' : 'Otro'
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            const { error } = await supabase
                .from('contact_messages')
                .insert([
                    {
                        name: formData.name,
                        email: formData.email,
                        subject: formData.subject,
                        message: formData.message
                    }
                ]);

            if (error) {
                console.error("Error de Supabase:", error);
                // Si la tabla no existe aún, avisamos al usuario o simulamos éxito
                setStatus('error');
            } else {
                setStatus('success');
                setFormData({ ...formData, message: '' });
            }
        } catch (err) {
            console.error("Error al enviar:", err);
            setStatus('error');
        }
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
                            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white dark:hover:bg-primary transition-all duration-300 text-xs font-bold text-[#0e1b14] dark:text-white"
                        >
                            <span className="material-symbols-outlined text-[16px]">language</span>
                            {language === 'en' ? 'EN' : 'ES'}
                        </button>
                        <button onClick={() => onNavigate('Packs')} className="text-sm font-bold text-primary hover:underline">
                            {language === 'en' ? 'Packs' : 'Ver Packs'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 md:py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

                    {/* Info Side */}
                    <div className="animate-fade-in text-[#0e1b14] dark:text-white">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
                            {t.title}
                        </h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 font-medium">
                            {t.subtitle}
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <span className="material-symbols-outlined">mail</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-gray-400 mb-1">Email</h4>
                                    <p className="text-lg font-black">mycaminoeu@gmail.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <span className="material-symbols-outlined">support_agent</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-gray-400 mb-1">WhatsApp</h4>
                                    <p className="text-lg font-black text-primary">+34 000 000 000</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="animate-scale-in">
                        {status === 'success' ? (
                            <div className="bg-white dark:bg-surface-dark border border-primary p-10 rounded-[2.5rem] shadow-2xl text-center flex flex-col items-center justify-center h-full gap-4">
                                <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                                    <span className="material-symbols-outlined text-5xl">check_circle</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t.success}</h3>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">{t.successSub}</p>
                                <button
                                    onClick={() => setStatus('idle')}
                                    className="mt-4 text-primary font-bold hover:underline"
                                >
                                    {language === 'en' ? 'Send another message' : 'Enviar otro mensaje'}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-dark p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">{t.name}</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Juan Peregrino"
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary outline-none text-slate-900 dark:text-white font-bold transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">{t.email}</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="tu@email.com"
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary outline-none text-slate-900 dark:text-white font-bold transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">{t.subject}</label>
                                    <select
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary outline-none text-slate-900 dark:text-white font-bold transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="General">{t.subjects.general}</option>
                                        <option value="Custom">{t.subjects.custom}</option>
                                        <option value="Incident">{t.subjects.incident}</option>
                                        <option value="Other">{t.subjects.other}</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">{t.message}</label>
                                    <textarea
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="..."
                                        rows={4}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary outline-none text-slate-900 dark:text-white font-bold transition-all resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    disabled={status === 'submitting'}
                                    className="w-full py-5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {status === 'submitting' ? (
                                        <>
                                            <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            {t.sending}
                                        </>
                                    ) : t.send}
                                </button>
                            </form>
                        )}
                    </div>

                </div>
            </main>

            <footer className="py-12 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-gray-400 font-medium">© 2024 MyCamino. mycaminoeu@gmail.com</p>
            </footer>
        </div>
    );
};

export default Contact;
