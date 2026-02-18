const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Document = require('../models/Document');

// Helper to get User ID from auth header
function getUserIdFromAuthHeader(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    const token = parts[1];
    const tokenParts = token.split('-');
    return tokenParts.length >= 3 ? tokenParts[2] : null;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const userId = getUserIdFromAuthHeader(req);
        const uploadDir = path.join(__dirname, '..', 'uploads', 'documents', `user-${userId}`);

        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `doc-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images, PDFs, and documents are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

// POST /api/documents/upload - Upload a document
router.post('/upload', upload.single('document'), async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { category, description, password } = req.body;

        if (!category) {
            return res.status(400).json({ message: 'Document category is required' });
        }

        // Create document record
        const document = new Document({
            userId: userId,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            category: category,
            filePath: req.file.path,
            size: req.file.size,
            description: description || '',
            password: password || null,
            isPasswordProtected: !!password
        });

        await document.save();

        res.status(201).json({
            message: 'Document uploaded successfully',
            document: {
                id: document._id,
                originalName: document.originalName,
                category: document.category,
                size: document.size,
                uploadDate: document.uploadDate,
                isPasswordProtected: document.isPasswordProtected
            }
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ message: 'Error uploading document', error: error.message });
    }
});

// GET /api/documents - Get all user documents
router.get('/', async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const documents = await Document.find({ userId: userId })
            .select('-password -filePath')
            .sort({ uploadDate: -1 });

        res.json({
            documents: documents.map(doc => ({
                id: doc._id,
                originalName: doc.originalName,
                fileType: doc.fileType,
                category: doc.category,
                size: doc.size,
                uploadDate: doc.uploadDate,
                description: doc.description,
                isPasswordProtected: doc.isPasswordProtected
            }))
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'Error fetching documents', error: error.message });
    }
});

// GET /api/documents/:id - Download a document
router.get('/:id', async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        const { password } = req.query;

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const document = await Document.findOne({
            _id: req.params.id,
            userId: userId
        });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Check password if document is protected
        if (document.isPasswordProtected) {
            if (!password || password !== document.password) {
                return res.status(403).json({ message: 'Incorrect password' });
            }
        }

        // Send file
        res.download(document.filePath, document.originalName);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ message: 'Error downloading document', error: error.message });
    }
});

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const document = await Document.findOne({
            _id: req.params.id,
            userId: userId
        });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Delete file from filesystem
        try {
            await fs.unlink(document.filePath);
        } catch (err) {
            console.error('Error deleting file:', err);
        }

        // Delete document record
        await Document.deleteOne({ _id: req.params.id });

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Error deleting document', error: error.message });
    }
});

// PUT /api/documents/:id/password - Set/update document password
router.put('/:id/password', async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        const { password } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const document = await Document.findOne({
            _id: req.params.id,
            userId: userId
        });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        document.password = password || null;
        document.isPasswordProtected = !!password;
        await document.save();

        res.json({ message: 'Document password updated successfully' });
    } catch (error) {
        console.error('Error updating document password:', error);
        res.status(500).json({ message: 'Error updating document password', error: error.message });
    }
});

// POST /api/documents/:id/share - Share document via email
router.post('/:id/share', async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        const { email } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({ message: 'Valid email address is required' });
        }

        const document = await Document.findOne({
            _id: req.params.id,
            userId: userId
        });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // TODO: Implement actual email sending logic here
        // For now, we'll just log and return success
        console.log(`Sharing document ${document.originalName} with ${email}`);

        // In production, you would:
        // 1. Generate a secure temporary download link
        // 2. Send email with the link using nodemailer or similar
        // 3. Set expiration on the link

        res.json({
            message: 'Document shared successfully',
            sharedWith: email,
            documentName: document.originalName
        });
    } catch (error) {
        console.error('Error sharing document:', error);
        res.status(500).json({ message: 'Error sharing document', error: error.message });
    }
});

module.exports = router;
