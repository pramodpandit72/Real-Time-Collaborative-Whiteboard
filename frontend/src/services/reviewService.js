import api from './api';

export const reviewService = {
  createReview: async (rating, comment) => {
    const response = await api.post('/reviews', { rating, comment });
    return response.data;
  },

  getReviews: async () => {
    const response = await api.get('/reviews');
    return response.data;
  }
};
