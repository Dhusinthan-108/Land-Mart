// Setup Contact Seller button
async function setupContactSeller(property) {
    const contactButton = document.getElementById('contact-seller-btn');
    if (!contactButton) return;

    contactButton.addEventListener('click', async function () {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            showNotification('Please log in to contact the seller.', false);
            window.location.href = 'login.html';
            return;
        }

        const sellerId = property?.ownerId?._id || property?.ownerId;
        if (!sellerId) {
            showNotification('Seller information is not available.', false);
            return;
        }

        if (currentUser.id === sellerId) {
            showNotification('This is your own property.', false);
            return;
        }

        try {
            // Start a conversation
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.START_CONVERSATION), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    propertyId: property._id,
                    initialMessage: `Hi, I'm interested in ${property.title}`
                })
            });

            if (response.ok) {
                window.location.href = `messages.html`;
            } else {
                showNotification('Failed to start conversation', false);
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            showNotification('Error starting conversation', false);
        }
    });
}
