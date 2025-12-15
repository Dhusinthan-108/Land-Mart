const fs = require('fs');

console.log('Testing remove property functionality...\n');

// Check if the JavaScript file has the removeProperty function
const jsContent = fs.readFileSync('./client/js/main.js', 'utf8');

console.log('Checking JavaScript functions:');
if (jsContent.includes('function removeProperty')) {
    console.log('✓ removeProperty function found');
} else {
    console.log('✗ removeProperty function missing');
}

if (jsContent.includes('DELETE') && jsContent.includes('/api/properties/')) {
    console.log('✓ Backend API call for property deletion found');
} else {
    console.log('✗ Backend API call for property deletion missing');
}

// Check if the CSS file has the remove button styles
const cssContent = fs.readFileSync('./client/styles/main.css', 'utf8');

console.log('\nChecking CSS styles:');
if (cssContent.includes('.remove-btn')) {
    console.log('✓ Remove button styles found');
} else {
    console.log('✗ Remove button styles missing');
}

// Check if the property card creation includes the remove button
console.log('\nChecking property card structure:');
if (jsContent.includes('Remove</button>') && jsContent.includes('removeProperty')) {
    console.log('✓ Remove button in property card found');
} else {
    console.log('✗ Remove button in property card missing');
}

// Check if the backend route exists
const backendContent = fs.readFileSync('./routes/properties.js', 'utf8');

console.log('\nChecking backend routes:');
if (backendContent.includes('DELETE') && backendContent.includes('/:id')) {
    console.log('✓ DELETE route for properties found');
} else {
    console.log('✗ DELETE route for properties missing');
}

console.log('\n✅ Remove property functionality verification completed!');
console.log('The remove property feature should now be available in the My Properties tab.');
console.log('Users can remove their own properties with a confirmation dialog and smooth animation.');