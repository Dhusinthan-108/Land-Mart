/**
 * ============================================================================
 * LAND MART - SELLER-BUYER MESSAGING SYSTEM
 * ============================================================================
 * Proper messaging function for communication between sellers and buyers
 * 
 * Features:
 * - Clear seller/buyer role identification
 * - Real-time message delivery
 * - Read receipts
 * - Property context in conversations
 * - Simple, reliable communication
 */

// ============================================================================
// STATE
// ============================================================================

const MessagingApp = {
    currentUser: null,
    socket: null,
    activeConversation: null,
    conversations: [],
    messages: []
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Messaging] Initializing...');

    // Check authentication
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || !user.token) {
        console.log('[Messaging] User not authenticated, redirecting...');
        window.location.href = 'login.html';
        return;
    }

    MessagingApp.currentUser = user;
    console.log('[Messaging] User:', user.name, '| Role:', user.role, '| ID:', user.id);

    // Initialize Socket.io
    initializeSocket();

    // Load conversations
    loadConversations();

    // Setup event listeners
    setupEventListeners();

    // Handle URL parameters (deep linking)
    handleURLParameters();
});

// ============================================================================
// SOCKET.IO - REAL-TIME COMMUNICATION
// ============================================================================

function initializeSocket() {
    if (typeof io === 'undefined') {
        console.warn('[Socket] Socket.io not available');
        return;
    }

    MessagingApp.socket = io();

    MessagingApp.socket.on('connect', () => {
        console.log('[Socket] Connected:', MessagingApp.socket.id);

        // Join personal room
        MessagingApp.socket.emit('join_user', MessagingApp.currentUser.id);
        console.log('[Socket] Joined user room:', MessagingApp.currentUser.id);

        updateConnectionStatus(true);
    });

    MessagingApp.socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
        updateConnectionStatus(false);
    });

    // Listen for new messages
    MessagingApp.socket.on('receive_message', (message) => {
        console.log('[Socket] New message received:', message._id);
        handleIncomingMessage(message);
    });

    // Listen for read receipts
    MessagingApp.socket.on('messages_read', ({ conversationId }) => {
        console.log('[Socket] Messages read:', conversationId);
        handleMessagesRead(conversationId);
    });
}

function updateConnectionStatus(isConnected) {
    const status = document.querySelector('.connection-status');
    if (status) {
        status.textContent = isConnected ? '● Online' : '○ Offline';
        status.style.color = isConnected ? '#10b981' : '#ef4444';
    }
}

// ============================================================================
// LOAD CONVERSATIONS
// ============================================================================

async function loadConversations() {
    try {
        showLoading('Loading conversations...');

        const url = getApiUrl(API_CONFIG.ENDPOINTS.GET_CONVERSATIONS);
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to load conversations');
        }

        const conversations = await response.json();
        MessagingApp.conversations = conversations;

        console.log('[Conversations] Loaded:', conversations.length);
        displayConversations(conversations);

    } catch (error) {
        console.error('[Conversations] Error:', error);
        showError('conversations-list', 'Failed to load conversations');
    } finally {
        hideLoading();
    }
}

function displayConversations(conversations) {
    const container = document.getElementById('conversations-list');

    if (!conversations || conversations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No Conversations</h3>
                <p>Start chatting about properties!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    conversations.forEach(conv => {
        const card = createConversationCard(conv);
        container.appendChild(card);
    });
}

function createConversationCard(conversation) {
    const card = document.createElement('div');
    card.className = 'conversation-card';
    card.dataset.id = conversation._id;

    // Determine the other participant (seller or buyer)
    const otherUser = getOtherParticipant(conversation);
    const avatarColor = getAvatarColor(otherUser.name);
    const initials = getInitials(otherUser.name);
    const timeStr = formatTime(conversation.updatedAt);

    // Determine role
    const role = otherUser.role || 'user';
    const roleClass = role === 'seller' ? 'seller' : 'buyer';

    // Check if active
    if (MessagingApp.activeConversation && MessagingApp.activeConversation._id === conversation._id) {
        card.classList.add('active');
    }

    card.innerHTML = `
        <div class="conversation-avatar" style="background: ${avatarColor}">${initials}</div>
        <div class="conversation-info">
            <div class="conversation-header">
                <h4 class="conversation-name">
                    ${escapeHtml(otherUser.name || 'Unknown')}
                    <span class="role-badge ${roleClass}">${role}</span>
                </h4>
                <span class="conversation-time">${timeStr}</span>
            </div>
            <div class="conversation-preview">
                <p class="last-message">
                    ${conversation.lastSenderId === MessagingApp.currentUser.id ?
            '<i class="fas fa-check"></i> ' : ''}
                    ${escapeHtml(conversation.lastMessage || 'No messages yet')}
                </p>
                ${conversation.unreadCount > 0 ?
            `<span class="unread-count">${conversation.unreadCount}</span>` : ''}
            </div>
        </div>
    `;

    card.addEventListener('click', () => openConversation(conversation));

    return card;
}

// ============================================================================
// OPEN CONVERSATION
// ============================================================================

async function openConversation(conversation) {
    console.log('[Conversation] Opening:', conversation._id);

    // Leave previous room
    if (MessagingApp.activeConversation && MessagingApp.socket) {
        MessagingApp.socket.emit('leave_conversation', MessagingApp.activeConversation._id);
    }

    // Update state
    MessagingApp.activeConversation = conversation;
    MessagingApp.messages = [];

    // Join new room
    if (MessagingApp.socket) {
        MessagingApp.socket.emit('join_conversation', conversation._id);
    }

    // Update UI
    updateActiveConversationUI();
    renderChatHeader(conversation);
    showChatPanel();

    // Load messages
    await loadMessages(conversation._id);

    // Mark as read
    markAsRead(conversation._id);
}

function renderChatHeader(conversation) {
    const header = document.getElementById('chat-header');
    const otherUser = getOtherParticipant(conversation);
    const avatarColor = getAvatarColor(otherUser.name);
    const initials = getInitials(otherUser.name);
    const property = conversation.propertyId || {};
    const role = otherUser.role || 'user';
    const roleClass = role === 'seller' ? 'seller' : 'buyer';

    header.innerHTML = `
        <button class="back-btn" onclick="closeChatPanel()">
            <i class="fas fa-arrow-left"></i>
        </button>
        <div class="chat-avatar" style="background: ${avatarColor}">${initials}</div>
        <div class="chat-details">
            <h3>
                ${escapeHtml(otherUser.name || 'Unknown')}
                <span class="role-badge ${roleClass}">${role}</span>
            </h3>
            <p class="property-title">${escapeHtml(property.title || property.location || 'Property Chat')}</p>
        </div>
        <div class="connection-status">● Online</div>
    `;
}

function showChatPanel() {
    document.querySelector('.messages-wrapper').classList.add('chat-active');
    document.getElementById('message-input-area').style.display = 'flex';
}

function closeChatPanel() {
    document.querySelector('.messages-wrapper').classList.remove('chat-active');

    if (MessagingApp.activeConversation && MessagingApp.socket) {
        MessagingApp.socket.emit('leave_conversation', MessagingApp.activeConversation._id);
    }

    MessagingApp.activeConversation = null;
    updateActiveConversationUI();
}

function updateActiveConversationUI() {
    document.querySelectorAll('.conversation-card').forEach(card => {
        card.classList.remove('active');
        if (MessagingApp.activeConversation && card.dataset.id === MessagingApp.activeConversation._id) {
            card.classList.add('active');
        }
    });
}

// ============================================================================
// LOAD AND DISPLAY MESSAGES
// ============================================================================

async function loadMessages(conversationId) {
    try {
        showLoading('Loading messages...');

        const url = getApiUrl(API_CONFIG.ENDPOINTS.GET_MESSAGES, { conversationId });
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to load messages');
        }

        const data = await response.json();
        MessagingApp.messages = data.messages || [];

        console.log('[Messages] Loaded:', MessagingApp.messages.length);
        displayMessages(MessagingApp.messages);

    } catch (error) {
        console.error('[Messages] Error:', error);
        showError('messages-body', 'Failed to load messages');
    } finally {
        hideLoading();
    }
}

function displayMessages(messages) {
    const container = document.getElementById('messages-body');
    container.innerHTML = '';

    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lock"></i>
                <p>Messages are encrypted. Start the conversation!</p>
            </div>
        `;
        return;
    }

    // Group messages by date and sender
    const grouped = groupMessagesByDateAndSender(messages);

    grouped.forEach(group => {
        // Add date separator
        const dateSep = document.createElement('div');
        dateSep.className = 'date-separator';
        dateSep.innerHTML = `<span>${formatDateLabel(group.date)}</span>`;
        container.appendChild(dateSep);

        // Add message groups
        group.messageGroups.forEach(msgGroup => {
            const groupElement = createMessageGroup(msgGroup);
            container.appendChild(groupElement);
        });
    });

    scrollToBottom();
}

function groupMessagesByDateAndSender(messages) {
    const groups = [];
    let currentDate = null;
    let currentSender = null;
    let currentGroup = [];

    messages.forEach((msg, index) => {
        const msgDate = new Date(msg.createdAt).toDateString();
        const senderId = msg.senderId?._id || msg.senderId;

        // New date
        if (msgDate !== currentDate) {
            if (currentGroup.length > 0) {
                addToGroups(groups, currentDate, currentGroup);
            }
            currentDate = msgDate;
            currentGroup = [];
            currentSender = null;
        }

        // New sender or time gap > 5 minutes
        const shouldStartNew =
            senderId !== currentSender ||
            (index > 0 && isLargeTimeGap(messages[index - 1].createdAt, msg.createdAt));

        if (shouldStartNew && currentGroup.length > 0) {
            addToGroups(groups, currentDate, currentGroup);
            currentGroup = [];
        }

        currentSender = senderId;
        currentGroup.push(msg);
    });

    // Add final group
    if (currentGroup.length > 0) {
        addToGroups(groups, currentDate, currentGroup);
    }

    return groups;
}

function addToGroups(groups, date, messageGroup) {
    let dateGroup = groups.find(g => g.date === date);
    if (!dateGroup) {
        dateGroup = { date, messageGroups: [] };
        groups.push(dateGroup);
    }
    dateGroup.messageGroups.push(messageGroup);
}

function isLargeTimeGap(time1, time2) {
    const diff = Math.abs(new Date(time2) - new Date(time1));
    return diff > 5 * 60 * 1000; // 5 minutes
}

function createMessageGroup(messages) {
    const group = document.createElement('div');
    const firstMsg = messages[0];
    const senderId = firstMsg.senderId?._id || firstMsg.senderId;
    const isSent = String(senderId) === String(MessagingApp.currentUser.id);

    group.className = `message-group ${isSent ? 'sent' : 'received'}`;

    // Add avatar for received messages
    if (!isSent) {
        const otherUser = getOtherParticipant(MessagingApp.activeConversation);
        const avatarColor = getAvatarColor(otherUser.name);
        const initials = getInitials(otherUser.name);
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.style.background = avatarColor;
        avatarDiv.textContent = initials;
        group.appendChild(avatarDiv);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'messages-wrapper-group';

    messages.forEach(msg => {
        const bubble = createMessageBubble(msg, isSent);
        wrapper.appendChild(bubble);
    });

    group.appendChild(wrapper);

    return group;
}

function createMessageBubble(message, isSent) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.dataset.id = message._id;

    const time = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    let status = '';
    if (isSent) {
        const color = message.isRead ? '#10b981' : 'rgba(255,255,255,0.5)';
        status = `<i class="fas fa-check-double" style="color: ${color}"></i>`;
    }

    bubble.innerHTML = `
        <div class="message-text">${escapeHtml(message.content)}</div>
        <div class="message-meta">
            <span class="message-time">${time}</span>
            ${status}
        </div>
    `;

    return bubble;
}

// ============================================================================
// SEND MESSAGE
// ============================================================================

async function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();

    if (!content || !MessagingApp.activeConversation) {
        return;
    }

    // Clear input
    input.value = '';

    try {
        const url = getApiUrl(API_CONFIG.ENDPOINTS.SEND_MESSAGE);
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                conversationId: MessagingApp.activeConversation._id,
                content: content
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const message = await response.json();
        console.log('[Message] Sent:', message._id);

        // Add to messages and re-render
        MessagingApp.messages.push(message);
        displayMessages(MessagingApp.messages);

        // Update conversation list
        updateConversationPreview(MessagingApp.activeConversation._id, content);

    } catch (error) {
        console.error('[Message] Send error:', error);
        showNotification('Failed to send message', false);
        input.value = content; // Restore
    }
}

// ============================================================================
// REAL-TIME MESSAGE HANDLING
// ============================================================================

function handleIncomingMessage(message) {
    console.log('[Message] Incoming:', message._id);

    // If message is for active conversation, add it
    if (MessagingApp.activeConversation &&
        message.conversationId === MessagingApp.activeConversation._id) {

        MessagingApp.messages.push(message);
        displayMessages(MessagingApp.messages);

        // Mark as read
        markAsRead(MessagingApp.activeConversation._id);
    }

    // Reload conversation list
    loadConversations();
}

function handleMessagesRead(conversationId) {
    if (MessagingApp.activeConversation && MessagingApp.activeConversation._id === conversationId) {
        // Update all check marks to green
        document.querySelectorAll('.message-bubble .fa-check-double').forEach(icon => {
            icon.style.color = '#10b981';
        });
    }
}

async function markAsRead(conversationId) {
    try {
        const url = getApiUrl(API_CONFIG.ENDPOINTS.MARK_READ, { conversationId });
        await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        console.log('[Messages] Marked as read:', conversationId);
    } catch (error) {
        console.error('[Messages] Mark read error:', error);
    }
}

function updateConversationPreview(conversationId, lastMessage) {
    const conv = MessagingApp.conversations.find(c => c._id === conversationId);
    if (conv) {
        conv.lastMessage = lastMessage;
        conv.lastSenderId = MessagingApp.currentUser.id;
        conv.updatedAt = new Date().toISOString();

        // Re-sort and display
        MessagingApp.conversations.sort((a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        displayConversations(MessagingApp.conversations);
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    // Send message on Enter
    const input = document.getElementById('message-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Send button
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    // Mobile menu
    const menuBtn = document.querySelector('.mobile-menu-button');
    const nav = document.querySelector('.navbar-nav');
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => nav.classList.toggle('show'));
    }
}

// ============================================================================
// URL PARAMETERS (DEEP LINKING)
// ============================================================================

function handleURLParameters() {
    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get('conversationId');
    const propertyId = params.get('propertyId');

    if (conversationId) {
        setTimeout(() => {
            const conv = MessagingApp.conversations.find(c => c._id === conversationId);
            if (conv) {
                openConversation(conv);
            }
        }, 500);
    } else if (propertyId) {
        startNewConversation(propertyId);
    }
}

async function startNewConversation(propertyId) {
    try {
        showLoading('Starting conversation...');

        const url = getApiUrl(API_CONFIG.ENDPOINTS.START_CONVERSATION);
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                propertyId: propertyId,
                initialMessage: 'Hi, I am interested in this property.'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to start conversation');
        }

        const conversation = await response.json();

        await loadConversations();
        openConversation(conversation);

    } catch (error) {
        console.error('[Conversation] Start error:', error);
        showNotification('Failed to start conversation', false);
    } finally {
        hideLoading();
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getOtherParticipant(conversation) {
    const buyer = conversation.buyerId || {};
    const seller = conversation.sellerId || {};
    const isBuyer = String(buyer._id || buyer) === String(MessagingApp.currentUser.id);
    return isBuyer ? seller : buyer;
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function getAvatarColor(name) {
    const colors = [
        '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
        '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDateLabel(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'TODAY';
    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';

    return date.toLocaleDateString([], {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }).toUpperCase();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    const container = document.getElementById('messages-body');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

function showLoading(message = 'Loading...') {
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        loader.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
        loader.style.display = 'flex';
    }
}

function hideLoading() {
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        loader.style.display = 'none';
    }
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${escapeHtml(message)}</p>
                <button onclick="location.reload()" style="margin-top: 16px; padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>
            </div>
        `;
    }
}
