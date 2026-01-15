const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const { successResponse } = require('../utils/response');

// Placeholder analytics routes - to be implemented
router.get('/sales', protect, isAdmin, async (req, res) => {
  successResponse(res, {}, 'Sales analytics to be implemented');
});

module.exports = router;
