const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  uploadImages,
  uploadExcel,
  getFile
} = require('../controllers/upload.controller');

router.post('/images', protect, uploadImages);
router.post('/excel', protect, uploadExcel);
router.get('/files/:id', protect, getFile);

module.exports = router;



