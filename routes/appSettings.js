const express = require('express');
const router = express.Router();

// In-memory storage for app settings (in a real app, this would be stored in a database)
let appSettings = {
  // General app settings
  appName: 'Land Mart',
  appVersion: '1.0.0',
  maintenanceMode: false,
  maxPropertiesPerUser: 50,
  
  // Feature flags
  enablePropertyReviews: true,
  enableMessaging: true,
  enablePayments: false,
  
  // Performance settings
  cacheTimeout: 300, // seconds
  maxConcurrentUsers: 1000,
  
  // Security settings
  passwordMinLength: 8,
  sessionTimeout: 24, // hours
  enableCaptcha: false,
  
  // UI/UX settings
  defaultTheme: 'light',
  enableAnimations: true,
  itemsPerPage: 10
};

// GET /api/app-settings - Get all app settings
router.get('/', (req, res) => {
  try {
    res.json(appSettings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching app settings', error: error.message });
  }
});

// PUT /api/app-settings - Update app settings
router.put('/', (req, res) => {
  try {
    const updates = req.body;
    
    // Update app settings
    appSettings = { ...appSettings, ...updates };
    
    res.json({ 
      message: 'App settings updated successfully',
      settings: appSettings 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating app settings', error: error.message });
  }
});

// GET /api/app-settings/:setting - Get specific app setting
router.get('/:setting', (req, res) => {
  try {
    const setting = req.params.setting;
    
    if (appSettings.hasOwnProperty(setting)) {
      res.json({ [setting]: appSettings[setting] });
    } else {
      res.status(404).json({ message: `Setting '${setting}' not found` });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching app setting', error: error.message });
  }
});

module.exports = router;