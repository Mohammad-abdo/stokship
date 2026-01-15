const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const fs = require('fs');
const path = require('path');

// @desc    Get translations for a language
// @route   GET /api/translations
// @access  Public
const getTranslations = asyncHandler(async (req, res) => {
  const { lang = 'en', namespace = 'translation' } = req.query;

  const translationPath = path.join(
    process.env.TRANSLATION_FILES_PATH || './locales',
    lang,
    `${namespace}.json`
  );

  try {
    if (fs.existsSync(translationPath)) {
      const translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
      successResponse(res, translations, 'Translations retrieved successfully');
    } else {
      // Fallback to default language
      const fallbackPath = path.join(
        process.env.TRANSLATION_FILES_PATH || './locales',
        process.env.FALLBACK_LANGUAGE || 'en',
        `${namespace}.json`
      );
      if (fs.existsSync(fallbackPath)) {
        const translations = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        successResponse(res, translations, 'Translations retrieved successfully (fallback)');
      } else {
        return errorResponse(res, 'Translation file not found', 404);
      }
    }
  } catch (error) {
    return errorResponse(res, 'Error reading translation file', 500);
  }
});

// @desc    Get specific translation
// @route   GET /api/translations/:key
// @access  Public
const getTranslationByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { lang = 'en' } = req.query;

  const translationPath = path.join(
    process.env.TRANSLATION_FILES_PATH || './locales',
    lang,
    'translation.json'
  );

  try {
    if (fs.existsSync(translationPath)) {
      const translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
      const value = translations[key] || null;
      successResponse(res, { key, value, language: lang }, 'Translation retrieved successfully');
    } else {
      return errorResponse(res, 'Translation not found', 404);
    }
  } catch (error) {
    return errorResponse(res, 'Error reading translation file', 500);
  }
});

// @desc    Create/update translation (admin)
// @route   POST /api/translations
// @access  Private (Admin)
const createOrUpdateTranslation = asyncHandler(async (req, res) => {
  const { key, value, language = 'en', namespace = 'translation' } = req.body;

  if (!key || !value || !language) {
    return errorResponse(res, 'Please provide key, value, and language', 400);
  }

  const translationPath = path.join(
    process.env.TRANSLATION_FILES_PATH || './locales',
    language,
    `${namespace}.json`
  );

  // Ensure directory exists
  const dir = path.dirname(translationPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Read existing translations
  let translations = {};
  if (fs.existsSync(translationPath)) {
    translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
  }

  // Update translation
  translations[key] = value;

  // Write back to file
  fs.writeFileSync(translationPath, JSON.stringify(translations, null, 2), 'utf8');

  // Update translation key in database
  await prisma.translationKey.upsert({
    where: { key },
    update: {
      namespace,
      updatedAt: new Date()
    },
    create: {
      key,
      namespace,
      isSystem: false
    }
  });

  successResponse(res, { key, value, language, namespace }, 'Translation saved successfully');
});

// @desc    Update translation (admin)
// @route   PUT /api/translations/:key
// @access  Private (Admin)
const updateTranslation = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, language = 'en', namespace = 'translation' } = req.body;

  if (!value) {
    return errorResponse(res, 'Please provide translation value', 400);
  }

  const translationPath = path.join(
    process.env.TRANSLATION_FILES_PATH || './locales',
    language,
    `${namespace}.json`
  );

  if (!fs.existsSync(translationPath)) {
    return errorResponse(res, 'Translation file not found', 404);
  }

  const translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
  translations[key] = value;
  fs.writeFileSync(translationPath, JSON.stringify(translations, null, 2), 'utf8');

  successResponse(res, { key, value, language }, 'Translation updated successfully');
});

// @desc    Delete translation (admin)
// @route   DELETE /api/translations/:key
// @access  Private (Admin)
const deleteTranslation = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { language = 'en', namespace = 'translation' } = req.query;

  const translationPath = path.join(
    process.env.TRANSLATION_FILES_PATH || './locales',
    language,
    `${namespace}.json`
  );

  if (fs.existsSync(translationPath)) {
    const translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
    delete translations[key];
    fs.writeFileSync(translationPath, JSON.stringify(translations, null, 2), 'utf8');
  }

  successResponse(res, null, 'Translation deleted successfully');
});

// @desc    Get all translation keys
// @route   GET /api/translations/keys
// @access  Private (Admin)
const getAllTranslationKeys = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, namespace } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (namespace) where.namespace = namespace;

  const [keys, total] = await Promise.all([
    prisma.translationKey.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { key: 'asc' }
    }),
    prisma.translationKey.count({ where })
  ]);

  paginatedResponse(res, keys, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Translation keys retrieved successfully');
});

// @desc    Import translations (admin)
// @route   POST /api/translations/import
// @access  Private (Admin)
const importTranslations = asyncHandler(async (req, res) => {
  const { translations, language, namespace = 'translation' } = req.body;

  if (!translations || !language) {
    return errorResponse(res, 'Please provide translations object and language', 400);
  }

  const translationPath = path.join(
    process.env.TRANSLATION_FILES_PATH || './locales',
    language,
    `${namespace}.json`
  );

  const dir = path.dirname(translationPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Merge with existing translations
  let existing = {};
  if (fs.existsSync(translationPath)) {
    existing = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
  }

  const merged = { ...existing, ...translations };
  fs.writeFileSync(translationPath, JSON.stringify(merged, null, 2), 'utf8');

  // Update translation keys in database
  for (const key of Object.keys(translations)) {
    await prisma.translationKey.upsert({
      where: { key },
      update: { namespace },
      create: { key, namespace, isSystem: false }
    });
  }

  successResponse(res, {
    imported: Object.keys(translations).length,
    language,
    namespace
  }, 'Translations imported successfully');
});

// @desc    Export translations (admin)
// @route   GET /api/translations/export
// @access  Private (Admin)
const exportTranslations = asyncHandler(async (req, res) => {
  const { language, namespace = 'translation', format = 'json' } = req.query;

  if (!language) {
    return errorResponse(res, 'Please provide language', 400);
  }

  const translationPath = path.join(
    process.env.TRANSLATION_FILES_PATH || './locales',
    language,
    `${namespace}.json`
  );

  if (!fs.existsSync(translationPath)) {
    return errorResponse(res, 'Translation file not found', 404);
  }

  const translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));

  if (format === 'csv') {
    // Convert to CSV format
    const csv = Object.entries(translations)
      .map(([key, value]) => `"${key}","${value}"`)
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=translations-${language}-${namespace}.csv`);
    return res.send(`"Key","Value"\n${csv}`);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=translations-${language}-${namespace}.json`);
    return res.json(translations);
  }
});

// @desc    Get translation completion status
// @route   GET /api/translations/status
// @access  Private (Admin)
const getTranslationStatus = asyncHandler(async (req, res) => {
  const { language } = req.query;

  const supportedLanguages = (process.env.SUPPORTED_LANGUAGES || 'ar,en').split(',');
  const languages = language ? [language] : supportedLanguages;

  const status = {};

  for (const lang of languages) {
    const translationPath = path.join(
      process.env.TRANSLATION_FILES_PATH || './locales',
      lang,
      'translation.json'
    );

    let totalKeys = 0;
    let translatedKeys = 0;

    if (fs.existsSync(translationPath)) {
      const translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
      totalKeys = Object.keys(translations).length;
      translatedKeys = Object.values(translations).filter(v => v && v.trim() !== '').length;
    }

    status[lang] = {
      totalKeys,
      translatedKeys,
      completionPercentage: totalKeys > 0 ? ((translatedKeys / totalKeys) * 100).toFixed(2) : 0
    };
  }

  successResponse(res, status, 'Translation status retrieved successfully');
});

// @desc    Get missing translations
// @route   GET /api/translations/missing
// @access  Private (Admin)
const getMissingTranslations = asyncHandler(async (req, res) => {
  const { language, namespace = 'translation' } = req.query;

  if (!language) {
    return errorResponse(res, 'Please provide language', 400);
  }

  const fallbackLang = process.env.FALLBACK_LANGUAGE || 'en';
  const fallbackPath = path.join(
    process.env.TRANSLATION_FILES_PATH || './locales',
    fallbackLang,
    `${namespace}.json`
  );
  const translationPath = path.join(
    process.env.TRANSLATION_FILES_PATH || './locales',
    language,
    `${namespace}.json`
  );

  if (!fs.existsSync(fallbackPath)) {
    return errorResponse(res, 'Fallback translation file not found', 404);
  }

  const fallbackTranslations = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
  let translations = {};
  if (fs.existsSync(translationPath)) {
    translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
  }

  const missing = Object.keys(fallbackTranslations).filter(
    key => !translations[key] || translations[key].trim() === ''
  );

  successResponse(res, {
    language,
    namespace,
    missingKeys: missing,
    missingCount: missing.length,
    totalKeys: Object.keys(fallbackTranslations).length
  }, 'Missing translations retrieved successfully');
});

// @desc    Generate translation key
// @route   POST /api/translations/generate-key
// @access  Private (Admin)
const generateTranslationKey = asyncHandler(async (req, res) => {
  const { entityType, entityId, fieldName, namespace } = req.body;

  if (!entityType || !fieldName) {
    return errorResponse(res, 'Please provide entityType and fieldName', 400);
  }

  const key = entityId
    ? `${namespace || entityType.toLowerCase()}.${fieldName}.${entityId}`
    : `${namespace || entityType.toLowerCase()}.${fieldName}`;

  // Check if key exists
  const existing = await prisma.translationKey.findUnique({
    where: { key }
  });

  if (existing) {
    return successResponse(res, { key, exists: true }, 'Translation key already exists');
  }

  // Create key
  await prisma.translationKey.create({
    data: {
      key,
      namespace: namespace || entityType.toLowerCase(),
      entityType,
      entityId: entityId ? parseInt(entityId) : null,
      fieldName,
      isSystem: false
    }
  });

  successResponse(res, { key, generated: true }, 'Translation key generated successfully');
});

module.exports = {
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
};



