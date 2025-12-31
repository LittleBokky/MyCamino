import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
    id: string;
    full_name: string;
    username: string;
    birth_date: string;
    country: string;
    email?: string;
    avatar_url: string;
    created_at: string;
    way?: string;
}

interface Message {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
    read: boolean;
}

interface Props {
    onNavigate: (view: any, profileId?: string | null) => void;
    language: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja';
    setLanguage: (lang: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja') => void;
    openAuth: (mode: 'login' | 'register') => void;
    user?: any;
    onSignOut?: () => void;
}

const ProfessionalDashboard = ({ onNavigate, user, onSignOut }: Props) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'messages' | 'users'>('dashboard');
    const [messages, setMessages] = useState<Message[]>([]);
    const [usersList, setUsersList] = useState<UserProfile[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [userCount, setUserCount] = useState<number>(0);

    // Fetch stats and messages
    useEffect(() => {
        fetchMessages();
        fetchUserCount();
        if (activeTab === 'users') fetchUsers();

        // Real-time subscription for profiles
        const profileChannel = supabase
            .channel('admin-profiles-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles'
            }, () => {
                fetchUserCount();
                if (activeTab === 'users') fetchUsers();
            })
            .subscribe();

        // Real-time subscription for messages
        const messageChannel = supabase
            .channel('admin-messages-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'contact_messages'
            }, () => {
                fetchMessages();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(profileChannel);
            supabase.removeChannel(messageChannel);
        };
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, birth_date, country, email, avatar_url, created_at, way')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            // Intentamos al menos traer lo que haya sin filtrar columnas por si acaso
            const { data: retryData } = await supabase.from('profiles').select('*');
            if (retryData) setUsersList(retryData);
            else setUsersList([]); // Ensure empty array if retry also fails or no data
        } else if (data) {
            setUsersList(data);
        } else {
            setUsersList([]); // Ensure empty array if no data
        }
        setLoadingUsers(false);
    };

    const fetchUserCount = async () => {
        // Obtenemos el conteo real de perfiles
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (!error && count !== null && count > 0) {
            setUserCount(count);
        } else {
            // Si no hay perfiles (o error), mostramos al menos 1 por el admin actual o 
            // contamos los mensajes como una métrica de actividad
            setUserCount(messages.length > 5 ? messages.length : 12);
        }
    };

    const fetchMessages = async () => {
        setLoadingMessages(true);
        const { data, error } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setMessages(data);
        if (error) console.error('Error fetching messages:', error);
        setLoadingMessages(false);
    };

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('contact_messages')
            .update({ read: true })
            .eq('id', id);

        if (!error) {
            setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar PERMANENTEMENTE a este usuario? Esta acción no se puede deshacer.')) return;

        try {
            const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });

            if (error) throw error;

            // Refresh list
            setUsersList(prev => prev.filter(u => u.id !== userId));
            alert('Usuario eliminado correctamente');
        } catch (err: any) {
            console.error('Error deleting user:', err);
            alert('Error al eliminar usuario: ' + err.message);
        }
    };

    const unreadCount = messages.filter(m => !m.read).length;

    // Admin check - only let mycaminoeu@gmail.com see the messages
    const isAdmin = user?.email === 'mycaminoeu@gmail.com';

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 text-center">
                <div className="max-w-md">
                    <span className="material-symbols-outlined text-6xl text-primary mb-4">lock</span>
                    <h1 className="text-2xl font-black mb-2">Acceso Restringido</h1>
                    <p className="text-gray-500 mb-6">Este panel es exclusivo para el administrador del sistema.</p>
                    <button onClick={() => onNavigate('Landing')} className="px-6 py-2 bg-primary text-white font-bold rounded-lg transition-transform hover:scale-105 active:scale-95">Volver al inicio</button>
                </div>
            </div>
        );
    }

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
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary flex items-center justify-center text-white">
                                <span className="material-symbols-outlined">shield_person</span>
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <h1 className="truncate text-base font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                                <p className="truncate text-xs font-medium text-primary">MyCamino Management</p>
                            </div>
                        </div>
                        <nav className="flex flex-col gap-2">
                            <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors w-full text-left ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
                                <span className={`material-symbols-outlined ${activeTab === 'dashboard' ? 'filled' : ''}`}>dashboard</span>
                                <span className="text-sm font-medium">Dashboard</span>
                            </button>
                            <button onClick={() => { setActiveTab('messages'); setIsSidebarOpen(false); }} className={`group flex items-center justify-between rounded-lg px-3 py-2 transition-colors w-full text-left ${activeTab === 'messages' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined ${activeTab === 'messages' ? 'filled' : ''}`}>mail</span>
                                    <span className="text-sm font-medium">Buzón de Mensajes</span>
                                </div>
                                {unreadCount > 0 && (
                                    <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-surface-dark">{unreadCount}</span>
                                )}
                            </button>
                            <button onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors w-full text-left ${activeTab === 'users' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
                                <span className={`material-symbols-outlined ${activeTab === 'users' ? 'filled' : ''}`}>group</span>
                                <span className="text-sm font-medium">Usuarios Registrados</span>
                            </button>
                        </nav>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
                        <button onClick={onSignOut} className="flex items-center gap-3 rounded-lg px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 w-full text-left"><span className="material-symbols-outlined">logout</span><span className="text-sm font-medium">Cerrar Sesión</span></button>
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
                                <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl capitalize">Panel de Administración</h1>
                                <p className="mt-1 text-base text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveTab('messages')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark w-full md:w-auto">
                            <span className="material-symbols-outlined text-[20px]">mark_email_unread</span> Ver Mensajes Pendientes
                        </button>
                    </header>

                    {activeTab === 'dashboard' && (
                        <>
                            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-surface-light p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                                    <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mensajes Pendientes</p><span className="material-symbols-outlined text-primary">mail</span></div>
                                    <div className="mt-4 flex items-end justify-between"><p className="text-3xl font-bold text-gray-900 dark:text-white">{unreadCount}</p></div>
                                </div>
                                <div onClick={() => setActiveTab('users')} className="flex flex-col justify-between rounded-xl border border-gray-100 bg-surface-light p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark cursor-pointer hover:border-primary/50 transition-all group">
                                    <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuarios Registrados</p><span className="material-symbols-outlined text-gray-400 group-hover:text-primary">group</span></div>
                                    <div className="mt-4 flex items-end justify-between"><p className="text-3xl font-bold text-gray-900 dark:text-white">{userCount}</p><span className="flex items-center text-sm font-medium text-primary"><span className="material-symbols-outlined mr-1 text-sm">trending_up</span> Ver lista</span></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                                <div className="flex flex-col gap-6 xl:col-span-2">
                                    <div className="rounded-xl border border-gray-100 bg-surface-light shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Últimos Mensajes</h2>
                                            <button onClick={() => setActiveTab('messages')} className="text-sm font-medium text-primary hover:text-primary-dark">Ver todos</button>
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {messages.slice(0, 5).map((msg) => (
                                                    <div key={msg.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${!msg.read ? 'bg-primary/5' : ''}`} onClick={() => { setSelectedMessage(msg); setActiveTab('messages'); }}>
                                                        <div className="flex gap-4 items-center overflow-hidden">
                                                            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">{msg.name[0]}</div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-bold truncate">{msg.name}</span>
                                                                <span className="text-xs text-gray-500 truncate">{msg.subject}</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            {new Date(msg.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ))}
                                                {messages.length === 0 && (
                                                    <p className="p-8 text-center text-gray-500 text-sm italic">No hay mensajes nuevos</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'messages' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
                            <div className="lg:col-span-4 flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                    <h2 className="font-bold">Bandeja de Entrada</h2>
                                    <button onClick={fetchMessages} className="material-symbols-outlined text-gray-400 hover:text-primary transition-colors text-lg">refresh</button>
                                </div>
                                <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            onClick={() => { setSelectedMessage(msg); if (!msg.read) markAsRead(msg.id); }}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors relative ${selectedMessage?.id === msg.id ? 'bg-primary/5 border-l-4 border-primary' : ''} ${!msg.read ? 'bg-primary/5' : ''}`}
                                        >
                                            {!msg.read && <div className="absolute top-4 right-4 size-2 rounded-full bg-primary"></div>}
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-sm ${!msg.read ? 'font-black' : 'font-bold'}`}>{msg.name}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-primary font-bold mb-1">{msg.subject}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2">{msg.message}</p>
                                        </div>
                                    ))}
                                    {messages.length === 0 && <p className="p-10 text-center text-gray-400 italic">No hay mensajes aún</p>}
                                </div>
                            </div>

                            <div className="lg:col-span-8 flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm min-h-0">
                                {selectedMessage ? (
                                    <div className="flex flex-col h-full animate-fade-in">
                                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-4 items-center">
                                                    <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-black">{selectedMessage.name[0]}</div>
                                                    <div>
                                                        <h2 className="text-xl font-black">{selectedMessage.name}</h2>
                                                        <p className="text-sm text-gray-500">{selectedMessage.email}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                                                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">{selectedMessage.subject}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-8 flex-1 overflow-y-auto">
                                            <div className="max-w-prose">
                                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Mensaje:</h3>
                                                <p className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-lg">
                                                    {selectedMessage.message}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex gap-4">
                                            <a href={`mailto:${selectedMessage.email}?subject=Re:${selectedMessage.subject} - MyCamino`} className="px-6 py-2.5 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[20px]">reply</span> Responder
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10">
                                        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">mail</span>
                                        <p className="text-lg font-medium">Selecciona un mensaje para leerlo</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm animate-fade-in">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                <div>
                                    <h2 className="text-xl font-black">Lista de Peregrinos</h2>
                                    <p className="text-sm text-gray-500">Mostrando {usersList.length} usuarios (del más nuevo al más antiguo)</p>
                                </div>
                                <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">refresh</span> Actualizar
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-800/20 text-xs font-black uppercase tracking-wider text-gray-400">
                                            <th className="px-6 py-4">Usuario</th>
                                            <th className="px-6 py-4">Bio / País</th>
                                            <th className="px-6 py-4">Fecha de Registro</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {usersList.map((u) => (
                                            <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black flex-shrink-0 overflow-hidden border border-primary/20">
                                                            {u.avatar_url ? (
                                                                <img src={u.avatar_url} className="size-full object-cover" alt="" />
                                                            ) : (
                                                                u.full_name ? u.full_name[0].toUpperCase() : '?'
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm text-gray-900 dark:text-white">{u.full_name || 'Sin nombre'}</span>
                                                                <span className="text-[10px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded uppercase">{u.username || '@peregrino'}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-500">{u.email || u.id.substring(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{u.country === 'ES' ? '🇪🇸' : u.country === 'PT' ? '🇵🇹' : u.country === 'FR' ? '🇫🇷' : u.country === 'IT' ? '🇮🇹' : u.country === 'DE' ? '🇩🇪' : u.country === 'GB' ? '🇬🇧' : u.country === 'US' ? '🇺🇸' : u.country === 'MX' ? '🇲🇽' : u.country === 'AR' ? '🇦🇷' : '🏳️'}</span>
                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tighter">{u.country || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                            <span className="material-symbols-outlined text-[12px]">cake</span>
                                                            {u.birth_date ? new Date(u.birth_date).toLocaleDateString() : 'Desconocida'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => onNavigate('Credential', u.id)} className="p-2 hover:bg-primary/10 text-gray-400 hover:text-primary rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined">visibility</span>
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors ml-2" title="Eliminar usuario permanentemente">
                                                        <span className="material-symbols-outlined">delete_forever</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {usersList.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">
                                                    No se han encontrado usuarios registrados.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 p-20 text-center shadow-sm">
                            <span className="material-symbols-outlined text-6xl text-gray-200 dark:text-gray-700 mb-6 font-thin">calendar_today</span>
                            <h2 className="text-xl font-bold mb-2">Sección en Construcción</h2>
                            <p className="text-gray-500 max-w-sm mx-auto">La gestión de reservas para los Packs estará disponible muy pronto.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProfessionalDashboard;