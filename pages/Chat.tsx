import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    read: boolean;
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string;
    };
}

interface Conversation {
    id: string;
    created_at: string;
    updated_at: string;
    other_user?: {
        id: string;
        full_name: string;
        avatar_url: string;
        username: string;
    };
    last_message?: Message;
    unread_count: number;
}

interface Props {
    onNavigate: (view: any, profileId?: string | null) => void;
    language: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja';
    setLanguage: (lang: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja') => void;
    user: any;
    onSignOut: () => void;
    selectedUserId?: string | null; // ID del usuario con quien chatear
}

const Chat = ({ onNavigate, user, language, selectedUserId }: Props) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [initializingChat, setInitializingChat] = useState(false);
    // User profile of the person currently selected (fetched directly if not in list yet)
    const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const selectedConversationRef = useRef<string | null>(null);

    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    const t = {
        messages: language === 'en' ? 'Messages' : language === 'es' ? 'Mensajes' : 'Messages',
        typeMessage: language === 'en' ? 'Type a message...' : language === 'es' ? 'Escribe un mensaje...' : 'Type a message...',
        send: language === 'en' ? 'Send' : language === 'es' ? 'Enviar' : 'Send',
        noConversations: language === 'en' ? 'No conversations yet' : language === 'es' ? 'No hay conversaciones aún' : 'No conversations yet',
        startChat: language === 'en' ? 'Start chatting with other pilgrims!' : language === 'es' ? '¡Empieza a chatear con otros peregrinos!' : 'Start chatting!',
        findPilgrims: language === 'en' ? 'Find Pilgrims' : language === 'es' ? 'Buscar Peregrinos' : 'Find Pilgrims',
    };

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const [clearedConversations, setClearedConversations] = useState<Set<string>>(new Set());

    // Reusable function to fetch conversations
    const fetchConversations = async () => {
        if (!user) return;

        try {
            const { data: convData, error } = await supabase
                .from('conversation_participants')
                .select(`
                  conversation_id,
                  conversations (
                    id,
                    created_at,
                    updated_at
                  )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            // Get other participants using Promise.all
            const conversationsWithUsers = await Promise.all(
                convData.map(async (conv: any) => {
                    const { data: participants } = await supabase
                        .from('conversation_participants')
                        .select('user_id, profiles(id, full_name, avatar_url, username)')
                        .eq('conversation_id', conv.conversation_id)
                        .neq('user_id', user.id)
                        .single();

                    const { data: lastMsg } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('conversation_id', conv.conversation_id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    const { count: unreadCount } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', conv.conversation_id)
                        .eq('read', false)
                        .neq('sender_id', user.id);

                    return {
                        id: conv.conversations.id,
                        created_at: conv.conversations.created_at,
                        updated_at: conv.conversations.updated_at,
                        other_user: participants?.profiles,
                        last_message: lastMsg,
                        unread_count: unreadCount || 0,
                    };
                })
            );

            setConversations(conversationsWithUsers.sort((a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            ).map(conv => ({
                ...conv,
                // Force 0 unread if this conversation is open OR has been opened recently
                unread_count: (conv.id === selectedConversationRef.current || clearedConversations.has(conv.id)) ? 0 : conv.unread_count
            })));
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchConversations();

        // Listen for ANY new message to update the sidebar list (last message & order)
        const globalMsgSub = supabase
            .channel('global-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    // We re-fetch conversations to update unread counts and last message snippet
                    // This is slightly inefficient but ensures consistency. A more optimized way would be to update local state.
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(globalMsgSub);
        };
    }, [user]);

    // Fetch user profile if selectedUserId is active but not in conversations list yet
    useEffect(() => {
        const loadSelectedUserProfile = async () => {
            if (!selectedUserId) {
                setSelectedUserProfile(null);
                return;
            }

            // Check if we already have this user in our conversations list
            const existingInList = conversations.find(c => c.other_user?.id === selectedUserId);
            if (existingInList) {
                setSelectedUserProfile(existingInList.other_user);
            } else {
                // Fetch manually
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', selectedUserId)
                    .single();
                setSelectedUserProfile(data);
            }
        };
        loadSelectedUserProfile();
    }, [selectedUserId, conversations]);


    // Handle finding or creating chat
    useEffect(() => {
        if (!selectedUserId || !user) return;

        const findOrCreateConversation = async () => {
            setInitializingChat(true);
            try {
                // Improved Check: Fetch ALL participants for user's conversations at once
                const { data: myConvs } = await supabase
                    .from('conversation_participants')
                    .select('conversation_id')
                    .eq('user_id', user.id);

                if (myConvs && myConvs.length > 0) {
                    const myConvIds = myConvs.map(c => c.conversation_id);
                    // Check if other user is in ANY of these conversations
                    const { data: existing } = await supabase
                        .from('conversation_participants')
                        .select('conversation_id')
                        .in('conversation_id', myConvIds)
                        .eq('user_id', selectedUserId)
                        .maybeSingle();

                    if (existing) {
                        setSelectedConversation(existing.conversation_id);
                        await fetchConversations();
                        setInitializingChat(false);
                        return;
                    }
                }

                // Create new conversation safely using RPC or Fallback
                const { data: newConvId, error: rpcError } = await supabase
                    .rpc('create_new_conversation', { other_user_id: selectedUserId });

                if (rpcError) throw rpcError;
                if (!newConvId) throw new Error('No conversation ID returned');

                setSelectedConversation(newConvId);
                // Refresh list to show the new chat in sidebar
                await fetchConversations();
            } catch (error: any) {
                console.error('Error finding/creating conversation:', error);

                // Fallback creation logic if RPC fails or doesn't exist
                if (error.message?.includes('function') || error.code === '42883') {
                    // Manual creation
                    const { data: newConv } = await supabase.from('conversations').insert({}).select().single();
                    if (newConv) {
                        await supabase.from('conversation_participants').insert([
                            { conversation_id: newConv.id, user_id: user.id },
                            { conversation_id: newConv.id, user_id: selectedUserId }
                        ]);
                        setSelectedConversation(newConv.id);
                        await fetchConversations();
                    }
                } else {
                    alert(`Error: ${error.message || 'Unknown error'}`);
                }
            } finally {
                setInitializingChat(false);
            }
        };

        findOrCreateConversation();
    }, [selectedUserId, user]);

    const deleteConversation = async (conversationId: string) => {
        if (!confirm(language === 'en' ? 'Delete this conversation?' : '¿Borrar esta conversación?')) return;

        try {
            // 1. Delete all messages in the conversation
            const { error: msgError } = await supabase
                .from('messages')
                .delete()
                .eq('conversation_id', conversationId);

            if (msgError) throw msgError;

            // 2. Delete all participants
            const { error: partError } = await supabase
                .from('conversation_participants')
                .delete()
                .eq('conversation_id', conversationId);

            if (partError) throw partError;

            // 3. Finally delete the conversation itself
            const { error: convError } = await supabase
                .from('conversations')
                .delete()
                .eq('id', conversationId);

            if (convError) throw convError;

            // Update local state
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (selectedConversation === conversationId) {
                setSelectedConversation(null);
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            alert('Error al eliminar la conversación. Asegúrate de tener permisos.');
        }
    };

    const isMarkingRead = useRef<boolean>(false);

    // Handle selecting a conversation
    const handleSelectConversation = (conversationId: string) => {
        setSelectedConversation(conversationId);
        // Track that this conversation is now "read" in this session
        setClearedConversations(prev => new Set(prev).add(conversationId));
        // Clear unread count locally for instant feedback
        setConversations(prev => prev.map(conv =>
            conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        ));
    };

    // Fetch messages for selected conversation
    useEffect(() => {
        if (!selectedConversation) return;

        const fetchMessagesAndMarkRead = async () => {
            // First fetch the messages
            const { data, error } = await supabase
                .from('messages')
                .select(`
                  *,
                  sender:profiles!sender_id(id, full_name, avatar_url)
                `)
                .eq('conversation_id', selectedConversation)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
                return;
            }

            setMessages(data || []);

            // Immediately mark as read in DB if there are potentially unread messages
            if (user) {
                isMarkingRead.current = true;
                const { error: updateError } = await supabase
                    .from('messages')
                    .update({ read: true })
                    .eq('conversation_id', selectedConversation)
                    .neq('sender_id', user.id)
                    .eq('read', false);

                if (updateError) {
                    console.error('Error marking messages as read:', updateError);
                }

                // Update local state even if DB update is slow/failed for better UX
                setConversations(prev => prev.map(conv =>
                    conv.id === selectedConversation ? { ...conv, unread_count: 0 } : conv
                ));

                // Wait a bit for DB consistency before allowing refresh
                setTimeout(() => {
                    isMarkingRead.current = false;
                    fetchConversations();
                }, 500);
            }
        };

        fetchMessagesAndMarkRead();

        // Subscribe to new messages for THIS conversation
        const channel = supabase
            .channel(`messages-${selectedConversation}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversation}`,
                },
                async (payload) => {
                    console.log('New message in active chat:', payload);
                    if (user && payload.new.sender_id === user.id) return;

                    const { data: senderData } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMsg = { ...payload.new, sender: senderData } as Message;
                    setMessages((prev) => [...prev, newMsg]);

                    // Since chat is open, mark this specific new message as read too
                    if (user) {
                        isMarkingRead.current = true;
                        await supabase
                            .from('messages')
                            .update({ read: true })
                            .eq('id', payload.new.id);

                        setConversations(prev => prev.map(conv =>
                            conv.id === selectedConversation ? { ...conv, unread_count: 0, last_message: newMsg } : conv
                        ));

                        setTimeout(() => {
                            isMarkingRead.current = false;
                        }, 500);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedConversation, user]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        const content = newMessage.trim();
        setNewMessage(''); // Clear input immediately

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            id: tempId,
            conversation_id: selectedConversation,
            sender_id: user.id,
            content: content,
            created_at: new Date().toISOString(),
            read: false,
            sender: {
                id: user.id,
                full_name: user.user_metadata?.full_name || 'Me',
                avatar_url: user.user_metadata?.avatar_url || '',
            }
        };

        setMessages((prev) => [...prev, tempMessage]);

        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: selectedConversation,
                sender_id: user.id,
                content: content,
            })
            .select(`
                *,
                sender:profiles!sender_id(id, full_name, avatar_url)
            `)
            .single();

        if (error) {
            console.error('Error sending message:', error);
            // Revert optimistic update
            setMessages((prev) => prev.filter(m => m.id !== tempId));
            setNewMessage(content); // Restore input
            alert('Failed to send message');
            return;
        }

        // Replace optimistic message with real one
        if (data) {
            setMessages((prev) => prev.map(m => m.id === tempId ? data : m));
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Determine the user details to show in the header
    // Use the conversation data if available, otherwise fallback to the explicitly fetched profile
    const selectedConvData = conversations.find((c) => c.id === selectedConversation);
    const headerUser = selectedConvData?.other_user || selectedUserProfile;
    const headerName = headerUser?.full_name || 'Usuario';
    const headerAvatar = headerUser?.avatar_url;
    const headerUsername = headerUser?.username || '';


    return (
        <div className="bg-background-light dark:bg-background-dark h-[100dvh] flex flex-col font-display overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-40 shrink-0 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7f3ed] dark:border-gray-800 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-6 py-4 lg:px-20">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('Landing')}>
                    <img src="/navbar_logo.png" alt="MyCamino" className="h-10 w-auto object-contain" />
                </div>
                <button onClick={() => onNavigate('Landing')} className="text-sm font-bold text-primary hover:underline">
                    {language === 'en' ? 'Back' : language === 'es' ? 'Volver' : 'Back'}
                </button>
            </header>

            {/* Main Chat Interface */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Conversations List */}
                <div className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark overflow-y-auto ${selectedConversation ? 'hidden md:block' : 'block'}`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white">{t.messages}</h3>
                        <button
                            onClick={() => onNavigate('Community')}
                            className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                            title={language === 'en' ? 'Find people' : language === 'es' ? 'Buscar personas' : 'Find people'}
                        >
                            <span className="material-symbols-outlined">person_search</span>
                        </button>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-800 mb-4">chat</span>
                            <p className="text-slate-400 font-bold">{t.noConversations}</p>
                            <p className="text-slate-300 dark:text-slate-600 text-sm mt-1 italic mb-6">{t.startChat}</p>
                            <button
                                onClick={() => onNavigate('Community')}
                                className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors"
                            >
                                {t.findPilgrims}
                            </button>
                        </div>
                    ) : (
                        <div>
                            {conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    onClick={() => handleSelectConversation(conv.id)}
                                    className={`p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800 ${selectedConversation === conv.id ? 'bg-primary/5' : ''
                                        }`}
                                >
                                    {conv.other_user?.avatar_url ? (
                                        <img
                                            src={conv.other_user.avatar_url}
                                            className="size-12 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                                            alt={conv.other_user.full_name}
                                        />
                                    ) : (
                                        <div className="size-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-lg font-black ring-2 ring-slate-100 dark:ring-slate-800">
                                            {(conv.other_user?.full_name || 'U')[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                            {conv.other_user?.full_name}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {conv.last_message?.content || 'Start a conversation'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {conv.unread_count > 0 && (
                                            <div className="size-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black">
                                                {conv.unread_count}
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteConversation(conv.id);
                                            }}
                                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Messages Area */}
                <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-background-dark ${selectedConversation ? 'fixed inset-0 z-50 md:static w-full h-full' : 'hidden md:flex'}`}>
                    {initializingChat ? (
                        <div className="flex-1 flex items-center justify-center bg-white dark:bg-background-dark">
                            <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-sm md:shadow-none">
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="md:hidden p-2 -ml-2 text-slate-500 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                {headerAvatar ? (
                                    <img
                                        src={headerAvatar}
                                        className="size-10 rounded-full object-cover"
                                        alt={headerName}
                                    />
                                ) : (
                                    <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-black">
                                        {(headerName || 'U')[0]}
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                                        {headerName}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {headerUsername ? (headerUsername.startsWith('@') ? headerUsername : `@${headerUsername}`) : '@usuario'}
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-background-dark">
                                {messages.map((msg) => {
                                    const isOwn = msg.sender_id === user.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {!isOwn && msg.sender?.avatar_url && (
                                                    <img
                                                        src={msg.sender.avatar_url}
                                                        className="size-8 rounded-full object-cover"
                                                        alt={msg.sender.full_name}
                                                    />
                                                )}
                                                <div
                                                    className={`px-4 py-2 rounded-2xl ${isOwn
                                                        ? 'bg-primary text-white rounded-br-sm'
                                                        : 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white rounded-bl-sm'
                                                        }`}
                                                >
                                                    <p className="text-sm">{msg.content}</p>
                                                    <p
                                                        className={`text-[10px] mt-1 ${isOwn ? 'text-white/70' : 'text-slate-400'
                                                            }`}
                                                    >
                                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={t.typeMessage}
                                        className="flex-1 px-4 py-3 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-primary outline-none text-slate-900 dark:text-white"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim()}
                                        className="size-12 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
                                    >
                                        <span className="material-symbols-outlined">send</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-8xl text-slate-200 dark:text-slate-800 mb-4">
                                    chat_bubble
                                </span>
                                <p className="text-slate-400 font-bold">
                                    {language === 'en' ? 'Select a conversation' : language === 'es' ? 'Selecciona una conversación' : 'Select a conversation'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
