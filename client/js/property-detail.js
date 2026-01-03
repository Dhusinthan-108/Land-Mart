// Property Detail Page JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Get property ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');

    if (propertyId) {
        loadPropertyDetails(propertyId);
    }
});

async function loadPropertyDetails(propertyId) {
    try {
        // Determine the correct API base URL
        const url = `${API_CONFIG.BASE_URL}/api/properties/${propertyId}`;

        console.log('Fetching property details from:', url);

        // Fetch property details
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Property details response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const property = await response.json();
        console.log('Received property details:', property);

        // Display property details
        displayPropertyDetails(property);

        // Enable messaging from this property detail page
        setupContactSeller(property);

        // Add owner-specific actions
        addOwnerActions(property);

    } catch (error) {
        console.error('Error loading property details:', error);
        document.querySelector('.property-detail-layout').innerHTML =
            '<p>Error loading property details. Please try again later.</p>';
    }
}

function displayPropertyDetails(property) {
    // Update property information
    document.querySelector('.property-title').textContent = property.title;
    document.querySelector('.property-location').innerHTML =
        `<i class="fas fa-map-marker-alt"></i> ${property.location}`;

    // Format price
    const formattedPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(property.price);
    document.querySelector('.property-price').textContent = formattedPrice;

    // Update description
    document.querySelector('.property-description p').textContent = property.description;

    // Update features
    const featuresList = document.querySelector('.features-list');
    featuresList.innerHTML = '';

    // Format size
    const formattedSize = new Intl.NumberFormat('en-IN').format(property.size);

    featuresList.innerHTML = `
        <li><i class="fas fa-ruler-combined"></i> Size: ${formattedSize} sq.ft</li>
        <li><i class="fas fa-mountain"></i> Terrain: ${property.terrain.replace('_', ' ')}</li>
        <li><i class="fas fa-file-contract"></i> Status: ${property.status.replace('_', ' ')}</li>
        <li><i class="fas fa-user"></i> Owner: ${property.ownerId.name}</li>
    `;

    // Update seller info
    document.querySelector('.seller-name').textContent = property.ownerId.name;

    // Update image gallery if available
    if (property.images && property.images.length > 0) {
        // Set main image
        document.getElementById('main-image').src = property.images[0];

        // Populate thumbnail gallery
        const thumbnailGallery = document.getElementById('thumbnail-gallery');
        thumbnailGallery.innerHTML = '';

        property.images.forEach((image, index) => {
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnailDiv.innerHTML = `
                <img src="${image}" alt="Property Image ${index + 1}">
            `;

            // Add click event to change main image
            thumbnailDiv.addEventListener('click', function () {
                // Remove active class from all thumbnails
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));

                // Add active class to clicked thumbnail
                this.classList.add('active');

                // Update main image
                document.getElementById('main-image').src = image;
            });

            thumbnailGallery.appendChild(thumbnailDiv);
        });
    } else {
        // Show placeholder if no images
        document.getElementById('main-image').src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
        document.getElementById('main-image').alt = 'No Image Available';
    }
}

async function setupContactSeller(property) {
    const contactButton = document.getElementById('contact-seller-btn');
    if (!contactButton) {
        return;
    }

    contactButton.addEventListener('click', async function () {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            showNotification('Please log in to message the seller.', false);
            window.location.href = 'login.html';
            return;
        }

        const sellerId = property?.ownerId?._id || property?.ownerId;
        if (!sellerId) {
            showNotification('Seller information is not available for this property.', false);
            return;
        }

        if (currentUser.id === (sellerId._id || sellerId)) {
            showNotification('You are the seller for this property.', false);
            return;
        }

        // Check if the property is liked/saved
        const savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
        const isLiked = savedProperties.includes(property._id);

        if (!isLiked) {
            showNotification('You must "Like" (Heart icon) this land first before you can message the seller.', false);
            const heartBtn = document.querySelector('.save-property-section button');
            if (heartBtn) {
                heartBtn.classList.add('pulse-animation');
                setTimeout(() => heartBtn.classList.remove('pulse-animation'), 2000);
            }
            return;
        }

        // Check if a conversation already exists
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/messages/check/${property._id}`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();

            if (data.exists) {
                window.location.href = `messages.html?conversationId=${data.conversationId}`;
            } else {
                // If no conversation exists, we can still go to messages.html but we'll need to start one
                window.location.href = `messages.html?propertyId=${property._id}&userId=${sellerId._id || sellerId}&start=true`;
            }
        } catch (error) {
            console.error('Error checking conversation:', error);
            window.location.href = `messages.html?propertyId=${property._id}&userId=${sellerId._id || sellerId}`;
        }
    });
}

function addOwnerActions(property) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Check if current user is the owner
    if (currentUser && property.ownerId._id === currentUser.id) {
        // Add edit and delete buttons for owners
        const contactSellerCard = document.querySelector('.contact-seller-card');

        const ownerActions = document.createElement('div');
        ownerActions.className = 'owner-actions card mt-4';
        ownerActions.innerHTML = `
            <h3>Owner Actions</h3>
            <div class="owner-action-buttons">
                <button class="btn btn-secondary w-100 mb-2" onclick="editProperty('${property._id}')">
                    <i class="fas fa-edit"></i> Edit Property
                </button>
                <button class="btn btn-danger w-100" onclick="deleteProperty('${property._id}')">
                    <i class="fas fa-trash"></i> Delete Property
                </button>
            </div>
        `;

        contactSellerCard.parentNode.insertBefore(ownerActions, contactSellerCard.nextSibling);
    } else if (currentUser) {
        // Add save button for logged-in users who are not owners
        const saveButton = document.querySelector('.save-property-section button');
        saveButton.innerHTML = '<i class="far fa-heart"></i> Save for Later';
        saveButton.onclick = function () {
            toggleSaveProperty(property._id, this);
        };
    } else {
        // For non-logged-in users, show login prompt
        const saveButton = document.querySelector('.save-property-section button');
        saveButton.innerHTML = '<i class="far fa-heart"></i> Save for Later';
        saveButton.onclick = function () {
            showNotification('Please log in to save properties.', false);
            window.location.href = 'login.html';
        };
    }
}

function editProperty(propertyId) {
    window.location.href = `edit-property.html?id=${propertyId}`;
}

async function deleteProperty(propertyId) {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
        return;
    }

    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            showNotification('You must be logged in to delete properties.', false);
            return;
        }

        // Determine the correct API base URL
        const url = `${API_CONFIG.BASE_URL}/api/properties/${propertyId}`;

        console.log('Deleting property at:', url);

        // Send delete request to backend
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        console.log('Property deletion response status:', response.status);

        if (response.ok) {
            showNotification('Property deleted successfully!', true);
            // Redirect to dashboard after deletion
            setTimeout(() => {
                window.location.href = 'unified-dashboard.html';
            }, 2000);
        } else {
            const errorData = await response.json();
            showNotification('Error deleting property: ' + errorData.message, false);
        }
    } catch (error) {
        console.error('Error deleting property:', error);
        showNotification('An error occurred while deleting the property. Please try again.', false);
    }
}

async function toggleSaveProperty(propertyId, buttonElement) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showNotification('You must be logged in to save properties.', false);
        window.location.href = 'login.html';
        return;
    }

    const isSaved = buttonElement.classList.contains('saved');

    if (isSaved) {
        // Unsave the property
        const result = await unsaveProperty(propertyId);
        if (result) {
            buttonElement.innerHTML = '<i class="far fa-heart"></i> Save for Later';
            buttonElement.classList.remove('saved');
            showNotification('Property unsaved!', true);
        }
    } else {
        // Save the property
        const result = await saveProperty(propertyId);
        if (result) {
            buttonElement.innerHTML = '<i class="fas fa-heart"></i> Saved';
            buttonElement.classList.add('saved');
            showNotification('Property saved! You can now message the seller.', true);

            // Highlight the message button
            const contactBtn = document.getElementById('contact-seller-btn');
            if (contactBtn) {
                contactBtn.classList.add('highlight-animation');
                setTimeout(() => contactBtn.classList.remove('highlight-animation'), 3000);
            }
        }
    }
}

// Save a property to the user's saved list
async function saveProperty(propertyId) {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            showNotification('You must be logged in to save properties.', false);
            return false;
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
            return true;
        } else {
            if (response.status === 401) {
                showNotification('Your session has expired. Please log in again.', false);
            } else {
                const errorData = await response.json();
                showNotification('Error saving property: ' + errorData.message, false);
            }
            return false;
        }
    } catch (error) {
        console.error('Error saving property:', error);
        showNotification('An error occurred while saving the property. Please try again.', false);
        return false;
    }
}

// Unsave a property from the user's saved list
async function unsaveProperty(propertyId) {
    try {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            showNotification('You must be logged in to unsave properties.', false);
            return false;
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
            return true;
        } else {
            const errorData = await response.json();
            showNotification('Error unsaving property: ' + errorData.message, false);
            return false;
        }
    } catch (error) {
        console.error('Error unsaving property:', error);
        showNotification('An error occurred while unsaving the property. Please try again.', false);
        return false;
    }
}



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