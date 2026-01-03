// Messages functionality - Updated for Conversation-based messaging

// Utility function to get authorization headers
function getAuthHeaders() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const headers = {
        'Content-Type': 'application/json'
    };

    if (currentUser && currentUser.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
    }

    return headers;
}

// Global state
let currentConversationId = null;
let allConversations = [];

// Initialize messages page
document.addEventListener('DOMContentLoaded', async function () {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Load all conversations first
    await loadConversations();

    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const conversationIdParam = urlParams.get('conversationId');
    const userIdParam = urlParams.get('userId');
    const propertyIdParam = urlParams.get('propertyId');
    const startParam = urlParams.get('start');

    if (conversationIdParam) {
        await loadConversation(conversationIdParam);
    } else if (userIdParam && propertyIdParam && startParam === 'true') {
        // Start a new conversation
        await startNewConversation(userIdParam, propertyIdParam);
    } else if (userIdParam && propertyIdParam) {
        // Try to find existing conversation or show start prompt
        const existing = allConversations.find(c =>
            c.propertyId._id === propertyIdParam &&
            (c.buyerId._id === currentUser.id || c.sellerId._id === currentUser.id)
        );
        if (existing) {
            await loadConversation(existing._id);
        } else {
            // Show start chat UI? Or just start it
            await startNewConversation(userIdParam, propertyIdParam);
        }
    } else if (allConversations.length > 0) {
        // Load the first interaction by default if no params
        await loadConversation(allConversations[0]._id);
    }

    // Add event listener for send button
    const sendButton = document.getElementById('send-message-btn');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // Add event listener for Enter key in textarea
    const messageTextarea = document.getElementById('message-textarea');
    if (messageTextarea) {
        messageTextarea.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Search functionality
    const searchInput = document.getElementById('conversation-search');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = allConversations.filter(conv =>
                conv.propertyId.title.toLowerCase().includes(searchTerm) ||
                (conv.buyerId.name.toLowerCase().includes(searchTerm) || conv.sellerId.name.toLowerCase().includes(searchTerm)) ||
                conv.lastMessage.toLowerCase().includes(searchTerm)
            );
            displayConversations(filtered);
        });
    }
});

// Load conversations for the current user
async function loadConversations() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/messages/conversations`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allConversations = await response.json();
        displayConversations(allConversations);
        return allConversations;

    } catch (error) {
        console.error('Error loading conversations:', error);
        return [];
    }
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

// Display conversations in the sidebar
function displayConversations(conversations) {
    const container = document.getElementById('conversations-container');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (conversations.length === 0) {
        container.innerHTML = '<div class="text-center py-5"><p class="text-muted">No conversations found.</p></div>';
        return;
    }

    container.innerHTML = '';

    conversations.forEach(conversation => {
        const conversationElement = document.createElement('div');
        conversationElement.className = 'conversation-item';
        if (currentConversationId === conversation._id) {
            conversationElement.classList.add('active');
        }

        // Determine who the "other" person is
        const isBuyer = currentUser.id === conversation.buyerId._id;
        const otherUser = isBuyer ? conversation.sellerId : conversation.buyerId;
        const property = conversation.propertyId;

        const initials = getInitials(otherUser.name);
        const timeStr = formatTimeAgo(new Date(conversation.updatedAt));

        conversationElement.innerHTML = `
            <div class="user-avatar">${initials}</div>
            <div class="conversation-info">
                <div class="conversation-top">
                    <h3>${property.title}</h3>
                    <span class="conversation-time">${timeStr}</span>
                </div>
                <div class="conversation-preview">
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <p class="other-user-name">${otherUser.name} (${otherUser.role})</p>
                        <p class="last-msg-text">${conversation.lastMessage || 'No messages yet'}</p>
                    </div>
                </div>
            </div>
        `;

        conversationElement.addEventListener('click', () => {
            document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
            conversationElement.classList.add('active');
            loadConversation(conversation._id);
        });

        container.appendChild(conversationElement);
    });
}

// Start a new conversation
async function startNewConversation(userId, propertyId) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/messages/start`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                propertyId,
                initialMessage: "Hi, I am interested in this property."
            })
        });

        if (response.ok) {
            const conversation = await response.json();
            currentConversationId = conversation._id;
            await loadConversations();
            await loadConversation(conversation._id);
        } else {
            const error = await response.json();
            alert(error.message);
        }
    } catch (error) {
        console.error('Error starting conversation:', error);
    }
}

// Load and display a specific conversation
async function loadConversation(conversationId) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        currentConversationId = conversationId;

        // Update UI structure
        document.getElementById('chat-header').style.display = 'flex';
        document.getElementById('message-input-container').style.display = 'block';

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/messages/conversation/${conversationId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const { conversation, messages } = await response.json();

        // UI Header updates
        const isBuyer = currentUser.id === conversation.buyerId._id;
        const otherUser = isBuyer ? conversation.sellerId : conversation.buyerId;
        const property = conversation.propertyId;

        const titleElement = document.getElementById('conversation-title');
        titleElement.innerHTML = `${property.title} <span class="property-tag" style="font-size: 0.7em; background: #eee; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">${property.location}</span>`;

        const avatarText = document.getElementById('active-user-avatar');
        avatarText.textContent = getInitials(otherUser.name);

        // Context info
        const propertyContext = document.getElementById('chat-property-context');
        const propertyBadge = document.getElementById('property-name-badge');
        propertyContext.style.display = 'flex';
        propertyBadge.textContent = `${otherUser.name} (${otherUser.role})`;

        displayMessages(messages);

        // Mark as read
        await markConversationAsRead(conversationId);

        // Update the list to show no unread
        // (This would be better with real unread counts in the list)

    } catch (error) {
        console.error('Error loading conversation:', error);
    }
}

// Display messages with date separation
function displayMessages(messages) {
    const container = document.getElementById('messages-container');
    container.innerHTML = '';

    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-chat"><i class="fas fa-comment-dots"></i><p>No messages yet. Say hello!</p></div>';
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let lastDate = null;

    messages.forEach(message => {
        const date = new Date(message.createdAt);
        const dateLabel = date.toLocaleDateString();

        if (dateLabel !== lastDate) {
            const divider = document.createElement('div');
            divider.className = 'date-divider';
            divider.innerHTML = `<span>${getFriendlyDate(date)}</span>`;
            container.appendChild(divider);
            lastDate = dateLabel;
        }

        const isSent = (message.senderId._id || message.senderId) === currentUser.id;
        addMessageElement(message, isSent);
    });

    container.scrollTop = container.scrollHeight;
}

function getFriendlyDate(date) {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function addMessageElement(message, isSent) {
    const container = document.getElementById('messages-container');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;

    const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageElement.innerHTML = `
        <div class="message-bubble">
            <div class="message-text">${message.content}</div>
        </div>
        <div class="message-meta">
            <span>${time}</span>
            ${isSent ? `<i class="fas ${message.isRead ? 'fa-check-double text-primary' : 'fa-check'}"></i>` : ''}
        </div>
    `;

    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
}

async function markConversationAsRead(conversationId) {
    try {
        await fetch(`${API_CONFIG.BASE_URL}/api/messages/read/${conversationId}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
    } catch (e) {
        console.error('Error marking as read:', e);
    }
}

async function sendMessage() {
    try {
        const textarea = document.getElementById('message-textarea');
        const content = textarea.value.trim();

        if (!content || !currentConversationId) return;

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/messages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                conversationId: currentConversationId,
                content: content
            })
        });

        if (response.ok) {
            const newMessage = await response.json();
            // Remove empty state if it's the first message
            if (document.querySelector('.empty-chat')) {
                document.getElementById('messages-container').innerHTML = '';
            }
            addMessageElement(newMessage, true);
            textarea.value = '';
            textarea.style.height = 'auto';

            // Refresh conversation list to show latest message
            loadConversations();
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 60000) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}