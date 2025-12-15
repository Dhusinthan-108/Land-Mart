// Main JavaScript file for Land Mart

document.addEventListener('DOMContentLoaded', function() {
    console.log('Land Mart loaded successfully!');
    
    // Update navigation based on user authentication status
    updateNavigation();
    
    // Mobile menu toggle
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.innerHTML = '☰';
    mobileMenuButton.classList.add('mobile-menu-button');
    document.querySelector('nav').appendChild(mobileMenuButton);
    
    const navUl = document.querySelector('nav ul');
    
    mobileMenuButton.addEventListener('click', function() {
        navUl.classList.toggle('show');
    });
    
    // Handle registration form submission
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegistration();
        });
    }
    
    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // Handle property form submission
    const propertyForm = document.getElementById('property-form');
    if (propertyForm) {
        propertyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handlePropertySubmission();
        });
    }
    
    // Handle profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            handleProfileUpdate(e);
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
    const otherForms = document.querySelectorAll('form:not(#register-form):not(#login-form):not(#property-form):not(#profile-form)');
    otherForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            validateForm(form);
        });
    });
});

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
        // Also update the saved properties count in case it changed
        const savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
        const savedCountElement = document.getElementById('saved-properties-count');
        if (savedCountElement) {
            savedCountElement.textContent = savedProperties.length;
        }
    } else if (tabName === 'messages') {
        loadMessages();
    } else if (tabName === 'settings') {
        loadUserSettings();
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
        
        // Update user info
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-role').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
        
        // Determine the correct API base URL
        const apiBaseUrl = 'http://localhost:5500';
        
        // Fetch user's properties
        const response = await fetch(`${apiBaseUrl}/api/properties/user/${currentUser.id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const properties = await response.json();
        
        // Update dashboard stats
        document.getElementById('total-properties').textContent = properties.length;
        
        // Count pending approvals
        const pendingApprovals = properties.filter(prop => prop.status === 'pending_approval').length;
        document.getElementById('pending-approvals').textContent = pendingApprovals;
        
        // Get saved properties count from localStorage
        const savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
        document.getElementById('saved-properties-count').textContent = savedProperties.length;
        
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
        
        // Determine the correct API base URL
        const apiBaseUrl = 'http://localhost:5500';
        
        // Fetch user's properties
        const response = await fetch(`${apiBaseUrl}/api/properties/user/${currentUser.id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const properties = await response.json();
        console.log('Received properties:', properties);
        
        // Get the properties container
        const container = document.getElementById('my-properties-container');
        if (!container) {
            console.error('Could not find my-properties-container element');
            return;
        }
        
        // Clear existing content
        container.innerHTML = '';
        
        // Add each property to the page
        if (properties.length > 0) {
            properties.forEach(property => {
                const propertyCard = createPropertyCard(property);
                container.appendChild(propertyCard);
            });
        } else {
            container.innerHTML = '<p>You have not added any properties yet. <a href="add-property.html">Add your first property</a></p>';
        }
        
        // Update the total properties count in dashboard
        const totalPropertiesElement = document.getElementById('total-properties');
        if (totalPropertiesElement) {
            totalPropertiesElement.textContent = properties.length;
        }
        
        console.log(`Loaded ${properties.length} properties for user ${currentUser.name}`);
    } catch (error) {
        console.error('Error loading user properties:', error);
        const container = document.getElementById('my-properties-container');
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
        
        // Get the saved properties container
        const container = document.getElementById('saved-properties-container');
        if (!container) return;
        
        // Get saved properties from localStorage (in a real app, this would come from the backend)
        const savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
        
        // Clear existing content
        container.innerHTML = '';
        
        if (savedProperties.length > 0) {
            // For each saved property ID, fetch the property details
            const apiBaseUrl = 'http://localhost:5500';
            
            // Create an array of promises for fetching property details
            const propertyPromises = savedProperties.map(propertyId => 
                fetch(`${apiBaseUrl}/api/properties/${propertyId}`).then(response => response.json())
            );
            
            try {
                // Wait for all property details to be fetched
                const properties = await Promise.all(propertyPromises);
                
                // Add each property to the page
                properties.forEach(property => {
                    const propertyCard = createSavedPropertyCard(property);
                    container.appendChild(propertyCard);
                });
                
                console.log(`Loaded ${properties.length} saved properties for user`);
            } catch (error) {
                console.error('Error fetching saved property details:', error);
                container.innerHTML = '<p>Error loading saved properties. Please try again later.</p>';
            }
        } else {
            container.innerHTML = '<p>You have not saved any properties yet. Browse properties and save your favorites!</p>';
        }
        
        console.log('Loaded saved properties');
    } catch (error) {
        console.error('Error loading saved properties:', error);
        document.getElementById('saved-properties-container').innerHTML = '<p>Error loading saved properties. Please try again later.</p>';
    }
}

// Save a property to the user's saved list
function saveProperty(propertyId) {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('You must be logged in to save properties.');
            window.location.href = 'login.html';
            return;
        }
        
        // Get existing saved properties from localStorage
        let savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
        
        // Check if property is already saved
        if (savedProperties.includes(propertyId)) {
            alert('This property is already saved.');
            return;
        }
        
        // Add property ID to saved properties list
        savedProperties.push(propertyId);
        
        // Save updated list back to localStorage
        localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
        
        // Update UI to show property is saved
        const saveButton = document.querySelector(`.save-btn[data-property-id="${propertyId}"]`);
        if (saveButton) {
            saveButton.textContent = 'Saved ✓';
            saveButton.disabled = true;
            saveButton.classList.add('saved');
        }
        
        // Update saved properties count in dashboard
        const savedCountElement = document.getElementById('saved-properties-count');
        if (savedCountElement) {
            savedCountElement.textContent = savedProperties.length;
        }
        
        console.log(`Property ${propertyId} saved successfully`);
    } catch (error) {
        console.error('Error saving property:', error);
        alert('An error occurred while saving the property. Please try again.');
    }
}

// Remove a property from the user's saved list
function unsaveProperty(propertyId) {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('You must be logged in to unsave properties.');
            window.location.href = 'login.html';
            return;
        }
        
        // Get existing saved properties from localStorage
        let savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
        
        // Remove property ID from saved properties list
        savedProperties = savedProperties.filter(id => id !== propertyId);
        
        // Save updated list back to localStorage
        localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
        
        // Update UI to show property is unsaved
        const saveButton = document.querySelector(`.save-btn[data-property-id="${propertyId}"]`);
        if (saveButton) {
            saveButton.textContent = 'Save Property';
            saveButton.disabled = false;
            saveButton.classList.remove('saved');
        }
        
        // Update saved properties count in dashboard
        const savedCountElement = document.getElementById('saved-properties-count');
        if (savedCountElement) {
            savedCountElement.textContent = savedProperties.length;
        }
        
        console.log(`Property ${propertyId} unsaved successfully`);
    } catch (error) {
        console.error('Error unsaving property:', error);
        alert('An error occurred while unsaving the property. Please try again.');
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
        
        // Get the messages container
        const container = document.getElementById('messages-container');
        if (!container) return;
        
        // Determine the correct API base URL
        const apiBaseUrl = 'http://localhost:5500';
        
        // Fetch messages for the current user
        const response = await fetch(`${apiBaseUrl}/api/messages/conversation/${currentUser.id}`);
        
        if (!response.ok) {
            throw new Error('Failed to load messages');
        }
        
        const messages = await response.json();
        
        // Group messages by conversation partner
        const conversations = {};
        messages.forEach(message => {
            // Determine the other user in the conversation
            const otherUserId = message.senderId._id === currentUser.id ? message.receiverId._id : message.senderId._id;
            const otherUserName = message.senderId._id === currentUser.id ? message.receiverId.name : message.senderId.name;
            
            // Create conversation key
            const conversationKey = otherUserId;
            
            // Initialize conversation if not exists
            if (!conversations[conversationKey]) {
                conversations[conversationKey] = {
                    userId: otherUserId,
                    userName: otherUserName,
                    messages: [],
                    lastMessage: null,
                    lastMessageTime: null
                };
            }
            
            // Add message to conversation
            conversations[conversationKey].messages.push(message);
            
            // Update last message if this is newer
            if (!conversations[conversationKey].lastMessageTime || 
                new Date(message.createdAt) > new Date(conversations[conversationKey].lastMessageTime)) {
                conversations[conversationKey].lastMessage = message.content;
                conversations[conversationKey].lastMessageTime = message.createdAt;
            }
        });
        
        // Convert to array and sort by last message time
        const conversationList = Object.values(conversations).sort((a, b) => 
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );
        
        // Display conversations
        if (conversationList.length === 0) {
            container.innerHTML = '<p>You have no messages yet. Contact sellers to start a conversation.</p>';
        } else {
            let html = '<div class="conversations-list">';
            html += '<h3>Your Conversations</h3>';
            
            conversationList.forEach(conversation => {
                // Format last message time
                const lastMessageDate = new Date(conversation.lastMessageTime);
                const timeDiff = Math.floor((new Date() - lastMessageDate) / (1000 * 60 * 60 * 24));
                let timeText;
                if (timeDiff === 0) {
                    timeText = 'Today';
                } else if (timeDiff === 1) {
                    timeText = 'Yesterday';
                } else {
                    timeText = `${timeDiff} days ago`;
                }
                
                // Truncate last message
                const truncatedMessage = conversation.lastMessage.length > 50 ? 
                    conversation.lastMessage.substring(0, 50) + '...' : 
                    conversation.lastMessage;
                
                html += `
                    <div class="conversation-item">
                        <div class="conversation-header">
                            <h4>${conversation.userName}</h4>
                            <span class="time">${timeText}</span>
                        </div>
                        <p class="last-message">${truncatedMessage}</p>
                        <button class="btn-secondary" onclick="window.location.href='messages.html'">View Conversation</button>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        }
        
        console.log(`Loaded messages for user ${currentUser.name}`);
    } catch (error) {
        console.error('Error loading messages:', error);
        document.getElementById('messages-container').innerHTML = '<p>Error loading messages. Please try again later.</p>';
    }
}

// Handle property submission
async function handlePropertySubmission() {
    try {
        // Get current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('You must be logged in to add a property.');
            window.location.href = 'login.html';
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
        if (!title || !description || !price || !size || !location) {
            alert('Please fill in all required fields.');
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
        const apiBaseUrl = 'http://localhost:5500';
        const apiUrl = `${apiBaseUrl}/api/properties`;
        
        // Send property data to backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(propertyData)
        });
        
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
            alert('Property listed successfully!');
            // Reset form
            document.getElementById('property-form').reset();
            // Redirect to dashboard
            window.location.href = 'unified-dashboard.html';
        } else {
            alert('Property submission failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Property submission error:', error);
        alert('An error occurred during property submission. Please try again.');
    }
}

// Load all properties for the properties listing page
async function loadAllProperties() {
    try {
        // Determine the correct API base URL
        const apiBaseUrl = 'http://localhost:5500';
        
        // Fetch all properties
        const response = await fetch(`${apiBaseUrl}/api/properties`);
        const properties = await response.json();
        
        // Get the properties container
        const propertiesContainer = document.querySelector('.properties-list');
        if (!propertiesContainer) return;
        
        // Clear existing properties (sample data)
        propertiesContainer.innerHTML = '';
        
        // Add each property to the page using the browse property card
        properties.forEach(property => {
            const propertyCard = createBrowsePropertyCard(property);
            propertiesContainer.appendChild(propertyCard);
        });
        
        console.log(`Loaded ${properties.length} properties`);
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

// Create a property card for browsing (without remove option)
function createBrowsePropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    
    // Use a placeholder image if no image is provided
    const imageUrl = property.imageUrl || 'https://placehold.co/600x400/3498db/ffffff?text=Property+Image';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${property.title}" onerror="this.src='https://placehold.co/600x400/3498db/ffffff?text=Property+Image'">
        <h3>${property.title}</h3>
        <p>${property.description.substring(0, 100)}${property.description.length > 100 ? '...' : ''}</p>
        <div class="property-details">
            <span>₹${property.price.toLocaleString()}</span>
            <span>${property.area} sq.ft</span>
        </div>
        <div class="property-actions">
            <button onclick="viewProperty('${property._id}')">View Details</button>
            <button onclick="saveProperty('${property._id}')" id="save-btn-${property._id}">Save Property</button>
        </div>
    `;
    
    // Check if property is already saved
    const savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
    if (savedProperties.includes(property._id)) {
        const saveBtn = card.querySelector(`#save-btn-${property._id}`);
        saveBtn.textContent = 'Saved';
        saveBtn.classList.add('saved');
    }
    
    return card;
}

// Enhanced property card creation with better styling (for My Properties with remove option)
function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    
    // Use a placeholder image if no image is provided
    const imageUrl = property.imageUrl || 'https://placehold.co/600x400/3498db/ffffff?text=Property+Image';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${property.title}" onerror="this.src='https://placehold.co/600x400/3498db/ffffff?text=Property+Image'">
        <h3>${property.title}</h3>
        <p>${property.description.substring(0, 100)}${property.description.length > 100 ? '...' : ''}</p>
        <div class="property-details">
            <span>₹${property.price.toLocaleString()}</span>
            <span>${property.area} sq.ft</span>
        </div>
        <div class="property-actions">
            <button onclick="viewProperty('${property._id}')">View Details</button>
            <button onclick="removeProperty('${property._id}')" class="remove-btn">Remove</button>
        </div>
    `;
    
    return card;
}

// Create a saved property card element (for saved properties tab)
function createSavedPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    
    // Use a placeholder image if no image is provided
    const imageUrl = property.imageUrl || 'https://placehold.co/600x400/3498db/ffffff?text=Property+Image';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${property.title}" onerror="this.src='https://placehold.co/600x400/3498db/ffffff?text=Property+Image'">
        <h3>${property.title}</h3>
        <p>${property.description.substring(0, 100)}${property.description.length > 100 ? '...' : ''}</p>
        <div class="property-details">
            <span>₹${property.price.toLocaleString()}</span>
            <span>${property.area} sq.ft</span>
        </div>
        <div class="property-actions">
            <button onclick="viewProperty('${property._id}')">View Details</button>
            <button onclick="unsaveProperty('${property._id}')" class="unsave-btn">Remove</button>
        </div>
    `;
    
    return card;
}

// View property details - redirect to property detail page
function viewProperty(propertyId) {
    // Redirect to property detail page with property ID as parameter
    window.location.href = `property-detail.html?id=${propertyId}`;
}

// Load user properties for dashboard
async function loadUserProperties() {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            console.log('No user logged in');
            return;
        }
        
        // Determine the correct API base URL
        const apiBaseUrl = 'http://localhost:5500';
        
        // Fetch user's properties
        const response = await fetch(`${apiBaseUrl}/api/properties/user/${currentUser.id}`);
        const properties = await response.json();
        
        // Update dashboard stats
        const totalPropertiesElement = document.querySelector('.stat-card h3');
        if (totalPropertiesElement) {
            totalPropertiesElement.nextElementSibling.textContent = properties.length;
        }
        
        console.log(`Loaded ${properties.length} properties for user ${currentUser.name}`);
    } catch (error) {
        console.error('Error loading user properties:', error);
    }
}

// Handle user login
async function handleLogin() {
    // Get form values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!email || !password) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Prepare data for API
    const loginData = {
        email: email,
        password: password
    };
    
    try {
        // Determine the correct API base URL
        const apiBaseUrl = 'http://localhost:5500';
        const apiUrl = `${apiBaseUrl}/api/users/login`;
        
        // Send login data to backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        let result;
        const contentType = response.headers.get('content-type');
        
        // Check if response has JSON content
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            // If not JSON, try to get text content
            const text = await response.text();
            result = { message: text || 'Login attempt completed' };
        }
        
        if (response.ok) {
            alert('Login successful!');
            // Store user info in localStorage (in a real app, you would use JWT)
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            // Update navigation
            updateNavigation();
            // Redirect to unified dashboard
            window.location.href = 'unified-dashboard.html';
        } else {
            alert('Login failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
}

// Handle user registration
async function handleRegistration() {
    // Get form values
    const fullName = document.getElementById('full-name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const accountType = document.getElementById('account-type').value;
    
    // Basic validation
    if (!fullName || !email || !phone || !password || !confirmPassword || !accountType) {
        alert('Please fill in all required fields.');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }
    
    // Prepare data for API
    const userData = {
        name: fullName,
        email: email,
        password: password,
        role: accountType,
        phone: phone
    };
    
    try {
        // Determine the correct API base URL
        const apiBaseUrl = 'http://localhost:5500';
        const apiUrl = `${apiBaseUrl}/api/users`;
        
        // Send registration data to backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
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
            alert('Account created successfully!');
            // Reset form
            document.getElementById('register-form').reset();
            // Update navigation
            updateNavigation();
            // Redirect to login page or dashboard
            window.location.href = 'login.html';
        } else {
            alert('Registration failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred during registration. Please try again.');
    }
}

// Enhanced notification function using CSS classes
function showNotification(message, isSuccess = true) {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${isSuccess ? 'success' : 'error'} show`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Enhanced form validation
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        // Reset validation styles
        input.style.borderColor = '#e1e5eb';
        input.style.boxShadow = 'none';
        
        // Check required fields
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            input.style.borderColor = '#dc3545';
            input.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
        }
        
        // Check email format
        if (input.type === 'email' && input.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value.trim())) {
                isValid = false;
                input.style.borderColor = '#dc3545';
                input.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
            }
        }
    });
    
    return isValid;
}

// Property search functionality
function searchProperties() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const propertyCards = document.querySelectorAll('.property-card');
    
    propertyCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
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
        
        // Determine the correct API base URL
        const apiBaseUrl = 'http://localhost:5500';
        
        // Fetch user data from backend
        const response = await fetch(`${apiBaseUrl}/api/users/${currentUser.id}`);
        
        if (response.ok) {
            const userData = await response.json();
            
            // Populate form fields with user data from backend
            document.getElementById('settings-full-name').value = userData.name || '';
            document.getElementById('settings-email').value = userData.email || '';
            document.getElementById('settings-phone').value = userData.phone || '';
            document.getElementById('settings-bio').value = userData.bio || '';
            
            console.log('Loaded user settings from backend');
        } else {
            // Fallback to localStorage data if backend fetch fails
            document.getElementById('settings-full-name').value = currentUser.name || '';
            document.getElementById('settings-email').value = currentUser.email || '';
            document.getElementById('settings-phone').value = currentUser.phone || '';
            document.getElementById('settings-bio').value = currentUser.bio || '';
            
            console.log('Loaded user settings from localStorage (backend fetch failed)');
        }
    } catch (error) {
        console.error('Error loading user settings:', error);
        
        // Fallback to localStorage data if there's an error
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            document.getElementById('settings-full-name').value = currentUser.name || '';
            document.getElementById('settings-email').value = currentUser.email || '';
            document.getElementById('settings-phone').value = currentUser.phone || '';
            document.getElementById('settings-bio').value = currentUser.bio || '';
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
        
        // Get form values
        const fullName = document.getElementById('settings-full-name').value;
        const email = document.getElementById('settings-email').value;
        const phone = document.getElementById('settings-phone').value;
        const bio = document.getElementById('settings-bio').value;
        
        // Prepare data for API
        const userData = {
            name: fullName,
            email: email,
            phone: phone,
            bio: bio
        };
        
        // Determine the correct API base URL
        const apiBaseUrl = 'http://localhost:5500';
        const apiUrl = `${apiBaseUrl}/api/users/${currentUser.id}`;
        
        // Send update data to backend
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
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
            document.getElementById('user-name').textContent = result.name;
            
            alert('Profile updated successfully!');
            
            console.log('User profile updated');
        } else {
            alert('Profile update failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('An error occurred while updating your profile. Please try again.');
    }
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
            alert('You must be logged in to remove properties.');
            return;
        }
        
        // Determine the correct API base URL
        const apiBaseUrl = 'http://localhost:5500';
        
        // Send delete request to backend
        const response = await fetch(`${apiBaseUrl}/api/properties/${propertyId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
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
            
            // Show success message
            showNotification('Property removed successfully!', true);
            
            // Reload the properties to update the count
            loadMyProperties();
        } else {
            const result = await response.json();
            throw new Error(result.message || 'Failed to remove property');
        }
    } catch (error) {
        console.error('Error removing property:', error);
        showNotification('Error removing property: ' + error.message, false);
    }
}

// Update navigation based on user authentication status
function updateNavigation() {
    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Find the navigation element
    const navElement = document.querySelector('nav ul');
    if (!navElement) return;
    
    // Find the last li element (which contains the Login link)
    const lastLi = navElement.lastElementChild;
    if (!lastLi) return;
    
    if (currentUser) {
        // User is logged in, replace Login with Logout
        lastLi.innerHTML = '<a href="#" id="logout-link">Logout</a>';
        
        // Add event listener for logout
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        }
    } else {
        // User is not logged in, ensure Login link is present
        lastLi.innerHTML = '<a href="login.html">Login</a>';
    }
}

// Handle user logout
function logoutUser() {
    // Remove user data from localStorage
    localStorage.removeItem('currentUser');
    
    // Update navigation
    updateNavigation();
    
    // Redirect to home page
    window.location.href = 'index.html';
}
