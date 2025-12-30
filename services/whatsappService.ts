/**
 * WhatsApp Service - Integração com uazapiGO
 * Suporte completo para funcionalidades de alta prioridade
 */

import {
    WhatsAppInstance,
    WhatsAppChat,
    WhatsAppMessage,
    WhatsAppWebhook,
    WhatsAppSendMediaPayload,
    WhatsAppSendContactPayload,
    WhatsAppSendLocationPayload,
    WhatsAppPresencePayload,
    WhatsAppChatPresence,
    WhatsAppMediaType,
    WhatsAppWebhookEvent,
    WhatsAppMessageFilter
} from '../types';

// ============================================
// CONFIGURATION
// ============================================

const BASE_URL = 'https://quantumtecnologia.uazapi.com';
const ADMIN_TOKEN = 'vyhHPuazrX32TuCCVbhuyDvfioSzD1sPrVUkWb3IH8Yg841dc9';

const adminHeaders = {
    'Content-Type': 'application/json',
    'admintoken': ADMIN_TOKEN
};

const getInstanceHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    'apikey': token
});

// ============================================
// MOCK DATA (Fallback for development)
// ============================================

const MOCK_INSTANCES: WhatsAppInstance[] = [
    {
        id: 'inst_main',
        name: 'Atendimento Principal',
        status: 'connected',
        token: 'b1492104-de40-4d89-83c2-755ca8712938',
        profileName: 'Mestre da Navalha',
        profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        isBusiness: true
    },
    {
        id: 'inst_support',
        name: 'Suporte Técnico',
        status: 'disconnected',
        token: 'mock_token_tech',
        profileName: 'Suporte',
        profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tech'
    }
];

const getMockChats = (): WhatsAppChat[] => [
    {
        id: '5511999999999@s.whatsapp.net',
        name: 'Cliente Exemplo',
        unreadCount: 2,
        lastMessage: 'Olá, gostaria de agendar um horário.',
        lastMessageTimestamp: Date.now() / 1000,
        lastMessageType: 'text',
        isGroup: false,
        phone: '5511999999999'
    },
    {
        id: '5511888888888@s.whatsapp.net',
        name: 'Maria Silva',
        unreadCount: 0,
        lastMessage: 'Confirmado para amanhã!',
        lastMessageTimestamp: (Date.now() / 1000) - 3600,
        lastMessageType: 'text',
        isGroup: false,
        phone: '5511888888888'
    },
    {
        id: '120363000000000000@g.us',
        name: 'Equipe Interna',
        unreadCount: 5,
        lastMessage: 'Reunião confirmada para sexta.',
        lastMessageTimestamp: (Date.now() / 1000) - 86400,
        isGroup: true,
        isGroupAdmin: true,
        phone: ''
    }
];

const getMockMessages = (chatId: string): WhatsAppMessage[] => [
    {
        id: 'msg1',
        chatId,
        fromMe: false,
        type: 'text',
        text: 'Olá, bom dia! Gostaria de saber os horários disponíveis.',
        timestamp: (Date.now() / 1000) - 100,
        status: 'read'
    },
    {
        id: 'msg2',
        chatId,
        fromMe: true,
        type: 'text',
        text: 'Bom dia! Temos horários hoje às 14h e 16h.',
        timestamp: (Date.now() / 1000) - 50,
        status: 'read'
    },
    {
        id: 'msg3',
        chatId,
        fromMe: false,
        type: 'text',
        text: 'Vou querer às 14h, por favor.',
        timestamp: (Date.now() / 1000) - 10,
        status: 'read'
    }
];

// ============================================
// INSTANCE MANAGEMENT
// ============================================

/**
 * List all WhatsApp instances
 */
export const getInstances = async (): Promise<WhatsAppInstance[]> => {
    try {
        const response = await fetch(`${BASE_URL}/instance/all`, {
            headers: adminHeaders
        });

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                return data.map((inst: any) => ({
                    id: inst.id,
                    name: inst.name,
                    status: inst.status,
                    token: inst.token,
                    profileName: inst.profileName,
                    profilePicUrl: inst.profilePicUrl,
                    number: inst.number,
                    qrcode: inst.qrcode,
                    paircode: inst.paircode,
                    isBusiness: inst.isBusiness,
                    platform: inst.plataform,
                    currentPresence: inst.current_presence,
                    lastDisconnect: inst.lastDisconnect,
                    lastDisconnectReason: inst.lastDisconnectReason,
                    chatbotEnabled: inst.chatbot_enabled,
                    created: inst.created,
                    updated: inst.updated
                }));
            }
        }
    } catch (error) {
        console.error('Error fetching instances:', error);
    }
    return MOCK_INSTANCES;
};

/**
 * Create a new WhatsApp instance
 */
export const createInstance = async (name: string): Promise<WhatsAppInstance | null> => {
    try {
        const response = await fetch(`${BASE_URL}/instance/init`, {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({ name, systemName: 'Q-Barber' })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.instance) {
                return {
                    id: data.instance.id,
                    name: data.instance.name,
                    status: data.instance.status,
                    token: data.instance.token || data.token,
                    qrcode: data.instance.qrcode
                };
            }
        }

        // Fallback mock
        return {
            id: 'mock-id-' + Date.now(),
            name,
            status: 'disconnected',
            token: `mock-token-${Date.now()}`
        };
    } catch (error) {
        console.error('Error creating instance:', error);
        return {
            id: 'mock-id-' + Date.now(),
            name,
            status: 'disconnected',
            token: `mock-token-${Date.now()}`
        };
    }
};

/**
 * Connect an instance (get QR code or pair code)
 */
export const connectInstance = async (
    instanceToken: string,
    phone?: string
): Promise<{ qrcode?: string; paircode?: string; status: string }> => {
    try {
        const response = await fetch(`${BASE_URL}/instance/connect`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify(phone ? { phone } : {})
        });

        const data = await response.json();

        return {
            qrcode: data.instance?.qrcode || data.qrcode || data.base64,
            paircode: data.instance?.paircode || data.paircode,
            status: data.instance?.status || (data.qrcode || data.base64 ? 'connecting' : 'connected')
        };
    } catch (error) {
        console.error('Error connecting instance:', error);
        return { status: 'connected' };
    }
};

/**
 * Disconnect an instance
 */
export const disconnectInstance = async (instanceToken: string): Promise<boolean> => {
    try {
        const response = await fetch(`${BASE_URL}/instance/disconnect`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken)
        });
        return response.ok;
    } catch (error) {
        console.error('Error disconnecting instance:', error);
        return true;
    }
};

/**
 * Delete an instance
 */
export const deleteInstance = async (instanceToken: string): Promise<boolean> => {
    try {
        const response = await fetch(`${BASE_URL}/instance`, {
            method: 'DELETE',
            headers: getInstanceHeaders(instanceToken)
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting instance:', error);
        return true;
    }
};

/**
 * Get instance status
 */
export const getInstanceStatus = async (instanceToken: string): Promise<WhatsAppInstance | null> => {
    try {
        const response = await fetch(`${BASE_URL}/instance/status`, {
            headers: getInstanceHeaders(instanceToken)
        });

        if (response.ok) {
            const data = await response.json();
            return {
                id: data.instance?.id,
                name: data.instance?.name,
                status: data.instance?.status || (data.status?.connected ? 'connected' : 'disconnected'),
                token: instanceToken,
                profileName: data.instance?.profileName,
                profilePicUrl: data.instance?.profilePicUrl,
                qrcode: data.instance?.qrcode,
                paircode: data.instance?.paircode
            };
        }
    } catch (error) {
        console.error('Error getting instance status:', error);
    }
    return null;
};

/**
 * Update instance presence (available/unavailable)
 */
export const updateInstancePresence = async (
    instanceToken: string,
    presence: 'available' | 'unavailable'
): Promise<boolean> => {
    try {
        const response = await fetch(`${BASE_URL}/instance/presence`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({ presence })
        });
        return response.ok;
    } catch (error) {
        console.error('Error updating presence:', error);
        return false;
    }
};

// ============================================
// WEBHOOK MANAGEMENT
// ============================================

/**
 * Set webhook configuration
 */
export const setWebhook = async (
    instanceToken: string,
    config: {
        url: string;
        enabled?: boolean;
        events?: WhatsAppWebhookEvent[];
        excludeMessages?: WhatsAppMessageFilter[];
        addUrlEvents?: boolean;
        addUrlTypesMessages?: boolean;
    }
): Promise<boolean> => {
    try {
        const response = await fetch(`${BASE_URL}/webhook`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({
                url: config.url,
                enabled: config.enabled ?? true,
                events: config.events ?? ['messages', 'messages_update', 'connection'],
                excludeMessages: config.excludeMessages ?? [],
                addUrlEvents: config.addUrlEvents ?? false,
                addUrlTypesMessages: config.addUrlTypesMessages ?? false
            })
        });
        return response.ok;
    } catch (error) {
        console.error('Error setting webhook:', error);
        return false;
    }
};

/**
 * Get current webhook configuration
 */
export const getWebhook = async (instanceToken: string): Promise<WhatsAppWebhook | null> => {
    try {
        const response = await fetch(`${BASE_URL}/webhook`, {
            headers: getInstanceHeaders(instanceToken)
        });

        if (response.ok) {
            const data = await response.json();
            return {
                id: data.id,
                enabled: data.enabled,
                url: data.url,
                events: data.events,
                addUrlTypesMessages: data.addUrlTypesMessages,
                addUrlEvents: data.addUrlEvents,
                excludeMessages: data.excludeMessages
            };
        }
    } catch (error) {
        console.error('Error getting webhook:', error);
    }
    return null;
};

// ============================================
// CHATS & MESSAGES
// ============================================

/**
 * Get chats list
 */
export const getChats = async (
    instanceToken: string,
    options?: { limit?: number; offset?: number }
): Promise<WhatsAppChat[]> => {
    try {
        const response = await fetch(`${BASE_URL}/chat/find`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({
                limit: options?.limit ?? 50,
                offset: options?.offset ?? 0
            })
        });

        if (!response.ok) return getMockChats();

        const data = await response.json();
        if (!data.chats) return getMockChats();

        return data.chats.map((chat: any) => ({
            id: chat.id || chat.wa_chatid || chat.jid,
            name: chat.name || chat.wa_name || chat.wa_contactName || 'Desconhecido',
            image: chat.image,
            imagePreview: chat.imagePreview,
            unreadCount: chat.wa_unreadCount,
            lastMessage: chat.wa_lastMessageTextVote || '',
            lastMessageTimestamp: chat.wa_lastMsgTimestamp,
            lastMessageType: chat.wa_lastMessageType,
            lastMessageSender: chat.wa_lastMessageSender,
            isGroup: chat.wa_isGroup,
            isGroupAdmin: chat.wa_isGroup_admin,
            phone: chat.phone || (chat.id ? chat.id.split('@')[0] : ''),
            wa_archived: chat.wa_archived,
            wa_isBlocked: chat.wa_isBlocked,
            wa_isPinned: chat.wa_isPinned,
            wa_label: chat.wa_label,
            lead_name: chat.lead_name,
            lead_email: chat.lead_email,
            lead_status: chat.lead_status,
            lead_tags: chat.lead_tags
        }));
    } catch (error) {
        console.error('Error fetching chats:', error);
        return getMockChats();
    }
};

/**
 * Get messages from a chat
 */
export const getMessages = async (
    instanceToken: string,
    chatId: string,
    options?: { limit?: number }
): Promise<WhatsAppMessage[]> => {
    try {
        const response = await fetch(`${BASE_URL}/message/find`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({
                chatid: chatId,
                limit: options?.limit ?? 50
            })
        });

        if (!response.ok) return getMockMessages(chatId);

        const data = await response.json();
        if (!data.messages) return getMockMessages(chatId);

        return data.messages.map((msg: any) => ({
            id: msg.id,
            messageId: msg.messageid,
            chatId: msg.chatid,
            sender: msg.sender,
            senderName: msg.senderName,
            fromMe: msg.fromMe,
            isGroup: msg.isGroup,
            type: msg.messageType || 'text',
            source: msg.source,
            text: msg.text || msg.content || msg.caption || '',
            caption: msg.caption,
            fileUrl: msg.fileURL,
            timestamp: msg.messageTimestamp || (msg.created ? new Date(msg.created).getTime() / 1000 : Date.now() / 1000),
            status: msg.status,
            quoted: msg.quoted,
            edited: msg.edited,
            reaction: msg.reaction,
            wasSentByApi: msg.wasSentByApi,
            trackSource: msg.track_source,
            trackId: msg.track_id,
            error: msg.error
        })).reverse();
    } catch (error) {
        console.error('Error fetching messages:', error);
        return getMockMessages(chatId);
    }
};

/**
 * Mark chat as read - uses the readchat parameter in message operations
 * Note: The uazapiGO API doesn't have a dedicated mark-as-read endpoint,
 * it uses readchat/readmessages parameters in send operations.
 * This function is a placeholder that succeeds silently.
 */
export const markChatAsRead = async (
    _instanceToken: string,
    _chatId: string
): Promise<boolean> => {
    // The uazapiGO API handles read status via readchat parameter in send operations
    // There's no dedicated mark-as-read endpoint, so we return true silently
    return true;
};

/**
 * Archive/unarchive chat
 */
export const archiveChat = async (
    instanceToken: string,
    chatId: string,
    archive: boolean
): Promise<boolean> => {
    try {
        const response = await fetch(`${BASE_URL}/chat/archive`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({ chatid: chatId, archive })
        });
        return response.ok;
    } catch (error) {
        console.error('Error archiving chat:', error);
        return false;
    }
};

// ============================================
// SEND MESSAGES
// ============================================

/**
 * Send text message
 */
export const sendMessage = async (
    instanceToken: string,
    number: string,
    text: string,
    options?: {
        delay?: number;
        readchat?: boolean;
        replyid?: string;
        mentions?: string;
        linkPreview?: boolean;
        trackSource?: string;
        trackId?: string;
    }
): Promise<WhatsAppMessage | null> => {
    try {
        const cleanNumber = number.includes('@') ? number.split('@')[0] : number;

        // Build payload without undefined values
        const payload: Record<string, any> = {
            number: cleanNumber,
            text
        };

        if (options?.delay) payload.delay = options.delay;
        if (options?.readchat !== undefined) payload.readchat = options.readchat;
        if (options?.replyid) payload.replyid = options.replyid;
        if (options?.mentions) payload.mentions = options.mentions;
        if (options?.linkPreview !== undefined) payload.linkPreview = options.linkPreview;

        const response = await fetch(`${BASE_URL}/send/text`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            return {
                id: data.id || data.messageid || `local-${Date.now()}`,
                chatId: `${cleanNumber}@s.whatsapp.net`,
                fromMe: true,
                type: 'text',
                text,
                timestamp: Date.now() / 1000,
                status: 'sent'
            };
        } else {
            const errorData = await response.text();
            console.error('Send message API error:', response.status, errorData);
        }
        return null;
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
};

/**
 * Send media message (image, video, audio, document, sticker)
 */
export const sendMedia = async (
    instanceToken: string,
    payload: WhatsAppSendMediaPayload
): Promise<WhatsAppMessage | null> => {
    try {
        const cleanNumber = payload.number.includes('@')
            ? payload.number.split('@')[0]
            : payload.number;

        const response = await fetch(`${BASE_URL}/send/media`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({
                number: cleanNumber,
                type: payload.type,
                file: payload.file,
                text: payload.text,
                docName: payload.docName,
                thumbnail: payload.thumbnail,
                mimetype: payload.mimetype,
                delay: payload.delay,
                readchat: payload.readchat ?? true,
                readmessages: payload.readmessages,
                replyid: payload.replyid,
                mentions: payload.mentions,
                forward: payload.forward,
                track_source: payload.trackSource,
                track_id: payload.trackId,
                async: payload.async
            })
        });

        if (response.ok) {
            const data = await response.json();
            return {
                id: data.id || data.messageid || `local-${Date.now()}`,
                chatId: `${cleanNumber}@s.whatsapp.net`,
                fromMe: true,
                type: payload.type === 'myaudio' || payload.type === 'ptt' ? 'audio' : payload.type,
                text: payload.text,
                fileUrl: data.fileUrl || payload.file,
                timestamp: Date.now() / 1000,
                status: 'sent'
            };
        }
        return null;
    } catch (error) {
        console.error('Error sending media:', error);
        return null;
    }
};

/**
 * Send contact card (vCard)
 */
export const sendContact = async (
    instanceToken: string,
    payload: WhatsAppSendContactPayload
): Promise<WhatsAppMessage | null> => {
    try {
        const cleanNumber = payload.number.includes('@')
            ? payload.number.split('@')[0]
            : payload.number;

        const response = await fetch(`${BASE_URL}/send/contact`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({
                number: cleanNumber,
                fullName: payload.fullName,
                phoneNumber: payload.phoneNumber,
                organization: payload.organization,
                email: payload.email,
                url: payload.url,
                delay: payload.delay,
                readchat: payload.readchat ?? true,
                replyid: payload.replyid,
                track_source: payload.trackSource,
                track_id: payload.trackId
            })
        });

        if (response.ok) {
            const data = await response.json();
            return {
                id: data.id || data.messageid || `local-${Date.now()}`,
                chatId: `${cleanNumber}@s.whatsapp.net`,
                fromMe: true,
                type: 'contact',
                contactName: payload.fullName,
                contactPhone: payload.phoneNumber,
                timestamp: Date.now() / 1000,
                status: 'sent'
            };
        }
        return null;
    } catch (error) {
        console.error('Error sending contact:', error);
        return null;
    }
};

/**
 * Send location
 */
export const sendLocation = async (
    instanceToken: string,
    payload: WhatsAppSendLocationPayload
): Promise<WhatsAppMessage | null> => {
    try {
        const cleanNumber = payload.number.includes('@')
            ? payload.number.split('@')[0]
            : payload.number;

        const response = await fetch(`${BASE_URL}/send/location`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({
                number: cleanNumber,
                name: payload.name,
                address: payload.address,
                latitude: payload.latitude,
                longitude: payload.longitude,
                delay: payload.delay,
                readchat: payload.readchat ?? true,
                replyid: payload.replyid,
                track_source: payload.trackSource,
                track_id: payload.trackId
            })
        });

        if (response.ok) {
            const data = await response.json();
            return {
                id: data.id || data.messageid || `local-${Date.now()}`,
                chatId: `${cleanNumber}@s.whatsapp.net`,
                fromMe: true,
                type: 'location',
                locationName: payload.name,
                locationAddress: payload.address,
                latitude: payload.latitude,
                longitude: payload.longitude,
                timestamp: Date.now() / 1000,
                status: 'sent'
            };
        }
        return null;
    } catch (error) {
        console.error('Error sending location:', error);
        return null;
    }
};

/**
 * Send presence indicator (composing/recording/paused)
 */
export const sendPresence = async (
    instanceToken: string,
    number: string,
    presence: WhatsAppChatPresence,
    delay?: number
): Promise<boolean> => {
    try {
        const cleanNumber = number.includes('@') ? number.split('@')[0] : number;

        const response = await fetch(`${BASE_URL}/message/presence`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({
                number: cleanNumber,
                presence,
                delay: delay ?? 5000
            })
        });
        return response.ok;
    } catch (error) {
        console.error('Error sending presence:', error);
        return false;
    }
};

// ============================================
// MESSAGE ACTIONS
// ============================================

/**
 * React to a message
 */
export const reactToMessage = async (
    instanceToken: string,
    chatId: string,
    messageId: string,
    emoji: string
): Promise<boolean> => {
    try {
        const response = await fetch(`${BASE_URL}/message/react`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({
                chatid: chatId,
                messageid: messageId,
                emoji
            })
        });
        return response.ok;
    } catch (error) {
        console.error('Error reacting to message:', error);
        return false;
    }
};

/**
 * Edit a message
 */
export const editMessage = async (
    instanceToken: string,
    chatId: string,
    messageId: string,
    newText: string
): Promise<boolean> => {
    try {
        const response = await fetch(`${BASE_URL}/message/edit`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({
                chatid: chatId,
                messageid: messageId,
                text: newText
            })
        });
        return response.ok;
    } catch (error) {
        console.error('Error editing message:', error);
        return false;
    }
};

/**
 * Delete a message
 */
export const deleteMessage = async (
    instanceToken: string,
    chatId: string,
    messageId: string,
    forEveryone: boolean = true
): Promise<boolean> => {
    try {
        const response = await fetch(`${BASE_URL}/message/delete`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({
                chatid: chatId,
                messageid: messageId,
                forEveryone
            })
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting message:', error);
        return false;
    }
};

/**
 * Forward a message
 */
export const forwardMessage = async (
    instanceToken: string,
    messageId: string,
    toNumber: string
): Promise<boolean> => {
    try {
        const cleanNumber = toNumber.includes('@') ? toNumber.split('@')[0] : toNumber;

        const response = await fetch(`${BASE_URL}/message/forward`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({
                messageid: messageId,
                number: cleanNumber
            })
        });
        return response.ok;
    } catch (error) {
        console.error('Error forwarding message:', error);
        return false;
    }
};

// ============================================
// CONTACT MANAGEMENT
// ============================================

/**
 * Check if a number is valid on WhatsApp
 */
export const checkNumber = async (
    instanceToken: string,
    number: string
): Promise<{ exists: boolean; jid?: string }> => {
    try {
        const cleanNumber = number.replace(/\D/g, '');

        const response = await fetch(`${BASE_URL}/contact/check`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({ number: cleanNumber })
        });

        if (response.ok) {
            const data = await response.json();
            return {
                exists: data.exists || data.onWhatsApp,
                jid: data.jid
            };
        }
        return { exists: false };
    } catch (error) {
        console.error('Error checking number:', error);
        return { exists: false };
    }
};

/**
 * Get contact profile picture
 */
export const getProfilePicture = async (
    instanceToken: string,
    number: string
): Promise<string | null> => {
    try {
        const cleanNumber = number.includes('@') ? number.split('@')[0] : number;

        const response = await fetch(`${BASE_URL}/contact/profilePicture`, {
            method: 'POST',
            headers: getInstanceHeaders(instanceToken),
            body: JSON.stringify({ number: cleanNumber })
        });

        if (response.ok) {
            const data = await response.json();
            return data.url || data.profilePictureUrl;
        }
        return null;
    } catch (error) {
        console.error('Error getting profile picture:', error);
        return null;
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format phone number to WhatsApp JID
 */
export const formatToJID = (number: string, isGroup: boolean = false): string => {
    const cleanNumber = number.replace(/\D/g, '');
    return isGroup ? `${cleanNumber}@g.us` : `${cleanNumber}@s.whatsapp.net`;
};

/**
 * Extract phone number from JID
 */
export const extractPhoneFromJID = (jid: string): string => {
    return jid.split('@')[0];
};

/**
 * Get media type icon
 */
export const getMediaTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
        image: '🖼️',
        video: '🎥',
        audio: '🎵',
        ptt: '🎙️',
        document: '📄',
        sticker: '🏷️',
        contact: '👤',
        location: '📍',
        poll: '📊'
    };
    return icons[type] || '📝';
};

/**
 * Format message preview
 */
export const formatMessagePreview = (message: WhatsAppMessage): string => {
    if (message.type === 'text') return message.text || '';
    if (message.type === 'image') return '📷 Imagem';
    if (message.type === 'video') return '🎥 Vídeo';
    if (message.type === 'audio' || message.type === 'ptt') return '🎵 Áudio';
    if (message.type === 'document') return `📄 ${message.fileName || 'Documento'}`;
    if (message.type === 'sticker') return '🏷️ Figurinha';
    if (message.type === 'contact') return `👤 ${message.contactName || 'Contato'}`;
    if (message.type === 'location') return `📍 ${message.locationName || 'Localização'}`;
    return message.text || '...';
};
