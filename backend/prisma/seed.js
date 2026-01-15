/**
 * Main Seed File
 * 
 * NOTE: This project now uses the Mediation Platform schema.
 * The seed file has been updated to use the mediation seed.
 * 
 * To seed the database, run:
 *   npm run prisma:seed
 * 
 * Or directly:
 *   npm run prisma:seed-mediation
 */

// Redirect to mediation seed
require('./seed-mediation.js');
