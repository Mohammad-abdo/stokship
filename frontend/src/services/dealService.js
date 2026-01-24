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
  },

  // Add items to a deal
  addDealItems: async (dealId, items) => {
    try {
      const response = await api.post(`/deals/${dealId}/items`, { items });
      return response;
    } catch (error) {
      console.error('Error adding deal items:', error);
      throw error;
    }
  },

  // Negotiation methods
  // Get negotiation messages for a deal
  getNegotiationMessages: async (dealId, params = {}) => {
    try {
      const response = await api.get(`/deals/${dealId}/negotiations`, { params });
      return response;
    } catch (error) {
      console.error('Error fetching negotiation messages:', error);
      throw error;
    }
  },

  // Send a negotiation message
  sendNegotiationMessage: async (dealId, data) => {
    try {
      const response = await api.post(`/deals/${dealId}/negotiations`, data);
      return response;
    } catch (error) {
      console.error('Error sending negotiation message:', error);
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (dealId) => {
    try {
      const response = await api.put(`/deals/${dealId}/negotiations/read`);
      return response;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
};
