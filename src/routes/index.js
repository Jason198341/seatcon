// src/routes/index.js
const express = require('express');
const router = express.Router();
const chatRoutes = require('./chatRoutes');
const userRoutes = require('./userRoutes');

router.use('/api/chat', chatRoutes);
router.use('/api/users', userRoutes);

module.exports = router;