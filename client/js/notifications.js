// Notifications functionality

// Utility function to get authorization headers
function getAuthHeaders() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const headers = {
        'Content-Type': 'application/json'
    };

    if (currentUser && currentUser.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
    }

    if (currentUser && currentUser.id) {
        headers['user-id'] = currentUser.id;
    }

    return headers;
}

// Show notification message (Toast)
function showNotification(message, isSuccess = true) {
    // Check if toast container exists
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '10000';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
    notification.textContent = message;

    notification.style.marginBottom = '10px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.fontWeight = 'bold';
    notification.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
    notification.style.animation = 'slideIn 0.3s ease-out';

    if (isSuccess) {
        notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    }

    container.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 3000);
    }, 3000);
}

// Load real notifications (Messages + Property Updates)
async function loadNotifications(filter = 'all') {
    const container = document.getElementById('notifications-container');
    // If we're on a page with a bell icon but no container, we still want to fetch counts
    // but skip rendering the list
    const hasContainer = !!container;

    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        if (hasContainer) {
            container.innerHTML = '<div class="text-center p-5"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">Loading notifications...</p></div>';
        }

        // 1. Fetch unread messages
        const messagesUrl = `${API_CONFIG.BASE_URL}/api/messages/conversations`;
        const messagesResponse = await fetch(messagesUrl, { headers: getAuthHeaders() });
        let messages = [];
        if (messagesResponse.ok) {
            messages = await messagesResponse.json();
        }

        // 2. Fetch my properties for status updates
        const propertiesUrl = `${API_CONFIG.BASE_URL}/api/properties/user/${currentUser.id}`;
        const propertiesResponse = await fetch(propertiesUrl, { headers: getAuthHeaders() });
        let properties = [];
        if (propertiesResponse.ok) {
            properties = await propertiesResponse.json();
        }

        // Convert conversations with unread messages to notification objects
        let notifications = messages
            .filter(conv => conv.unreadCount > 0)
            .map(conv => {
                const isBuyer = currentUser.id === conv.buyerId._id;
                const sender = isBuyer ? conv.sellerId : conv.buyerId;
                return {
                    id: conv._id,
                    type: 'message',
                    title: `New message from ${sender.name}`,
                    content: conv.lastMessage || 'Sent you a message',
                    timestamp: new Date(conv.updatedAt),
                    isRead: false,
                    icon: '💬',
                    link: `messages.html?conversationId=${conv._id}`
                };
            });

        // Convert property statuses to notification objects
        properties.forEach(p => {
            if (p.status === 'pending_approval') {
                notifications.push({
                    id: `prop-${p._id}`,
                    type: 'property',
                    title: `Property Pending Approval`,
                    content: `Your property "${p.title}" is currently under review.`,
                    timestamp: new Date(p.updatedAt || p.createdAt),
                    isRead: false,
                    icon: '🏠',
                    link: `property-detail.html?id=${p._id}`
                });
            } else if (p.status === 'published') {
                notifications.push({
                    id: `prop-${p._id}-pub`,
                    type: 'property',
                    title: `Property Approved`,
                    content: `Great news! "${p.title}" has been approved and is now live.`,
                    timestamp: new Date(p.updatedAt || p.createdAt),
                    isRead: true, // Assuming published properties are "read" notifications for now
                    icon: '✅',
                    link: `property-detail.html?id=${p._id}`
                });
            }
        });

        // Add some simulated ones if empty just for flair (optional, but requested "premium" look)
        if (notifications.length === 0) {
            notifications = [
                {
                    id: 'welcome',
                    type: 'system',
                    title: 'Welcome to Land Mart!',
                    content: 'Start exploring premium land properties or list your own today.',
                    timestamp: new Date(),
                    isRead: true,
                    icon: '🌟'
                }
            ];
        }

        // Sort by timestamp
        notifications.sort((a, b) => b.timestamp - a.timestamp);

        // Filter
        let filtered = notifications;
        if (filter === 'unread') filtered = notifications.filter(n => !n.isRead);
        else if (filter === 'property') filtered = notifications.filter(n => n.type === 'property');
        else if (filter === 'message') filtered = notifications.filter(n => n.type === 'message');

        // Update Sidebar and Header Badges
        const unreadCount = notifications.filter(n => !n.isRead).length;

        ['header-notification-badge', 'sidebar-notification-badge'].forEach(id => {
            const badge = document.getElementById(id);
            if (badge) {
                badge.textContent = unreadCount;
                badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
            }
        });

        if (hasContainer) {
            displayNotifications(filtered);
        }

    } catch (error) {
        console.error('Error loading notifications:', error);
        if (hasContainer) {
            container.innerHTML = '<p class="text-center text-danger">Failed to load notifications.</p>';
        }
    }
}

function displayNotifications(notifications) {
    const container = document.getElementById('notifications-container');
    container.innerHTML = '';

    if (notifications.length === 0) {
        container.innerHTML = '<div class="text-center p-5 text-muted"><i class="far fa-bell-slash fa-3x mb-3"></i><p>No notifications match your filter.</p></div>';
        return;
    }

    notifications.forEach(n => {
        const item = document.createElement('div');
        item.className = `notification-item ${!n.isRead ? 'unread' : ''}`;

        item.innerHTML = `
            <div class="notification-icon-wrapper">${n.icon}</div>
            <div class="notification-info">
                <div class="notification-meta">
                    <span class="notification-type">${n.type.toUpperCase()}</span>
                    <span class="notification-time">${formatTimeAgo(n.timestamp)}</span>
                </div>
                <h4 class="notification-title">${n.title}</h4>
                <p class="notification-text">${n.content}</p>
                ${n.link ? `<a href="${n.link}" class="notification-link">View Details <i class="fas fa-chevron-right"></i></a>` : ''}
            </div>
            <div class="notification-actions">
                ${!n.isRead && n.type === 'message' ? `<button class="btn-mark-read" title="Mark as Read" onclick="markMessageAsRead('${n.id}')"><i class="fas fa-check"></i></button>` : ''}
            </div>
        `;
        container.appendChild(item);
    });
}

async function markMessageAsRead(messageId) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/messages/${messageId}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (response.ok) {
            showNotification('Notification cleared');
            loadNotifications(getCurrentFilter());
            // Global badge update
            if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
        }
    } catch (error) {
        console.error(error);
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function getCurrentFilter() {
    const active = document.querySelector('.notification-filters .btn.filter-active');
    return active ? active.getAttribute('data-filter') : 'all';
}

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    loadNotifications();

    document.querySelectorAll('.notification-filters .btn').forEach(btn => {
        btn.onclick = function () {
            document.querySelectorAll('.notification-filters .btn').forEach(b => b.classList.remove('filter-active', 'btn-primary'));
            document.querySelectorAll('.notification-filters .btn').forEach(b => b.classList.add('btn-outline'));
            this.classList.add('filter-active', 'btn-primary');
            this.classList.remove('btn-outline');
            loadNotifications(this.getAttribute('data-filter'));
        };
    });

    const markAllBtn = document.getElementById('mark-all-read');
    if (markAllBtn) {
        markAllBtn.onclick = async () => {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}/api/messages/read-all`, {
                    method: 'PUT',
                    headers: getAuthHeaders()
                });
                if (response.ok) {
                    showNotification('All notifications cleared', true);
                    loadNotifications(getCurrentFilter());
                    if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
                } else {
                    showNotification('Failed to clear notifications', false);
                }
            } catch (error) {
                console.error('Bulk read error:', error);
                showNotification('Connection error', false);
            }
        };
    }

    const clearAllBtn = document.getElementById('clear-notifications');
    if (clearAllBtn) {
        clearAllBtn.onclick = () => {
            showNotification('Notification history cleared (locally)', true);
            const container = document.getElementById('notifications-container');
            if (container) container.innerHTML = '<div class="text-center p-5 text-muted"><p>No notifications.</p></div>';
        };
    }
});