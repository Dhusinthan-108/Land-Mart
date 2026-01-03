const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Debugging middleware for user routes
router.use((req, res, next) => {
  console.log(`User route hit: ${req.method} ${req.url}`);
  next();
});

// GET /api/users - Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// POST /api/users/register - Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;
        
        // Validation
        if (!name || !email || !password || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        
        const newUser = new User({
            name,
            email,
            password, // In a real app, this would be hashed
            phone
        });
        
        // Only set role if provided, otherwise use default
        if (role) {
            newUser.role = role;
        }
        
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// POST /api/users/login - Login user
router.post('/login', async (req, res) => {
    console.log('\n========================================');
    console.log('🔐 LOGIN REQUEST RECEIVED');
    console.log('========================================');
    console.log('Request body:', req.body);
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            console.log('❌ Validation failed: Email and password are required');
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        // Find user by email
        console.log('\n🔍 Searching for user with email:', email);
        const user = await User.findOne({ email });
        console.log('User found in database:', user ? 'YES ✅' : 'NO ❌');
        
        if (!user) {
            console.log('❌ Login failed: User not found for email', email);
            console.log('========================================\n');
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Log user data for debugging (without password)
        console.log('\n📋 User found in database:');
        console.log('   - User ID (MongoDB _id):', user._id.toString());
        console.log('   - Name:', user.name);
        console.log('   - Email:', user.email);
        console.log('   - Role:', user.role);
        
        // Check password (in a real app, you would hash and compare with bcrypt)
        console.log('\n🔑 Password validation:');
        console.log('   - Provided password:', password);
        console.log('   - Stored password:', user.password);
        console.log('   - Match:', user.password === password ? 'YES ✅' : 'NO ❌');
        
        if (user.password !== password) {
            console.log('❌ Login failed: Password mismatch for user', user.email);
            console.log('========================================\n');
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Log successful login
        console.log('\n✅ PASSWORD VALIDATED SUCCESSFULLY');
        console.log('✅ LOGIN SUCCESSFUL FOR USER:', user.email);
        
        // Return user data (in a real app, you would generate a JWT token)
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        
        console.log('\n📤 Sending user data to frontend:');
        console.log('   - User ID being sent:', userData.id.toString());
        console.log('   - Name:', userData.name);
        console.log('   - Email:', userData.email);
        console.log('   - Role:', userData.role);
        console.log('\n⚠️  CRITICAL: Verify this User ID matches on the frontend!');
        console.log('========================================\n');
        
        res.json({
            message: 'Login successful',
            user: userData
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Error during login', error: error.message });
    }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
    try {
        const { name, email, role, phone, bio } = req.body;
        
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (role) updates.role = role;
        if (phone) updates.phone = phone;
        if (bio !== undefined) updates.bio = bio; // Allow empty string or null
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

// GET /api/users/profile - Get current user profile
router.get('/profile', async (req, res) => {
    try {
        // This would typically be handled by authentication middleware
        // For now, we'll extract user ID from headers or session
        const userId = req.headers['user-id'] || req.query.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User ID is required' });
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Return user profile data
        const profileData = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            bio: user.bio,
            role: user.role,
            emailNotifications: user.emailNotifications !== false,
            messageNotifications: user.messageNotifications !== false,
            propertyUpdates: user.propertyUpdates !== false,
            profilePublic: user.profilePublic !== false,
            showContactInfo: user.showContactInfo !== false,
            activityVisibility: user.activityVisibility !== false,
            twoFactorAuth: user.twoFactorAuth || false,
            createdAt: user.createdAt
        };
        
        res.json(profileData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', async (req, res) => {
    try {
        const userId = req.headers['user-id'] || req.query.userId;
        const { name, phone, bio } = req.body;
        
        if (!userId) {
            return res.status(401).json({ message: 'User ID is required' });
        }
        
        // Validation
        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and phone are required' });
        }
        
        const updates = {};
        if (name) updates.name = name;
        if (phone) updates.phone = phone;
        if (bio !== undefined) updates.bio = bio;
        
        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                bio: user.bio,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
});

// PUT /api/users/notifications - Update notification preferences
router.put('/notifications', async (req, res) => {
    try {
        const userId = req.headers['user-id'] || req.query.userId;
        const { emailNotifications, messageNotifications, propertyUpdates } = req.body;
        
        if (!userId) {
            return res.status(401).json({ message: 'User ID is required' });
        }
        
        const updates = {};
        if (emailNotifications !== undefined) updates.emailNotifications = emailNotifications;
        if (messageNotifications !== undefined) updates.messageNotifications = messageNotifications;
        if (propertyUpdates !== undefined) updates.propertyUpdates = propertyUpdates;
        
        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'Notification preferences updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notifications', error: error.message });
    }
});

// PUT /api/users/privacy - Update privacy settings
router.put('/privacy', async (req, res) => {
    try {
        const userId = req.headers['user-id'] || req.query.userId;
        const { profilePublic, showContactInfo, activityVisibility } = req.body;
        
        if (!userId) {
            return res.status(401).json({ message: 'User ID is required' });
        }
        
        const updates = {};
        if (profilePublic !== undefined) updates.profilePublic = profilePublic;
        if (showContactInfo !== undefined) updates.showContactInfo = showContactInfo;
        if (activityVisibility !== undefined) updates.activityVisibility = activityVisibility;
        
        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'Privacy settings updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating privacy settings', error: error.message });
    }
});

// PUT /api/users/password - Update password
router.put('/password', async (req, res) => {
    try {
        const userId = req.headers['user-id'] || req.query.userId;
        const { currentPassword, newPassword } = req.body;
        
        if (!userId) {
            return res.status(401).json({ message: 'User ID is required' });
        }
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }
        
        // Find user by ID
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check current password
        if (user.password !== currentPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating password', error: error.message });
    }
});

module.exports = router;