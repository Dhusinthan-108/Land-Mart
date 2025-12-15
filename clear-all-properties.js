const axios = require('axios');

async function clearAllProperties() {
    try {
        console.log('Fetching current properties...');
        
        // Fetch all properties
        const propertiesResponse = await axios.get('http://localhost:5500/api/properties');
        const properties = propertiesResponse.data;
        console.log(`Found ${properties.length} properties to delete`);
        
        // Delete all properties
        console.log('Deleting properties...');
        let deletedCount = 0;
        for (const property of properties) {
            try {
                await axios.delete(`http://localhost:5500/api/properties/${property._id}`);
                console.log(`Deleted property: ${property.title}`);
                deletedCount++;
            } catch (error) {
                console.error(`Error deleting property ${property._id}:`, error.message);
            }
        }
        
        console.log(`Successfully deleted ${deletedCount} properties`);
        
        // Verify properties are cleared
        const finalProperties = await axios.get('http://localhost:5500/api/properties');
        console.log(`Remaining properties: ${finalProperties.data.length}`);
        
        if (finalProperties.data.length === 0) {
            console.log('✅ All properties successfully deleted!');
        } else {
            console.log('⚠️ Some properties may still remain');
        }
        
    } catch (error) {
        console.error('Error clearing properties:', error.message);
    }
}

clearAllProperties();