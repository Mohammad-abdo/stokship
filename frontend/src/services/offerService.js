import api from './api';

const MEDIATION_BASE_URL = '/mediation'; // Mediation routes are mounted at root, but some routes need /mediation prefix
const OFFERS_BASE_URL = '/offers'; // Base URL already includes /api

export const offerService = {
  // Get offer by ID (public)
  getOfferById: (offerId) => {
    return api.get(`${OFFERS_BASE_URL}/${offerId}`);
  },

  // Get active offers (public)
  getActiveOffers: (params = {}) => {
    return api.get(OFFERS_BASE_URL, { params });
  },

  // Get recommended offers (public)
  getRecommendedOffers: (limit = 10) => {
    return api.get(`${OFFERS_BASE_URL}/recommended`, { params: { limit } });
  },

  // Get offers by category (public)
  getOffersByCategory: (categoryId, params = {}) => {
    return api.get(`${OFFERS_BASE_URL}/by-category/${categoryId}`, { params });
  },

  // Get trader offers (public)
  // Mediation routes are mounted at root, so path is /api/traders/:id/offers/public
  getTraderOffers: (traderId, params = {}) => {
    console.log("📡 Calling getTraderOffers with traderId:", traderId, "params:", params);
    console.log("📡 Full URL will be:", `/api/traders/${traderId}/offers/public`);
    return api.get(`/traders/${traderId}/offers/public`, { params });
  },

  // Request negotiation (public - for non-authenticated users)
  requestNegotiationPublic: (offerId, data) => {
    return api.post(`${MEDIATION_BASE_URL}/offers/${offerId}/request-negotiation/public`, data);
  },

  // Request negotiation (authenticated)
  requestNegotiation: (offerId, data) => {
    return api.post(`${MEDIATION_BASE_URL}/offers/${offerId}/request-negotiation`, data);
  }
};
