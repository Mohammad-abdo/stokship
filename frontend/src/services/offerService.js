import api from './api';

export const offerService = {
  // Get active offers
  getActiveOffers: async (params = {}) => {
    try {
      const response = await api.get('/offers', { params });
      return response;
    } catch (error) {
      console.error('Error fetching active offers:', error);
      throw error;
    }
  },

  // Get recommended offers (from mediation routes)
  getRecommendedOffers: async (limit = 10) => {
    try {
      // Note: This endpoint is in mediation routes, so it's at /api/offers/recommended
      const response = await api.get('/offers/recommended', { params: { limit } });
      return response;
    } catch (error) {
      console.error('Error fetching recommended offers:', error);
      throw error;
    }
  },

  // Get offer by ID
  getOfferById: async (id) => {
    try {
      const response = await api.get(`/offers/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching offer ${id}:`, error);
      throw error;
    }
  },

  // Get offers by category (from mediation routes)
  getOffersByCategory: async (categoryId, params = {}) => {
    try {
      // Note: This endpoint is in mediation routes, so it's at /api/offers/by-category/:categoryId
      const response = await api.get(`/offers/by-category/${categoryId}`, { params });
      return response;
    } catch (error) {
      console.error(`Error fetching offers for category ${categoryId}:`, error);
      throw error;
    }
  },

  // Create offer (for traders)
  createOffer: async (data) => {
    try {
      const response = await api.post('/traders/offers', data);
      return response;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  },

  // Upload Excel file
  uploadExcel: async (offerId, file) => {
    try {
      const formData = new FormData();
      formData.append('excelFile', file);
      const response = await api.post(`/traders/offers/${offerId}/upload-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error(`Error uploading Excel for offer ${offerId}:`, error);
      throw error;
    }
  },
};

