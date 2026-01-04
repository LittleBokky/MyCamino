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
    name?: string | null;
    is_group?: boolean;
    avatar_url?: string | null;
    other_user?: {
        id: string;
        full_name: string;
        avatar_url: string;
        username: string;
    };
    participants?: {
        id: string;
        full_name: string;
        avatar_url: string;
    }[];
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
    const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);

    // Group Chat State
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedGroupUsers, setSelectedGroupUsers] = useState<string[]>([]);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const typingTimeoutRef = useRef<any>(null);

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
                    updated_at,
                    name,
                    is_group,
                    avatar_url
                  )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            // Get participants and details using Promise.all
            const conversationsWithUsers = await Promise.all(
                (convData || []).map(async (convDetail: any) => {
                    const conv = convDetail.conversations;
                    if (!conv) return null;

                    const { data: participants } = await supabase
                        .from('conversation_participants')
                        .select('user_id, profiles(id, full_name, avatar_url, username)')
                        .eq('conversation_id', conv.id);

                    // Helper to normalize Supabase join results
                    const getProfile = (p: any) => Array.isArray(p?.profiles) ? p.profiles[0] : p?.profiles;

                    const allParticipants = (participants || []).map(getProfile).filter(Boolean);
                    const otherParticipants = allParticipants.filter((p: any) => p.id !== user.id);
                    const isGroup = conv.is_group || allParticipants.length > 2;

                    const lastMsgQuery = await supabase
                        .from('messages')
                        .select('*')
                        .eq('conversation_id', conv.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    const lastMsg = lastMsgQuery.data;

                    const { count: unreadCount } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', conv.id)
                        .eq('read', false)
                        .neq('sender_id', user.id);

                    return {
                        id: conv.id,
                        created_at: conv.created_at,
                        updated_at: conv.updated_at,
                        name: conv.name,
                        is_group: isGroup,
                        avatar_url: conv.avatar_url,
                        other_user: !isGroup && otherParticipants.length === 1 ? otherParticipants[0] : null,
                        participants: allParticipants,
                        last_message: lastMsg,
                        unread_count: unreadCount || 0,
                    };
                })
            );

            const filteredConvs = conversationsWithUsers.filter(c => c !== null) as Conversation[];

            setConversations(filteredConvs.sort((a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            ).map(conv => ({
                ...conv,
                unread_count: (conv.id === selectedConversationRef.current || clearedConversations.has(conv.id)) ? 0 : conv.unread_count
            })));
        } catch (error: any) {
            console.error('Error fetching conversations:', error);
            // If it's a column missing error, it's likely the SQL hasn't been run
            if (error?.code === '42703') {
                console.error('Database columns missing. Please run the SQL migration for name and is_group.');
            }
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

    const fetchAvailableUsers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, username')
            .neq('id', user.id)
            .limit(50);

        if (!error && data) {
            setAvailableUsers(data);
        }
    };

    useEffect(() => {
        if (showCreateGroup) {
            fetchAvailableUsers();
        }
    }, [showCreateGroup]);

    const handleCreateGroupChat = async () => {
        if (!groupName.trim() || selectedGroupUsers.length === 0) {
            alert(language === 'en' ? 'Please provide a name and select at least one participant.' : 'Por favor, introduce un nombre y selecciona al menos un participante.');
            return;
        }

        setIsCreatingGroup(true);
        try {
            // Use RPC for atomic creation of group and participants
            const { data: newConvId, error } = await supabase.rpc('create_group_conversation', {
                p_name: groupName.trim(),
                p_participant_ids: selectedGroupUsers
            });

            if (error) throw error;
            if (!newConvId) throw new Error('No conversation ID returned');

            // Success
            setGroupName('');
            setSelectedGroupUsers([]);
            setShowCreateGroup(false);
            setSelectedConversation(newConvId);
            await fetchConversations();
        } catch (error: any) {
            console.error('Error creating group:', error);
            alert(`Error: ${error.message || 'Check your database permissions/RPC'}`);
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const toggleGroupUser = (userId: string) => {
        setSelectedGroupUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
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

        // Subscribe to new messages AND typing/read events for THIS conversation
        const channel = supabase
            .channel(`conversation-${selectedConversation}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversation}`,
                },
                async (payload) => {
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
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversation}`,
                },
                (payload) => {
                    // Update read status in real-time
                    setMessages(prev => prev.map(msg =>
                        msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
                    ));
                }
            )
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.userId !== user.id) {
                    setTypingUser(payload.userName);
                    // Clear after 3 seconds of no typing signal
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
                }
            })
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

    const handleTyping = () => {
        if (!selectedConversation) return;
        supabase.channel(`conversation-${selectedConversation}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user.id, userName: user.user_metadata?.full_name || 'Someone' },
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        handleTyping();
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
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowCreateGroup(true)}
                                className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                                title={language === 'en' ? 'Create Group' : language === 'es' ? 'Crear Grupo' : 'Create Group'}
                            >
                                <span className="material-symbols-outlined">group_add</span>
                            </button>
                            <button
                                onClick={() => onNavigate('Community')}
                                className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                                title={language === 'en' ? 'Find people' : language === 'es' ? 'Buscar personas' : 'Find people'}
                            >
                                <span className="material-symbols-outlined">person_search</span>
                            </button>
                        </div>
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
                                    {conv.is_group ? (
                                        conv.avatar_url ? (
                                            <img
                                                src={conv.avatar_url}
                                                className="size-12 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                                                alt={conv.name || 'Group'}
                                            />
                                        ) : (
                                            <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary text-lg font-black ring-2 ring-slate-100 dark:ring-slate-800">
                                                <span className="material-symbols-outlined">groups</span>
                                            </div>
                                        )
                                    ) : conv.other_user?.avatar_url ? (
                                        <img
                                            src={conv.other_user.avatar_url}
                                            className="size-12 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                                            alt={conv.other_user.full_name}
                                        />
                                    ) : (
                                        <div className="size-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-lg font-black ring-2 ring-slate-100 dark:ring-slate-800">
                                            {(conv.other_user?.full_name || conv.name || 'U')[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                            {conv.name || conv.other_user?.full_name}
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
                                {selectedConvData?.is_group ? (
                                    <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">groups</span>
                                    </div>
                                ) : headerAvatar ? (
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
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                                        {selectedConvData?.name || headerName}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {selectedConvData?.is_group
                                            ? `${selectedConvData.participants?.length || 0} ${language === 'en' ? 'members' : 'miembros'}`
                                            : headerUsername ? (headerUsername.startsWith('@') ? headerUsername : `@${headerUsername}`) : '@usuario'}
                                    </p>
                                </div>
                                {selectedConvData?.is_group && (
                                    <button
                                        onClick={() => setShowMembersModal(true)}
                                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined">info</span>
                                    </button>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-background-dark">
                                {messages.map((msg, index) => {
                                    const isOwn = msg.sender_id === user.id;
                                    const isGroup = selectedConvData?.is_group;
                                    // Logic: show name if it's a group, not our own message, and the sender changed
                                    const showName = isGroup && !isOwn && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);

                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                            {showName && (
                                                <span className="text-[11px] font-bold text-primary mb-1 ml-10">
                                                    {msg.sender?.full_name}
                                                </span>
                                            )}
                                            <div className={`flex gap-2 max-w-[85%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {!isOwn && (
                                                    <div className="size-8 shrink-0">
                                                        {showName ? (
                                                            msg.sender?.avatar_url ? (
                                                                <img
                                                                    src={msg.sender.avatar_url}
                                                                    className="size-8 rounded-full object-cover"
                                                                    alt={msg.sender.full_name}
                                                                />
                                                            ) : (
                                                                <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                                                    {msg.sender?.full_name?.[0]}
                                                                </div>
                                                            )
                                                        ) : null}
                                                    </div>
                                                )}
                                                <div
                                                    className={`px-4 py-2 rounded-2xl ${isOwn
                                                        ? 'bg-primary text-white rounded-br-sm'
                                                        : 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white rounded-bl-sm'
                                                        } shadow-sm`}
                                                >
                                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                                    <div className="flex items-center justify-end gap-1 mt-1">
                                                        <p className={`text-[9px] ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </p>
                                                        {isOwn && (
                                                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-80 leading-none">
                                                                {msg.read
                                                                    ? (language === 'en' ? 'Read' : 'Leido')
                                                                    : (language === 'en' ? 'Sent' : 'Enviado')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {typingUser && (
                                    <div className="flex items-center gap-2 animate-pulse mb-4">
                                        <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 px-3 py-2 rounded-2xl rounded-bl-sm">
                                            <div className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="size-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 italic">
                                            {typingUser} {language === 'en' ? 'is typing...' : 'está escribiendo...'}
                                        </span>
                                    </div>
                                )}
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

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                {language === 'en' ? 'New Group' : 'Nuevo Grupo'}
                            </h3>
                            <button onClick={() => setShowCreateGroup(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {language === 'en' ? 'Group Name' : 'Nombre del Grupo'}
                                </label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder={language === 'en' ? 'Epic Route 2026...' : 'El Camino Epico 2026...'}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {language === 'en' ? 'Select Participants' : 'Seleccionar Participantes'} ({selectedGroupUsers.length})
                                </label>
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {availableUsers.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => toggleGroupUser(u.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedGroupUsers.includes(u.id)
                                                ? 'bg-primary/10 ring-1 ring-primary'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} className="size-10 rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold">
                                                    {(u.full_name || u.username || 'U')[0]}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{u.full_name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{u.username}</p>
                                            </div>
                                            <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedGroupUsers.includes(u.id) ? 'bg-primary border-primary' : 'border-gray-200 dark:border-gray-700'}`}>
                                                {selectedGroupUsers.includes(u.id) && <span className="material-symbols-outlined text-white text-lg">check</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                            <button
                                onClick={() => setShowCreateGroup(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                {language === 'en' ? 'Cancel' : 'Cancelar'}
                            </button>
                            <button
                                onClick={handleCreateGroupChat}
                                disabled={isCreatingGroup || !groupName.trim() || selectedGroupUsers.length === 0}
                                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCreatingGroup && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                {language === 'en' ? 'Create Group' : 'Crear Grupo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Members Modal */}
            {showMembersModal && selectedConvData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h3 className="font-black text-lg text-slate-900 dark:text-white">
                                {language === 'en' ? 'Group Members' : 'Miembros del Grupo'}
                            </h3>
                            <button onClick={() => setShowMembersModal(false)} className="text-slate-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[60vh] p-2">
                            {selectedConvData.participants?.map((p: any) => (
                                <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                                    {p.avatar_url ? (
                                        <img src={p.avatar_url} className="size-10 rounded-full object-cover" alt={p.full_name} />
                                    ) : (
                                        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                            {p.full_name?.[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{p.full_name}</p>
                                        <p className="text-xs text-slate-500 truncate">@{p.username || 'usuario'}</p>
                                    </div>
                                    {p.id === user.id && (
                                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-full uppercase">
                                            {language === 'en' ? 'You' : 'Tú'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
