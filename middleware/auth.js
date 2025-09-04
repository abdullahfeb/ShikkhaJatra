const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

const teacherAuth = async (req, res, next) => {
    try {
        await auth(req, res, () => {});
        
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Teacher role required.' });
        }
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed.' });
    }
};

const adminAuth = async (req, res, next) => {
    try {
        await auth(req, res, () => {});
        
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed.' });
    }
};

module.exports = { auth, teacherAuth, adminAuth };
