const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegisterInput, validateLoginInput } = require('../middleware/validation');

// Public routes with rate limiting and input validation
router.post('/register', authLimiter, validateRegisterInput, authController.register);
router.post('/login', authLimiter, validateLoginInput, authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
