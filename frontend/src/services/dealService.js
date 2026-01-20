import api from './api';

export const dealService = {
  // Get all deals (with optional filters like traderId)
  getDeals: async (params = {}) => {
    try {
      const response = await api.get('/deals', { params });
      return response;
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  },

  // Get single deal by ID
  getDealById: async (id) => {
    try {
      const response = await api.get(`/deals/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching deal ${id}:`, error);
      throw error;
    }
  },

  // Create a new deal (Make Request flow usually handles this via offer)
  createDeal: async (data) => {
    try {
      const response = await api.post('/deals', data);
      return response;
    } catch (error) {
      console.error('Error creating deal:', error);
      throw error;
    }
  }
};
