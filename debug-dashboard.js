// Debug script to check dashboard functionality
console.log('Starting dashboard debug...');

// Check if all required elements exist
const requiredElements = [
    'user-name',
    'user-role',
    'total-properties',
    'saved-properties-count',
    'pending-approvals',
    'my-properties-container',
    'saved-properties-container',
    'messages-container',
    'settings-full-name',
    'settings-email',
    'settings-phone',
    'settings-bio'
];

console.log('Checking required elements:');
requiredElements.forEach(elementId => {
    const element = document.getElementById(elementId);
    if (element) {
        console.log(`✓ Element found: ${elementId}`);
    } else {
        console.log(`✗ Element missing: ${elementId}`);
    }
});

// Check if tab containers exist
const tabContainers = [
    'overview-tab',
    'my-properties-tab',
    'saved-properties-tab',
    'messages-tab',
    'settings-tab'
];

console.log('\nChecking tab containers:');
tabContainers.forEach(tabId => {
    const tab = document.getElementById(tabId);
    if (tab) {
        console.log(`✓ Tab container found: ${tabId}`);
    } else {
        console.log(`✗ Tab container missing: ${tabId}`);
    }
});

// Check if tab buttons exist
const tabButtons = document.querySelectorAll('.dashboard-tabs button');
console.log(`\nFound ${tabButtons.length} tab buttons:`);
tabButtons.forEach((button, index) => {
    console.log(`  ${index + 1}. ${button.textContent}`);
});

// Check if currentUser exists in localStorage
const currentUser = localStorage.getItem('currentUser');
if (currentUser) {
    console.log('\n✓ Current user found in localStorage');
    try {
        const user = JSON.parse(currentUser);
        console.log(`  User: ${user.name} (${user.email})`);
    } catch (e) {
        console.log('✗ Error parsing currentUser');
    }
} else {
    console.log('\n✗ No current user in localStorage');
}

// Check if savedProperties exist in localStorage
const savedProperties = localStorage.getItem('savedProperties');
if (savedProperties) {
    try {
        const props = JSON.parse(savedProperties);
        console.log(`\n✓ Saved properties found: ${props.length} items`);
    } catch (e) {
        console.log('\n✗ Error parsing savedProperties');
    }
} else {
    console.log('\n✓ No saved properties in localStorage (this is normal if none have been saved)');
}

console.log('\nDebug completed.');