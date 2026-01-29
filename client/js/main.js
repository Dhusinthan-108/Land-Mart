

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

function isAuthenticated() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return !!currentUser;
}

function handleApiError(error, operation) {
    console.error(`${operation} error:`, error);
    if (error && error.status === 401) {
        localStorage.removeItem('currentUser');
        if (typeof showNotification === 'function') {
            showNotification('Your session has expired. Please log in again.', false);
        }
        return true;
    }
    return false;
}

function isValidUserId(userId) {
    return userId && typeof userId === 'string' && userId.length > 0;
}

function isPropertyOwner(propertyOwnerId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser && propertyOwnerId && currentUser.id === propertyOwnerId;
}

// Utility function to check if current user is a seller
// In the new system, all users can act as both buyers and sellers
function isSeller() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser !== null; // All users can sell properties
}

// Utility function to check if current user is a land seller
function isLandSeller() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return false;
    const role = (currentUser.role || '').toString().toLowerCase();
    return role === 'land_seller' || role === 'landseller' || role === 'seller';
}

// Main JavaScript file for Land Mart

// Check if user is admin
function isAdmin() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser && currentUser.role === 'admin';
}

// Update saved properties count in dashboard
async function updateSavedPropertiesCount() {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            return;
        }

        // Validate user ID
        if (!isValidUserId(currentUser.id)) {
            console.error('Invalid user ID for saved properties count:', currentUser.id);
            return;
        }

        // Determine the correct API base URL
        const url = getApiUrl(API_CONFIG.ENDPOINTS.SAVED_PROPERTIES, { userId: currentUser.id });

        console.log('Fetching saved properties count from:', url);

        // Fetch saved properties count from backend
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        console.log('Saved properties count response status:', response.status);

        if (response.ok) {
            const savedProperties = await response.json();
            console.log('Saved properties count:', savedProperties.length);
            // Update the saved properties count in dashboard
            const savedCountElement = document.getElementById('saved-properties-count');
            if (savedCountElement) {
                savedCountElement.textContent = savedProperties.length;
            }
        } else {
            // Fallback to localStorage if backend fetch fails
            console.warn('Failed to fetch saved properties count from backend, falling back to localStorage');
            const savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
            const savedCountElement = document.getElementById('saved-properties-count');
            if (savedCountElement) {
                savedCountElement.textContent = savedProperties.length;
            }
        }
    } catch (error) {
        console.error('Error updating saved properties count:', error);
        // Fallback to localStorage if there's an error
        const savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
        const savedCountElement = document.getElementById('saved-properties-count');
        if (savedCountElement) {
            savedCountElement.textContent = savedProperties.length;
        }
    }
}

// Update notification badge count
async function updateNotificationBadge() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        // Use the correct endpoint for conversations
        // Note: The backend currently doesn't support an efficient unread count, 
        // using the conversations endpoint to at least verify connectivity without 404s.
        const url = getApiUrl(API_CONFIG.ENDPOINTS.CONVERSATIONS);
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const conversations = await response.json();
            // We cannot filtering unread messages from conversation objects easily.
            // So we will just silence the error and maybe show total conversations if we wanted.
            // For now, removing badge logic to prevent misleading info.

            /* 
            const unreadCount = messages.filter(m => !m.isRead && m.receiverId._id === currentUser.id).length;

            // Find or create badge in navbar
            const notificationsLink = document.querySelector('a[href="notifications.html"]');
            if (notificationsLink) {
                let badge = notificationsLink.querySelector('.badge');
                if (unreadCount > 0) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'badge';
                        badge.style.backgroundColor = 'var(--danger)';
                        badge.style.color = 'white';
                        badge.style.borderRadius = '50%';
                        badge.style.padding = '2px 6px';
                        badge.style.fontSize = '10px';
                        badge.style.marginLeft = '5px';
                        badge.style.verticalAlign = 'middle';
                        notificationsLink.appendChild(badge);
                    }
                    badge.textContent = unreadCount;
                } else if (badge) {
                    badge.remove();
                }
            }
            */
        }
    } catch (error) {
        console.error('Error updating notification badge:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('Land Mart loaded successfully!');

    // Update navigation based on user authentication status
    updateNavigation();

    // Mobile menu toggle - only initialize if elements exist
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navbarNav = document.querySelector('.navbar-nav');

    if (mobileMenuButton && navbarNav) {
        mobileMenuButton.addEventListener('click', function () {
            navbarNav.classList.toggle('show');
        });
    } else {
        // This is normal for pages with different navigation structures
        console.debug('Mobile menu elements not found - using alternative navigation');
    }

    // Update notification badge
    updateNotificationBadge();
    // Poll for new notifications every 60 seconds
    setInterval(updateNotificationBadge, 60000);

    // Handle registration form submission
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleRegistration();
        });
    }

    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleLogin();
        });
    }

    // Handle property form submission
    // Handle property form submission & initialization
    const propertyForm = document.getElementById('property-form');
    if (propertyForm) {
        // Initialize image upload if we are on a page with it
        initImageUpload();

        // Check if we are on edit page
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('id');

        // If edit page (and not add page), load data
        if (window.location.pathname.includes('edit-property.html') && editId) {
            loadPropertyForEdit(editId);

            propertyForm.addEventListener('submit', function (e) {
                e.preventDefault();
                handlePropertyUpdate(editId);
            });
        } else {
            // Add property page
            propertyForm.addEventListener('submit', function (e) {
                e.preventDefault();
                handlePropertySubmission();
            });
        }
    }

    // Handle profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            handleProfileUpdate(e);
        });
    }

    // Handle app settings form submission
    const appSettingsForm = document.getElementById('app-settings-form');
    if (appSettingsForm) {
        appSettingsForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleAppSettingsUpdate(e);
        });
    }

    // Handle notifications form submission
    const notificationsForm = document.getElementById('notifications-form');
    if (notificationsForm) {
        notificationsForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleNotificationsUpdate(e);
        });
    }

    // Handle privacy form submission
    const privacyForm = document.getElementById('privacy-form');
    if (privacyForm) {
        privacyForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handlePrivacyUpdate(e);
        });
    }

    // Handle security form submission
    const securityForm = document.getElementById('security-form');
    if (securityForm) {
        securityForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleSecurityUpdate(e);
        });
    }

    // Load all properties on properties page
    const propertiesListSection = document.querySelector('.properties-list');
    if (propertiesListSection) {
        loadAllProperties();
    }

    // Load user properties on dashboard
    const dashboardSection = document.querySelector('.dashboard');
    if (dashboardSection) {
        loadUserProperties();
    }

    // Load unified dashboard
    const unifiedDashboardSection = document.querySelector('.unified-dashboard');
    if (unifiedDashboardSection) {
        loadUnifiedDashboard();
    }

    // Form validation example for other forms
    const otherForms = document.querySelectorAll('form:not(#register-form):not(#login-form):not(#property-form):not(#profile-form):not(#app-settings-form):not(#notifications-form):not(#privacy-form):not(#security-form)');
    otherForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            validateForm(form);
        });
    });

    // Initialize settings navigation if on settings page
    initializeSettingsNavigation();

    // Show admin link if user is admin
    if (isAdmin()) {
        showAdminLink();
    }
});

// Show admin link in navigation
function showAdminLink() {
    const navUl = document.querySelector('nav ul');
    if (navUl) {
        const adminLi = document.createElement('li');
        adminLi.innerHTML = '<a href="admin.html">Admin</a>';
        navUl.appendChild(adminLi);
    }
}

// Switch between dashboard tabs with smooth transitions
function switchTab(tabName) {
    // Hide all tab contents with fade out effect
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        if (content.classList.contains('active')) {
            content.style.opacity = '0';
            setTimeout(() => {
                content.classList.remove('active');
                content.style.opacity = '1';
            }, 150);
        }
    });

    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.dashboard-tabs button');
    tabs.forEach(tab => {
        tab.classList.remove('tab-active');
    });

    // Add active class to clicked tab after a small delay
    setTimeout(() => {
        // Find the button that was clicked by tab name
        const clickedButton = Array.from(tabs).find(button =>
            button.textContent.toLowerCase().includes(tabName.replace('-', ' '))
        ) || tabs[0]; // fallback to first tab if not found

        clickedButton.classList.add('tab-active');

        // Show selected tab content with fade in effect
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
            selectedTab.style.opacity = '0';
            setTimeout(() => {
                selectedTab.style.opacity = '1';
            }, 10);
        }
    }, 150);

    // Load content for the selected tab if needed
    if (tabName === 'my-properties') {
        loadMyProperties();
    } else if (tabName === 'saved-properties') {
        loadSavedProperties();
    } else if (tabName === 'messages') {
        loadMessages();
    } else if (tabName === 'settings') {
        loadUserSettings();
    }
}

// Initialize settings navigation functionality
function initializeSettingsNavigation() {
    const navLinks = document.querySelectorAll('.settings-nav a');
    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();

                // Remove active class from all links and sections
                navLinks.forEach(l => l.parentElement.classList.remove('active'));
                document.querySelectorAll('.settings-section').forEach(section => {
                    section.style.display = 'none';
                });

                // Add active class to clicked link
                this.parentElement.classList.add('active');

                // Show corresponding section
                const targetId = this.getAttribute('href').substring(1);
                document.getElementById(targetId).style.display = 'block';
            });
        });
    }
}

// Load unified dashboard
async function loadUnifiedDashboard() {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            console.log('No user logged in');
            return;
        }

        console.log('Loading dashboard for user:', currentUser);

        // Update user info immediately
        const userNameElement = document.getElementById('user-name') || document.querySelector('.welcome-title');
        const userRoleElement = document.getElementById('user-role');

        if (userNameElement) {
            if (userNameElement.tagName === 'H1') {
                userNameElement.textContent = `Welcome back, ${currentUser.name}! 👋`;
            } else {
                userNameElement.textContent = currentUser.name;
            }
        }

        if (userRoleElement) {
            const roleDisplay = currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'User';
            userRoleElement.textContent = roleDisplay;
        }

        // Validate user ID
        if (!isValidUserId(currentUser.id)) {
            console.error('Invalid user ID for dashboard:', currentUser.id);
            return;
        }

        // 1. Load User's Properties
        const propertiesUrl = getApiUrl(API_CONFIG.ENDPOINTS.GET_USER_PROPERTIES, { userId: currentUser.id });
        const propertiesResponse = await fetch(propertiesUrl, {
            headers: getAuthHeaders()
        });

        if (propertiesResponse.ok) {
            const properties = await propertiesResponse.json();

            // Update Listed Properties Stat
            const totalPropertiesElement = document.getElementById('total-properties');
            if (totalPropertiesElement) {
                totalPropertiesElement.textContent = properties.length;
            }

            // Calculate Total Value
            const totalValue = properties.reduce((sum, prop) => sum + (parseFloat(prop.price) || 0), 0);
            const totalValueElement = document.getElementById('total-value');
            if (totalValueElement) {
                // Format nicely e.g. ₹5L or full number
                if (totalValue >= 100000) {
                    totalValueElement.textContent = `₹${(totalValue / 100000).toFixed(1)}L`;
                } else {
                    totalValueElement.textContent = `₹${totalValue.toLocaleString('en-IN')}`;
                }
            }
        }

        // 2. Load Message Count (Using conversations endpoint)
        const messagesUrl = getApiUrl(API_CONFIG.ENDPOINTS.CONVERSATIONS);
        const messagesResponse = await fetch(messagesUrl, {
            headers: getAuthHeaders()
        });

        if (messagesResponse.ok) {
            const conversations = await messagesResponse.json();
            const totalMessagesElement = document.getElementById('total-messages');
            if (totalMessagesElement) {
                totalMessagesElement.textContent = conversations.length;
            }
        }

        // 3. Update Saved Properties Count
        updateSavedPropertiesCount();

        console.log(`Loaded dashboard for user ${currentUser.name}`);
    } catch (error) {
        console.error('Error loading unified dashboard:', error);
        showNotification('Error loading dashboard: ' + error.message, false);
    }
}

// Load user's properties for the "My Properties" tab
async function loadMyProperties() {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            console.log('No user logged in');
            document.getElementById('my-properties-container').innerHTML = '<p>You must be logged in to view your properties. <a href="login.html">Log in</a></p>';
            return;
        }

        console.log('Loading properties for user:', currentUser);

        // Validate user ID
        if (!isValidUserId(currentUser.id)) {
            console.error('Invalid user ID for properties:', currentUser.id);
            document.getElementById('my-properties-container').innerHTML = '<p>Error loading properties: Invalid user ID.</p>';
            return;
        }

        // Determine the correct API base URL
        const url = `${API_CONFIG.BASE_URL}/api/properties/user/${currentUser.id}`;

        console.log('Fetching user properties from:', url);

        // Fetch user's properties with authentication headers
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        console.log('User properties response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const properties = await response.json();
        console.log('Received properties:', properties);

        // Get the properties container
        // Check for both old and new container IDs
        const container = document.getElementById('my-properties-container') ||
            document.querySelector('#listed-properties-section .properties-grid');
        if (!container) {
            console.error('Could not find my-properties-container or listed-properties-section .properties-grid element');
            return;
        }

        // Clear existing content but preserve the no-properties-message if it exists
        const noPropertiesMessage = container.querySelector('.no-properties-message');

        // Store the no-properties-message element if it exists
        const noPropsMsg = noPropertiesMessage ? noPropertiesMessage.cloneNode(true) : null;

        // Clear all children
        container.innerHTML = '';

        // Re-add the no-properties-message if it existed
        if (noPropsMsg) {
            container.appendChild(noPropsMsg);
        }

        // Add each property to the page
        if (properties.length > 0) {
            properties.forEach(property => {
                const propertyCard = createPropertyCard(property, true);
                container.appendChild(propertyCard);
            });

            // Hide the no-properties message if it exists
            if (noPropertiesMessage) {
                noPropertiesMessage.style.display = 'none';
            }
        } else {
            // Show the no-properties message if it exists, or add one if it doesn't
            if (noPropertiesMessage) {
                noPropertiesMessage.style.display = 'flex';
                noPropertiesMessage.innerHTML = `
                    <p>You haven't listed any properties yet.</p>
                    <a href="add-property.html" class="btn btn-primary">Add Your First Property</a>
                `;
            } else {
                container.innerHTML = '<p>You have not added any properties yet. <a href="add-property.html">Add your first property</a></p>';
            }
        }

        // Update the total properties count in dashboard
        const totalPropertiesElement = document.getElementById('total-properties');
        if (totalPropertiesElement) {
            totalPropertiesElement.textContent = properties.length;
        }

        console.log(`Loaded ${properties.length} properties for user ${currentUser.name}`);
    } catch (error) {
        console.error('Error loading user properties:', error);
        // Check for both old and new container IDs
        const container = document.getElementById('my-properties-container') ||
            document.querySelector('#listed-properties-section .properties-grid');
        if (container) {
            container.innerHTML = `<p>Error loading properties: ${error.message}. Please try again later.</p>`;
        }
    }
}

// Load saved properties for the "Saved Properties" tab
async function loadSavedProperties() {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            console.log('No user logged in');
            return;
        }

        // Validate user ID
        if (!isValidUserId(currentUser.id)) {
            console.error('Invalid user ID for saved properties:', currentUser.id);
            return;
        }

        // Get the saved properties container
        // Check for both old and new container IDs
        const container = document.getElementById('saved-properties-container') ||
            document.querySelector('#saved-properties-section .properties-grid');
        if (!container) {
            console.error('Could not find saved-properties-container or saved-properties-section .properties-grid element');
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Determine the correct API base URL
        const url = `${API_CONFIG.BASE_URL}/api/properties/saved/${currentUser.id}`;

        console.log('Fetching saved properties from:', url);

        // Fetch saved properties from backend with authentication headers
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        console.log('Saved properties response status:', response.status);

        if (!response.ok) {
            // Fallback to localStorage if backend fetch fails
            console.warn('Failed to fetch saved properties from backend, falling back to localStorage');
            const savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];

            if (savedProperties.length > 0) {
                // For each saved property ID, fetch the property details

                // Create an array of promises for fetching property details
                const propertyPromises = savedProperties.map(propertyId =>
                    fetch(`${API_CONFIG.BASE_URL}/api/properties/${propertyId}`, {
                        headers: getAuthHeaders()
                    }).then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to fetch property ${propertyId}`);
                        }
                        return response.json();
                    })
                );

                try {
                    // Wait for all property details to be fetched
                    const properties = await Promise.all(propertyPromises);

                    // Add each property to the page
                    properties.forEach(property => {
                        const propertyCard = createSavedPropertyCard(property);
                        container.appendChild(propertyCard);
                    });

                    console.log(`Loaded ${properties.length} saved properties for user from localStorage`);
                } catch (error) {
                    console.error('Error fetching saved property details:', error);
                    container.innerHTML = '<p>Error loading saved properties. Please try again later.</p>';
                }
            } else {
                container.innerHTML = '<p>You have not saved any properties yet. Browse properties and save your favorites!</p>';
            }

            // Update saved properties count
            updateSavedPropertiesCount();
            return;
        }

        // Get saved properties from backend response
        const properties = await response.json();
        console.log('Received saved properties:', properties);

        if (properties.length > 0) {
            // Add each property to the page
            properties.forEach(property => {
                const propertyCard = createSavedPropertyCard(property);
                container.appendChild(propertyCard);
            });

            console.log(`Loaded ${properties.length} saved properties for user from database`);
        } else {
            container.innerHTML = '<p>You have not saved any properties yet. Browse properties and save your favorites!</p>';
        }

        // Update saved properties count
        updateSavedPropertiesCount();

        console.log('Loaded saved properties');
    } catch (error) {
        console.error('Error loading saved properties:', error);
        // Check for both old and new container IDs
        const container = document.getElementById('saved-properties-container') ||
            document.querySelector('#saved-properties-section .properties-grid');
        if (container) {
            container.innerHTML = '<p>Error loading saved properties. Please try again later.</p>';
        }

        // Update saved properties count even if there's an error
        updateSavedPropertiesCount();
    }
}

// Load messages for the "Messages" tab
async function loadMessages() {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            console.log('No user logged in');
            return;
        }

        // Validate user ID
        if (!isValidUserId(currentUser.id)) {
            console.error('Invalid user ID for messages:', currentUser.id);
            return;
        }

        // Get the messages container
        const container = document.getElementById('messages-container');
        if (!container) return;

        // Determine the correct API base URL
        const url = getApiUrl(API_CONFIG.ENDPOINTS.CONVERSATIONS);

        console.log('Fetching messages from:', url);

        // Fetch messages for the current user with authentication headers
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        console.log('Messages response status:', response.status);

        if (!response.ok) {
            throw new Error(`Failed to load messages. Status: ${response.status}`);
        }

        const conversations = await response.json();
        console.log('Received conversations:', conversations);

        // Display conversations
        if (conversations.length === 0) {
            container.innerHTML = '<p>You have no messages yet. Contact other users to start a conversation.</p>';
        } else {
            let html = '<div class="conversations-list">';
            html += '<h3>Your Conversations</h3>';

            conversations.forEach(conversation => {
                // Determine the other user in the conversation
                const otherUserId = conversation.buyerId._id === currentUser.id ? conversation.sellerId._id : conversation.buyerId._id;
                const otherUserName = conversation.buyerId._id === currentUser.id ? conversation.sellerId.name : conversation.buyerId.name;
                const otherUserRole = conversation.buyerId._id === currentUser.id ? conversation.sellerId.role : conversation.buyerId.role; // Optional

                // Format last message time
                const lastMessageDate = new Date(conversation.updatedAt); // Use conversation updated time
                const now = new Date();
                const timeDiffMinutes = Math.floor((now - lastMessageDate) / (1000 * 60));
                const timeDiffHours = Math.floor(timeDiffMinutes / 60);
                const timeDiffDays = Math.floor(timeDiffHours / 24);

                let timeText;
                if (timeDiffMinutes < 1) {
                    timeText = 'Just now';
                } else if (timeDiffMinutes < 60) {
                    timeText = `${timeDiffMinutes} min ago`;
                } else if (timeDiffHours < 24) {
                    timeText = `${timeDiffHours} hr ago`;
                } else if (timeDiffDays < 7) {
                    timeText = `${timeDiffDays} day ago`;
                } else {
                    timeText = lastMessageDate.toLocaleDateString();
                }

                // Truncate last message
                const lastMsgContent = conversation.lastMessage || 'No messages yet';
                const truncatedMessage = lastMsgContent.length > 50 ?
                    lastMsgContent.substring(0, 50) + '...' :
                    lastMsgContent;

                html += `
                    <div class="conversation-item">
                        <div class="conversation-header">
                            <h4>${otherUserName}</h4>
                            <span class="time">${timeText}</span>
                        </div>
                        <p class="last-message">${truncatedMessage}</p>
                        ${conversation.propertyId ? `<p class="property-name">Regarding: ${conversation.propertyId.title}</p>` : ''}
                        <button class="btn-secondary" onclick="openConversation('${conversation._id}')">View Conversation</button>
                    </div>
                `;
            });

            html += '</div>';
            container.innerHTML = html;
        }

        console.log(`Loaded messages for user ${currentUser.name}`);
    } catch (error) {
        console.error('Error loading messages:', error);
        const container = document.getElementById('messages-container');
        if (container) {
            container.innerHTML = `<p>Error loading messages: ${error.message}. Please try again later.</p>`;
        }
    }
}

// Open a conversation with a specific user
function openConversation(userId, propertyId) {
    // Redirect to the messages page with the conversation parameters
    window.location.href = `messages.html?userId=${userId}&propertyId=${propertyId}`;
}

// Handle property submission
async function handlePropertySubmission() {
    try {
        // Get current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            showNotification('You must be logged in to add a property.', false);
            return;
        }

        // Get form values
        const title = document.getElementById('property-title').value;
        const description = document.getElementById('property-description').value;
        const price = parseFloat(document.getElementById('property-price').value);
        const size = parseFloat(document.getElementById('property-size').value);
        const location = document.getElementById('property-location').value;
        const terrain = document.getElementById('property-terrain').value;

        // Validation
        if (!title || !description || !price || !size || !location || !terrain) {
            showNotification('Please fill in all required fields.', false);
            return;
        }

        // Prepare data for API
        const propertyData = {
            title: title,
            description: description,
            price: price,
            size: size,
            location: location,
            terrain: terrain,
            ownerId: currentUser.id
        };

        // Determine the correct API base URL
        const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.CREATE_PROPERTY);

        // Add images if available
        if (typeof propertyImages !== 'undefined' && propertyImages.length > 0) {
            propertyData.images = propertyImages.map(img => img.dataUrl);
        }

        console.log('Submitting property to:', apiUrl);
        console.log('Property data:', propertyData);

        // Send property data to backend with authentication headers
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(propertyData)
        });

        console.log('Property submission response status:', response.status);

        let result;
        const contentType = response.headers.get('content-type');

        // Check if response has JSON content
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            // If not JSON, try to get text content
            const text = await response.text();
            result = { message: text || 'Property submission completed' };
        }

        if (response.ok) {
            showNotification('Property listed successfully!', true);
            // Reset form
            document.getElementById('property-form').reset();
            // Redirect to dashboard
            window.location.href = 'unified-dashboard.html';
        } else {
            if (response.status === 401) {
                showNotification('Your session has expired. Please log in again.', false);
                // Clear user data on authentication failure
                localStorage.removeItem('currentUser');
                // Optionally redirect to login page
                // window.location.href = 'login.html';
            } else {
                showNotification('Property submission failed: ' + (result.message || 'Unknown error'), false);
            }
        }
    } catch (error) {
        console.error('Property submission error:', error);
        showNotification('An error occurred during property submission. Please try again.', false);
    }
}

// Load all properties for the properties listing page
async function loadAllProperties() {
    try {
        // Determine the correct API base URL
        const url = `${API_CONFIG.BASE_URL}/api/properties`;

        console.log('Fetching all properties from:', url);

        // Fetch all properties
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        console.log('All properties response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const properties = await response.json();
        console.log('Received all properties:', properties);

        // Get the properties container
        const propertiesContainer = document.querySelector('.properties-list');
        if (!propertiesContainer) return;

        // Clear existing content
        propertiesContainer.innerHTML = '';

        // Add each property to the page
        if (properties.length > 0) {
            properties.forEach(property => {
                const propertyCard = createPropertyCard(property);
                propertiesContainer.appendChild(propertyCard);
            });
        } else {
            propertiesContainer.innerHTML = '<p>No properties available at the moment.</p>';
        }

        // Update results info if element exists
        const resultsInfo = document.querySelector('.results-info');
        if (resultsInfo) {
            resultsInfo.textContent = `${properties.length} properties available`;
        }

        console.log(`Loaded ${properties.length} properties`);
    } catch (error) {
        console.error('Error loading properties:', error);
        const propertiesContainer = document.querySelector('.properties-list');
        if (propertiesContainer) {
            propertiesContainer.innerHTML = '<p>Error loading properties. Please try again later.</p>';
        }
    }
}

// Create a property card element
function createPropertyCard(property, isMyPropertiesView = false) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.setAttribute('data-property-id', property._id);

    // Format price
    const formattedPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(property.price);

    // Format size
    const formattedSize = new Intl.NumberFormat('en-IN').format(property.size);

    // Build property actions based on ownership
    let propertyActions = '';
    const ownerId = property?.ownerId?._id || property?.ownerId;
    const isOwner = isPropertyOwner(ownerId);

    if (isMyPropertiesView && isOwner) {
        // For my properties view, show both edit and remove buttons
        propertyActions = `
            <button class="btn-secondary edit-btn" onclick="window.location.href='edit-property.html?id=${property._id}'">Edit Property</button>
            <button class="btn-danger remove-btn" onclick="removeProperty('${property._id}')">Remove Property</button>`;
    } else {
        propertyActions = `<button class="save-btn" data-property-id="${property._id}">Save Property</button>`;
        // Only show message button if logged in and not the owner
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && ownerId && ownerId !== currentUser.id) {
            propertyActions += `<button class="btn-outline message-btn" onclick="window.location.href='messages.html?userId=${ownerId}&propertyId=${property._id}'" style="margin-left: 10px; padding: 5px 10px; font-size: 0.9rem;"><i class="fas fa-envelope"></i> Message</button>`;
        }
    }

    card.innerHTML = `
        <div class="property-image">
            <img src="${property.images && property.images.length > 0 ? property.images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4='}" alt="${property.title}">
        </div>
        <div class="property-info">
            <h3>${property.title}</h3>
            <p class="location">${property.location}</p>
            <p class="price">${formattedPrice}</p>
            <div class="property-details">
                <span class="detail"><strong>Size:</strong> ${formattedSize} sq.ft</span>
                <span class="detail"><strong>Terrain:</strong> ${property.terrain.replace('_', ' ')}</span>
                <span class="detail"><strong>Status:</strong> ${property.status.replace('_', ' ')}</span>
            </div>
            <div class="property-actions">
                <button class="btn-primary" onclick="window.location.href='property-detail.html?id=${property._id}'">View Details</button>
                ${propertyActions}
            </div>
        </div>
    `;

    // Add event listener for save button (only if it exists)
    const saveButton = card.querySelector('.save-btn');
    if (saveButton) {
        saveButton.addEventListener('click', function () {
            toggleSavePropertyFromCard(property._id, this);
        });
    }

    return card;
}

// Create a saved property card element
function createSavedPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card saved';
    card.setAttribute('data-property-id', property._id);

    // Format price
    const formattedPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(property.price);

    // Format size
    const formattedSize = new Intl.NumberFormat('en-IN').format(property.size);

    card.innerHTML = `
        <div class="property-image">
            <img src="${property.images && property.images.length > 0 ? property.images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4='}" alt="${property.title}">
        </div>
        <div class="property-info">
            <h3>${property.title}</h3>
            <p class="location">${property.location}</p>
            <p class="price">${formattedPrice}</p>
            <div class="property-details">
                <span class="detail"><strong>Size:</strong> ${formattedSize} sq.ft</span>
                <span class="detail"><strong>Terrain:</strong> ${property.terrain.replace('_', ' ')}</span>
                <span class="detail"><strong>Status:</strong> ${property.status.replace('_', ' ')}</span>
            </div>
            <div class="property-actions">
                <button class="btn-primary" onclick="window.location.href='property-detail.html?id=${property._id}'">View Details</button>
                <button class="save-btn saved" data-property-id="${property._id}">Unsave Property</button>
            </div>
        </div>
    `;

    // Add event listener for unsave button (only if it exists)
    const saveButton = card.querySelector('.save-btn');
    if (saveButton) {
        saveButton.addEventListener('click', function () {
            toggleSavePropertyFromCard(property._id, this);
        });
    }

    return card;
}

// Toggle save/unsave property from card
async function toggleSavePropertyFromCard(propertyId, buttonElement) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showNotification('You must be logged in to save properties.', false);
        window.location.href = 'login.html';
        return;
    }

    const isSaved = buttonElement.classList.contains('saved');

    if (isSaved) {
        // Unsave the property
        await unsaveProperty(propertyId);
        buttonElement.textContent = 'Save Property';
        buttonElement.classList.remove('saved');
    } else {
        // Save the property
        await saveProperty(propertyId);
        buttonElement.textContent = 'Unsave Property';
        buttonElement.classList.add('saved');
    }

    // Update saved properties count
    updateSavedPropertiesCount();
}

// Save a property to the user's saved list
async function saveProperty(propertyId) {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            showNotification('You must be logged in to save properties.', false);
            return;
        }

        // Validate user ID
        if (!isValidUserId(currentUser.id)) {
            console.error('Invalid user ID for saving property:', currentUser.id);
            showNotification('Error saving property: Invalid user ID.', false);
            return;
        }

        // Determine the correct API base URL
        const apiUrl = `${API_CONFIG.BASE_URL}/api/properties/${propertyId}/save`;

        console.log('Saving property to:', apiUrl);

        // Send save request to backend with authentication headers
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                userId: currentUser.id
            })
        });

        console.log('Save property response status:', response.status);

        if (response.ok) {
            // Update localStorage as well for consistency
            let savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
            if (!savedProperties.includes(propertyId)) {
                savedProperties.push(propertyId);
                localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
            }

            console.log(`Property ${propertyId} saved successfully to database`);
            showNotification('Property saved successfully!', true);
        } else {
            if (response.status === 401) {
                showNotification('Your session has expired. Please log in again.', false);
            } else {
                const errorData = await response.json();
                showNotification('Error saving property: ' + errorData.message, false);
            }
        }
    } catch (error) {
        console.error('Error saving property:', error);
        showNotification('An error occurred while saving the property. Please try again.', false);
    }
}

// Unsave a property from the user's saved list
async function unsaveProperty(propertyId) {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            showNotification('You must be logged in to unsave properties.', false);
            return;
        }

        // Validate user ID
        if (!isValidUserId(currentUser.id)) {
            console.error('Invalid user ID for unsaving property:', currentUser.id);
            showNotification('Error unsaving property: Invalid user ID.', false);
            return;
        }

        // Determine the correct API base URL
        const apiUrl = `${API_CONFIG.BASE_URL}/api/properties/${propertyId}/unsave`;

        console.log('Unsaving property from:', apiUrl);

        // Send unsave request to backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                userId: currentUser.id
            })
        });

        console.log('Unsave property response status:', response.status);

        if (response.ok) {
            // Update localStorage as well for consistency
            let savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
            savedProperties = savedProperties.filter(id => id !== propertyId);
            localStorage.setItem('savedProperties', JSON.stringify(savedProperties));

            console.log(`Property ${propertyId} unsaved successfully from database`);
        } else {
            const errorData = await response.json();
            showNotification('Error unsaving property: ' + errorData.message, false);
        }
    } catch (error) {
        console.error('Error unsaving property:', error);
        showNotification('An error occurred while unsaving the property. Please try again.', false);
    }
}

// Load user settings for the "Settings" tab
async function loadUserSettings() {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            console.log('No user logged in');
            return;
        }

        // Validate user ID
        if (!isValidUserId(currentUser.id)) {
            console.error('Invalid user ID for settings:', currentUser.id);
            return;
        }

        // Get form elements with null checks
        const fullNameElement = document.getElementById('settings-full-name');
        const emailElement = document.getElementById('settings-email');
        const phoneElement = document.getElementById('settings-phone');
        const bioElement = document.getElementById('settings-bio');

        // Check if all elements exist before trying to set their values
        if (!fullNameElement || !emailElement || !phoneElement || !bioElement) {
            console.log('Settings form elements not found on page');
            return;
        }

        // Determine the correct API base URL
        const url = `${API_CONFIG.BASE_URL}/api/users/${currentUser.id}`;

        console.log('Fetching user settings from:', url);

        // Fetch user data from backend
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        console.log('User settings response status:', response.status);

        if (response.ok) {
            const userData = await response.json();
            console.log('Received user settings:', userData);

            // Populate form fields with user data from backend
            fullNameElement.value = userData.name || '';
            emailElement.value = userData.email || '';
            phoneElement.value = userData.phone || '';
            bioElement.value = userData.bio || '';

            console.log('Loaded user settings from backend');
        } else {
            // Fallback to localStorage data if backend fetch fails
            fullNameElement.value = currentUser.name || '';
            emailElement.value = currentUser.email || '';
            phoneElement.value = currentUser.phone || '';
            bioElement.value = currentUser.bio || '';

            console.log('Loaded user settings from localStorage (backend fetch failed)');
        }
    } catch (error) {
        console.error('Error loading user settings:', error);

        // Get form elements with null checks
        const fullNameElement = document.getElementById('settings-full-name');
        const emailElement = document.getElementById('settings-email');
        const phoneElement = document.getElementById('settings-phone');
        const bioElement = document.getElementById('settings-bio');

        // Check if all elements exist before trying to set their values
        if (!fullNameElement || !emailElement || !phoneElement || !bioElement) {
            console.log('Settings form elements not found on page');
            return;
        }

        // Fallback to localStorage data if there's an error
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            fullNameElement.value = currentUser.name || '';
            emailElement.value = currentUser.email || '';
            phoneElement.value = currentUser.phone || '';
            bioElement.value = currentUser.bio || '';
        }
    }
}

// Handle profile form submission
async function handleProfileUpdate(event) {
    event.preventDefault();

    try {
        // Get current user from localStorage
        let currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('You must be logged in to update settings.');
            return;
        }

        // Validate user ID
        if (!isValidUserId(currentUser.id)) {
            console.error('Invalid user ID for profile update:', currentUser.id);
            alert('Error updating profile: Invalid user ID.');
            return;
        }

        // Get form values with null checks
        const fullNameElement = document.getElementById('settings-full-name');
        const emailElement = document.getElementById('settings-email');
        const phoneElement = document.getElementById('settings-phone');
        const bioElement = document.getElementById('settings-bio');

        // Check if all elements exist before accessing their values
        if (!fullNameElement || !emailElement || !phoneElement || !bioElement) {
            console.error('One or more profile form elements not found');
            alert('Profile form elements not found. Please try again.');
            return;
        }

        const fullName = fullNameElement.value;
        const email = emailElement.value;
        const phone = phoneElement.value;
        const bio = bioElement.value;

        // Prepare data for API
        const userData = {
            name: fullName,
            email: email,
            phone: phone,
            bio: bio
        };

        // Determine the correct API base URL
        const apiUrl = `${API_CONFIG.BASE_URL}/api/users/${currentUser.id}`;

        console.log('Updating user profile at:', apiUrl);
        console.log('User data:', userData);

        // Send update data to backend with authentication headers
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });

        console.log('Profile update response status:', response.status);

        let result;
        const contentType = response.headers.get('content-type');

        // Check if response has JSON content
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            // If not JSON, try to get text content
            const text = await response.text();
            result = { message: text || 'Profile update completed' };
        }

        if (response.ok) {
            // Update user data in localStorage with the response from server
            const updatedUser = {
                id: result._id,
                name: result.name,
                email: result.email,
                role: result.role,
                phone: result.phone,
                bio: result.bio
            };

            localStorage.setItem('currentUser', JSON.stringify(updatedUser));

            // Update user info in the dashboard header
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = result.name;
            }

            showNotification('Profile updated successfully!', true);

            console.log('User profile updated');
        } else {
            showNotification('Profile update failed: ' + (result.message || 'Unknown error'), false);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('An error occurred while updating your profile. Please try again.', false);
    }
}

// Handle app settings form submission
function handleAppSettingsUpdate(event) {
    event.preventDefault();

    // Get form elements with null checks
    const themeElement = document.getElementById('theme');
    const languageElement = document.getElementById('language');
    const compactViewElement = document.getElementById('compact-view');
    const autoRefreshElement = document.getElementById('auto-refresh');

    // Check if all elements exist
    if (!themeElement || !languageElement || !compactViewElement || !autoRefreshElement) {
        console.error('One or more app settings form elements not found');
        showNotification('App settings form elements not found. Please try again.', false);
        return;
    }

    // Get form values
    const theme = themeElement.value;
    const language = languageElement.value;
    const compactView = compactViewElement.checked;
    const autoRefresh = autoRefreshElement.checked;

    // In a real app, you would send these settings to the backend
    // For now, we'll store them in localStorage
    const appSettings = {
        theme: theme,
        language: language,
        compactView: compactView,
        autoRefresh: autoRefresh
    };

    localStorage.setItem('appSettings', JSON.stringify(appSettings));

    showNotification('App settings saved successfully!', true);

    console.log('App settings updated:', appSettings);
}

// Handle notifications form submission
function handleNotificationsUpdate(event) {
    event.preventDefault();

    // Get form elements with null checks
    const emailNotificationsElement = document.querySelector('input[name="email-notifications"]');
    const smsNotificationsElement = document.querySelector('input[name="sms-notifications"]');
    const propertyUpdatesElement = document.querySelector('input[name="property-updates"]');
    const messageNotificationsElement = document.querySelector('input[name="message-notifications"]');
    const marketingEmailsElement = document.querySelector('input[name="marketing-emails"]');

    // Check if all elements exist
    if (!emailNotificationsElement || !smsNotificationsElement || !propertyUpdatesElement ||
        !messageNotificationsElement || !marketingEmailsElement) {
        console.error('One or more notifications form elements not found');
        showNotification('Notifications form elements not found. Please try again.', false);
        return;
    }

    // Get form values
    const emailNotifications = emailNotificationsElement.checked;
    const smsNotifications = smsNotificationsElement.checked;
    const propertyUpdates = propertyUpdatesElement.checked;
    const messageNotifications = messageNotificationsElement.checked;
    const marketingEmails = marketingEmailsElement.checked;

    // Correctly send settings to backend
    const notificationSettings = {
        emailNotifications: emailNotifications,
        messageNotifications: messageNotifications,
        propertyUpdates: propertyUpdates
    };

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    fetch(`${API_CONFIG.BASE_URL}/api/users/notifications`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(notificationSettings)
    }).then(response => {
        if (response.ok) {
            localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
            showNotification('Notification preferences saved successfully!', true);
        } else {
            showNotification('Failed to save preferences to server', false);
        }
    }).catch(error => {
        console.error('Error updating notifications:', error);
        showNotification('An error occurred while saving notifications', false);
    });
}

// Handle privacy form submission
function handlePrivacyUpdate(event) {
    event.preventDefault();

    // Get form elements with null checks
    const profilePublicElement = document.getElementById('profile-public');
    const showContactInfoElement = document.getElementById('show-contact-info');
    const activityVisibilityElement = document.getElementById('activity-visibility');

    // Check if all elements exist
    if (!profilePublicElement || !showContactInfoElement || !activityVisibilityElement) {
        console.error('One or more privacy form elements not found');
        showNotification('Privacy form elements not found. Please try again.', false);
        return;
    }

    // Get form values
    const profilePublic = profilePublicElement.checked;
    const showContactInfo = showContactInfoElement.checked;
    const activityVisibility = activityVisibilityElement.checked;

    // Correctly send settings to backend
    const privacySettings = {
        profilePublic: profilePublic,
        showContactInfo: showContactInfo,
        activityVisibility: activityVisibility
    };

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    fetch(`${API_CONFIG.BASE_URL}/api/users/privacy`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(privacySettings)
    }).then(response => {
        if (response.ok) {
            localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
            showNotification('Privacy settings saved successfully!', true);
        } else {
            showNotification('Failed to save privacy settings to server', false);
        }
    }).catch(error => {
        console.error('Error updating privacy:', error);
        showNotification('An error occurred while saving privacy settings', false);
    });
}

// Handle security form submission (password update)
async function handleSecurityUpdate(event) {
    event.preventDefault();

    const currentPasswordElement = document.getElementById('current-password');
    const newPasswordElement = document.getElementById('new-password');
    const confirmPasswordElement = document.getElementById('confirm-password');

    if (!currentPasswordElement || !newPasswordElement || !confirmPasswordElement) {
        console.error('Security form elements not found');
        return;
    }

    const currentPassword = currentPasswordElement.value;
    const newPassword = newPasswordElement.value;
    const confirmPassword = confirmPasswordElement.value;

    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match!', false);
        return;
    }

    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters long!', false);
        return;
    }

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/password`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        if (response.ok) {
            showNotification('Password updated successfully!', true);
            currentPasswordElement.value = '';
            newPasswordElement.value = '';
            confirmPasswordElement.value = '';
        } else {
            const errorData = await response.json();
            showNotification(errorData.message || 'Failed to update password', false);
        }
    } catch (error) {
        console.error('Error updating password:', error);
        showNotification('An error occurred while updating password', false);
    }
}

// Global state for images
let propertyImages = [];
let existingPropertyImages = [];

// Initialize image upload functionality
function initImageUpload() {
    const imageInput = document.getElementById('property-images');
    const uploadArea = document.getElementById('upload-drop-zone');

    if (imageInput) {
        imageInput.addEventListener('change', function (e) {
            handleImageSelection(e.target.files);
        });
    }

    if (uploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });

        uploadArea.addEventListener('drop', handleDrop, false);
    }
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    const uploadArea = document.getElementById('upload-drop-zone');
    if (uploadArea) {
        uploadArea.style.borderColor = 'var(--primary)';
        uploadArea.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
    }
}

function unhighlight() {
    const uploadArea = document.getElementById('upload-drop-zone');
    if (uploadArea) {
        uploadArea.style.borderColor = '#cbd5e1'; // gray-300
        uploadArea.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    }
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleImageSelection(files);
}

function handleImageSelection(files) {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.match('image.*')) {
            showNotification('Please select only image files', false);
            continue;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const imageData = {
                file: file,
                dataUrl: e.target.result,
                name: file.name,
                isExisting: false
            };
            propertyImages.push(imageData);
            displayImagePreview(imageData, propertyImages.length - 1, false);
        };
        reader.readAsDataURL(file);
    }
}

function displayImagePreview(imageData, index, isExisting = false) {
    const previewContainer = document.getElementById('image-preview-container');
    if (!previewContainer) return;

    const previewDiv = document.createElement('div');
    previewDiv.className = 'image-preview';
    previewDiv.id = isExisting ? `existing-image-${index}` : `new-image-${index}`;
    // Inline styles for preview if not in CSS
    previewDiv.style.position = 'relative';
    previewDiv.style.width = '100px';
    previewDiv.style.height = '100px';
    previewDiv.style.borderRadius = '8px';
    previewDiv.style.overflow = 'hidden';
    previewDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

    const imgSrc = isExisting ? imageData : imageData.dataUrl;

    previewDiv.innerHTML = `
        <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;">
        <button type="button" class="remove-image" onclick="${isExisting ? `removeExistingImage('${imageData}')` : `removeNewImage(${index})`}" style="position: absolute; top: 5px; right: 5px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
    `;

    previewContainer.appendChild(previewDiv);

    // Update text
    updateUploadText();
}

function updateUploadText() {
    const uploadText = document.querySelector('#upload-drop-zone p');
    if (uploadText) {
        const totalValidation = propertyImages.length + existingPropertyImages.length;
        if (totalValidation > 0) {
            uploadText.textContent = `${totalValidation} image${totalValidation !== 1 ? 's' : ''} selected`;
            uploadText.style.color = 'var(--success)';
        } else {
            uploadText.textContent = 'Drag & drop images here or click to browse';
            uploadText.style.color = 'var(--gray-500)';
        }
    }
}

// Global functions for inline onclicks
window.removeNewImage = function (index) {
    propertyImages.splice(index, 1);
    const el = document.getElementById(`new-image-${index}`);
    if (el) el.remove();
    // Re-render all to fix indices or just accept potential gap/misalignment in index
    // For simplicity, we'll just remove the element and update text. 
    // Ideally we re-render or use IDs.
    updateUploadText();
};

window.removeExistingImage = function (imgUrl) {
    existingPropertyImages = existingPropertyImages.filter(img => img !== imgUrl);
    // Find the element by checking sources or IDs
    // Since we passed the URL, we might need a better way to find the element
    // Or just reload all.
    // Let's iterate elements
    const previews = document.querySelectorAll('.image-preview img');
    previews.forEach(img => {
        if (img.getAttribute('src') === imgUrl) {
            img.parentElement.remove();
        }
    });
    updateUploadText();
};

// Load property data for editing
async function loadPropertyForEdit(propertyId) {
    try {
        const url = getApiUrl(API_CONFIG.ENDPOINTS.GET_PROPERTY, { id: propertyId });
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load property');

        const property = await response.json();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

        if (property.ownerId._id !== currentUser.id && property.ownerId !== currentUser.id) {
            showNotification('Unauthorized access', false);
            window.location.href = 'unified-dashboard.html';
            return;
        }

        // Populate fields
        if (document.getElementById('property-title')) document.getElementById('property-title').value = property.title;
        if (document.getElementById('property-description')) document.getElementById('property-description').value = property.description;
        if (document.getElementById('property-location')) document.getElementById('property-location').value = property.location;
        if (document.getElementById('property-terrain')) document.getElementById('property-terrain').value = property.terrain;
        if (document.getElementById('property-price')) document.getElementById('property-price').value = property.price;
        if (document.getElementById('property-size')) document.getElementById('property-size').value = property.size;

        // Load images
        if (property.images && property.images.length) {
            existingPropertyImages = [...property.images];
            existingPropertyImages.forEach((img, i) => displayImagePreview(img, i, true));
        }

    } catch (error) {
        console.error(error);
        showNotification('Error loading property', false);
    }
}

// Handle property update
async function handlePropertyUpdate(propertyId) {
    try {
        const title = document.getElementById('property-title').value;
        const description = document.getElementById('property-description').value;
        const price = document.getElementById('property-price').value;
        const size = document.getElementById('property-size').value;
        const location = document.getElementById('property-location').value;
        const terrain = document.getElementById('property-terrain').value;

        // Combine new and existing images
        const images = [
            ...existingPropertyImages,
            ...propertyImages.map(img => img.dataUrl) // New images
        ];

        const propertyData = { title, description, price, size, location, terrain, images };

        const url = getApiUrl(API_CONFIG.ENDPOINTS.UPDATE_PROPERTY, { id: propertyId });
        const response = await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(propertyData)
        });

        if (response.ok) {
            showNotification('Property updated successfully!', true);
            setTimeout(() => window.location.href = 'unified-dashboard.html', 1500);
        } else {
            const err = await response.json();
            showNotification('Update failed: ' + err.message, false);
        }

    } catch (error) {
        console.error(error);
        showNotification('Error updating property', false);
    }
}

// Handle security form submission
function handleSecurityUpdate(event) {
    event.preventDefault();

    // Get form elements with null checks
    const currentPasswordElement = document.getElementById('current-password');
    const newPasswordElement = document.getElementById('new-password');
    const confirmPasswordElement = document.getElementById('confirm-password');
    const twoFactorAuthElement = document.getElementById('two-factor-auth');
    const securityFormElement = document.getElementById('security-form');

    // Check if all required elements exist
    if (!currentPasswordElement || !newPasswordElement || !confirmPasswordElement) {
        console.error('One or more security form elements not found');
        showNotification('Security form elements not found. Please try again.', false);
        return;
    }

    // Get form values
    const currentPassword = currentPasswordElement.value;
    const newPassword = newPasswordElement.value;
    const confirmPassword = confirmPasswordElement.value;
    const twoFactorAuth = twoFactorAuthElement ? twoFactorAuthElement.checked : false;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Please fill in all password fields.', false);
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match.', false);
        return;
    }

    // In a real app, you would send these settings to the backend for processing
    // For now, we'll just simulate the update

    // Store security settings in localStorage
    const securitySettings = {
        twoFactorAuth: twoFactorAuth
    };

    localStorage.setItem('securitySettings', JSON.stringify(securitySettings));

    showNotification('Security settings updated successfully!', true);

    // Reset the form if it exists
    if (securityFormElement) {
        securityFormElement.reset();
    }

    console.log('Security settings updated:', securitySettings);
}

// Handle property removal
async function removeProperty(propertyId) {
    try {
        // Confirm with user before deleting
        if (!confirm('Are you sure you want to remove this property? This action cannot be undone.')) {
            return;
        }

        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            showNotification('You must be logged in to remove properties.', false);
            return;
        }

        // Validate user ID
        if (!isValidUserId(currentUser.id)) {
            console.error('Invalid user ID for property removal:', currentUser.id);
            showNotification('Error removing property: Invalid user ID.', false);
            return;
        }

        // Determine the correct API base URL
        const url = `${API_CONFIG.BASE_URL}/api/properties/${propertyId}`;

        console.log('Removing property at:', url);

        // Send delete request to backend
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        console.log('Property removal response status:', response.status);

        if (response.ok) {
            // Remove the property card from the UI
            // Find the button that triggered this function and traverse to the card
            const buttons = document.querySelectorAll(`.property-actions button[onclick*="'${propertyId}'"]`);
            let propertyCard = null;

            // Loop through buttons to find the one in the "Remove" button
            for (let button of buttons) {
                if (button.classList.contains('remove-btn') || button.textContent.includes('Remove')) {
                    propertyCard = button.closest('.property-card');
                    break;
                }
            }

            // Fallback: if we couldn't find by class, try the first one
            if (!propertyCard && buttons.length > 0) {
                propertyCard = buttons[0].closest('.property-card');
            }

            if (propertyCard) {
                propertyCard.style.opacity = '0';
                propertyCard.style.transform = 'translateY(20px)';
                propertyCard.style.transition = 'all 0.3s ease';

                setTimeout(() => {
                    propertyCard.remove();

                    // Update the property count
                    const container = document.getElementById('my-properties-container');
                    if (container && container.children.length === 0) {
                        container.innerHTML = '<p>You have not added any properties yet. <a href="add-property.html">Add your first property</a></p>';
                    }
                }, 300);
            }

            console.log(`Property ${propertyId} removed successfully`);
        } else {
            const errorData = await response.json();
            showNotification('Error removing property: ' + errorData.message, false);
        }
    } catch (error) {
        console.error('Error removing property:', error);
        showNotification('An error occurred while removing the property. Please try again.', false);
    }
}

// Handle registration form submission
async function handleRegistration() {
    try {
        // Get form values with proper element IDs
        const name = document.getElementById('full-name') ? document.getElementById('full-name').value : '';
        const email = document.getElementById('email') ? document.getElementById('email').value : '';
        const phone = document.getElementById('phone') ? document.getElementById('phone').value : '';
        const password = document.getElementById('password') ? document.getElementById('password').value : '';
        const confirmPassword = document.getElementById('confirm-password') ? document.getElementById('confirm-password').value : '';
        const termsAccepted = document.getElementById('terms') ? document.getElementById('terms').checked : false;

        // Validation
        if (!name || !email || !phone || !password || !confirmPassword) {
            showNotification('Please fill in all required fields.', false);
            return;
        }

        if (password !== confirmPassword) {
            showNotification('Passwords do not match.', false);
            return;
        }

        if (!termsAccepted) {
            showNotification('You must agree to the Terms and Conditions.', false);
            return;
        }

        // Prepare data for API
        const userData = {
            name: name,
            email: email,
            phone: phone,
            password: password
            // No role specified - users can buy and sell
        };

        // Determine the correct API base URL
        const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.REGISTER);

        console.log('Registering user at:', apiUrl);
        console.log('User data:', userData);

        // Send registration data to backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        console.log('Registration response status:', response.status);

        let result;
        const contentType = response.headers.get('content-type');

        // Check if response has JSON content
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            // If not JSON, try to get text content
            const text = await response.text();
            result = { message: text || 'Registration completed' };
        }

        if (response.ok) {
            showNotification('Registration successful! Please log in.', true);
            // Reset form
            if (document.getElementById('register-form')) {
                document.getElementById('register-form').reset();
            }
            // Redirect to login page
            window.location.href = 'login.html';
        } else {
            showNotification('Registration failed: ' + (result.message || 'Unknown error'), false);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('An error occurred during registration. Please try again.', false);
    }
}

// Handle login form submission
async function handleLogin() {
    try {
        // Get form values with proper element IDs
        const email = document.getElementById('email') ? document.getElementById('email').value : '';
        const password = document.getElementById('password') ? document.getElementById('password').value : '';

        console.log('Login attempt with email:', email);

        // Validation
        if (!email || !password) {
            console.log('Validation failed: Please fill in all fields.');
            showNotification('Please fill in all fields.', false);
            return;
        }

        // Prepare data for API
        const loginData = {
            email: email,
            password: password
        };

        // Determine the correct API base URL
        const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.LOGIN);

        console.log('Logging in at:', apiUrl);
        console.log('Login data being sent:', loginData);

        // Send login data to backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        console.log('Login response status:', response.status);

        let result;
        const contentType = response.headers.get('content-type');

        // Check if response has JSON content
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
            console.log('Login response data:', result);
        } else {
            // If not JSON, try to get text content
            const text = await response.text();
            result = { message: text || 'Login completed' };
            console.log('Login response text:', text);
        }

        if (response.ok) {
            console.log('=== LOGIN SUCCESSFUL ===');
            console.log('Received user data from backend:', result.user);

            // Validate user data
            if (!result.user || !result.user.id) {
                console.error('❌ CRITICAL: Invalid user data received from server:', result);
                showNotification('Login failed: Invalid user data received', false);
                return;
            }

            // Log the exact user ID received from backend
            console.log('✅ Backend returned User ID:', result.user.id);
            console.log('User details - Name:', result.user.name, '| Email:', result.user.email, '| Role:', result.user.role);

            // Store user data in localStorage with simulated token
            const userData = {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role, // This will be undefined if not provided by backend
                // In a real app, this would be a JWT token from the backend
                token: `simulated-token-${result.user.id}-${Date.now()}`
            };

            console.log('📦 Storing user data in localStorage:', userData);
            console.log('User ID being stored:', userData.id);
            localStorage.setItem('currentUser', JSON.stringify(userData));

            // Verify what was actually stored
            const storedData = JSON.parse(localStorage.getItem('currentUser'));
            console.log('✅ Verified stored data in localStorage:', storedData);
            console.log('Stored User ID matches backend:', storedData.id === result.user.id);

            showNotification('Login successful!', true);
            // Reset form
            if (document.getElementById('login-form')) {
                document.getElementById('login-form').reset();
            }
            // Redirect to dashboard
            window.location.href = 'unified-dashboard.html';
        } else {
            console.log('Login failed with message:', result.message);
            // Display error in the login form error container
            const errorContainer = document.getElementById('login-error');
            if (errorContainer) {
                errorContainer.textContent = result.message || 'Invalid email or password';
                errorContainer.style.display = 'block';
            } else {
                // Fallback to notification
                showNotification('Login failed: ' + (result.message || 'Invalid email or password'), false);
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred during login. Please try again.', false);
    }
}

// Update navigation based on user authentication status
function updateNavigation() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const navLinks = document.querySelectorAll('nav ul li a');

    // Update login/logout link
    navLinks.forEach(link => {
        if (link.textContent === 'Login') {
            if (currentUser) {
                link.textContent = 'Logout';
                link.href = '#';
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    localStorage.removeItem('currentUser');
                    showNotification('You have been logged out.', true);
                    window.location.href = 'index.html';
                });
            }
        }
    });

    // Show/hide dashboard link based on authentication
    navLinks.forEach(link => {
        if (link.textContent === 'Dashboard' || link.href.includes('unified-dashboard.html')) {
            if (currentUser) {
                link.style.display = 'block';
            } else {
                link.style.display = 'none';
            }
        }
    });
}

// Form validation helper
function validateForm(form) {
    // Generic form validation
    const inputs = form.querySelectorAll('input, textarea, select');
    let isValid = true;

    inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            input.style.borderColor = 'red';
            setTimeout(() => {
                input.style.borderColor = '';
            }, 3000);
        }
    });

    if (!isValid) {
        alert('Please fill in all required fields.');
        return false;
    }

    return true;
}

// Show notification message
function showNotification(message, isSuccess = true) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
    notification.textContent = message;

    // Style the notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';

    if (isSuccess) {
        notification.style.backgroundColor = '#4CAF50';
    } else {
        notification.style.backgroundColor = '#f44336';
    }

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}