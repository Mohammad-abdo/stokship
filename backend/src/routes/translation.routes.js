const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getTranslations,
  getTranslationByKey,
  createOrUpdateTranslation,
  updateTranslation,
  deleteTranslation,
  getAllTranslationKeys,
  importTranslations,
  exportTranslations,
  getTranslationStatus,
  getMissingTranslations,
  generateTranslationKey
} = require('../controllers/translation.controller');

router.get('/', getTranslations);
router.get('/keys', protect, isAdmin, getAllTranslationKeys);
router.get('/status', protect, isAdmin, getTranslationStatus);
router.get('/missing', protect, isAdmin, getMissingTranslations);
router.get('/:key', getTranslationByKey);
router.post('/', protect, isAdmin, createOrUpdateTranslation);
router.put('/:key', protect, isAdmin, updateTranslation);
router.delete('/:key', protect, isAdmin, deleteTranslation);
router.post('/import', protect, isAdmin, importTranslations);
router.get('/export', protect, isAdmin, exportTranslations);
router.post('/generate-key', protect, isAdmin, generateTranslationKey);

module.exports = router;

