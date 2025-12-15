const express = require('express');
const router = express.Router();
const User = require('../models/User');

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

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;
        
        // Validation
        if (!name || !email || !password || !role || !phone) {
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
            role,
            phone
        });
        
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// POST /api/users/login - Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Check password (in a real app, you would hash and compare)
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Return user data (in a real app, you would generate a JWT token)
        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
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

module.exports = router;