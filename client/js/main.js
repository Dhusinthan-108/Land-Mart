// Main JavaScript file for Land Mart
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
let notificationSocket = null;

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
    // Verify both user object and token exist
    return !!(currentUser && currentUser.token);
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



// Update notification badge
// Update notification badge
async function updateNotificationBadge() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        console.log('[Main] Updating notification badge...');

        const url = getApiUrl(API_CONFIG.ENDPOINTS.GET_CONVERSATIONS);
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const conversations = await response.json();

            // Validate response is array
            if (!Array.isArray(conversations)) {
                console.warn('[Main] Expected array of conversations, got:', conversations);
                return;
            }

            // Calculate total unread count
            const unreadCount = conversations.reduce((sum, conv) => {
                return sum + (parseInt(conv.unreadCount) || 0);
            }, 0);

            console.log(`[Main] Total unread count: ${unreadCount}`);

            // Update badges
            const navBadge = document.getElementById('nav-message-badge');
            const sidebarBadge = document.getElementById('sidebar-message-badge');

            if (navBadge) {
                navBadge.textContent = unreadCount;
                navBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
            }

            if (sidebarBadge) {
                sidebarBadge.textContent = unreadCount;
                sidebarBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
            }
        } else {
            console.error('[Main] Failed to fetch conversations:', response.status);
        }
    } catch (error) {
        console.error('[Main] Error updating notification badge:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('Land Mart loaded successfully!');

    // Update navigation based on user authentication status
    updateNavigation();

    // Start notification system (Socket.io instead of polling)
    initNotificationSystem();

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
    const dashboardSection = document.querySelector('.dashboard') || document.querySelector('.dashboard-main');
    if (dashboardSection) {
        loadMyProperties();
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

                const href = this.getAttribute('href');
                if (!href || href === '#') return; // Skip links without proper href

                // Remove active class from all links and sections
                navLinks.forEach(l => l.parentElement.classList.remove('active'));
                document.querySelectorAll('.settings-section').forEach(section => {
                    section.style.display = 'none';
                });

                // Add active class to clicked link
                this.parentElement.classList.add('active');

                // Show corresponding section
                const targetId = href.substring(1);
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    targetEl.style.display = 'block';
                }
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



        // 3. Update Saved Properties and My Properties list
        updateSavedPropertiesCount();
        loadMyProperties();
        loadSavedProperties();

        console.log(`Loaded dashboard for user ${currentUser.name}`);
    } catch (error) {
        console.error('Error loading unified dashboard:', error);
        showNotification('Error loading dashboard: ' + error.message, false);
    }
}

function isPropertyOwner(propertyOwnerId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !propertyOwnerId) return false;
    // Compare as strings to handle ObjectId vs String mismatch
    const currentUserId = currentUser.id || currentUser._id;
    const ownerId = propertyOwnerId._id || propertyOwnerId;
    return currentUserId.toString() === ownerId.toString();
}

// Global debounce capability
let loadMyPropertiesTimeout = null;

// Load user's properties for the "My Properties" tab
async function loadMyProperties(targetContainerId = null) {
    // Debounce to prevent rapid re-execution
    if (loadMyPropertiesTimeout) {
        clearTimeout(loadMyPropertiesTimeout);
    }

    return new Promise((resolve) => {
        loadMyPropertiesTimeout = setTimeout(async () => {
            await executeLoadMyProperties(targetContainerId);
            resolve();
        }, 300);
    });
}

// Internal function to execute the actual loading logic
async function executeLoadMyProperties(targetContainerId = null) {
    try {
        // Get the properties container - prioritize explicit ID, then fallback
        let container = null;
        if (targetContainerId) {
            container = document.getElementById(targetContainerId);
        }

        if (!container) {
            container = document.getElementById('listed-properties-container') ||
                document.getElementById('my-properties-container') ||
                document.querySelector('#listed-properties-section .properties-grid');
        }

        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            console.log('No user logged in');
            if (container) container.innerHTML = '<p>You must be logged in to view your properties. <a href="login.html">Log in</a></p>';
            return;
        }

        console.log('Loading properties for user:', currentUser);

        // Validate user ID
        if (!isValidUserId(currentUser.id)) {
            console.error('Invalid user ID for properties:', currentUser.id);
            if (container) container.innerHTML = '<p>Error loading properties: Invalid user ID.</p>';
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

        if (!container) {
            console.error('Could not find listed-properties-container element');
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
                // Determine equality explicitly for debugging
                const ownerId = property.ownerId._id || property.ownerId;
                const isOwner = isPropertyOwner(ownerId);
                console.log(`Property ${property._id}: Owner ${ownerId} vs Current ${currentUser.id} -> isOwner: ${isOwner}`);

                const propertyCard = createPropertyCard(property, true);

                // Force styles to ensure interactivity and visibility
                propertyCard.style.pointerEvents = 'auto';
                propertyCard.style.opacity = '1';
                propertyCard.style.position = 'relative';

                container.appendChild(propertyCard);
            });

            // Hide the no-properties message if it exists
            const msg = container.querySelector('.no-properties-message');
            if (msg) {
                msg.style.display = 'none';
            }
        } else {
            // Show the no-properties message if it exists, or add one if it doesn't
            const msg = container.querySelector('.no-properties-message');
            if (msg) {
                msg.style.display = 'flex';
                msg.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <i class="fas fa-home" style="font-size: 3rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
                        <p style="font-size: 1.25rem; color: var(--text-secondary); margin-bottom: 1.5rem;">You haven't listed any properties yet.</p>
                        <a href="add-property.html" class="btn btn-primary">Add Your First Property</a>
                    </div>
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
        const container = document.getElementById('listed-properties-container') ||
            document.getElementById('my-properties-container') ||
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



// Open a conversation with a specific user
function openConversation(userId, propertyId) {
    // Redirect to the messages page with the conversation parameters
    window.location.href = `messages.html?userId=${userId}&propertyId=${propertyId}`;
}

// Handle property submission
let isSubmittingProperty = false; // Guard flag to prevent multiple submissions

async function handlePropertySubmission() {
    // Prevent multiple simultaneous submissions
    if (isSubmittingProperty) {
        console.log('[Property] Submission already in progress, ignoring duplicate call');
        return;
    }

    try {
        isSubmittingProperty = true;

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

        console.log('[Property] Submitting to:', apiUrl);
        console.log('[Property] Data:', propertyData);

        // Disable submit button
        const submitBtn = document.querySelector('#property-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        }

        // Send property data to backend with authentication headers
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(propertyData)
        });

        console.log('[Property] Response status:', response.status);

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
            // Clear images
            if (typeof propertyImages !== 'undefined') {
                propertyImages = [];
                const previewContainer = document.getElementById('image-preview-container');
                if (previewContainer) {
                    previewContainer.innerHTML = '';
                }
            }
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'unified-dashboard.html';
            }, 1500);
        } else {
            if (response.status === 401) {
                showNotification('Your session has expired. Please log in again.', false);
                // Clear user data on authentication failure
                localStorage.removeItem('currentUser');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showNotification('Property submission failed: ' + (result.message || 'Unknown error'), false);
            }
        }
    } catch (error) {
        console.error('[Property] Submission error:', error);
        showNotification('An error occurred during property submission. Please try again.', false);
    } finally {
        // Re-enable submit button
        const submitBtn = document.querySelector('#property-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Property';
        }
        // Reset guard flag
        isSubmittingProperty = false;
    }
}

// Load all properties for the properties listing page with pagination support
async function loadAllProperties(page = 1) {
    try {
        const limit = 12; // Show 12 properties per page
        const url = `${API_CONFIG.BASE_URL}/api/properties?page=${page}&limit=${limit}`;

        console.log(`Fetching properties page ${page} from:`, url);

        // Show loading state
        const propertiesContainer = document.querySelector('.properties-list');
        if (propertiesContainer) {
            propertiesContainer.innerHTML = '<div class="no-properties-message"><p><i class="fas fa-spinner fa-spin"></i> Loading properties...</p></div>';
        }

        // Fetch properties
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const { properties, pagination } = data;

        console.log(`Received ${properties.length} properties of ${pagination.total} total`);

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
            propertiesContainer.innerHTML = '<div class="no-properties-message"><p>No properties available at the moment.</p></div>';
        }

        // Update results info
        const resultsInfo = document.querySelector('.results-info');
        if (resultsInfo) {
            resultsInfo.textContent = `${pagination.total} properties available`;
        }

        // Render pagination controls
        renderPagination(pagination);

        // Scroll to top of properties section
        const topBar = document.querySelector('.properties-topbar');
        if (topBar && page > 1) {
            topBar.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (error) {
        console.error('Error loading properties:', error);
        const propertiesContainer = document.querySelector('.properties-list');
        if (propertiesContainer) {
            propertiesContainer.innerHTML = '<div class="no-properties-message"><p>Error loading properties. Please try again later.</p></div>';
        }
    }
}

// Function to render pagination controls
function renderPagination(pagination) {
    const paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) return;

    const { page, pages, total } = pagination;

    // If only one page, hide pagination but keep container for spacing
    if (pages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'block';

    let paginationHtml = `
        <nav aria-label="Properties pagination">
            <ul class="pagination">
                <li class="page-item ${page === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="event.preventDefault(); ${page === 1 ? '' : `loadAllProperties(${page - 1})`}" ${page === 1 ? 'tabindex="-1" aria-disabled="true"' : ''}>Previous</a>
                </li>
    `;

    // Always show first page
    paginationHtml += `
        <li class="page-item ${page === 1 ? 'active' : ''}">
            <a class="page-link" href="#" onclick="event.preventDefault(); loadAllProperties(1)">1</a>
        </li>
    `;

    // Show ellipsis if needed
    if (page > 3) {
        paginationHtml += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    // Show pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
        paginationHtml += `
            <li class="page-item ${i === page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); loadAllProperties(${i})">${i}</a>
            </li>
        `;
    }

    // Show ellipsis if needed
    if (page < pages - 2) {
        paginationHtml += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    // Always show last page
    if (pages > 1) {
        paginationHtml += `
            <li class="page-item ${page === pages ? 'active' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); loadAllProperties(${pages})">${pages}</a>
            </li>
        `;
    }

    paginationHtml += `
                <li class="page-item ${page === pages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="event.preventDefault(); ${page === pages ? '' : `loadAllProperties(${page + 1})`}" ${page === pages ? 'tabindex="-1" aria-disabled="true"' : ''}>Next</a>
                </li>
            </ul>
        </nav>
    `;

    paginationContainer.innerHTML = paginationHtml;
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
        // Use global functions or direct hrefs where possible
        propertyActions = `
            <button class="btn btn-outline btn-sm edit-btn" onclick="window.location.href='edit-property.html?id=${property._id}'">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm remove-btn" onclick="window.removeProperty('${property._id}')">
                <i class="fas fa-trash"></i> Remove
            </button>`;
    } else {
        // Only show message button if logged in and not the owner
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && ownerId && ownerId !== currentUser.id) {
            propertyActions += `<button class="btn btn-outline btn-sm message-btn" onclick="window.location.href='messages.html?userId=${ownerId}&propertyId=${property._id}'">
                <i class="fas fa-envelope"></i> Message
            </button>`;
        }
    }

    // Simplified SVG placeholder
    const placeholderImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

    // Check if image exists and is valid
    let imageUrl = placeholderImage;
    if (property.images && property.images.length > 0 && property.images[0]) {
        imageUrl = property.images[0];
    }

    card.innerHTML = `
        <div class="property-image">
            <img src="${imageUrl}" alt="${property.title}" onerror="this.onerror=null; this.src='${placeholderImage}';">
            <button class="save-btn" data-property-id="${property._id}"><i class="far fa-heart"></i></button>
        </div>
        <div class="property-info" style="padding: 1.5rem;">
            <p class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem;">${property.title}</h3>
            <p class="property-price">${formattedPrice}</p>
            <div class="property-meta">
                <span class="meta-item"><i class="fas fa-ruler-combined"></i> ${formattedSize} sq.ft</span>
                <span class="meta-item"><i class="fas fa-mountain"></i> ${property.terrain ? property.terrain.replace('_', ' ') : 'Land'}</span>
            </div>
            <div class="property-actions-container" style="margin-top: auto; padding-top: 1.25rem;">
                <!-- View Details Button (Always Full Width) -->
                <button class="btn btn-primary" style="width: 100%; margin-bottom: 0.5rem;" onclick="window.location.href='property-detail.html?id=${property._id}'">
                    View Details
                </button>
                
                <!-- Action Buttons (Grid Layout) -->
                ${propertyActions ? `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">${propertyActions}</div>` : ''}
            </div>
        </div>
    `;

    // Add event listener for save button
    const saveButton = card.querySelector('.save-btn');
    if (saveButton) {
        saveButton.addEventListener('click', function (e) {
            e.stopPropagation();
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
            <button class="save-btn saved" data-property-id="${property._id}"><i class="fas fa-heart"></i></button>
        </div>
        <div class="property-info" style="padding: 1.5rem;">
            <p class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem;">${property.title}</h3>
            <p class="property-price">${formattedPrice}</p>
            <div class="property-meta">
                <span class="meta-item"><i class="fas fa-ruler-combined"></i> ${formattedSize} sq.ft</span>
                <span class="meta-item"><i class="fas fa-mountain"></i> ${property.terrain.replace('_', ' ')}</span>
            </div>
            <div class="property-actions" style="display: flex; gap: 0.75rem; margin-top: 1.25rem;">
                <button class="btn btn-primary flex-1" onclick="window.location.href='property-detail.html?id=${property._id}'">View Details</button>
                <button class="btn btn-outline btn-sm" onclick="window.location.href='messages.html?userId=${property.ownerId?._id || property.ownerId}&propertyId=${property._id}'">
                    <i class="fas fa-envelope"></i> Message
                </button>
            </div>
        </div>
    `;

    // Add event listener for unsave button
    const saveButton = card.querySelector('.save-btn');
    if (saveButton) {
        saveButton.addEventListener('click', function (e) {
            e.stopPropagation();
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
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_USER}`;

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
            showNotification('You must be logged in to update settings.', false);
            return;
        }

        // Get form values
        const name = document.getElementById('settings-full-name').value;
        const phone = document.getElementById('settings-phone').value;
        const bio = document.getElementById('settings-bio').value;

        if (!name || !phone) {
            showNotification('Name and phone are required.', false);
            return;
        }

        // Prepare data for API
        const updateData = { name, phone, bio };

        // Use the profile endpoint which uses the token
        const apiUrl = `${API_CONFIG.BASE_URL}/api/users/profile`;

        // Send update data to backend with authentication headers
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (response.ok) {
            // Update user data in localStorage while PRESERVING the token
            currentUser.name = result.user.name;
            currentUser.phone = result.user.phone;
            currentUser.bio = result.user.bio;

            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Update user name displays across the page
            updateWelcomeName(result.user.name);

            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = result.user.name;
            }

            showNotification('Profile updated successfully!', true);

            // If updateNavigation exists, call it to refresh header UI
            if (typeof updateNavigation === 'function') {
                updateNavigation();
            }
        } else {
            showNotification(result.message || 'Error updating profile.', false);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('An error occurred while updating your profile.', false);
    }
}

// Helper to update welcome name if it exists (e.g. on dashboard)
function updateWelcomeName(name) {
    const welcomeElement = document.getElementById('welcome-name');
    if (welcomeElement) {
        welcomeElement.innerHTML = `Welcome back, ${name}! 👋`;
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



// Handle privacy form submission
async function handlePrivacyUpdate(event) {
    event.preventDefault();

    // Get form elements
    const profilePublicElement = document.getElementById('profile-public');
    const showContactInfoElement = document.getElementById('show-contact-info');
    const activityVisibilityElement = document.getElementById('activity-visibility');

    if (!profilePublicElement || !showContactInfoElement || !activityVisibilityElement) {
        console.warn('One or more privacy elements not found');
    }

    const privacySettings = {
        profilePublic: profilePublicElement ? profilePublicElement.checked : undefined,
        showContactInfo: showContactInfoElement ? showContactInfoElement.checked : undefined,
        activityVisibility: activityVisibilityElement ? activityVisibilityElement.checked : undefined
    };

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/privacy`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(privacySettings)
        });

        if (response.ok) {
            showNotification('Privacy settings updated successfully!', true);
        } else {
            showNotification('Failed to update privacy settings', false);
        }
    } catch (error) {
        console.error('Error updating privacy settings:', error);
        showNotification('An error occurred while updating privacy settings', false);
    }
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
// Handle property removal
// Make available globally
window.removeProperty = async function (propertyId) {
    try {
        console.log('[Main] removeProperty called for ID:', propertyId);

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

        // Trim property ID just in case
        const cleanPropertyId = propertyId.trim();

        // Determine the correct API base URL
        const url = `${API_CONFIG.BASE_URL}/api/properties/${cleanPropertyId}`;

        console.log('Removing property at:', url, 'Original ID:', propertyId);

        // Show loading state
        const buttons = document.querySelectorAll(`.property-actions button[onclick*="'${propertyId}'"]`);
        buttons.forEach(btn => {
            if (btn.classList.contains('remove-btn') || btn.textContent.includes('Remove')) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';
            }
        });

        // Send delete request to backend
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        console.log('Property removal response status:', response.status);

        if (response.ok) {
            showNotification('Property removed successfully!', true);

            // Remove the property card from the UI
            // Find the button that triggered this function and traverse to the card
            let propertyCard = null;

            // Loop through buttons to find the one in the "Remove" button
            // We re-query because we might have modified them above
            const updatedButtons = document.querySelectorAll(`.property-actions button[onclick*="'${propertyId}'"]`);
            for (let button of updatedButtons) {
                if (button.classList.contains('remove-btn') || button.textContent.includes('Remove') || button.disabled) {
                    propertyCard = button.closest('.property-card');
                    break;
                }
            }

            // Allow finding by data attribute as fallback
            if (!propertyCard) {
                propertyCard = document.querySelector(`.property-card[data-property-id="${propertyId}"]`);
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

                    // Update stats if needed
                    const totalPropEl = document.getElementById('total-properties');
                    if (totalPropEl) {
                        const currentCount = parseInt(totalPropEl.textContent) || 0;
                        if (currentCount > 0) totalPropEl.textContent = currentCount - 1;
                    }
                }, 300);
            }

            console.log(`Property ${propertyId} removed successfully`);
        } else {
            const errorData = await response.json();
            showNotification('Error removing property: ' + (errorData.message || 'Unknown error'), false);

            // Reset buttons
            buttons.forEach(btn => {
                if (btn.classList.contains('remove-btn') || btn.textContent.includes('Remove')) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-trash"></i> Remove';
                }
            });
        }
    } catch (error) {
        console.error('Error removing property:', error);
        showNotification('An error occurred while removing the property: ' + error.message, false);

        // Reset buttons
        const buttons = document.querySelectorAll(`.property-actions button[onclick*="'${propertyId}'"]`);
        buttons.forEach(btn => {
            if (btn.classList.contains('remove-btn') || btn.textContent.includes('Remove')) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-trash"></i> Remove';
            }
        });
    }
};

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
    const loginBtn = document.querySelector('.btn-signin');
    const originalBtnText = loginBtn ? loginBtn.innerHTML : 'Sign In';

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

        // Show loading state
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        }

        // Hide error container
        const errorContainer = document.getElementById('login-error');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }

        // Prepare data for API
        const loginData = {
            email: email,
            password: password
        };

        // Determine the correct API base URL
        const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.LOGIN);

        console.log('Logging in at:', apiUrl);

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

        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            const text = await response.text();
            result = { message: text || 'Login completed' };
        }

        if (response.ok) {
            console.log('=== LOGIN SUCCESSFUL ===');

            // Validate user data
            if (!result.user || !result.user.id) {
                console.error('❌ Invalid user data received');
                showNotification('Login failed: Invalid data from server', false);
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = originalBtnText;
                }
                return;
            }

            // Clear any old session data first
            localStorage.removeItem('currentUser');

            // Store user data
            const userData = {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
                token: `simulated-token-${result.user.id}-${Date.now()}`
            };

            console.log('Session initialized with token:', userData.token.substring(0, 20) + '...');
            localStorage.setItem('currentUser', JSON.stringify(userData));
            showNotification('Login successful! Redirecting...', true);

            // Redirect after a small delay
            setTimeout(() => {
                window.location.href = 'unified-dashboard.html';
            }, 800);
        } else {
            if (errorContainer) {
                errorContainer.textContent = result.message || 'Invalid email or password';
                errorContainer.style.display = 'block';
            } else {
                showNotification('Login failed: ' + (result.message || 'Invalid email or password'), false);
            }

            // Reset button
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalBtnText;
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred during login. Please try again.', false);

        // Reset button
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalBtnText;
        }
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

// Initialize notification system
async function initNotificationSystem() {
    if (!isAuthenticated()) return;

    // Initial badge update
    updateNotificationBadge();

    // Initialize socket for notifications if safe
    if (typeof io === 'undefined') {
        console.warn('[Main] Socket.io not found, falling back to one-time update.');
        return;
    }

    // prevent duplicate initialization
    if (notificationSocket) return;

    // Use existing global socket if available (from messages.js)
    if (typeof socket !== 'undefined' && socket) {
        notificationSocket = socket;
    } else {
        notificationSocket = io();
    }

    notificationSocket.on('connect', () => {
        console.log('[Main] Global notification socket connected');
        if (currentUser && currentUser.id) {
            notificationSocket.emit('join_user', currentUser.id);
        }
    });

    notificationSocket.on('receive_message', (message) => {
        console.log('[Main] New message notification received');
        updateNotificationBadge();
    });

    notificationSocket.on('messages_read', () => {
        updateNotificationBadge();
    });

    notificationSocket.on('connect_error', (err) => {
        console.debug('[Main] Notification socket error:', err.message);
    });
}
